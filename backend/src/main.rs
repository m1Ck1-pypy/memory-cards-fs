use axum::{
    Router,
    extract::{
        State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    response::IntoResponse,
    routing::get,
};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::Number;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use ts_rs::TS;

#[derive(Serialize, Deserialize, Clone, Debug, TS)]
#[ts(export)]
pub struct Card {
    pub id: u8,
    pub value: u8,
    pub flipped: bool,
    pub matched: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, TS)]
#[ts(export)]
pub struct Player {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Clone, Debug, TS)]
#[ts(export)]
pub struct GameState {
    pub cards: Vec<Card>,
    pub players: (Player, Option<Player>), // player1, player2
    pub current_turn: String,              // player ID
    pub scores: (u8, u8),                  // (p1, p2)
    pub timer: u16,
    pub status: GameStatus,
    pub winner: Option<String>, // player ID or "draw"
}

#[derive(Serialize, Clone, PartialEq, Debug, TS)]
#[ts(export)]
pub enum GameStatus {
    Waiting,
    Playing,
    Finished,
}

#[derive(Serialize, Deserialize, Clone, Debug, TS)]
#[ts(export)]
#[serde(tag = "type")]
pub enum ClientMessage {
    CreateGame,
    JoinGame { room_id: String },
    StartGame { room_id: String },
    FlipCard { card_id: u8 },
}

#[derive(Serialize, Clone)]
#[serde(tag = "type")]
pub enum ServerMessage {
    GameCreated { 
        room_id: String,
        player_id: String 
    },
    // RoomJoined { state: GameState },
    GameJoined { state: GameState },
    GameStateUpdate { state: GameState },
    GameStarted { timer: u16 },
    GameOver { winner: String, scores: (u8, u8) },
    PlayerLeft,
    Error { message: String },
}

type RoomMap = Arc<Mutex<HashMap<String, Room>>>;

#[derive(Clone)]
struct AppState {
    rooms: RoomMap,
}

#[derive(Debug)]
struct Room {
    id: String,
    creator_id: String, // ID создателя (если он отключится — комната удаляется)
    state: GameState,
    sockets: Vec<tokio::sync::mpsc::UnboundedSender<ServerMessage>>,
    game_task: Option<tokio::task::JoinHandle<()>>, // таймер
}

impl Room {
    fn new(creator_id: String) -> Self {
        let mut cards: Vec<Card> = (0..8)
            .flat_map(|v| {
                vec![
                    Card {
                        id: v * 2,
                        value: v,
                        flipped: false,
                        matched: false,
                    },
                    Card {
                        id: v * 2 + 1,
                        value: v,
                        flipped: false,
                        matched: false,
                    },
                ]
            })
            .collect();
        fastrand::shuffle(&mut cards);

        Self {
            id: Self::generate_id(),
            creator_id: creator_id.clone(),
            state: GameState {
                cards,
                players: (
                    Player {
                        id: creator_id.clone(),
                        name: "Player 1".to_string(),
                    },
                    None,
                ),
                current_turn: creator_id,
                scores: (0, 0),
                timer: 60,
                status: GameStatus::Waiting,
                winner: None,
            },
            sockets: vec![],
            game_task: None,
        }
    }

    fn generate_id() -> String {
        const LEN: usize = 8;
        const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let mut id = String::with_capacity(LEN);
        for _ in 0..LEN {
            let random_index = fastrand::usize(0..LEN);
            id.push(CHARS[random_index] as char);
        }

        id
    }

    // Проверка, все ли пары найдены
    fn is_game_finished(&self) -> bool {
        self.state.cards.iter().all(|c| c.matched)
    }

    // Определение победителя
    fn get_winner(&self) -> String {
        match self.state.scores {
            (p1, p2) if p1 > p2 => self.state.players.0.id.clone(),
            (p1, p2) if p2 > p1 => self.state.players.1.as_ref().unwrap().id.clone(),
            _ => "draw".to_string(),
        }
    }
}

#[tokio::main]
async fn main() {
    let state = AppState {
        rooms: Arc::new(Mutex::new(HashMap::new())),
    };

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    println!("🚀 Memory Cell server running on ws://localhost:3001/ws");
    axum::serve(listener, app).await.unwrap();
}

async fn ws_handler(ws: WebSocketUpgrade, state: State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state.0))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut ws_tx, mut ws_rx) = socket.split();

    // Обработка сокета
    let (sender, receiver) = tokio::sync::mpsc::unbounded_channel::<ServerMessage>();
    let mut room_id: Option<String> = None;
    let player_id = String::from("1");

    let send_task = tokio::spawn(async move {
        let mut receiver = receiver;
        while let Some(msg) = receiver.recv().await {
            let text = match serde_json::to_string(&msg) {
                Ok(t) => t,
                Err(e) => {
                    eprintln!("Failed to serialize message: {e}");
                    continue;
                }
            };

            if ws_tx.send(Message::Text(text.into())).await.is_err() {
                break;
            }
        }
    });

    // --- ЗАДАЧА 2: Приём от клиента ---
    while let Some(result) = ws_rx.next().await {
        match result {
            Ok(Message::Text(text)) => {
                println!("Text: {text}");
                let text_str = text.as_str();
                if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(text_str) {
                    println!("Client message: {client_msg:?}");
                    handle_client_message(client_msg, &sender, &state, &mut room_id, &player_id)
                        .await;
                } else {
                    eprintln!("Failed to deserialize client message");
                }
            }
            Ok(Message::Close(_)) | Err(_) => break,
            _ => {}
        }
    }
    send_task.abort();

    // При отключении
    if let Some(rid) = room_id {
        let mut rooms = state.rooms.lock().await;
        if let Some(room) = rooms.get(&rid) {
            // Если отключился создатель — удаляем комнату
            if room.creator_id == player_id {
                // 1. Извлекаем данные ДО того, как `rooms` будет изменён
                let sockets = room.sockets.clone(); // или лучше — взять владение

                // 2. Удаляем комнату (освобождаем `rooms`)
                rooms.remove(&rid);

                // 3. Теперь можно безопасно использовать `sockets`
                broadcast(&sockets, ServerMessage::PlayerLeft);
            }
        }
    }
}

async fn handle_client_message(
    msg: ClientMessage,
    sender: &tokio::sync::mpsc::UnboundedSender<ServerMessage>,
    state: &AppState,
    room_id: &mut Option<String>,
    player_id: &String,
) {
    println!("MESSAGE CLIENT: {msg:?}");
    match msg {
        ClientMessage::CreateGame => {
            let mut rooms = state.rooms.lock().await;
            let room = Room::new(player_id.clone());
            let room_id_clone = room.id.clone();
            rooms.insert(room.id.clone(), room);
            *room_id = Some(room_id_clone.clone());
            println!("room_id_clone {room_id_clone}");
            let _ = sender.send(ServerMessage::GameCreated {
                room_id: room_id_clone,
                player_id: player_id.to_string()
            });
        }

        ClientMessage::JoinGame { room_id: rid } => {
            println!("{rid}");
            let mut rooms = state.rooms.lock().await;
            if let Some(room) = rooms.get_mut(&rid) {
                if room.state.players.1.is_some() {
                    let _ = sender.send(ServerMessage::Error {
                        message: "Room is full".to_string(),
                    });
                } else {
                    room.state.players.1 = Some(Player {
                        id: player_id.clone(),
                        name: "Player 2".to_string(),
                    });
                    room.sockets.push(sender.clone());
                    *room_id = Some(rid.clone());
                    println!("STATE: {:?}", room.state.clone());
                    let _ = sender.send(ServerMessage::GameJoined {
                        state: room.state.clone(),
                        // player_id: player_id.clone(),
                        // players: 2,
                        // room_id: rid.clone(),
                    });
                    broadcast(
                        &room.sockets,
                        ServerMessage::GameStateUpdate {
                            state: room.state.clone(),
                        },
                    );
                }
            } else {
                let _ = sender.send(ServerMessage::Error {
                    message: "Room not found".to_string(),
                });
            }
        }

        ClientMessage::StartGame { room_id: rid } => {
            let mut rooms = state.rooms.lock().await;
            if let Some(room) = rooms.get_mut(&rid) {
                if room.state.players.1.is_none() {
                    let _ = sender.send(ServerMessage::Error {
                        message: "Not enough players".to_string(),
                    });
                    return;
                }

                room.state.status = GameStatus::Playing;
                room.sockets.push(sender.clone());

                // 🔁 Создаём копию состояния для таймера
                let mut game_state = room.state.clone();
                let sockets = room.sockets.clone();

                let game_task = tokio::spawn(async move {
                    let mut timer = 60;
                    loop {
                        tokio::time::sleep(Duration::from_secs(1)).await;
                        timer -= 1;

                        // 🔄 Обновляем таймер в локальном состоянии
                        game_state.timer = timer;

                        // 📡 Отправляем обновлённое состояние
                        broadcast(
                            &sockets,
                            ServerMessage::GameStateUpdate {
                                state: game_state.clone(),
                            },
                        );

                        // Проверяем конец игры
                        if timer == 0 || all_cards_matched(&game_state.cards) {
                            let winner = determine_winner(&game_state);
                            broadcast(
                                &sockets,
                                ServerMessage::GameOver {
                                    winner,
                                    scores: game_state.scores,
                                },
                            );
                            break;
                        }
                    }
                });

                room.game_task = Some(game_task);
            }
        }

        ClientMessage::FlipCard { card_id } => {
            let mut rooms = state.rooms.lock().await;
            if let Some(room) = rooms.get_mut(&room_id.clone().unwrap_or_default()) {
                // Проверяем, чей ход
                if room.state.current_turn != *player_id {
                    return;
                }

                let cards = &mut room.state.cards;
                let card = cards.iter_mut().find(|c| c.id == card_id);
                if let Some(card) = card {
                    if card.flipped || card.matched {
                        return;
                    }
                    card.flipped = true;

                    // Собираем открытые карточки
                    let flipped_ids: Vec<u8> = cards
                        .iter()
                        .filter(|c| c.flipped && !c.matched)
                        .map(|c| c.id)
                        .collect();

                    if flipped_ids.len() == 2 {
                        let a_id = flipped_ids[0];
                        let b_id = flipped_ids[1];

                        let card_a = &cards[a_id as usize]; // или найти по id
                        let card_b = &cards[b_id as usize];

                        if card_a.value == card_b.value {
                            // Совпали
                            for card in cards.iter_mut() {
                                if card.id == a_id || card.id == b_id {
                                    card.matched = true;
                                }
                            }

                            // Очки
                            if room.state.players.0.id == *player_id {
                                room.state.scores.0 += 1;
                            } else if let Some(p2) = &room.state.players.1 {
                                if p2.id == *player_id {
                                    room.state.scores.1 += 1;
                                }
                            }
                            // Ход продолжается
                        } else {
                            // Не совпали — закрываем через 1 сек
                            let room_id_clone = room.id.clone();
                            let state_clone = state.clone(); // AppState с Arc<Mutex<...>>

                            tokio::spawn(async move {
                                tokio::time::sleep(Duration::from_millis(1000)).await;

                                // 🔁 Получаем доступ к комнате снова
                                let mut rooms = state_clone.rooms.lock().await;
                                if let Some(room) = rooms.get_mut(&room_id_clone) {
                                    for card in room.state.cards.iter_mut() {
                                        if card.id == a_id || card.id == b_id {
                                            card.flipped = false;
                                        }
                                    }

                                    // Рассылаем обновлённое состояние
                                    broadcast(
                                        &room.sockets,
                                        ServerMessage::GameStateUpdate {
                                            state: room.state.clone(),
                                        },
                                    );
                                }
                            });

                            // Сразу меняем ход
                            room.state.current_turn = if room.state.players.0.id == *player_id {
                                room.state.players.1.as_ref().unwrap().id.clone()
                            } else {
                                room.state.players.0.id.clone()
                            };
                        }
                    }

                    // Проверка завершения
                    if room.is_game_finished() {
                        room.state.status = GameStatus::Finished;
                        room.state.winner = Some(room.get_winner());
                        broadcast(
                            &room.sockets,
                            ServerMessage::GameOver {
                                winner: room.state.winner.clone().unwrap(),
                                scores: room.state.scores,
                            },
                        );
                    } else {
                        // Отправляем обновлённое состояние (с flipped = true)
                        broadcast(
                            &room.sockets,
                            ServerMessage::GameStateUpdate {
                                state: room.state.clone(),
                            },
                        );
                    }
                }
            }
        }
    }
}

fn broadcast(senders: &[tokio::sync::mpsc::UnboundedSender<ServerMessage>], msg: ServerMessage) {
    for sender in senders {
        let _ = sender.send(msg.clone());
    }
}

// Вспомогательные (упрощённые)
fn room_is_finished(_senders: &[tokio::sync::mpsc::UnboundedSender<ServerMessage>]) -> bool {
    false // нужно улучшить
}
fn get_winner_from_sockets(
    _senders: &[tokio::sync::mpsc::UnboundedSender<ServerMessage>],
) -> String {
    "draw".to_string()
}

fn all_cards_matched(cards: &[Card]) -> bool {
    cards.iter().all(|c| c.matched)
}

fn determine_winner(state: &GameState) -> String {
    match state.scores {
        (p1, p2) if p1 > p2 => state.players.0.id.clone(),
        (p1, p2) if p2 > p1 => state.players.1.as_ref().unwrap().id.clone(),
        _ => "draw".to_string(),
    }
}
