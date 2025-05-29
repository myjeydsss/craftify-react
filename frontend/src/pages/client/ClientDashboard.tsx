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
    fetchArts();
  }, [user]);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/artists`);
        if (Array.isArray(response.data)) {
          const approved = response.data.filter(
            (a: Artist) => a.status === "approved"
          );
          setVerifiedArtists(approved);
        } else {
          console.warn("Unexpected response for artists:", response.data);
        }
      } catch (err) {
        console.error("Error fetching artists:", err);
      }
    };

    fetchArtists();
  }, []);

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
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Card */}
        <div
          onClick={() => navigate("/browse-artists")}
          className="group cursor-pointer bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col items-center text-center"
        >
          <div className="bg-gradient-to-tr from-blue-100 to-blue-200 p-4 rounded-full shadow-sm group-hover:scale-105 transform transition">
            <FaUsers className="text-3xl text-blue-700" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-800">
            Browse Artists
          </h2>
          <p className="mt-2 text-gray-500 text-sm">
            Discover and collaborate with talented creators.
          </p>
        </div>

        {/* Card */}
        <div
          onClick={() => navigate("/browse-clients")}
          className="group cursor-pointer bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col items-center text-center"
        >
          <div className="bg-gradient-to-tr from-green-100 to-green-200 p-4 rounded-full shadow-sm group-hover:scale-105 transform transition">
            <FaUserTie className="text-3xl text-green-700" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-800">
            Browse Clients
          </h2>
          <p className="mt-2 text-gray-500 text-sm">
            Connect with clients searching for your skills.
          </p>
        </div>

        {/* Card */}
        <div
          onClick={() => navigate("/browse-arts")}
          className="group cursor-pointer bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col items-center text-center"
        >
          <div className="bg-gradient-to-tr from-purple-100 to-purple-200 p-4 rounded-full shadow-sm group-hover:scale-105 transform transition">
            <FaPalette className="text-3xl text-purple-700" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-800">Browse Arts</h2>
          <p className="mt-2 text-gray-500 text-sm">
            Explore inspiring artworks from the community.
          </p>
        </div>

        {/* Card */}
        <div
          onClick={() => navigate("/post-job")}
          className="group cursor-pointer bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col items-center text-center"
        >
          <div className="bg-gradient-to-tr from-orange-100 to-orange-200 p-4 rounded-full shadow-sm group-hover:scale-105 transform transition">
            <FaUserTie className="text-3xl text-orange-700" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-800">Post a Job</h2>
          <p className="mt-2 text-gray-500 text-sm">
            Offer a commission and find the right artist for your project.
          </p>
        </div>
      </div>

      {/* Artworks Section */}
      <div className="bg-white rounded-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Artworks
          </h2>
          <Link
            to="/browse-arts"
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline transition"
          >
            View More
          </Link>
        </div>

        {arts.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            No artworks found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {arts.slice(0, artworksDisplayed).map((art) => (
              <div
                key={art.art_id}
                className="group bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="w-full h-56 sm:h-60 md:h-64 overflow-hidden rounded-t-xl">
                  <img
                    src={
                      art.image_url ??
                      "https://via.placeholder.com/600x600?text=No+Image"
                    }
                    alt={art.title || "Artwork"}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {art.title}
                    </h3>
                    <p className="mt-1 text-gray-600 text-sm">
                      ₱{parseFloat(art.price).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    to={`/art/${art.art_id}`}
                    className="mt-4 inline-block bg-orange-500 text-white text-sm font-semibold text-center px-4 py-2 rounded-md hover:bg-orange-600 transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Artists Section */}
      <div className="bg-white shadow-md rounded-2xl p-8 mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Verified Artists</h2>
          <Link
            to="/browse-artists"
            className="text-sm font-semibold text-orange-600 hover:underline hover:text-orange-700 transition"
          >
            View More
          </Link>
        </div>
        {verifiedArtists.length === 0 ? (
          <div className="text-center text-gray-500">
            No verified artists found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {verifiedArtists.slice(0, 4).map((artist) => (
              <div
                key={artist.user_id}
                className="group bg-gray-50 hover:bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
              >
                <img
                  src={
                    artist.profile_image ??
                    "https://via.placeholder.com/150?text=No+Image"
                  }
                  alt={`${artist.firstname} ${artist.lastname}`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow mb-4 transition-transform duration-300 group-hover:scale-105"
                />
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {artist.firstname} {artist.lastname}
                </h3>
                <span className="mt-2 text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  ID Verified
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
