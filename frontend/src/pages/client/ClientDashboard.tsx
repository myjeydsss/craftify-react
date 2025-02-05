import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaUserTie,
  FaPalette,
  FaHeart,
} from "react-icons/fa";

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
  medium: string | null;
  style: string | null;
}

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [arts, setArts] = useState<Art[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtsAndWishlist = async () => {
      setLoading(true);
      try {
        const [artsResponse, wishlistResponse] = await Promise.all([
          axios.get<Art[]>(`${import.meta.env.VITE_API_URL}/arts`),
          user ? axios.get<string[]>(`${import.meta.env.VITE_API_URL}/wishlist/${user.id}`) : Promise.resolve({ data: [] }),
        ]);

        setArts(artsResponse.data);
        setWishlist(wishlistResponse.data);
      } catch (err: any) {
        console.error("Error fetching arts or wishlist:", err.message);
        setError("Failed to load arts or wishlist. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchArtsAndWishlist();
  }, [user]);

  const handleWishlistToggle = async (artId: string) => {
    if (!user) {
      alert("Please log in to manage your wishlist.");
      return;
    }

    try {
      const action = wishlist.includes(artId) ? "remove" : "add";

      await axios.post(`${import.meta.env.VITE_API_URL}/wishlist`, {
        userId: user.id,
        artId,
        action,
      });

      setWishlist((prev) =>
        action === "add" ? [...prev, artId] : prev.filter((id) => id !== artId)
      );
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-poppins">
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

      {/* Browse Arts Section */}
      <div className="mt-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Browse Arts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {arts.map((art) => (
            <div
              key={art.art_id}
              className="relative bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => navigate(`/art/${art.art_id}`)}
            >
              {/* Image Section */}
              <div className="relative flex items-center justify-center bg-gray-100">
                {art.image_url ? (
                  <img
                    src={art.image_url}
                    alt={art.title}
                    className="w-full"
                    style={{
                      objectFit: "contain",
                      maxHeight: art.image_url.includes('portrait') ? "500px" : "300px",
                    }}
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">Image Not Available</p>
                  </div>
                )}

                {/* Wishlist Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering parent click
                    handleWishlistToggle(art.art_id);
                  }}
                  className={`absolute top-3 right-3 bg-white p-2 rounded-full shadow-md transition ${
                    wishlist.includes(art.art_id) ? "text-red-500" : "text-gray-400 hover:text-red-500"
                  }`}
                >
                  <FaHeart size={20} />
                </button>
              </div>

              {/* Art Details */}
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-900">{art.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{art.description || "No description available"}</p>
                <p className="text-sm font-medium text-gray-800">
                  {art.artist
                    ? `${art.artist.firstname} ${art.artist.lastname}`
                    : "Unknown Artist"}
                </p>
                <p className="mt-2 text-lg font-bold text-orange-500">
                  ₱{parseFloat(art.price).toLocaleString()}
                </p>

                {/* Tags */}
                {art.tags && art.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {art.tags.map((tag) => (
                      <span
                        key={`${art.art_id}-tag-${tag.id}`}
                        className="bg-orange-100 text-orange-700 text-sm font-medium px-3 py-1 rounded-full"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;