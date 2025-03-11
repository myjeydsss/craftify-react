import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Import Navigate for redirection
import Swal from "sweetalert2"; // Import SweetAlert2
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai"; // Import icons for visibility toggle
import { supabase } from "../../client"; // Adjust the import based on your setup

const UpdatePassword: React.FC = () => {
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false); // State for password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false); // State for confirm password visibility
  const navigate = useNavigate();
  const location = useLocation();

  // Check for a valid token in the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token'); // Extract token from URL

    if (!token) {
      // Redirect to login if no token
      navigate("/update-password");
    }
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if refs are defined
    if (!passwordRef.current || !confirmPasswordRef.current) {
      setErrorMsg("Unable to access password fields.");
      return;
    }

    if (passwordRef.current.value !== confirmPasswordRef.current.value) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser ({
        password: passwordRef.current.value,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        // Show success toast
        await Swal.fire({
          icon: 'success',
          title: 'Password Updated!',
          text: 'Your password has been updated successfully.',
          confirmButtonText: 'OK',
        });

        navigate("/dashboard"); // Redirect to the login page after successful update
      }
    } catch (error) {
      console.error("Failed to update password:", error);
      setErrorMsg("Failed to update password . Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500 px-4">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-center text-red-400">Update Your Password</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} // Toggle input type
              ref={passwordRef}
              placeholder="New Password"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-400 focus:border-red-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)} // Toggle visibility
              className="absolute right-3 top-3"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />} {/* Show/hide icon */}
            </button>
          </div>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"} // Toggle input type
              ref={confirmPasswordRef}
              placeholder="Confirm Password"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-400 focus:border-red-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Toggle visibility
              className="absolute right-3 top-3"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <AiFillEye /> : <AiFillEyeInvisible />} {/* Show/hide icon */}
            </button>
          </div>
          {errorMsg && <p className="mt-2 text-red-500">{errorMsg}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white bg-red-400 rounded-md shadow hover:bg-red-500 transition"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
        <button
          onClick={() => navigate("/login")}
          className="mt-4 w-full py-3 text-white bg-gray-400 rounded-md shadow hover:bg-gray-500 transition"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default UpdatePassword; 
