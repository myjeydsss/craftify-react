import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import { Link, useNavigate } from "react-router-dom";
import { FaUsers, FaUserTie, FaPalette } from "react-icons/fa";

interface Artist {
  user_id: string;
  firstname: string;
  lastname: string;
  profile_image: string | null;
  status: string | null;
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

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ClientDashboard: React.FC = () => {
  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [arts, setArts] = useState<Art[]>([]);
  const [verifiedArtists, setVerifiedArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const artworksDisplayed = 4;

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

    const fetchVerifiedArtists = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/verified-artists`);

        setVerifiedArtists(response.data);
      } catch (error) {
        console.error("Error fetching verified artists:", error);
      }
    };

    fetchArts();
    fetchVerifiedArtists();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#5C0601] mb-4">
          Welcome to Craftify!
        </h1>
        <p className="text-gray-500 mb-5">
          Explore, manage, and showcase your art.
        </p>
        <hr className="border-gray-300 mb-6" />
      </div>

      {/* Quick Navigation Buttons */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          className="bg-white p-6 shadow-lg rounded-lg flex flex-col items-center hover:shadow-xl transition transform hover:-translate-y-2 cursor-pointer"
          onClick={() => navigate("/browse-artists")}
        >
          <FaUsers className="text-5xl text-blue-500" />
          <h2 className="text-xl font-bold text-gray-700 mt-4">
            Browse Artists
          </h2>
          <p className="mt-2 text-gray-500 text-center">
            Discover and collaborate with fellow artists.
          </p>
        </div>

        <div
          className="bg-white p-6 shadow-lg rounded-lg flex flex-col items-center hover:shadow-xl transition transform hover:-translate-y-2 cursor-pointer"
          onClick={() => navigate("/browse-clients")}
        >
          <FaUserTie className="text-5xl text-green-500" />
          <h2 className="text-xl font-bold text-gray-700 mt-4">
            Browse Clients
          </h2>
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
                src={art.image_url ?? "https://via.placeholder.com/300"}
                alt={art.title || "Artwork"}
                className="w-full h-40 sm:h-60 object-cover transition-transform duration-300 transform hover:scale-105"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800">{art.title}</h3>
                <p className="text-gray-600">
                  ₱{parseFloat(art.price).toLocaleString()}
                </p>
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

      {/* Verified Artists Section */}
      <div className="bg-white shadow-md rounded-lg p-8 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Verified Artists
          </h2>
          <Link
            to="/browse-artists"
            className="text-orange-500 hover:underline"
          >
            View All Artists
          </Link>
        </div>
        {verifiedArtists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {verifiedArtists.slice(0, 4).map((artist) => (
              <div
                key={artist.user_id}
                className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1 text-center"
              >
                <div className="p-4">
                  <img
                    src={
                      artist.profile_image ??
                      "https://via.placeholder.com/150x150.png?text=No+Image"
                    }
                    alt={`${artist.firstname} ${artist.lastname}`}
                    className="w-24 h-24 mx-auto rounded-full object-cover shadow-md mb-4"
                  />
                  <h3 className="text-lg font-bold text-gray-800">
                    {artist.firstname} {artist.lastname}
                  </h3>
                  <div className="mt-2 inline-block bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                    I.D. Verified
                  </div>
                  <Link
                    to={`/profile/artist/${artist.user_id}`}
                    className="block mt-4 bg-orange-100 text-orange-800 px-4 py-2 rounded-md hover:bg-blue-200 transition"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">
            No verified artists available right now.
          </p>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
