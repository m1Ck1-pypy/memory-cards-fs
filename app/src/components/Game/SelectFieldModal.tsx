import { SIZE } from '../../constants/sizeGame';
import ModalContainer from '../ModalContainer';
import { actions } from '../../state/state';
import { gameProxy } from '../../state/ws';
import { useNavigate } from 'react-router-dom';
import { multiGameState } from '../../state/multi-game';
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
  const navigate = useNavigate();
  const multiSnap = useSnapshot(multiGameState);
  // const snap = useSnapshot(gameProxy);
  const onClickValueSize = async (size: SIZE) => {
    actions.setSize(size);

    if (players === 2) {
      await gameProxy.createGame();
      console.log('🚀 ~ multiSnap.roomId:', multiSnap.roomId);
      // navigate(`/game`);
    }
  };

  return (
    <ModalContainer onClose={() => true}>
      <div className='relative w-full max-w-md bg-slate-800/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl animate-modal-enter'>
        <div className='p-6 flex flex-col gap-1'>
          <h2 className='text-white text-3xl font-bold mb-4 text-center'>
            Select the field size
          </h2>
          <div className='flex justify-center space-x-4'>
            {buttons.map((button) => (
              <button
                key={button.key}
                className='px-5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200'
                onClick={() => onClickValueSize(button.size)}
              >
                {button.size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalContainer>
  );
};

export default SelectFieldModal;
