import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import { supabase } from "../../client";

const UpdatePassword: React.FC = () => {
  useEffect(() => {
    document.title = "Update Password | Craftify";
  }, []);

  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/update-password");
    }
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordRef.current.value,
      });

      if (updateError) {
        setErrorMsg(updateError.message);
        return;
      }

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId || userError) {
        setErrorMsg("Failed to retrieve user information.");
        return;
      }

      // Optionally check user role (in case you want to validate role exists)
      const { data: artistData } = await supabase
        .from("artist")
        .select("role")
        .eq("user_id", userId)
        .single();

      const { data: clientData } = await supabase
        .from("client")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (!artistData?.role && !clientData?.role) {
        setErrorMsg("User role not found.");
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Password Updated!",
        text: "Your password has been updated successfully.",
        confirmButtonText: "Continue",
      });

      navigate("/dashboard"); // ✅ Let DynamicDashboard handle role-based view
    } catch (error) {
      console.error("Error updating password:", error);
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500 px-4">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-center text-red-400">
          Update Your Password
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              ref={passwordRef}
              placeholder="New Password"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-400 focus:border-red-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              ref={confirmPasswordRef}
              placeholder="Confirm Password"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-400 focus:border-red-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3"
              aria-label="Toggle confirm password visibility"
            >
              {showConfirmPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
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
