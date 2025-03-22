// ModalCommunity.tsx
import React, { useEffect, useRef } from "react";

interface ModalCommunityProps {
  show: boolean;
  onClose: () => void;
  imageSrc: string | null; // Prop to receive the image source
}

const ModalCommunity: React.FC<ModalCommunityProps> = ({
  show,
  onClose,
  imageSrc,
}) => {
  const modalRef = useRef<HTMLDivElement>(null); // Reference for the modal content

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose(); // Close the modal if clicked outside
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div
        ref={modalRef}
        className="rounded-lg p-4 max-w-3xl max-h-[80vh] overflow-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500"
        >
          &times;
        </button>
        {imageSrc && (
          <img
            src={imageSrc}
            alt="Selected Art"
            className="max-w-full max-h-[70vh] object-contain mx-auto" // Adjusted for full image display
          />
        )}
      </div>
    </div>
  );
};

export default ModalCommunity;
