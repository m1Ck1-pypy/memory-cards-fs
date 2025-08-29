import React from "react";
import { Gamepad2 } from "lucide-react";

const GameLogo: React.FC = () => {
  return (
    <div className="text-center mb-16">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-500 rounded-2xl mb-6 shadow-2xl">
        <Gamepad2 className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          NEXUS
        </span>
      </h1>
      <p className="text-gray-300 text-lg font-medium">Game Portal</p>
    </div>
  );
};

export default GameLogo;
