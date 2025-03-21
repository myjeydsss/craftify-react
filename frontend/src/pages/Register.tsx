import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSpinner, FaUser , FaPaintBrush, FaEye, FaEyeSlash } from "react-icons/fa"; // Import icons
import Swal from "sweetalert2"; // Import SweetAlert2
import axios from "axios"; // To make HTTP requests

const Register: React.FC = () => {
  useEffect(() => {
        document.title = "Register | Craftify";
      }, []);
    
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState<"Client" | "Artist" | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Toggle for password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Toggle for confirm password visibility
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !firstNameRef.current?.value ||
      !lastNameRef.current?.value ||
      !usernameRef.current?.value ||
      !emailRef.current?.value ||
      !passwordRef.current?.value ||
      !confirmPasswordRef.current?.value ||
      !role
    ) {
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Please fill all the fields.",
      });
      return;
    }

    if (passwordRef.current.value !== confirmPasswordRef.current.value) {
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Passwords do not match.",
      });
      return;
    }

    try {
      setLoading(true);

      // Check if the email is already registered
      const API_BASE_URL = import.meta.env.VITE_API_URL; 
      const emailCheckResponse = await axios.get(`${API_BASE_URL}/check-email`, {
        params: { email: emailRef.current.value }
      });

      if (emailCheckResponse.data.exists) {
        Swal.fire({
          icon: "error",
          title: "Email already in use!",
          text: "This email is already registered. Please use a different email.",
        });
        return;
      }

      // API call to your backend
      await axios.post(`${API_BASE_URL}/register`, {
        email: emailRef.current.value,
        password: passwordRef.current.value,
        firstName: firstNameRef.current.value,
        lastName: lastNameRef.current.value,
        username: usernameRef.current.value,
        role,
      });

      Swal.fire({
        icon: "success",
        title: "Registration successful!",
        text: "Check your email to confirm your account.",
      }).then(() => {
        navigate("/login"); // Redirect to login page after successful registration
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.response?.data?.error || "Error creating your account. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center py-20 justify-center min-h-screen bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-4xl font-extrabold text-center text-red-400">Create an Account</h2>
        <p className="mt-2 text-center text-gray-600">Start your journey with us today!</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* First Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">First Name</label>
            <input
              type="text"
              ref={firstNameRef}
              required
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your first name"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Last Name</label>
            <input
              type="text"
              ref={lastNameRef}
              required
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your last name"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Username</label>
            <input
              type="text"
              ref={usernameRef}
              required
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Choose a username"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              ref={emailRef}
              required
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              ref={passwordRef}
              required
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-6 right-0 p-3 text-sm text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700">Confirm Password</label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              ref={confirmPasswordRef}
              required
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-6 right-0 p-3 text-sm text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Role</label>
            <div className="flex justify-between mt-3">
              {/* Client Role */}
              <div
                onClick={() => setRole("Client")}
                className={`cursor-pointer w-full mx-2 p-5 text-center border-2 rounded-lg shadow-lg ${
                  role === "Client" ? "border-red-500 bg-red-50" : "border-gray-150"
                }`}
              >
                <FaUser  className="text-4xl text-blue-500 mx-auto mb-2" />
                <span className="block font-semibold text-gray-700">Client</span>
              </div>

              {/* Artist Role */}
              <div
                onClick={() => setRole("Artist")}
                className={`cursor-pointer w-full mx-2 p-5 text-center border-2 rounded-lg shadow-lg ${
                  role === "Artist" ? "border-red-500 bg-red-50" : "border-gray-150"
                }`}
              >
                <FaPaintBrush className="text-4xl text-yellow-400 mx-auto mb-2" />
                <span className="block font-semibold text-gray-700">Artist</span>
              </div>
            </div>
          </div>

   {/* Terms and Privacy Policy */}
   <div className="mt-4 text-center text-sm">
          By clicking Creat Account, you are agreeing to the{" "}
          <Link to="/terms-and-conditions" className="font-semibold text-red-500 hover:underline">
            Terms of Use
          </Link>{" "}
          including the arbitration clause and you are acknowledging the{" "}
          <Link to="/privacy-policy" className="font-semibold text-red-500 hover:underline">
            Privacy Policy
          </Link>.
        </div>  

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white bg-red-400 rounded-lg hover:bg-red-500 transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Registering...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>


        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-red-500 hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;