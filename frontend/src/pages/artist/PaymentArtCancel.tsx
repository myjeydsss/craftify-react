import React from "react";
import { useNavigate } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

const PaymentArtCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white px-4">
      <ExclamationTriangleIcon className="w-24 h-24 text-yellow-500 animate-pulse mb-6" />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Payment Cancelled
      </h1>
      <p className="text-gray-600 text-center max-w-md mb-6">
        You cancelled the payment for this artwork. If this was a mistake, you
        can return to the art listings and try again at any time.
      </p>
      <button
        onClick={() => navigate("/cart")}
        className="px-6 py-3 bg-gray-700 text-white font-medium rounded-full hover:bg-gray-800 active:scale-95 transition-all"
      >
        Go to Cart
      </button>
    </div>
  );
};

export default PaymentArtCancel;
