import { proxy } from "valtio";
import gameWsService from "../services/connect";
import { multiGameActions, multiGameState } from "./multi-game";
import type {
  MessageGameCreated,
  MessageGameJoined,
  MessagePlayerJoined,
  MessageGameStarted,
  MessageCardFlipped,
  MessageGameUpdated,
  MessageGameEnded,
  MessageError,
} from "../services/connect";

interface GamePlayer {
  id: number;
  isConnected: boolean;
}

interface GameState {
  // Состояние подключения
  isConnected: boolean;
  isConnecting: boolean;

  // Игровая комната
  roomId: string | null;
  playerId: number | null; // 1 или 2
  players: GamePlayer[];
  playersCount: number;

  // Игровые действия
  createGame: () => Promise<void>;
  joinGame: (roomId: string) => Promise<void>;
  startGame: () => void;
  flipCard: (cardIndex: number) => void;
  restartGame: () => void;

  // Состояние ошибок
  error: string | null;
  clearError: () => void;
}

export const gameProxy = proxy<GameState>({
  // Состояние подключения
  isConnected: false,
  isConnecting: false,

  // Игровая комната
  roomId: null,
  playerId: null,
  players: [],
  playersCount: 0,

  // Игровые действия
  async createGame() {
    gameProxy.error = null;
    
    gameWsService.createGame();
  },

  async joinGame(roomId: string) {
    gameProxy.error = null;
    gameWsService.joinGame(roomId);
  },

  startGame() {
    if (gameProxy.playerId !== 1) {
      gameProxy.error = "Только создатель игры может начать игру";
      return;
    }
    if (gameProxy.playersCount < 2) {
      gameProxy.error = "Ожидается второй игрок";
      return;
    }
    gameWsService.startGame();
  },

  flipCard(cardIndex: number) {
    gameWsService.flipCard(cardIndex);
  },

  restartGame() {
    if (gameProxy.playerId !== 1) {
      gameProxy.error = "Только создатель игры может перезапустить игру";
      return;
    }
    gameWsService.restartGame();
  },

  // Состояние ошибок
  error: null,
  clearError() {
    gameProxy.error = null;
  },
});

// Инициализация игрового WebSocket соединения
export const initGameStore = () => {
  // Состояние подключения
  const handleOpen = () => {
    gameProxy.isConnected = true;
    gameProxy.isConnecting = false;
    console.log("🎮 Game WebSocket connected");
  };

  const handleClose = () => {
    gameProxy.isConnected = false;
    gameProxy.isConnecting = false;
    // Сбрасываем состояние игры при отключении
    gameProxy.roomId = null;
    gameProxy.playerId = null;
    gameProxy.players = [];
    gameProxy.playersCount = 0;
    console.log("🎮 Game WebSocket disconnected");
  };

  // Отслеживаем попытки подключения
  const connectionInterval = setInterval(() => {
    const isConn = gameWsService.isConnected();
    const isConnOrConnecting = gameWsService.isConnectingOrConnected();

    if (!isConn && isConnOrConnecting && !gameProxy.isConnecting) {
      gameProxy.isConnecting = true;
    } else if (isConn && gameProxy.isConnecting) {
      gameProxy.isConnecting = false;
      gameProxy.isConnected = true;
    }
  }, 500);

  // Обработчики игровых сообщений
  const handleGameCreated = (data: MessageGameCreated) => {
    console.log("🎮 Game created:", data);
    
    multiGameState.roomId = data.room_id;
    gameProxy.playerId = data.playerId;
    gameProxy.players = [{ id: 1, isConnected: true }];
    gameProxy.playersCount = 1;
    
    gameWsService.setCurrentRoomId(data.room_id);
    gameWsService.setCurrentPlayerId(data.playerId);
  };

  const handleGameJoined = (data: MessageGameJoined) => {
    console.log("🎮 Game joined:", data);
    gameProxy.roomId = data.roomId;
    gameProxy.playerId = data.playerId;
    gameProxy.playersCount = data.players;
    gameWsService.setCurrentPlayerId(data.playerId);

    // Обновляем список игроков
    gameProxy.players = [];
    for (let i = 1; i <= data.players; i++) {
      gameProxy.players.push({ id: i, isConnected: true });
    }
  };

  const handlePlayerJoined = (data: MessagePlayerJoined) => {
    console.log("🎮 Player joined:", data);
    gameProxy.playersCount = data.players;

    // Обновляем список игроков
    gameProxy.players = [];
    for (let i = 1; i <= data.players; i++) {
      gameProxy.players.push({ id: i, isConnected: true });
    }
  };

  const handleGameStarted = (data: MessageGameStarted) => {
    console.log("🎮 Game started:", data);
    // Запускаем игру в локальном состоянии
    multiGameActions.startGame();
  };

  const handleCardFlipped = (data: MessageCardFlipped) => {
    console.log("🎮 Card flipped:", data);
    // Обновляем состояние карты из сервера
    multiGameActions.updateCardFromServer(
      data.cardIndex,
      data.playerId,
      data.currentPlayer,
    );
  };

  const handleGameUpdated = (data: MessageGameUpdated) => {
    console.log("🎮 Game updated:", data);
    // Полное обновление игрового состояния
    multiGameActions.updateGameFromServer({
      cards: data.cards,
      playerScores: data.playerScores,
      currentPlayer: data.currentPlayer,
      gameOver: data.gameOver,
      winner: data.winner,
    });
  };

  const handleGameEnded = (data: MessageGameEnded) => {
    console.log("🎮 Game ended:", data);
    // Обновляем финальное состояние игры
    multiGameActions.updateGameFromServer({
      cards: [],
      playerScores: data.playerScores,
      currentPlayer: 1,
      gameOver: true,
      winner: data.winner,
    });
  };

  const handleError = (data: MessageError) => {
    console.error("🎮 Game error:", data);
    gameProxy.error = data.message;
  };

  // Подписываемся на события
  gameWsService.on("open", handleOpen);
  gameWsService.on("close", handleClose);
  gameWsService.on("GameCreated", handleGameCreated);
  gameWsService.on("GameJoined", handleGameJoined);
  gameWsService.on("PlayerJoined", handlePlayerJoined);
  gameWsService.on("GameStarted", handleGameStarted);
  gameWsService.on("CardFlipped", handleCardFlipped);
  gameWsService.on("GameUpdated", handleGameUpdated);
  gameWsService.on("GameEnded", handleGameEnded);
  gameWsService.on("Error", handleError);

  // Возвращаем функцию очистки
  return () => {
    gameWsService.off("open", handleOpen);
    gameWsService.off("close", handleClose);
    gameWsService.off("GameCreated", handleGameCreated);
    gameWsService.off("GameJoined", handleGameJoined);
    gameWsService.off("PlayerJoined", handlePlayerJoined);
    gameWsService.off("GameStarted", handleGameStarted);
    gameWsService.off("CardFlipped", handleCardFlipped);
    gameWsService.off("GameUpdated", handleGameUpdated);
    gameWsService.off("GameEnded", handleGameEnded);
    gameWsService.off("Error", handleError);
    clearInterval(connectionInterval);
  };
};
