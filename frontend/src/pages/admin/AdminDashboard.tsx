import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthProvider"; // Ensure you have this hook for auth
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from '../../../client'; // Import the Supabase client
import { FaUsers, FaPalette, FaCheckCircle, FaUserTie, FaFileUpload } from 'react-icons/fa'; // Import icons

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State variables for statistics
  const [clientCount, setClientCount] = useState<number>(0);
  const [artistCount, setArtistCount] = useState<number>(0);
  const [verificationCount, setVerificationCount] = useState<number>(0);
  const [artCount, setArtCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchStatistics = async () => {
      setLoading(true);
      try {
        // Fetch client count
        const { count: clientsCount, error: clientError } = await supabase
          .from("client") // Replace with your actual clients table name
          .select("*", { count: 'exact', head: true });

        if (clientError) throw clientError;

        setClientCount(clientsCount || 0); // Set client count

        // Fetch artist count
        const { count: artistsCount, error: artistError } = await supabase
          .from("artist") // Replace with your actual artists table name
          .select("*", { count: 'exact', head: true });

        if (artistError) throw artistError;

        setArtistCount(artistsCount || 0); // Set artist count

        // Fetch verification count
        const { count: verificationsCount, error: verificationError } = await supabase
          .from("artist_verification") // Replace with your actual verifications table name
          .select("*", { count: 'exact', head: true });

        if (verificationError) throw verificationError;

        setVerificationCount(verificationsCount || 0); // Set verification count

        // Fetch arts count
        const { count: artsCount, error: artsError } = await supabase
          .from("arts") // Replace with your actual arts table name
          .select("*", { count: 'exact', head: true });

        if (artsError) throw artsError;

        setArtCount(artsCount || 0); // Set arts count
      } catch (error) {
        console.error("Error fetching statistics:", error);
        Swal.fire("Error", "Failed to load statistics.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Calculate total users
  const totalUsers = clientCount + artistCount;

  return (
    <div className="container mx-auto px-4 py-16">

      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#5C0601] mb-4">Admin Dashboard</h1>
        <hr className="border-gray-300 mb-6" />
      </div>
           
      {/* Main Content */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users Count Card */}
        <div className="bg-white p-6 shadow-lg rounded-md transition-transform transform hover:scale-105">
          <div className="flex items-center mb-4">
            <FaUsers className="text-3xl text-purple-500 mr-2" />
              <h2 className="text-xl font-bold text-gray-700">Total Users</h2>
          </div>
          <p className="mt-2 text-3xl font-bold text-center text-purple-500">{totalUsers}</p>
        </div>

        {/* Client Count Card */}
        <div className="bg-white p-6 shadow-lg rounded-md transition-transform transform hover:scale-105">
          <div className="flex items-center mb-4">
            <FaUserTie className="text-3xl text-red-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-700">Total Clients Users</h2>
          </div>
          <p className="mt-2 text-3xl font-bold text-center text-red-500">{clientCount}</p>
        </div>

        {/* Artist Count Card */}
        <div className="bg-white p-6 shadow-lg rounded-md transition-transform transform hover:scale-105">
          <div className="flex items-center mb-4">
            <FaPalette className="text-3xl text-green-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-700">Total Artists Users</h2>
          </div>
          <p className="mt-2 text-3xl font-bold text-center text-green-500">{artistCount}</p>
        </div>

        {/* Verification Count Card */}
        <div className="bg-white p-6 shadow-lg rounded-md transition-transform transform hover:scale-105">
          <div className="flex items-center mb-4">
            <FaCheckCircle className="text-3xl text-blue-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-700">Total Verified Artists</h2>
          </div>
          <p className="mt-2 text-3xl font-bold text-center text-blue-500">{verificationCount}</p>
        </div>

        {/* Art Count Card */}
        <div className="bg-white p-6 shadow-lg rounded-md transition-transform transform hover:scale-105">
          <div className="flex items-center mb-4">
            <FaFileUpload className="text-3xl text-purple-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-700">Total Artworks Uploaded</h2>
          </div>
          <p className="mt-2 text-3xl font-bold text-center text-purple-500">{artCount}</p>
        </div>
      </div>

      
    </div>
  );
};

export default AdminDashboard;