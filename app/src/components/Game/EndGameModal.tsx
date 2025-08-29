import ModalContainer from "../ModalContainer";

interface Props {
  score?: number;
  winner?: 1 | 2 | null | "draw";
  onClose: () => void;
}

const EndGameModal: React.FC<Props> = ({ score, onClose, winner }) => {
  const onCloseModal = () => onClose();
  return (
    <ModalContainer onClose={onCloseModal}>
      <div className="relative w-full max-w-md bg-slate-800/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl animate-modal-enter">
        <div className="p-6">
          <h2 className="text-white text-2xl font-bold mb-4 text-center">
            Game Over
          </h2>
          {!!score ||
            (score === 0 && (
              <p className="text-white text-lg mb-4">Your score: {score}</p>
            ))}
          {!!winner && <Winner winner={winner} />}
          <button
            onClick={onCloseModal}
            className="px-5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200"
          >
            Play Again
          </button>
        </div>
      </div>
    </ModalContainer>
  );
};

export default EndGameModal;

const Winner = ({ winner }: { winner: 1 | 2 | null | "draw" }) => {
  return (
    <p className="text-white text-lg mb-4">
      Result Game:{" "}
      {winner === 1 ? "Win Player 1" : winner === 2 ? "Win Player 2" : "Draw"}
    </p>
  );
};
