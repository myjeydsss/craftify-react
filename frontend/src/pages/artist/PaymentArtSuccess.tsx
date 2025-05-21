import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

const PaymentArtSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white px-4">
      <CheckCircleIcon className="w-24 h-24 text-green-500 animate-bounce mb-6" />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Purchase Successful!
      </h1>
      <p className="text-gray-600 text-center max-w-md mb-6">
        Your payment was successfully processed. The artwork you selected is now
        part of your collection. You can view it in your cart.
      </p>
      <button
        onClick={() => navigate("/cart")}
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 active:scale-95 transition-all"
      >
        Go to Cart
      </button>
    </div>
  );
};

export default PaymentArtSuccess;
