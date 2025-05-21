import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { FaSpinner } from "react-icons/fa";

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const milestoneId = searchParams.get("milestone_id");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const markMilestoneAsPaid = async () => {
      if (!milestoneId) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/milestones/${milestoneId}/mark-paid`
        );

        if (response.status === 200) {
          setSuccess(true);
        }
      } catch (error) {
        console.error("Failed to mark milestone as paid:", error);
      } finally {
        setLoading(false);
      }
    };

    markMilestoneAsPaid();
  }, [milestoneId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-white px-4">
        <div className="animate-spin text-blue-600 mb-4">
          <FaSpinner className="w-12 h-12" />
        </div>
        <p className="text-lg text-gray-600 font-medium">
          Processing your payment...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white px-4">
      {success ? (
        <>
          <CheckCircleIcon className="w-24 h-24 text-green-500 animate-bounce mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 text-center max-w-md mb-6">
            Your milestone has been marked as paid. You can now view the updated
            status in your project dashboard.
          </p>
          <button
            onClick={() => navigate("/client-project-page")}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 active:scale-95 transition-all"
          >
            Go to Project Dashboard
          </button>
        </>
      ) : (
        <>
          <ExclamationCircleIcon className="w-20 h-20 text-red-500 animate-pulse mb-6" />
          <h1 className="text-2xl font-bold text-red-600">
            Something went wrong
          </h1>
          <p className="text-gray-600 text-center max-w-md mt-2 mb-4">
            We couldn't verify your payment. Please try again or contact support
            for help.
          </p>
          <button
            onClick={() => navigate("/client-project-page")}
            className="px-6 py-3 bg-gray-600 text-white font-medium rounded-full hover:bg-gray-700 active:scale-95 transition-all"
          >
            Back to Project Page
          </button>
        </>
      )}
    </div>
  );
};

export default PaymentSuccess;
