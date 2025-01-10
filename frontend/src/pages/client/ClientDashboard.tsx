import React from "react";
import { useAuth } from "../../context/AuthProvider"; // Ensure you have this hook for auth
import { useNavigate } from "react-router-dom";

const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-poppins">
      {/* Header */}
      <header className="bg-white shadow-md p-6 rounded-md flex justify-between items-center">
        <h1 className="text-3xl font-bold text-red-500">Artist Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition"
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="bg-white p-6 shadow-md rounded-md">
          <h2 className="text-xl font-bold text-gray-700">Welcome, {user?.email}</h2>
          <p className="mt-2 text-gray-600">Manage your profile and portfolio.</p>
          <button
            onClick={() => navigate("/artist-profile")}
            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
          >
            Manage Profile
          </button>
        </div>

        {/* Projects */}
        <div className="bg-white p-6 shadow-md rounded-md">
          <h2 className="text-xl font-bold text-gray-700">Projects</h2>
          <p className="mt-2 text-gray-600">Track and manage your projects.</p>
          <button
            onClick={() => navigate("/artist-projects")}
            className="mt-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition"
          >
            View Projects
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-white p-6 shadow-md rounded-md">
          <h2 className="text-xl font-bold text-gray-700">Notifications</h2>
          <p className="mt-2 text-gray-600">Check new messages or updates.</p>
          <button
            onClick={() => navigate("/artist-notifications")}
            className="mt-4 bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 transition"
          >
            View Notifications
          </button>
        </div>
      </div>

      {/* Dashboard Statistics */}
      <div className="mt-6 bg-white p-6 shadow-md rounded-md">
        <h2 className="text-xl font-bold text-gray-700">Dashboard Statistics</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-100 p-4 rounded-md text-center">
            <h3 className="text-lg font-bold text-red-500">10</h3>
            <p className="text-gray-600">Total Projects</p>
          </div>
          <div className="bg-green-100 p-4 rounded-md text-center">
            <h3 className="text-lg font-bold text-green-500">5</h3>
            <p className="text-gray-600">Ongoing Projects</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-md text-center">
            <h3 className="text-lg font-bold text-blue-500">20</h3>
            <p className="text-gray-600">Artworks Uploaded</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-md text-center">
            <h3 className="text-lg font-bold text-yellow-500">15</h3>
            <p className="text-gray-600">New Notifications</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;