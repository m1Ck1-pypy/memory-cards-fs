import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import EndGameModal from '../components/Game/EndGameModal';
// import InstructionGame from "../components/Game/InstructionGame";
import { useSnapshot } from 'valtio';
import { gameActions, gameState } from '../state/game';
import SelectFieldModal from '../components/Game/SelectFieldModal';
import SingleGame from '../components/Game/SingleGame';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MultiGame from '../components/Game/MutliGame';
import { actions, appState } from '../state/state';
import { multiGameActions, multiGameState } from '../state/multi-game';

const GamePage = () => {
  const snap_app = useSnapshot(appState);
  const snap_single_game = useSnapshot(gameState);
  const snap_multi_game = useSnapshot(multiGameState);
  const navigate = useNavigate();
  const location = useLocation();
  const players: number = location.state?.players || 1;

  const params = useParams();
  const gameId = params.gameId;

  useEffect(() => {
    if (gameId) {
      actions.changeSizeGame(false);
    }

    return () => {
      actions.changeSizeGame(true);
    };
  }, [players, gameId]);

  const onModalClose = () => {
    if (players === 1) {
      gameActions.initializeGame();
      return;
    }
    multiGameActions.initializeGame();
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4'>
      <button
        onClick={() => navigate('/')}
        className='z-100 absolute top-20 left-115 flex items-center space-x-2 text-white/70 hover:text-white transition-colors duration-200'
      >
        <ArrowLeft className='w-5 h-5' />
        <span>Back to Menu</span>
      </button>
      {snap_app?.changeSize && !gameId && (
        <SelectFieldModal players={players} />
      )}

      {players == 1 && !snap_app?.changeSize && <SingleGame />}

      {players == 2 && !snap_app?.changeSize && <MultiGame />}

      {/* Game instructions */}
      {/*{!snap.changeSize && <InstructionGame gameStarted={snap.gameStarted} />}*/}

      {/* End Game Info Modal */}
      {snap_single_game.gameOver && (
        <EndGameModal score={snap_single_game.score} onClose={onModalClose} />
      )}
      {snap_multi_game.gameOver && (
        <EndGameModal winner={snap_multi_game.winner} onClose={onModalClose} />
      )}
    </div>
  );
};

export default GamePage;
