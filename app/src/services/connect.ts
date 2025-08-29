export type MessageType =
  | "GameJoined"
  | "GameCreated"
  | "PlayerJoined"
  | "GameStarted"
  | "CardFlipped"
  | "GameUpdated"
  | "GameEnded"
  | "Error";

export interface ServerMessage {
  type: MessageType;
}

// Игрок присоединился к игре
export interface MessageGameJoined extends ServerMessage {
  type: "GameJoined";
  roomId: string;
  playerId: number; // 1 или 2
  players: number; // количество игроков в комнате
}

// Игра создана
export interface MessageGameCreated extends ServerMessage {
  type: "GameCreated";
  room_id: string;
  playerId: number; // создатель всегда игрок 1
}

// Второй игрок подключился
export interface MessagePlayerJoined extends ServerMessage {
  type: "PlayerJoined";
  roomId: string;
  playerId: number; // который подключился
  players: number; // общее количество игроков
}

// Игра началась
export interface MessageGameStarted extends ServerMessage {
  type: "GameStarted";
  roomId: string;
  currentPlayer: 1 | 2;
}

// Карта перевернута
export interface MessageCardFlipped extends ServerMessage {
  type: "CardFlipped";
  roomId: string;
  cardIndex: number;
  playerId: number;
  currentPlayer: 1 | 2;
}

// Обновление состояния игры
export interface MessageGameUpdated extends ServerMessage {
  type: "GameUpdated";
  roomId: string;
  cards: any[]; // массив карт
  playerScores: [number, number];
  currentPlayer: 1 | 2;
  gameOver: boolean;
  winner?: 1 | 2 | "draw" | null;
}

// Игра закончена
export interface MessageGameEnded extends ServerMessage {
  type: "GameEnded";
  roomId: string;
  winner: 1 | 2 | "draw";
  playerScores: [number, number];
}

export interface MessageError extends ServerMessage {
  type: "Error";
  message: string;
  roomId?: string;
}

export type IncomingMessage =
  | MessageGameJoined
  | MessageGameCreated
  | MessagePlayerJoined
  | MessageGameStarted
  | MessageCardFlipped
  | MessageGameUpdated
  | MessageGameEnded
  | MessageError;

// Клиентские сообщения
export interface ClientCreateGame {
  type: "CreateGame";
  // room_id: string;
}

export interface ClientJoinGame {
  type: "JoinGame";
  room_id: string;
}

export interface ClientStartGame {
  type: "StartGame";
  roomId: string;
}

export interface ClientFlipCard {
  type: "FlipCard";
  roomId: string;
  cardIndex: number;
}

export interface ClientRestartGame {
  type: "RestartGame";
  roomId: string;
}

export type ClientMessage =
  | ClientCreateGame
  | ClientJoinGame
  | ClientStartGame
  | ClientFlipCard
  | ClientRestartGame;

type Listener = (data: any) => void;
type ListenersMap = Map<string, Listener[]>;

class GameWebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectInterval = 3000;
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;

  // Очередь сообщений, пока соединение не установлено
  private messageQueue: ClientMessage[] = [];

  // Подписчики: type → [callbacks]
  private listeners: ListenersMap = new Map();

  // Флаг, что соединение инициировано
  private isConnecting = false;

  // Текущий игрок и комната
  private currentRoomId: string | null = null;
  private currentPlayerId: number | null = null;

  private static instance: GameWebSocketService;

  private constructor(url: string) {
    this.url = url;
  }

  static getInstance(
    url: string = "ws://localhost:3001/ws",
  ): GameWebSocketService {
    if (!GameWebSocketService.instance) {
      GameWebSocketService.instance = new GameWebSocketService(url);
    }
    return GameWebSocketService.instance;
  }

  // === Публичные методы ===

  /**
   * Подписка на событие (серверное сообщение по type)
   */
  on(event: string, callback: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Гарантируем подключение при первой подписке
    this.ensureConnected();
  }

  /**
   * Отправка сообщения
   */
  send(message: ClientMessage): void {
    this.messageQueue.push(message);
    this.ensureConnected();
    this.flushQueue();
  }

  /**
   * Отписка
   */
  off(event: string, callback: Listener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // === Игровые методы ===

  /**
   * Создать новую игру
   */
  createGame(): void {
    const message: ClientCreateGame = {
      type: "CreateGame",
    };
    // this.currentRoomId = roomId;
    this.send(message);
  }

  /**
   * Присоединиться к игре
   */
  joinGame(roomId: string): void {
    const message: ClientJoinGame = {
      type: "JoinGame",
      room_id: roomId,
    };
    this.currentRoomId = roomId;
    this.send(message);
  }

  /**
   * Начать игру
   */
  startGame(): void {
    if (!this.currentRoomId) return;

    const message: ClientStartGame = {
      type: "StartGame",
      roomId: this.currentRoomId,
    };
    this.send(message);
  }

  /**
   * Перевернуть карту
   */
  flipCard(cardIndex: number): void {
    if (!this.currentRoomId) return;

    const message: ClientFlipCard = {
      type: "FlipCard",
      roomId: this.currentRoomId,
      cardIndex,
    };
    this.send(message);
  }

  /**
   * Перезапустить игру
   */
  restartGame(): void {
    if (!this.currentRoomId) return;

    const message: ClientRestartGame = {
      type: "RestartGame",
      roomId: this.currentRoomId,
    };
    this.send(message);
  }

  // === Геттеры ===

  getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }
  
  setCurrentRoomId(roomId: string): void {
    this.currentRoomId = roomId;
  }

  getCurrentPlayerId(): number | null {
    return this.currentPlayerId;
  }

  setCurrentPlayerId(playerId: number): void {
    this.currentPlayerId = playerId;
  }

  // === Внутренние методы ===

  private ensureConnected(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.connect();
  }

  private connect(): void {
    this.isConnecting = true;
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("✅ WebSocket connected");
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.flushQueue(); // отправляем отложенные сообщения
      this.emit("open");
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data);
      } catch (err) {
        console.error("Failed to parse message", err);
      }
    };

    this.socket.onclose = (event) => {
      console.log("❌ WebSocket closed", event);
      this.socket = null;
      this.isConnecting = false;
      this.emit("close", event);

      // Попытка переподключения
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔁 Reconnecting... attempt ${this.reconnectAttempts}`);
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.emit("Error", { message: "Connection error" });
    };
  }

  private flushQueue(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.messageQueue.forEach((msg) => {
      this.socket!.send(JSON.stringify(msg));
    });
    this.messageQueue = [];
  }

  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((cb) => cb(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  isConnectingOrConnected(): boolean {
    return (
      this.isConnected() ||
      (this.socket !== null && this.socket.readyState === WebSocket.CONNECTING)
    );
  }
}

// Экземпляр синглтона
const gameWsService = GameWebSocketService.getInstance();

export default gameWsService;
