import React from "react";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaUserTie,
  FaPalette,
  FaProjectDiagram,
  FaBell,
  FaImages,
} from "react-icons/fa";

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-poppins">
      {/* Header */}
      <header className="bg-white shadow-md p-6 rounded-md text-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {user?.email}!
        </h1>
        <p className="text-gray-500 mt-1">
          Explore, manage, and showcase your art.
        </p>
      </header>

      {/* Quick Navigation Buttons */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          className="bg-white p-6 shadow-lg rounded-lg flex flex-col items-center hover:shadow-xl transition cursor-pointer"
          onClick={() => navigate("/browse-artists")}
        >
          <FaUsers className="text-5xl text-blue-500" />
          <h2 className="text-xl font-bold text-gray-700 mt-4">Browse Artists</h2>
          <p className="mt-2 text-gray-500 text-center">
            Discover and collaborate with fellow artists.
          </p>
        </div>

        <div
          className="bg-white p-6 shadow-lg rounded-lg flex flex-col items-center hover:shadow-xl transition cursor-pointer"
          onClick={() => navigate("/browse-clients")}
        >
          <FaUserTie className="text-5xl text-green-500" />
          <h2 className="text-xl font-bold text-gray-700 mt-4">Browse Clients</h2>
          <p className="mt-2 text-gray-500 text-center">
            Find potential clients looking for your work.
          </p>
        </div>

        <div
          className="bg-white p-6 shadow-lg rounded-lg flex flex-col items-center hover:shadow-xl transition cursor-pointer"
          onClick={() => navigate("/browse-arts")}
        >
          <FaPalette className="text-5xl text-purple-500" />
          <h2 className="text-xl font-bold text-gray-700 mt-4">Browse Arts</h2>
          <p className="mt-2 text-gray-500 text-center">
            Explore amazing artworks and get inspired.
          </p>
        </div>
      </div>

      {/* Dashboard Statistics */}
      <div className="mt-8 bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Dashboard Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-red-100 p-6 rounded-lg flex flex-col items-center shadow-sm">
            <FaProjectDiagram className="text-4xl text-red-500" />
            <h3 className="text-xl font-bold text-red-500 mt-2">10</h3>
            <p className="text-gray-600">Total Projects</p>
          </div>
          <div className="bg-green-100 p-6 rounded-lg flex flex-col items-center shadow-sm">
            <FaProjectDiagram className="text-4xl text-green-500" />
            <h3 className="text-xl font-bold text-green-500 mt-2">5</h3>
            <p className="text-gray-600">Ongoing Projects</p>
          </div>
          <div className="bg-blue-100 p-6 rounded-lg flex flex-col items-center shadow-sm">
            <FaImages className="text-4xl text-blue-500" />
            <h3 className="text-xl font-bold text-blue-500 mt-2">20</h3>
            <p className="text-gray-600">Artworks Uploaded</p>
          </div>
          <div className="bg-yellow-100 p-6 rounded-lg flex flex-col items-center shadow-sm">
            <FaBell className="text-4xl text-yellow-500" />
            <h3 className="text-xl font-bold text-yellow-500 mt-2">15</h3>
            <p className="text-gray-600">New Notifications</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;