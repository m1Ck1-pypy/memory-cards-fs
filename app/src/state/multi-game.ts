import { proxy } from "valtio";
import { SIZE, VALUE_SIZE } from "../constants/sizeGame";
import { appState } from "./state";

export interface MultiCard {
  id: number;
  value: number;
  isFlipped: boolean;
  isMatched: boolean;
  flippedBy: number | null; // 1 для игрока 1, 2 для игрока 2
}

const GAME_TIMER = 10; // 60 секунд на игру

export interface MultiPlayerGameState {
  roomId: string;
  cards: MultiCard[];
  flippedCards: number[];
  playerScores: [number, number]; // [player1Score, player2Score]
  currentPlayer: 1 | 2; // Текущий активный игрок
  timeLeft: number;
  gameOver: boolean;
  gameStarted: boolean;
  winner: 1 | 2 | null | "draw"; // Победитель или ничья
  changeSize: boolean;
  size: SIZE;
}

export const multiGameState = proxy<MultiPlayerGameState>({
  roomId: "",
  cards: [],
  flippedCards: [],
  playerScores: [0, 0],
  currentPlayer: 1,
  timeLeft: GAME_TIMER, // 60 секунд на игру
  gameOver: false,
  gameStarted: false,
  winner: null,
  changeSize: true,
  size: SIZE.SMALL,
});

export const multiGameActions = {
  // Генерация ID комнаты
  generateRoomId: () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    multiGameState.roomId = result;
    return result;
  },

  setSize: (size: SIZE) => {
    multiGameState.size = size;
    multiGameState.changeSize = false;
  },

  changeSizeGame: (value: boolean) => {
    multiGameState.changeSize = value;
  },

  // Инициализация игры
  initializeGame: () => {
    if (appState.changeSize) return;

    // Создаем пары чисел от 1 до 8
    const values = [...Array(VALUE_SIZE[appState.size]).keys()].map(
      (i) => i + 1,
    );
    const pairs = [...values, ...values];

    // Перемешиваем карты
    const shuffled = [...pairs]
      .sort(() => Math.random() - 0.5)
      .map((value, id) => ({
        id,
        value,
        isFlipped: false,
        isMatched: false,
        flippedBy: null,
      }));

    multiGameState.cards = shuffled;
    multiGameState.flippedCards = [];
    multiGameState.playerScores = [0, 0];
    multiGameState.currentPlayer = 1;
    multiGameState.timeLeft = GAME_TIMER;
    multiGameState.gameOver = false;
    multiGameState.gameStarted = false;
    multiGameState.winner = null;
  },

  // Начало игры
  startGame: () => {
    multiGameState.gameStarted = true;
  },

  // Перезапуск игры
  restartGame: () => {
    multiGameActions.initializeGame();
    multiGameState.gameStarted = true;
  },

  // Обработка клика по карте
  handleCardClick: (index: number) => {
    if (!multiGameState.gameStarted || multiGameState.gameOver) return;
    if (multiGameState.flippedCards.length >= 2) return;
    if (
      multiGameState.cards[index].isFlipped ||
      multiGameState.cards[index].isMatched
    )
      return;

    // Переворачиваем карту
    multiGameState.cards = multiGameState.cards.map((card, i) =>
      i === index
        ? {
            ...card,
            isFlipped: true,
            flippedBy: multiGameState.currentPlayer,
          }
        : card,
    );

    multiGameState.flippedCards = [...multiGameState.flippedCards, index];

    // Если перевернуто две карты, проверяем совпадение
    if (multiGameState.flippedCards.length === 2) {
      setTimeout(() => multiGameActions.checkForMatch(), 600);
    }
  },

  // Проверка совпадения карт
  checkForMatch: () => {
    const [firstIndex, secondIndex] = multiGameState.flippedCards;
    const firstCard = multiGameState.cards[firstIndex];
    const secondCard = multiGameState.cards[secondIndex];

    if (firstCard.value === secondCard.value) {
      // Карты совпали
      multiGameState.cards = multiGameState.cards.map((card, index) =>
        index === firstIndex || index === secondIndex
          ? { ...card, isMatched: true }
          : card,
      );

      // Начисляем очки текущему игроку
      const newScores = [...multiGameState.playerScores];
      newScores[multiGameState.currentPlayer - 1] += 10;
      multiGameState.playerScores = newScores as [number, number];
    } else {
      // Карты не совпали - переворачиваем обратно
      multiGameState.cards = multiGameState.cards.map((card, index) =>
        multiGameState.flippedCards.includes(index) && !card.isMatched
          ? { ...card, isFlipped: false, flippedBy: null }
          : card,
      );

      // Переход хода к другому игроку
      multiGameState.currentPlayer = multiGameState.currentPlayer === 1 ? 2 : 1;
    }

    multiGameState.flippedCards = [];
    multiGameActions.checkGameCompletion();
  },

  // Обновление таймера
  updateTimer: () => {
    if (
      !multiGameState.gameStarted ||
      multiGameState.gameOver ||
      multiGameState.timeLeft <= 0
    )
      return;

    multiGameState.timeLeft -= 1;

    if (multiGameState.timeLeft === 0) {
      multiGameState.gameOver = true;
      multiGameActions.determineWinner();
    }
  },

  // Проверка завершения игры
  checkGameCompletion: () => {
    const allMatched = multiGameState.cards.every((card) => card.isMatched);
    if (allMatched && !multiGameState.gameOver) {
      multiGameState.gameOver = true;
      multiGameActions.determineWinner();
    }
  },

  // Определение победителя
  determineWinner: () => {
    const [player1Score, player2Score] = multiGameState.playerScores;

    if (player1Score > player2Score) {
      multiGameState.winner = 1;
    } else if (player2Score > player1Score) {
      multiGameState.winner = 2;
    } else {
      multiGameState.winner = "draw";
    }
  },

  // Обновление состояния игры из WebSocket
  updateGameFromServer: (gameData: {
    cards: MultiCard[];
    playerScores: [number, number];
    currentPlayer: 1 | 2;
    gameOver: boolean;
    winner?: 1 | 2 | "draw" | null;
  }) => {
    multiGameState.cards = gameData.cards;
    multiGameState.playerScores = gameData.playerScores;
    multiGameState.currentPlayer = gameData.currentPlayer;
    multiGameState.gameOver = gameData.gameOver;
    if (gameData.winner !== undefined) {
      multiGameState.winner = gameData.winner;
    }
  },

  // Обновление карты из WebSocket
  updateCardFromServer: (
    cardIndex: number,
    playerId: number,
    currentPlayer: 1 | 2,
  ) => {
    multiGameState.cards = multiGameState.cards.map((card, i) =>
      i === cardIndex
        ? {
            ...card,
            isFlipped: true,
            flippedBy: playerId,
          }
        : card,
    );
    multiGameState.currentPlayer = currentPlayer;
    multiGameState.flippedCards = [...multiGameState.flippedCards, cardIndex];
  },
};
