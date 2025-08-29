import React from 'react';
import { Users, X, Hash } from 'lucide-react';
import ModalContainer from './ModalContainer';
import { useSnapshot } from 'valtio';
import { appState, actions } from '../state/state';

const JoinModal: React.FC = () => {
  const snap = useSnapshot(appState);

  return (
    <ModalContainer onClose={actions.closeModal}>
      <div className='relative w-full max-w-md bg-slate-800/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl animate-modal-enter'>
        <div className='flex items-center justify-between p-6 border-b border-white/10'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600'>
              <Users className='w-5 h-5 text-white' />
            </div>
            <h2 className='text-xl font-semibold text-white'>Join Game</h2>
          </div>
          <button
            onClick={actions.closeModal}
            className='p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-200'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={(e) => actions.handleJoinSubmit(e)} className='p-6'>
          <div className='mb-6'>
            <label
              htmlFor='joinCode'
              className='block text-sm font-medium text-gray-300 mb-3'
            >
              Game Code
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                <Hash className='w-5 h-5 text-gray-400' />
              </div>
              <input
                type='text'
                id='joinCode'
                value={snap.joinCode}
                onChange={(e) => actions.setJoinCode(e.target.value)}
                placeholder='Enter game code'
                className='w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                maxLength={8}
                autoFocus
              />
            </div>
            <p className='text-xs text-gray-400 mt-2'>
              Enter the 4-8 character game code
            </p>
          </div>

          <div className='flex space-x-3'>
            <button
              type='button'
              onClick={actions.closeModal}
              className='flex-1 py-3 px-4 bg-slate-600/50 hover:bg-slate-600/70 text-white rounded-xl font-medium transition-colors duration-200'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={!snap.joinCode.trim()}
              className='flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100'
            >
              Join Game
            </button>
          </div>
        </form>
      </div>
    </ModalContainer>
  );
};

export default JoinModal;
