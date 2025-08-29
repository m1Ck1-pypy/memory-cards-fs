import { useSnapshot } from "valtio";
import { gameProxy } from "../../../state/ws";
import { Wifi, WifiOff } from "lucide-react";

const ConnectStatus = () => {
  const gameWs = useSnapshot(gameProxy);

  return (
    <div className="flex items-center justify-center mb-4">
      <div
        className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
          gameWs.isConnected
            ? "bg-green-500/20"
            : gameWs.isConnecting
              ? "bg-yellow-500/20"
              : "bg-red-500/20"
        }`}
      >
        {gameWs.isConnected ? (
          <Wifi className="w-4 h-4 text-green-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400" />
        )}
        <span
          className={`text-sm font-medium ${
            gameWs.isConnected
              ? "text-green-400"
              : gameWs.isConnecting
                ? "text-yellow-400"
                : "text-red-400"
          }`}
        >
          {gameWs.isConnected
            ? "Connected"
            : gameWs.isConnecting
              ? "Connecting..."
              : "Disconnected"}
        </span>
      </div>
    </div>
  );
};

export default ConnectStatus;
