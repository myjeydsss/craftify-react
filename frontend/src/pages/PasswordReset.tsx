import React, { useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer"; // Import Footer if you have one

const PasswordReset: React.FC = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailRef.current?.value) {
      setErrorMsg("Email is required.");
      return;
    }

    try {
      setErrorMsg("");
      setLoading(true); // Set loading to true

      // Make sure to use the correct API URL
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/password-reset`, {
        email: emailRef.current.value,
      });

      // Show success alert
      await Swal.fire({
        title: "Success!",
        text: response.data.message,
        icon: "success",
        confirmButtonText: "Okay",
      });

      // Clear the input field
      emailRef.current.value = "";

      // Redirect to login page after the alert is confirmed
      navigate("/login");
    } catch (error) {
      // Check if the error response exists and set the error message accordingly
      if (axios.isAxiosError(error) && error.response) {
        setErrorMsg(error.response.data.error || "Failed to send password reset email.");
      } else {
        setErrorMsg("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500 px-4">
        <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
          <h2 className="text-3xl font-bold text-center text-red-400">Reset Your Password</h2>
          <p className="mt-2 text-center text-sm text-gray-500">Please enter your email to receive a password reset link.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Email</label>
              <input
                type="email"
                ref={emailRef}
                required
                className="w-full mt-1 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-400 focus:border-red-400"
                placeholder="Enter your email"
              />
            </div>
            {errorMsg && (
              <div className="p-3 mt-2 text-sm text-red-800 bg-red-100 rounded-lg">
                {errorMsg}
              </div>
            )}
            <button
              type="submit"
              disabled={loading} // Disable button while loading
              className="w-full py-3 text-white bg-red-400 rounded-md shadow hover:bg-red-500 transition"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <div className="mt-4 text-center text-sm">
            <p className="text-gray-600">Remembered your password? <span className="font-semibold text-blue-500 hover:underline cursor-pointer" onClick={() => navigate("/login")}>Login</span></p>
          </div>
        </div>
      </div>
      <Footer /> {/* Include Footer if you have one */}
    </>
  );
};

export default PasswordReset;