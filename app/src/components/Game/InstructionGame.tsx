interface Props {
  gameStarted: boolean;
}

const InstructionGame = ({ gameStarted }: Props) => {
  if (gameStarted) return null;

  return (
    <div className="absolute top-30 left-150 transform -translate-x-1/2 bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 max-w-md">
      <h3 className="text-white font-semibold mb-2">How to play:</h3>
      <ul className="text-gray-300 text-sm list-disc list-inside">
        <li>Find all matching pairs of numbers</li>
        <li>Click on a card to flip it</li>
        <li>Match two identical cards to make them disappear</li>
        <li>Complete before the time runs out!</li>
      </ul>
    </div>
  );
};

export default InstructionGame;
