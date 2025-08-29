import { useSnapshot } from "valtio";
import AnimatedBackground from "./components/AnimatedBackground";
import GameLogo from "./components/GameLogo";
import MenuItem from "./components/MenuItem";
import JoinModal from "./components/JoinModal";
import SettingsModal from "./components/SettingsModal";
import ContextMenu from "./components/StartContextMenu";
import { appState, actions } from "./state/state";
import { menuItems } from "./constants/menuItems";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import GamePage from "./pages/Game";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

const HomePage = () => {
  const snap = useSnapshot(appState);
  const navigate = useNavigate();

  const handleContextMenuSelect = (option: string) => {
    actions.selectContextMenuOption(option);

    // Navigate to game page with the selected player count
    const players = option === "1player" ? 1 : 2;
    navigate("/game", { state: { players } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <GameLogo />

        <div className="space-y-4">
          {menuItems.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              isHovered={snap.hoveredItem === item.id}
              onMouseEnter={() => actions.setHoveredItem(item.id)}
              onMouseLeave={() => actions.setHoveredItem(null)}
              onClick={(e) => actions.handleMenuClick(item.id, e)}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">Version 1.0.0</p>
        </div>
      </div>

      {snap.showJoinModal && <JoinModal />}
      {snap.showSettingsModal && <SettingsModal />}

      <ContextMenu onSelect={handleContextMenuSelect} />
    </div>
  );
};
