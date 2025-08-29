import React, { useEffect, useRef } from "react";
import { useSnapshot } from "valtio";
import { actions, appState } from "../state/state";

interface ContextMenuProps {
  onSelect: (option: string) => void;
}

const options = [
  { id: "1player", label: "1 Player" },
  { id: "2player", label: "2 Player" },
];

const StartContextMenu: React.FC<ContextMenuProps> = ({ onSelect }) => {
  const snap = useSnapshot(appState);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        actions.closeContextMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!snap.contextMenu.isOpen) return null;

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    top: snap.contextMenu.position.y,
    left: snap.contextMenu.position.x,
    zIndex: 1000,
  };

  const handleOptionSelect = (option: string) => {
    onSelect(option);
  };

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-slate-800/95 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl overflow-hidden min-w-[140px]"
    >
      {options.map((option) => (
        <div
          key={option.id}
          onClick={() => handleOptionSelect(option.id)}
          className="px-4 py-3 text-white hover:bg-purple-600/50 transition-colors duration-150 cursor-pointer"
        >
          {option.label}
        </div>
      ))}
    </div>
  );
};

export default StartContextMenu;
