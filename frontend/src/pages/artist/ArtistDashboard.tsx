import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import { Link, useNavigate } from "react-router-dom";
import { FaUsers, FaUserTie, FaPalette } from "react-icons/fa";

interface Artist {
  firstname: string;
  lastname: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Art {
  art_id: string;
  title: string;
  description: string | null;
  price: string;
  image_url: string | null;
  artist: Artist | null;
  tags: Tag[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL; // Ensure API URL is correctly set

const ArtistDashboard: React.FC = () => {
  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  const { user } = useAuth();
  const [arts, setArts] = useState<Art[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const artworksDisplayed = 4; 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArts = async () => {
      if (!user?.id) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/arts`);
        if (Array.isArray(response.data)) {
          setArts(response.data);
        } else {
          console.warn("Unexpected response for arts:", response.data);
          setArts([]);
        }
      } catch (err) {
        console.error("Error fetching arts:", err);
        setError("Failed to load arts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchArts();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#5C0601] mb-4">Welcome to Craftify!</h1>
        <p className="text-gray-500 mb-5">Explore, manage, and showcase your art.</p>
        <hr className="border-gray-300 mb-6" />
      </div>

      {/* Quick Navigation Buttons */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          className="bg-white p-6 shadow-lg rounded-lg flex flex-col items-center hover:shadow-xl transition transform hover:-translate-y-2 cursor-pointer"
          onClick={() => navigate("/browse-artists")}
        >
          <FaUsers className="text-5xl text-blue-500" />
          <h2 className="text-xl font-bold text-gray-700 mt-4">Browse Artists</h2>
          <p className="mt-2 text-gray-500 text-center">
            Discover and collaborate with fellow artists.
          </p>
        </div>

        <div
          className="bg-white p-6 shadow-lg rounded-lg flex flex-col items-center hover:shadow-xl transition transform hover:-translate-y-2 cursor-pointer"
          onClick={() => navigate("/browse-clients")}
        >
          <FaUserTie className="text-5xl text-green-500" />
          <h2 className="text-xl font-bold text-gray-700 mt-4">Browse Clients</h2>
          <p className="mt-2 text-gray-500 text-center">
            Find potential clients looking for your work.
          </p>
        </div>

        <div
          className="bg-white p-6 shadow-lg rounded-lg flex flex-col items-center hover:shadow-xl transition transform hover:-translate-y-2 cursor-pointer"
          onClick={() => navigate("/browse-arts")}
        >
          <FaPalette className="text-5xl text-purple-500" />
          <h2 className="text-xl font-bold text-gray-700 mt-4">Browse Arts</h2>
          <p className="mt-2 text-gray-500 text-center">
            Explore amazing artworks and get inspired.
          </p>
        </div>
      </div>

     {/* Artworks Section */}
<div className="bg-white shadow-md rounded-lg p-8 mb-12 mt-8">
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-semibold text-gray-900">Artworks</h2>
    <Link to="/browse-arts" className="text-orange-500 hover:underline">
      View More Arts
    </Link>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {arts.slice(0, artworksDisplayed).map((art) => (
      <div
        key={art.art_id}
        className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1"
      >
        <img
          src={art.image_url ?? "https://via.placeholder.com/300"} // Use a placeholder if null
          alt={art.title || "Artwork"}
          className="w-full h-40 sm:h-60 object-cover transition-transform duration-300 transform hover:scale-105"
        />
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-800">{art.title}</h3>
          <p className="text-gray-600">₱{parseFloat(art.price).toLocaleString()}</p>
          <Link
            to={`/art/${art.art_id}`}
            className="block mt-4 text-center bg-orange-100 text-orange-800 px-4 py-2 rounded-md hover:bg-orange-200 transition"
          >
            View Details
          </Link>
        </div>
      </div>
    ))}
  </div>
</div>
    </div>
  );
};

export default ArtistDashboard;