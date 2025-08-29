import React from "react";
import type { LucideIcon } from "lucide-react";

interface Item {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

interface MenuItemProps {
  item: Item;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (e: React.MouseEvent) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  item,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  const Icon = item.icon;

  return (
    <button
      onClick={(e) => onClick(e)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        w-full group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm
        border border-white/20 transition-all duration-300 hover:scale-105 hover:bg-white/15 cursor-pointer
        ${isHovered ? "shadow-2xl" : "shadow-lg"}
      `}
    >
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <div
            className={`
            p-3 rounded-xl bg-gradient-to-br ${item.color} shadow-lg
            transition-transform duration-300 group-hover:scale-110
          `}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-semibold text-white group-hover:text-white/90 transition-colors duration-300">
            {item.label}
          </span>
        </div>

        <div
          className={`
          transition-transform duration-300
          ${isHovered ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"}
        `}
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      </div>

      <div
        className={`
        absolute inset-0 bg-gradient-to-r ${item.color} opacity-0
        transition-opacity duration-300 group-hover:opacity-10
      `}
      />

      <div
        className={`
        absolute inset-0 rounded-2xl border-2 border-gradient-to-r ${item.color} opacity-0
        transition-opacity duration-300 group-hover:opacity-50
      `}
      />
    </button>
  );
};

export default MenuItem;
