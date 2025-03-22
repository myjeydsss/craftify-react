import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaEdit } from "react-icons/fa";
import ClipLoader from "react-spinners/ClipLoader";
import { useAuth } from "../../context/AuthProvider"; // Import the AuthProvider

interface AdminProfileData {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  role: string;
}

const AdminProfile: React.FC = () => {
  const { user } = useAuth(); // Get the user from AuthProvider
  const [adminProfile, setAdminProfile] = useState<AdminProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();

  // Fetch the admin's profile data
  const fetchAdminProfile = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL; // Ensure this is set in your environment variables

    if (!user) {
      setError("User  not logged in.");
      setLoading(false);
      return;
    }

    try {
      const { data: sessionData } = await axios.get(`${API_BASE_URL}/admin-profile/${user.id}`);
      setAdminProfile(sessionData);
    } catch (err: any) {
      console.error("Error fetching admin profile:", err);
      setError(err.response?.data?.error || "Failed to fetch admin profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
  }, [user]); // Fetch profile when user changes

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ClipLoader color="#3498db" loading={loading} size={80} />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Profile Picture */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-48 h-48 rounded-full overflow-hidden shadow-md mb-4">
          <FaUserCircle className="w-full h-full text-gray-300" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-800">{`${adminProfile?.firstname} ${adminProfile?.lastname}`}</h1>
        <p className="text-gray-600 text-lg">{adminProfile?.role || "No role assigned"}</p>
      </div>

      {/* Profile Details Section */}
      <div className="mt-8 bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Profile Details</h2>
        <div className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Firstname:</span>
            <span className="text-gray-700">{adminProfile?.firstname || "No username available"}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Lastname:</span>
            <span className="text-gray-700">{adminProfile?.lastname || "No username available"}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Role:</span>
            <span className="text-gray-700">{adminProfile?.role || "No username available"}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Username:</span>
            <span className="text-gray-700">{adminProfile?.username || "No username available"}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">Email:</span>
            <span className="text-gray-700">{adminProfile?.email}</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Button */}
      <div className="mt-12 text-center">
        <button
          onClick={() => navigate("/edit-admin-profile")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300 text-base font-medium"
        >
          <FaEdit className="inline mr-2" /> Edit Profile
        </button>
      </div>
    </div>
  );
};

export default AdminProfile;