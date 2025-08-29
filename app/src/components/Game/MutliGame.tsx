import React, { useEffect } from "react";
import { useSnapshot } from "valtio";
import { Clock, Copy, Circle } from "lucide-react";
import { multiGameState, multiGameActions } from "../../state/multi-game";
import { appState } from "../../state/state";
import { gameProxy, initGameStore } from "../../state/ws";
import { SIZE, VALUE_SIZE } from "../../constants/sizeGame";
import UserPanel from "./Multi/UserPanel";
import ConnectStatus from "./Multi/ConnectStatus";

const gridFileds = (size: SIZE) => {
  const cells = VALUE_SIZE[size] / 2;
  const style: Record<number, string> = {
    4: "grid grid-cols-4 gap-3 mb-6",
    6: "grid grid-cols-6 gap-3 mb-6",
    8: "grid grid-cols-8 gap-3 mb-6"
  }
  
  return style[cells];
};

const MultiGamePage: React.FC = () => {
  const snap = useSnapshot(multiGameState);
  const app = useSnapshot(appState);
  const gameWs = useSnapshot(gameProxy);

  // Инициализация WebSocket и игры
  useEffect(() => {
    if (app.changeSize) return;

    multiGameActions.initializeGame();
    // multiGameActions.generateRoomId();

    // Инициализируем WebSocket соединение
    const cleanup = initGameStore();
    return cleanup;
  }, [app.changeSize]);

  // Таймер
  useEffect(() => {
    if (!snap.gameStarted || snap.gameOver || snap.timeLeft <= 0) return;

    const timer = setTimeout(() => {
      multiGameActions.updateTimer();
    }, 1000);

    return () => clearTimeout(timer);
  }, [snap.timeLeft, snap.gameStarted, snap.gameOver]);

  // Копирование ID комнаты в буфер обмена
  const copyRoomId = () => {
    navigator.clipboard.writeText(snap.roomId);
  };

  // Подсчет занятых ячеек для каждого игрока
  const player1Cells = snap.cards.filter(
    (card) => card.flippedBy === 1 && card.isMatched,
  ).length;
  const player2Cells = snap.cards.filter(
    (card) => card.flippedBy === 2 && card.isMatched,
  ).length;

  // // Присоединиться к игре (для тестирования)
  // const joinGame = () => {
  //   const roomId = prompt("Введите ID комнаты:");
  //   if (roomId) {
  //     gameProxy.joinGame(roomId);
  //   }
  // };

  return (
    <>
      <div className="relative w-full max-w-7xl h-[90vh] flex">
        {/* Кнопка возврата */}

        {/* Player 1 - Left Panel */}
        <UserPanel cells={player1Cells} index={0} team="Red" />

        {/* Center Game Area */}
        <div className="w-3/4 bg-slate-800/50 backdrop-blur-md border-y border-white/20 p-6 flex flex-col">
          {/* Статус подключения */}
          <ConnectStatus />

          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Multi-Player Game
            </h1>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-gray-300">Room:</span>
              <span className="text-purple-400 font-mono">{snap.roomId}</span>
              <button
                onClick={copyRoomId}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Copy Room ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            {/* Информация об игроках */}
            {multiGameState.roomId && (
              <div className="flex items-center justify-center space-x-4 text-sm">
                <span className="text-gray-300">
                  Players: {gameWs.playersCount}/2
                </span>
                {gameWs.playerId && (
                  <span className="text-blue-400">
                    You are Player {gameWs.playerId}
                  </span>
                )}
              </div>
            )}

            {/* Ошибки */}
            {gameWs.error && (
              <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                <span className="text-red-400 text-sm">{gameWs.error}</span>
                <button
                  onClick={gameProxy.clearError}
                  className="ml-2 text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center mb-6 bg-slate-700/30 rounded-xl p-4">
            <div className="flex items-center space-x-2 mr-6">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-white">Time: {snap.timeLeft}s</span>
            </div>

            <div className="text-white">
              Current Player:{" "}
              <span
                className={
                  snap.currentPlayer === 1 ? "text-red-400" : "text-blue-400"
                }
              >
                Player {snap.currentPlayer}
              </span>
            </div>
          </div>

          {/* Game board */}
          <div className={gridFileds(app.size)}>
            {snap.cards.map((card, index) => {
              const isPlayer1Card = card.flippedBy === 1;
              const isPlayer2Card = card.flippedBy === 2;

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    // Если игра в сетевом режиме, используем WebSocket
                    // if (gameWs.roomId && gameWs.isConnected) {
                    //   gameProxy.flipCard(index);
                    // } else {

                    // Локальная игра
                    multiGameActions.handleCardClick(index);
                  }}
                  className={`
                    aspect-square rounded-lg cursor-pointer transition-all duration-300 transform
                    ${
                      card.isFlipped || card.isMatched
                        ? card.isMatched
                          ? isPlayer1Card
                            ? "bg-red-600/80"
                            : isPlayer2Card
                              ? "bg-blue-600/80"
                              : "bg-slate-600"
                          : isPlayer1Card
                            ? "bg-red-500/50"
                            : isPlayer2Card
                              ? "bg-blue-500/50"
                              : "bg-slate-600"
                        : "bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
                    }
                    ${!card.isMatched && !card.isFlipped ? "hover:scale-105" : ""}
                    flex items-center justify-center text-2xl font-bold
                  `}
                >
                  {(card.isFlipped || card.isMatched) && (
                    <span className="text-white">{card.value}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Game status */}
          <div className="text-center mb-6">
            <div
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${snap.currentPlayer === 1 ? "bg-red-500/20" : "bg-blue-500/20"}`}
            >
              <Circle
                className={`w-3 h-3 ${snap.currentPlayer === 1 ? "fill-red-400" : "fill-blue-400"} animate-pulse`}
              />
              <span
                className={`font-semibold ${snap.currentPlayer === 1 ? "text-red-400" : "text-blue-400"}`}
              >
                Player {snap.currentPlayer}'s Turn
              </span>
              <span className="text-white">- Active</span>
            </div>
          </div>

          {/* Game controls */}
          {/*<div className="text-center mt-auto">
            {!gameWs.roomId ? (
              <div className="space-x-3">
                <button
                  onClick={createGame}
                  disabled={!gameWs.isConnected}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Game
                </button>
                <button
                  onClick={joinGame}
                  disabled={!gameWs.isConnected}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join Game
                </button>
              </div>
              ) : !snap.gameStarted ? (
              <div className="space-x-3">
                <button
                  onClick={gameProxy.startGame}
                  disabled={gameWs.playersCount < 2 || gameWs.playerId !== 1}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gameWs.playersCount < 2
                    ? "Waiting for Player 2..."
                    : "Start Game"}
                </button>
                {gameWs.playerId !== 1 && (
                  <p className="text-gray-400 text-sm">
                    Waiting for host to start the game...
                  </p>
                )}
              </div>
            ) : snap.gameOver ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {snap.winner === "draw"
                    ? "It's a draw!"
                    : `Player ${snap.winner} wins!`}
                </h2>
                <button
                  onClick={gameProxy.restartGame}
                  disabled={gameWs.playerId !== 1}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Play Again
                </button>
                {gameWs.playerId !== 1 && (
                  <p className="text-gray-400 text-sm">
                    Only host can restart the game
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={gameProxy.restartGame}
                disabled={gameWs.playerId !== 1}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Restart Game
              </button>
            )}
          </div>*/}

          <div className="text-center mt-auto">
            {!snap.gameStarted ? (
              <button
                onClick={multiGameActions.startGame}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200"
              >
                Start Game
              </button>
            ) : snap.gameOver ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {snap.winner === "draw"
                    ? "It's a draw!"
                    : `Player ${snap.winner} wins!`}
                </h2>
                <button
                  // onClick={gameProxy.restartGame}
                  // disabled={gameWs.playerId !== 1}
                  onClick={multiGameActions.restartGame}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Play Again
                </button>
                {/*{gameWs.playerId !== 1 && (
                  <p className="text-gray-400 text-sm">
                    Only host can restart the game
                  </p>
                )}*/}
              </div>
            ) : (
              <button
                // onClick={gameProxy.restartGame}
                // disabled={gameWs.playerId !== 1}
                onClick={multiGameActions.restartGame}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Restart Game
              </button>
            )}
          </div>
        </div>

        {/* Player 2 - Right Panel */}
        <UserPanel cells={player2Cells} index={1} team="Blue" />
      </div>
    </>
  );
};

export default MultiGamePage;
