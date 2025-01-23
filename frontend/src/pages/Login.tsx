import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { FaSpinner } from "react-icons/fa";
import axios from "axios";

const Login: React.FC = () => {
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifierRef.current?.value || !passwordRef.current?.value) {
      setErrorMsg("Please enter your email/username and password.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const { success, error, userId } = await login(
        identifierRef.current.value,
        passwordRef.current.value
      );

      if (!success) {
        setErrorMsg(error || "Login failed. Please try again.");
        return;
      }

      if (!userId) {
        throw new Error("User ID not found after login.");
      }

      // Fetch role based on userId directly from the backend
      const API_BASE_URL = import.meta.env.VITE_API_URL; // Backend URL
      const response = await axios.get(`${API_BASE_URL}/user-role/${userId}`);
      const { role } = response.data;

      // Redirect user based on role
      if (role === "Artist") {
        navigate("/artist-dashboard");
      } else if (role === "Client") {
        navigate("/client-dashboard");
      } else if (role === "Admin") {
        navigate("/admin-dashboard");
      } else {
        throw new Error("Invalid role. Please contact support.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500 px-4">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-center text-red-400">Welcome Back</h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Please log in to your account
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-700"
            >
              Email or Username
            </label>
            <input
              id="identifier"
              ref={identifierRef}
              type="text"
              placeholder="Enter your email or username"
              className="w-full mt-2 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-400 focus:border-red-400"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-400 focus:border-red-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {errorMsg && (
            <p className="text-sm text-red-600 bg-red-100 p-2 rounded">
              {errorMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white bg-red-400 rounded-md shadow hover:bg-red-500 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition"
          >
            {loading ? (
              <FaSpinner className="animate-spin mx-auto text-white" />
            ) : (
              "Log In"
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="text-sm text-blue-500 hover:text-blue-700 transition"
          >
            Don't have an account? Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;