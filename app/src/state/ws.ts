import { proxy } from 'valtio';
import gameWsService from '../services/connect';
import { multiGameActions, multiGameState } from './multi-game';

// Исправленные типы — соответствуют серверу
interface MessageGameCreated {
  type: 'GameCreated';
  room_id: string;
  player_id: string; // UUID, не number!
}

interface MessageGameJoined {
  type: 'GameJoined';
  state: {
    players: {
      0: { id: string; name: string };
      1?: { id: string; name: string };
    };
    current_turn: string;
    cards: Array<{
      id: number;
      value: number;
      isFlipped: boolean;
      isMatched: boolean;
      flippedBy: number | null;
    }>;
    scores: [number, number];
    timer: number;
    status: 'Waiting' | 'Playing' | 'Finished';
    winner: string | null;
  };
  room_id: string;
  player_id: string;
}

interface MessageGameStateUpdate {
  type: 'GameStateUpdate';
  state: MessageGameJoined['state'];
  player_id: MessageGameJoined['player_id']; // UUID
  room_id: MessageGameJoined['room_id'];
}

interface MessageGameOver {
  type: 'GameOver';
  winner: string; // player_id or "draw"
  scores: [number, number];
}

interface MessageError {
  type: 'Error';
  message: string;
}

export interface GamePlayer {
  id: number; // локальный ID: 1 или 2
  playerId: string; // UUID
  isConnected: boolean;
}

interface GameState {
  isConnected: boolean;
  isConnecting: boolean;

  roomId: string | null;
  playerId: string | null; // UUID

  // Действия
  createGame: () => void;
  joinGame: (roomId: string) => void;
  startGame: () => void;
  flipCard: (cardIndex: number) => void;

  error: string | null;
  clearError: () => void;
}

export const gameProxy = proxy<GameState>({
  isConnected: false,
  isConnecting: false,

  roomId: null,
  playerId: null,

  createGame() {
    gameProxy.clearError();
    gameProxy.error = null;
    gameWsService.createGame();
  },

  joinGame(roomId: string) {
    gameProxy.clearError();
    gameProxy.error = null;
    gameWsService.joinGame(roomId);
  },

  startGame() {
    if (multiGameState.playerId !== '1') {
      gameProxy.error = 'Только создатель игры может начать игру';
      return;
    }
    if (multiGameState.playersCount < 2) {
      gameProxy.error = 'Ожидается второй игрок';
      return;
    }
    gameWsService.startGame();
  },

  flipCard(cardIndex: number) {
    gameWsService.flipCard(cardIndex);
  },

  clearError() {
    gameProxy.error = null;
  },

  error: null,
});

// Инициализация игрового WebSocket соединения
export const initGameStore = () => {
  const handleOpen = () => {
    gameProxy.isConnected = true;
    gameProxy.isConnecting = false;
    console.log('🎮 Game WebSocket connected');
  };

  const handleClose = () => {
    gameProxy.isConnected = false;
    gameProxy.isConnecting = false;
    // Сброс состояния
    gameProxy.roomId = null;
    gameProxy.playerId = null;
    multiGameState.players = [];
    multiGameState.playersCount = 0;
    console.log('🎮 Game WebSocket disconnected');
  };

  const handleGameCreated = (data: MessageGameCreated) => {
    console.log('🎮 Game created:', data);

    multiGameState.players = [
      { id: 1, playerId: data.player_id, isConnected: true },
    ];
    multiGameState.playersCount = 1;

    // multiGameState.playerId = data.player_id;
    // multiGameState.roomId = data.room_id;

    // Сохраняем в multiGame, если нужно
    multiGameActions.setRoomId(data.room_id);
    multiGameActions.setPlayerId(data.player_id);
  };

  const handleGameJoined = (data: MessageGameJoined) => {
    console.log('🎮 Game joined:', data);

    const state = data.state;
    // const localPlayerId = gameWsService.getCurrentPlayerId(); // если хранится

    gameProxy.roomId = data.room_id;
    gameProxy.playerId = data.player_id;
    // gameProxy.playerId = ??? — нужно передать извне

    multiGameActions.setRoomId(data.room_id);
    // multiGameActions.setPlayerId(data.player_id); // передаем извне

    const players: GamePlayer[] = [];
    let count = 0;

    if (state.players[0]) {
      players.push({ id: 1, playerId: state.players[0].id, isConnected: true });
      count++;
    }
    if (state.players[1]) {
      players.push({ id: 2, playerId: state.players[1].id, isConnected: true });
      count++;
    }

    multiGameState.players = players;
    multiGameState.playersCount = count;

    // Передаём состояние в локальную игру
    multiGameActions.updateGameFromServer({
      playerId: data.player_id,
      roomId: data.room_id,
      cards: state.cards,
      playerScores: state.scores,
      currentPlayer: state.current_turn === state.players[0]?.id ? 1 : 2,
      gameOver: state.status === 'Finished',
      winner: state.winner
        ? state.winner === state.players[0]?.id
          ? 1
          : state.winner === state.players[1]?.id
          ? 2
          : 'draw'
        : null,
    });
  };

  const handleGameStateUpdate = (data: MessageGameStateUpdate) => {
    console.log('🎮 Game state updated:', data);

    const state = data.state;
    const p1Id = state.players[0]?.id;
    const p2Id = state.players[1]?.id;

    multiGameActions.updateGameFromServer({
      playerId: data.player_id,
      roomId: data.room_id,
      cards: state.cards,
      playerScores: state.scores,
      currentPlayer: state.current_turn === p1Id ? 1 : 2,
      gameOver: state.status === 'Finished',
      winner: state.winner
        ? state.winner === p1Id
          ? 1
          : state.winner === p2Id
          ? 2
          : 'draw'
        : null,
    });
  };

  const handleGameOver = (data: MessageGameOver) => {
    console.log('🎮 Game over:', data);

    const winner = data.winner;
    const p1Id = multiGameActions.getCurrentPlayer(); // предположим, что знаем
    const p2Id = multiGameState.players.find((p) => p.id === 2)?.playerId;

    let winnerId: 1 | 2 | 'draw' | null = null;
    if (winner === 'draw') {
      winnerId = 'draw';
    } else if (winner === p1Id.toString()) {
      winnerId = 1;
    } else if (winner === p2Id) {
      winnerId = 2;
    }

    multiGameActions.updateGameFromServer({
      playerId: '',
      roomId: '',
      cards: [],
      playerScores: data.scores,
      currentPlayer: 1,
      gameOver: true,
      winner: winnerId,
    });
  };

  const handleError = (data: MessageError) => {
    console.error('🎮 Game error:', data);
    gameProxy.error = data.message;
  };

  // Подписываемся только на реальные события
  gameWsService.on('open', handleOpen);
  gameWsService.on('close', handleClose);
  gameWsService.on('GameCreated', handleGameCreated);
  gameWsService.on('GameJoined', handleGameJoined);
  gameWsService.on('GameStateUpdate', handleGameStateUpdate);
  gameWsService.on('GameOver', handleGameOver);
  gameWsService.on('Error', handleError);

  return () => {
    gameWsService.off('open', handleOpen);
    gameWsService.off('close', handleClose);
    gameWsService.off('GameCreated', handleGameCreated);
    gameWsService.off('GameJoined', handleGameJoined);
    gameWsService.off('GameStateUpdate', handleGameStateUpdate);
    gameWsService.off('GameOver', handleGameOver);
    gameWsService.off('Error', handleError);
  };
};
