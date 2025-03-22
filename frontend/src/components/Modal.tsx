import React, { useRef, ReactNode } from "react";

interface ModalProps {
  show: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ show, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement | null>(null);

  if (!show) return null;

  const handleOutsideClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto"
      onClick={handleOutsideClick}
    >
      <div
        ref={modalRef}
        className="relative bg-white w-full max-w-[90%] max-h-[95vh] mx-auto rounded-lg shadow-lg overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <h3 className="text-lg font-semibold">View Art Details</h3>
          <button
            onClick={onClose}
            className="text-white text-2xl font-semibold hover:text-gray-300 transition"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
