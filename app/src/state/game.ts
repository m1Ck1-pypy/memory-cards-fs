import { proxy } from "valtio";
import { VALUE_SIZE } from "../constants/sizeGame";
import { appState } from "./state";

export interface Card {
  id: number;
  value: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface GameState {
  cards: Card[];
  flippedCards: number[];
  matchedPairs: number;
  score: number;
  timeLeft: number;
  gameOver: boolean;
  gameStarted: boolean;
}

const INIT_TIMER = 10;
export const gameState = proxy<GameState>({
  cards: [],
  flippedCards: [],
  matchedPairs: 0,
  score: 0,
  timeLeft: INIT_TIMER,
  gameOver: false,
  gameStarted: false,
});

export const gameActions = {
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
      .map((value, id) => ({ id, value, isFlipped: false, isMatched: false }));

    gameState.cards = shuffled;
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.score = 0;
    gameState.timeLeft = INIT_TIMER;
    gameState.gameOver = false;
    gameState.gameStarted = false;
  },

  // Начало игры
  startGame: () => {
    gameState.gameStarted = true;
  },

  // Перезапуск игры
  restartGame: () => {
    gameActions.initializeGame();
    gameState.gameStarted = true;
  },

  // Обработка клика по карте
  handleCardClick: (index: number) => {
    if (!gameState.gameStarted || gameState.gameOver) return;
    if (gameState.flippedCards.length >= 2) return;
    if (gameState.cards[index].isFlipped || gameState.cards[index].isMatched)
      return;

    // Переворачиваем карту
    gameState.cards = gameState.cards.map((card, i) =>
      i === index ? { ...card, isFlipped: true } : card,
    );

    gameState.flippedCards = [...gameState.flippedCards, index];

    // Если перевернуто две карты, проверяем совпадение
    if (gameState.flippedCards.length === 2) {
      setTimeout(() => gameActions.checkForMatch(), 500);
    }
  },

  // Проверка совпадения карт
  checkForMatch: () => {
    const [firstIndex, secondIndex] = gameState.flippedCards;
    const firstCard = gameState.cards[firstIndex];
    const secondCard = gameState.cards[secondIndex];

    if (firstCard.value === secondCard.value) {
      // Карты совпали
      gameState.cards = gameState.cards.map((card, index) =>
        index === firstIndex || index === secondIndex
          ? { ...card, isMatched: true }
          : card,
      );
      gameState.matchedPairs += 1;
      gameState.score += 10;
    } else {
      // Карты не совпали - переворачиваем обратно
      gameState.cards = gameState.cards.map((card, index) =>
        gameState.flippedCards.includes(index) && !card.isMatched
          ? { ...card, isFlipped: false }
          : card,
      );
    }

    gameState.flippedCards = [];
  },

  // Обновление таймера
  updateTimer: () => {
    if (!gameState.gameStarted || gameState.gameOver || gameState.timeLeft <= 0)
      return;

    gameState.timeLeft -= 1;

    if (gameState.timeLeft === 0) {
      gameState.gameOver = true;
    }
  },

  // Проверка завершения игры
  checkGameCompletion: () => {
    if (gameState.matchedPairs === 8 && !gameState.gameOver) {
      gameState.gameOver = true;
      gameState.score += gameState.timeLeft * 5; // Бонус за оставшееся время
    }
  },
};
