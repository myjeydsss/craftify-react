import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { FaUserCircle } from "react-icons/fa";
import ClipLoader from "react-spinners/ClipLoader";

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface AdminProfile {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  role: string;
}

const EditAdminProfile: React.FC = () => {
  useEffect(() => {
    document.title = "Edit Admin Profile";
  }, []);

  const { user } = useAuth();
  const navigate = useNavigate();

  const [adminProfile, setAdminProfile] = useState<AdminProfile>({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    role: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the admin's profile data
  const fetchAdminProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/admin-profile/${user.id}`);
      setAdminProfile(response.data);
    } catch (err) {
      console.error("Error fetching admin profile:", err);
      setError("Failed to fetch admin profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAdminProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setLoading(true);

    try {
      await axios.put(`${API_BASE_URL}/admin-profile`, { userId: user.id, profile: adminProfile });
      navigate("/admin-profile");
    } catch (error) {
      console.error("Failed to save profile:", error);
      setError("Failed to save profile. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <ClipLoader color="#3498db" loading={loading} size={80} />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
    {error && <div className="text-red-500 text-center mb-4">{error}</div>}
    <form onSubmit={handleSave} className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-[#5C0601] mb-4">My Profile</h2>
        <hr className="border-gray-300 mb-6" />
      </div>

        {/* Profile Picture Upload Section */}
        <div className="relative mx-auto w-40 h-40">
          <div className="rounded-full overflow-hidden shadow-md mb-4">
            <FaUserCircle className="w-full h-full text-gray-300" />
          </div>
        </div>

        {/* Profile Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-gray-700">First Name</label>
            <input
              name="firstname"
              value={adminProfile.firstname}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Last Name</label>
            <input
              name="lastname"
              value={adminProfile.lastname}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Username</label>
            <input
              name="username"
              value={adminProfile.username}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={adminProfile.email}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Role</label>
            <input
              name="role"
              value={adminProfile.role}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="text-center">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300 text-base font-medium"
          >
            Save Changes
          </button>
          <Link to="/admin-profile" className="ml-4 text-gray-500 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EditAdminProfile;