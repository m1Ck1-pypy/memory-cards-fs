import { useSnapshot } from 'valtio';
import { multiGameState } from '../../../state/multi-game';

type Props = {
  roomId: string;
};

const PlayerInfo = ({ roomId }: Props) => {
  const multiSnap = useSnapshot(multiGameState);

  if (!roomId) return null;

  return (
    <div className='flex items-center justify-center space-x-4 text-sm'>
      <span className='text-gray-300'>Players: {multiSnap.playersCount}/2</span>
      {multiSnap.playerId && (
        <span className='text-blue-400'>
          You are Player {multiSnap.playerId}
        </span>
      )}
    </div>
  );
};

export default PlayerInfo;
