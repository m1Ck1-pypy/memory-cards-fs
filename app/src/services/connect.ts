import type { GameState } from '../../../backend/bindings/GameState';

export type MessageType =
  | 'GameJoined'
  | 'GameCreated'
  | 'PlayerJoined'
  | 'GameStarted'
  | 'CardFlipped'
  | 'GameStateUpdate'
  | 'GameEnded'
  | 'Error';

export interface ServerMessage {
  type: MessageType;
}

// === Серверные сообщения ===

export interface MessageGameCreated extends ServerMessage {
  type: 'GameCreated';
  room_id: string;
  player_id: string; // UUID
}

export interface MessageGameJoined extends ServerMessage {
  type: 'GameJoined';
  state: GameState;
  room_id: string;
  player_id: string;
}

export interface MessageGameStateUpdate extends ServerMessage {
  type: 'GameStateUpdate';
  state: GameState;
}

export interface MessageGameEnded extends ServerMessage {
  type: 'GameEnded';
  winner: string; // player_id or "draw"
  scores: [number, number];
}

export interface MessageError extends ServerMessage {
  type: 'Error';
  message: string;
}

// Клиентские сообщения
export interface ClientCreateGame {
  type: 'CreateGame';
}

export interface ClientJoinGame {
  type: 'JoinGame';
  room_id: string;
}

export interface ClientStartGame {
  type: 'StartGame';
  room_id: string;
}

export interface ClientFlipCard {
  type: 'FlipCard';
  room_id: string;
  card_id: number;
}

// ❌ RestartGame пока не реализовано на сервере
// export interface ClientRestartGame { ... }

export type ClientMessage =
  | ClientCreateGame
  | ClientJoinGame
  | ClientStartGame
  | ClientFlipCard;
// | ClientRestartGame;

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
    url: string = 'ws://localhost:3001/ws',
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
  async createGame(): Promise<void> {
    const message: ClientCreateGame = {
      type: 'CreateGame',
    };
    this.send(message);
  }

  /**
   * Присоединиться к игре
   */
  joinGame(roomId: string): void {
    const message: ClientJoinGame = {
      type: 'JoinGame',
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
      type: 'StartGame',
      room_id: this.currentRoomId,
    };
    this.send(message);
  }

  /**
   * Перевернуть карту
   */
  flipCard(cardIndex: number): void {
    if (!this.currentRoomId) return;

    const message: ClientFlipCard = {
      type: 'FlipCard',
      room_id: this.currentRoomId,
      card_id: cardIndex,
    };
    this.send(message);
  }

  /**
   * Перезапустить игру
   */
  // restartGame(): void {
  //   if (!this.currentRoomId) return;
  //   const message: ClientRestartGame = {
  //     type: 'RestartGame',
  //     roomId: this.currentRoomId,
  //   };
  //   this.send(message);
  // }

  // === Геттеры ===
  getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }
  getCurrentPlayerId(): number | null {
    return this.currentPlayerId;
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
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.flushQueue(); // отправляем отложенные сообщения
      this.emit('open');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data);
      } catch (err) {
        console.error('Failed to parse message', err);
      }
    };

    this.socket.onclose = (event) => {
      console.log('❌ WebSocket closed', event);
      this.socket = null;
      this.isConnecting = false;
      this.emit('close', event);

      // Попытка переподключения
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔁 Reconnecting... attempt ${this.reconnectAttempts}`);
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('Error', { message: 'Connection error' });
    };
  }

  private flushQueue(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.messageQueue.forEach((msg) => {
      this.socket!.send(JSON.stringify(msg));
    });
    this.messageQueue = []; // ✅ Очищаем только после отправки
  }

  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((cb) => {
        cb(data);
      });
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
