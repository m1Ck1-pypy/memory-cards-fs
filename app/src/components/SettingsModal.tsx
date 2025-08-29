import React from "react";
import { Settings, X, Volume2, VolumeX, Mouse, Keyboard } from "lucide-react";
import ModalContainer from "./ModalContainer";
import { useSnapshot } from "valtio";
import { actions, appState } from "../state/state";

const SettingsModal: React.FC = () => {
  const snap = useSnapshot(appState);

  return (
    <ModalContainer onClose={actions.closeModal}>
      <div className="relative w-full max-w-md bg-slate-800/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl animate-modal-enter">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={actions.closeModal}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <span>Music</span>
              </label>
              <span className="text-sm text-purple-400 font-medium">
                {snap.musicVolume}%
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={snap.musicVolume}
                onChange={(e) => actions.setMusicVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                <VolumeX className="w-4 h-4" />
                <span>Sound</span>
              </label>
              <span className="text-sm text-purple-400 font-medium">
                {snap.soundVolume}%
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={snap.soundVolume}
                onChange={(e) => actions.setSoundVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                {snap.useMouseKeyboard ? (
                  <Mouse className="w-4 h-4" />
                ) : (
                  <Keyboard className="w-4 h-4" />
                )}
                <span>Mouse/Keyboard</span>
              </label>
              <button
                onClick={() =>
                  actions.setUseMouseKeyboard(!snap.useMouseKeyboard)
                }
                className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800
                ${snap.useMouseKeyboard ? "bg-gradient-to-r from-purple-500 to-purple-600" : "bg-slate-600"}
              `}
              >
                <span
                  className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
                  ${snap.useMouseKeyboard ? "translate-x-6" : "translate-x-1"}
                `}
                />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {snap.useMouseKeyboard
                ? "Mouse and keyboard controls enabled"
                : "Touch/gamepad controls enabled"}
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-white/10">
          <button
            onClick={actions.closeModal}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
          >
            Save Settings
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

export default SettingsModal;
