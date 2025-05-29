import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import { Link, useNavigate } from "react-router-dom";
import { FaUsers, FaUserTie, FaPalette, FaSpinner } from "react-icons/fa";

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

interface Client {
  user_id: string;
  firstname: string;
  lastname: string;
  address: string | null;
  profile_image: string | null;
  status: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

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

  const [clients, setClients] = useState<Client[]>([]);
  const [clientLoading, setClientLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/clients`);
        if (Array.isArray(response.data)) {
          const verified = response.data.filter(
            (c: Client) => c.status === "approved"
          );
          setClients(verified);
        } else {
          console.warn("Unexpected response for clients:", response.data);
        }
      } catch (err) {
        console.error("Error fetching clients:", err);
      } finally {
        setClientLoading(false);
      }
    };

    fetchClients();
  }, []);

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
        <h1 className="text-4xl font-bold text-[#5C0601] mb-4">
          Welcome to Craftify!
        </h1>
        <p className="text-gray-500 mb-5">
          Explore, manage, and showcase your art.
        </p>
        <hr className="border-gray-300 mb-6" />
      </div>

      {/* Quick Navigation Buttons */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div
          className="bg-white p-6 shadow-lg rounded-lg flex flex-col items-center hover:shadow-xl transition transform hover:-translate-y-2 cursor-pointer"
          onClick={() => navigate("/browse-jobs")}
        >
          <FaSpinner className="text-5xl text-red-500" />
          <h2 className="text-xl font-bold text-gray-700 mt-4">Browse Jobs</h2>
          <p className="mt-2 text-gray-500 text-center">
            Look for commissions and job offers you can apply for.
          </p>
        </div>
      </div>

      {/* Artworks Section */}
      <div className="bg-white shadow-md rounded-2xl px-4 py-8 sm:px-6 lg:px-8 mb-12 mt-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Artworks</h2>
          <Link
            to="/browse-arts"
            className="text-sm font-semibold text-orange-600 hover:underline hover:text-orange-700 transition"
          >
            View More
          </Link>
        </div>

        {arts.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            No artworks found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {arts.slice(0, artworksDisplayed).map((art) => (
              <div
                key={art.art_id}
                className="group bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Image */}
                <div className="w-full h-52 sm:h-64 overflow-hidden">
                  <img
                    src={
                      art.image_url ??
                      "https://via.placeholder.com/400x400?text=No+Image"
                    }
                    alt={art.title || "Artwork"}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1 justify-between text-center">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {art.title}
                  </h3>
                  <p className="mt-1 text-gray-600 text-sm mb-4">
                    ₱{parseFloat(art.price).toLocaleString()}
                  </p>
                  <Link
                    to={`/art/${art.art_id}`}
                    className="inline-block bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-orange-600 transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Clients Section */}
      <div className="bg-white shadow-md rounded-2xl p-8 mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Verified Clients</h2>
          <Link
            to="/browse-clients"
            className="text-sm font-semibold text-orange-600 hover:underline hover:text-orange-700 transition"
          >
            View More
          </Link>
        </div>
        {clientLoading ? (
          <div className="text-center text-gray-500">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="text-center text-gray-500">
            No verified clients found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {clients.slice(0, 4).map((client) => (
              <div
                key={client.user_id}
                className="group bg-gray-50 hover:bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
              >
                <img
                  src={
                    client.profile_image ??
                    "https://via.placeholder.com/150?text=No+Image"
                  }
                  alt={`${client.firstname} ${client.lastname}`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow mb-4 transition-transform duration-300 group-hover:scale-105"
                />
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {client.firstname} {client.lastname}
                </h3>
                <p className="text-sm text-gray-500 truncate w-full">
                  {client.address || "No location provided"}
                </p>
                <span className="mt-3 text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
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

export default ArtistDashboard;
