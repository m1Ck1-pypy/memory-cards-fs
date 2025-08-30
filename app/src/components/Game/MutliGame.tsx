import React, { useEffect } from 'react';
import { useSnapshot, type Snapshot } from 'valtio';
import { Clock, Copy, Circle } from 'lucide-react';
import {
  multiGameState,
  multiGameActions,
  type MultiPlayerGameState,
} from '../../state/multi-game';
import { appState } from '../../state/state';
import { initGameStore } from '../../state/ws';
import { SIZE, VALUE_SIZE } from '../../constants/sizeGame';
import UserPanel from './Multi/UserPanel';
import ConnectStatus from './Multi/ConnectStatus';
import Errors from './Multi/Errors';
import PlayerInfo from './Multi/PlayerInfo';

const gridFileds = (size: SIZE) => {
  const cells = VALUE_SIZE[size] / 2;
  const style: Record<number, string> = {
    4: 'grid grid-cols-4 gap-3 mb-6',
    6: 'grid grid-cols-6 gap-3 mb-6',
    8: 'grid grid-cols-8 gap-3 mb-6',
  };

  return style[cells];
};

const playerCells = (snap: Snapshot<MultiPlayerGameState>, player: number) => {
  return snap.cards.filter(
    (card) => card.flippedBy === player && card.isMatched,
  ).length;
};

const MultiGamePage: React.FC = () => {
  const snapMulti = useSnapshot(multiGameState);
  const app = useSnapshot(appState);

  // const { gameId } = useParams();

  // Инициализация WebSocket и игры
  useEffect(() => {
    if (app.changeSize) return;

    multiGameActions.initializeGame();

    // Инициализируем WebSocket соединение
    const cleanup = initGameStore();
    return cleanup;
  }, [app.changeSize]);

  // Таймер
  useEffect(() => {
    if (!snapMulti.gameStarted || snapMulti.gameOver || snapMulti.timeLeft <= 0)
      return;

    const timer = setTimeout(() => {
      multiGameActions.updateTimer();
    }, 1000);

    return () => clearTimeout(timer);
  }, [snapMulti.timeLeft, snapMulti.gameStarted, snapMulti.gameOver]);

  // Копирование ID комнаты в буфер обмена
  const copyRoomId = () => {
    navigator.clipboard.writeText(snapMulti.roomId);
  };

  // useEffect(() => {
  //   if (gameId) {
  //     gameProxy.joinGame(gameId);
  //     return;
  //   }
  // }, [gameId]);

  // if (!snapMulti.roomId || !gameId) return <>loading...</>;

  return (
    <>
      <div className='relative w-full max-w-7xl h-[90vh] flex'>
        {/* Player 1 - Left Panel */}
        <UserPanel cells={playerCells(snapMulti, 1)} index={0} team='Red' />

        {/* Center Game Area */}
        <div className='w-3/4 bg-slate-800/50 backdrop-blur-md border-y border-white/20 p-6 flex flex-col'>
          {/* Статус подключения */}
          <ConnectStatus />

          <div className='text-center mb-6'>
            <h1 className='text-3xl font-bold text-white mb-2'>
              Multi-Player Game
            </h1>
            <div className='flex items-center justify-center space-x-2'>
              <span className='text-gray-300'>Room:</span>
              <span className='text-purple-400 font-mono'>
                {snapMulti.roomId}
              </span>
              <button
                onClick={copyRoomId}
                className='p-1 text-gray-400 hover:text-white transition-colors'
                title='Copy Room ID'
              >
                <Copy className='w-4 h-4' />
              </button>
            </div>

            {/* Информация об игроках */}
            <PlayerInfo roomId={snapMulti.roomId} />

            {/* Ошибки */}
            <Errors />
          </div>

          <div className='flex items-center justify-center mb-6 bg-slate-700/30 rounded-xl p-4'>
            <div className='flex items-center space-x-2 mr-6'>
              <Clock className='w-5 h-5 text-purple-400' />
              <span className='text-white'>Time: {snapMulti.timeLeft}s</span>
            </div>

            <div className='text-white'>
              Current Player:{' '}
              <span
                className={
                  snapMulti.currentPlayer === 1
                    ? 'text-red-400'
                    : 'text-blue-400'
                }
              >
                Player {snapMulti.currentPlayer}
              </span>
            </div>
          </div>

          {/* Game board */}
          <div className={gridFileds(app.size)}>
            {snapMulti.cards.map((card, index) => {
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
                            ? 'bg-red-600/80'
                            : isPlayer2Card
                            ? 'bg-blue-600/80'
                            : 'bg-slate-600'
                          : isPlayer1Card
                          ? 'bg-red-500/50'
                          : isPlayer2Card
                          ? 'bg-blue-500/50'
                          : 'bg-slate-600'
                        : 'bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800'
                    }
                    ${
                      !card.isMatched && !card.isFlipped
                        ? 'hover:scale-105'
                        : ''
                    }
                    flex items-center justify-center text-2xl font-bold
                  `}
                >
                  {(card.isFlipped || card.isMatched) && (
                    <span className='text-white'>{card.value}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Game status */}
          <div className='text-center mb-6'>
            <div
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
                snapMulti.currentPlayer === 1
                  ? 'bg-red-500/20'
                  : 'bg-blue-500/20'
              }`}
            >
              <Circle
                className={`w-3 h-3 ${
                  snapMulti.currentPlayer === 1
                    ? 'fill-red-400'
                    : 'fill-blue-400'
                } animate-pulse`}
              />
              <span
                className={`font-semibold ${
                  snapMulti.currentPlayer === 1
                    ? 'text-red-400'
                    : 'text-blue-400'
                }`}
              >
                Player {snapMulti.currentPlayer}'s Turn
              </span>
              <span className='text-white'>- Active</span>
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
              ) : !snapMulti.gameStarted ? (
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
            ) : snapMulti.gameOver ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {snapMulti.winner === "draw"
                    ? "It's a draw!"
                    : `Player ${snapMulti.winner} wins!`}
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

          <div className='text-center mt-auto'>
            {!snapMulti.gameStarted ? (
              <button
                onClick={multiGameActions.startGame}
                className='px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200'
              >
                Start Game
              </button>
            ) : snapMulti.gameOver ? (
              <div>
                <h2 className='text-2xl font-bold text-white mb-4'>
                  {snapMulti.winner === 'draw'
                    ? "It's a draw!"
                    : `Player ${snapMulti.winner} wins!`}
                </h2>
                <button
                  // onClick={gameProxy.restartGame}
                  // disabled={gameWs.playerId !== 1}
                  onClick={multiGameActions.restartGame}
                  className='px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
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
                className='px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Restart Game
              </button>
            )}
          </div>
        </div>

        {/* Player 2 - Right Panel */}
        <UserPanel cells={playerCells(snapMulti, 2)} index={1} team='Blue' />
      </div>
    </>
  );
};

export default MultiGamePage;
