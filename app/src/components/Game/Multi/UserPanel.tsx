import { useSnapshot } from "valtio";
import { multiGameState } from "../../../state/multi-game";
import { Circle, Trophy } from "lucide-react";

interface Props {
  cells: number;
  index: number;
  team: "Red" | "Blue";
}

const colors = [
  {
    index: 0,
    titleTeam: "text-red-400",
    textTeam: "text-red-300",
    infoCardTitle: "text-red-400",
    infoCardIcon: "fill-red-400",
    infoCardText: "text-red-300",
    infoCardBackground: "bg-red-500/20",
    infoCardBorder: "border-red-500/30",
  },
  {
    index: 1,
    titleTeam: "text-blue-400",
    textTeam: "text-blue-300",
    infoCardTitle: "text-blue-400",
    infoCardIcon: "fill-blue-400",
    infoCardText: "text-blue-300",
    infoCardBackground: "bg-blue-500/20",
    infoCardBorder: "border-blue-500/30",
  },
];

const panelRounded = (index: number) => {
  const style: Record<number, string> = {
    0: "rounded-l-2xl",
    1: "rounded-r-2xl",
  };
  return style[index];
};

const UserPanel = ({ cells, index, team }: Props) => {
  const snap = useSnapshot(multiGameState);

  return (
    <div
      className={`w-1/5 bg-slate-800/70 backdrop-blur-md ${panelRounded(index)} border border-white/20 p-6 z-2 flex flex-col gap-4 ${snap.gameStarted && snap.currentPlayer === index + 1 ? `player-${index + 1}-turn` : ""}`}
    >
      <div className="text-center">
        <h2
          className={`text-2xl font-bold ${colors[index].titleTeam} mb-2`}
        >{`Player ${index + 1}`}</h2>
        <p className={`${colors[index].textTeam}`}>{`${team} Team`}</p>
      </div>

      <div className="bg-slate-700/40 rounded-xl p-4">
        <div className="text-center">
          <span className="text-white text-3xl font-bold flex gap-3 justify-center items-center">
            <Trophy className="w-5 h-5" />
            {snap.playerScores[index]}
          </span>
          <p className="text-gray-300">Score</p>
        </div>
      </div>

      {snap.currentPlayer === index + 1 &&
        snap.gameStarted &&
        !snap.gameOver && (
          <div
            className={`${colors[index].infoCardBackground} border ${colors[index].infoCardBorder} rounded-xl p-4 mb-6`}
          >
            <div
              className={`flex items-center justify-center space-x-2 ${colors[index].infoCardTitle} mb-2`}
            >
              <Circle
                className={`w-4 h-4 ${colors[index].infoCardIcon} animate-pulse`}
              />
              <span className="font-semibold">Your Turn!</span>
            </div>
            <p className={`${colors[index].infoCardText} text-sm text-center`}>
              Click on any unrevealed cell
            </p>
          </div>
        )}

      <div className="mt-auto">
        <h3 className="text-white font-semibold mb-3 border-b border-white/10 pb-2">
          {`Player ${index + 1} stats`}
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-300">Cells Claimed:</span>
            <span className="text-white">{cells}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Score:</span>
            <span className="text-white">{snap.playerScores[index]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPanel;
