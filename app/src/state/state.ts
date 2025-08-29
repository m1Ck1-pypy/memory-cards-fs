import { proxy } from "valtio";
import { SIZE } from "../constants/sizeGame";
import gameWsService from "../services/connect";

interface AppState {
  hoveredItem: string | null;
  showJoinModal: boolean;
  showSettingsModal: boolean;
  joinCode: string;
  musicVolume: number;
  soundVolume: number;
  useMouseKeyboard: boolean;
  contextMenu: {
    isOpen: boolean;
    position: { x: number; y: number };
    selectedOption: string | null;
  };
  changeSize: boolean;
  size: SIZE;
}

export const appState = proxy<AppState>({
  hoveredItem: null,
  showJoinModal: false,
  showSettingsModal: false,
  joinCode: "",
  musicVolume: 75,
  soundVolume: 80,
  useMouseKeyboard: true,
  contextMenu: {
    isOpen: false,
    position: { x: 0, y: 0 },
    selectedOption: null,
  },
  changeSize: true,
  size: SIZE.SMALL,
});

export const actions = {
  setHoveredItem: (item: string | null) => {
    appState.hoveredItem = item;
  },

  setShowJoinModal: (show: boolean) => {
    appState.showJoinModal = show;
  },

  setShowSettingsModal: (show: boolean) => {
    appState.showSettingsModal = show;
  },

  setJoinCode: (code: string) => {
    appState.joinCode = code;
  },

  setMusicVolume: (volume: number) => {
    appState.musicVolume = volume;
  },

  setSoundVolume: (volume: number) => {
    appState.soundVolume = volume;
  },

  setUseMouseKeyboard: (use: boolean) => {
    appState.useMouseKeyboard = use;
  },
  
  setSize: (size: SIZE) => {
    appState.size = size;
    appState.changeSize = false;
  },

  changeSizeGame: (value: boolean) => {
    appState.changeSize = value;
  },

  openContextMenu: (x: number, y: number) => {
    appState.contextMenu.isOpen = true;
    appState.contextMenu.position = { x, y };
  },

  closeContextMenu: () => {
    appState.contextMenu.isOpen = false;
    appState.contextMenu.selectedOption = null;
  },

  selectContextMenuOption: (option: string) => {
    appState.contextMenu.selectedOption = option;
    console.log(`Selected: ${option}`);
    // Add your logic here for what happens when an option is selected
    appState.contextMenu.isOpen = false;
  },

  handleMenuClick: (itemId: string, event?: React.MouseEvent) => {
    // If it's a right-click on the Start button, show context menu instead
    if (itemId === "start" && event && event.type === "contextmenu") {
      event.preventDefault();
      actions.openContextMenu(event.clientX, event.clientY);
      return;
    }

    if (itemId === "join") {
      appState.showJoinModal = true;
    } else if (itemId === "settings") {
      appState.showSettingsModal = true;
    } else if (itemId === "start" && event) {
      event.preventDefault();
      actions.openContextMenu(event.clientX, event.clientY);
    } else {
      window.close();
    }
  },

  handleJoinSubmit: (e: React.FormEvent) => {
    e.preventDefault();
    if (appState.joinCode.trim()) {
      console.log(`Joining game with code: ${appState.joinCode}`);
      
      gameWsService.joinGame(appState.joinCode);
      appState.showJoinModal = false;
      appState.joinCode = "";
    }
  },

  closeModal: () => {
    appState.showJoinModal = false;
    appState.showSettingsModal = false;
    appState.joinCode = "";
  },
};
