import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const ArtistVerification: React.FC = () => {
  const [portfolio, setPortfolio] = useState<File | null>(null);
  const [validId, setValidId] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPortfolio(file);
  };

  const handleValidIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setValidId(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!portfolio || !validId) {
      Swal.fire("Missing Documents", "Please upload both your portfolio and a valid ID.", "warning");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("document", portfolio);
      formData.append("valid_id", validId);

      const response = await axios.post(
        `http://localhost:8081/artist-verification/${user?.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        Swal.fire("Success", "Verification request submitted successfully.", "success").then(() =>
          navigate("/artist-profile")
        );
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.message || "An unexpected error occurred while submitting your verification.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-semibold mb-8 text-center text-gray-800">Get Verified</h1>

      {/* Explanation about verification */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8 max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Why Get Verified?</h2>
        <p className="text-gray-700 mb-6">
          Verification helps build trust with potential clients and gives your profile more visibility.
          A verified artist profile is more likely to attract clients and gain credibility in the community.
        </p>
        <h3 className="text-xl font-semibold mb-4">What Documents Are Required?</h3>
        <ul className="list-disc list-inside text-gray-700 mb-6">
          <li>Portfolio (PDF, PNG, JPG, JPEG)</li>
          <li>Valid ID (e.g., Passport, Driver’s License, National ID, etc.)</li>
        </ul>
      </div>

      {/* Verification form */}
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white shadow-lg rounded-lg p-6 space-y-4">
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">Submit Verification Documents</h3>

        {/* Portfolio input */}
        <label className="block">
          <span className="text-gray-700">Upload your portfolio (PDF, PNG, JPG, JPEG)</span>
          <input
            type="file"
            onChange={handlePortfolioChange}
            className="block w-full mt-2 border rounded-md p-2"
            accept=".pdf,.jpg,.png,.jpeg"
          />
        </label>

        {/* Valid ID input */}
        <label className="block">
          <span className="text-gray-700">Upload a valid ID (PDF, PNG, JPG, JPEG)</span>
          <input
            type="file"
            onChange={handleValidIdChange}
            className="block w-full mt-2 border rounded-md p-2"
            accept=".pdf,.jpg,.png,.jpeg"
          />
        </label>

        {/* Submit button */}
        <button
          type="submit"
          className={`w-full bg-blue-600 text-white rounded-md py-2 ${
            uploading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
          disabled={uploading}
        >
          {uploading ? "Submitting..." : "Submit for Verification"}
        </button>
      </form>

      {/* Back Button */}
      <div className="text-center mt-6">
        <button
          onClick={() => navigate("/artist-profile")}
          className="text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to Profile
        </button>
      </div>
    </div>
  );
};

export default ArtistVerification;