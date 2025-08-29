import { useSnapshot } from "valtio";
import { gameActions, gameState } from "../../state/game";
import { useEffect } from "react";
import { Clock, Star } from "lucide-react";
import { VALUE_SIZE } from "../../constants/sizeGame";
import { appState } from "../../state/state";

const SingleGame = () => {
  const snap = useSnapshot(gameState);
  const app = useSnapshot(appState);

  const cells = VALUE_SIZE[app.size];

  // Таймер
  useEffect(() => {
    if (!snap.gameStarted || snap.gameOver || snap.timeLeft <= 0) return;

    const timer = setTimeout(() => {
      gameActions.updateTimer();
    }, 1000);

    return () => clearTimeout(timer);
  }, [snap.gameStarted, snap.gameOver, snap.timeLeft]);

  console.log(snap.timeLeft);

  // Проверка завершения игры
  useEffect(() => {
    if (app.changeSize) return;
    gameActions.checkGameCompletion();
  }, [snap.matchedPairs, snap.gameOver, app.changeSize]);

  useEffect(() => {
    if (app.changeSize) return;

    gameActions.initializeGame();
  }, [app.changeSize]);

  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto">
      <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-white/20 p-8">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">
          Memory Game
        </h1>
        <p className="text-purple-400 text-lg mb-8 text-center">
          Single Player Mode
        </p>

        {/* Game info panel */}
        <div className="flex justify-between items-center mb-6 bg-slate-700/30 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-white">Time: {snap.timeLeft}s</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-white">Score: {snap.score}</span>
          </div>
          <div className="text-white">
            Pairs: {snap.matchedPairs}/{cells}
          </div>
        </div>

        {/* Game board */}
        <div
          className={`grid gap-4 mb-8 grid-cols-${VALUE_SIZE[app.size] / 2}`}
        >
          {snap.cards.map((card, index) => (
            <div
              key={card.id}
              onClick={() => gameActions.handleCardClick(index)}
              className={`
                aspect-square rounded-xl cursor-pointer transition-all duration-300 transform
                ${
                  card.isFlipped || card.isMatched
                    ? "bg-slate-600 rotate-0"
                    : "bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 rotate-y-180"
                }
                ${!card.isMatched && !card.isFlipped ? "hover:scale-105" : ""}
                ${card.isMatched ? "opacity-60" : ""}
                flex items-center justify-center text-2xl font-bold
              `}
            >
              {(card.isFlipped || card.isMatched) && (
                <span className="text-white text-5xl">{card.value}</span>
              )}
            </div>
          ))}
        </div>

        {/* Game controls */}
        <div className="text-center min-h-12">
          {!snap.gameStarted && (
            <button
              onClick={gameActions.startGame}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200"
            >
              Start Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleGame;
