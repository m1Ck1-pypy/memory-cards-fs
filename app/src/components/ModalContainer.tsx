import React from "react";

type Props = {
  onClose: () => void;
  children: React.ReactNode;
};

const ModalContainer: React.FC<Props> = ({ onClose, children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>
      {children}
    </div>
  );
};

export default ModalContainer;
