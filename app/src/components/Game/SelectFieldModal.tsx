import { SIZE } from '../../constants/sizeGame';
import ModalContainer from '../ModalContainer';
import { actions, appState } from '../../state/state';
import { gameProxy } from '../../state/ws';
// import { multiGameState } from '../../state/multi-game';
import { useSnapshot } from 'valtio';

const buttons = [
  {
    key: 's',
    size: SIZE.SMALL,
  },
  {
    key: 'm',
    size: SIZE.MEDIUM,
  },
  {
    key: 'l',
    size: SIZE.LARGE,
  },
];

const SelectFieldModal = ({ players }: { players: number }) => {
  // const multiSnap = useSnapshot(multiGameState);
  const appSnap = useSnapshot(appState);
  // const snap = useSnapshot(gameProxy);

  const onClickValueSize = (size: SIZE) => {
    actions.setSize(size);
  };

  const onCreateGame = async () => {
    if (players === 2) {
      gameProxy.createGame();
    }
    actions.changeSizeGame(false);
  };

  const isActiveSize = (size: SIZE) => {
    if (appSnap.size === size) {
      return `from-purple-800 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-2 border-white`;
    } else {
      return `from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700`;
    }
  };

  return (
    <ModalContainer onClose={() => true}>
      <div className='relative w-full max-w-md bg-slate-800/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl animate-modal-enter'>
        <div className='p-6 flex flex-col gap-6'>
          <h2 className='text-white text-3xl font-bold text-center'>
            Select the field size
          </h2>
          <div className='flex justify-center gap-3 px-2'>
            {buttons.map((button) => (
              <button
                key={button.key}
                className={`px-5 py-2 bg-gradient-to-r text-white rounded-xl font-medium transition-all duration-200 border-2 border-transparent ${isActiveSize(
                  button.size,
                )}`}
                onClick={() => onClickValueSize(button.size)}
              >
                {button.size}
              </button>
            ))}
          </div>
          <button
            onClick={onCreateGame}
            className='text-2xl text-white p-2 w-full rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
          >
            Create Game
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

export default SelectFieldModal;
