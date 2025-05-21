import React from "react";
import { useNavigate } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white px-4">
      <ExclamationTriangleIcon className="w-24 h-24 text-yellow-500 animate-pulse mb-6" />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Payment Cancelled
      </h1>
      <p className="text-gray-600 text-center max-w-md mb-6">
        You have cancelled the payment process. No changes were made. If this
        was a mistake, you can try again or return to your project board.
      </p>
      <button
        onClick={() => navigate("/client-project-page")}
        className="px-6 py-3 bg-gray-700 text-white font-medium rounded-full hover:bg-gray-800 active:scale-95 transition-all"
      >
        Return to Project Page
      </button>
    </div>
  );
};

export default PaymentCancel;
