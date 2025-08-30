import { useSnapshot } from 'valtio';
import { gameProxy } from '../../../state/ws';
import { X } from 'lucide-react';

const Errors = () => {
  const snapProxy = useSnapshot(gameProxy);

  if (!snapProxy.error) return null;

  return (
    <div className='flex items-center justify-center mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg'>
      <span className='text-red-400 text-sm'>{gameProxy.error}</span>
      <button
        onClick={gameProxy.clearError}
        className='ml-2 text-red-400 hover:text-red-300 cursor-pointer'
      >
        <X className='w-4 h-4' />
      </button>
    </div>
  );
};

export default Errors;
