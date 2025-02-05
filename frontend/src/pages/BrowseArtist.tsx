import React, { useEffect, useState } from "react";
import { FaSearch, FaMapMarkerAlt, FaUserCircle } from "react-icons/fa";
import Masonry from "react-masonry-css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";

// TypeScript Interface
interface Artist {
  user_id: string;
  firstname: string;
  lastname: string;
  bio: string | null;
  gender: string | null;
  date_of_birth: string | null;
  email: string;
  role: string;
  address: string | null;
  phone: string | null;
  profile_image: string | null;
  status: string | null;
}

const BrowseArtist: React.FC = () => {
  const { user } = useAuth(); // Get logged-in client
  const [artists, setArtists] = useState<Artist[]>([]);
  const [matchedArtists, setMatchedArtists] = useState<
    { artist_name: string; client_name: string }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [matching, setMatching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const totalItems = artists.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Fetch artists from the server
  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      try {
        const response = await axios.get<Artist[]>(`${import.meta.env.VITE_API_URL}/artists`);
        setArtists(response.data);
      } catch (err: any) {
        console.error("Error fetching artists:", err.message);
        setError("Failed to fetch artists. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  // Filter artists by search term
  const filteredArtists = artists.filter((artist) => {
    const searchLower = search.toLowerCase();
    return (
      artist.firstname.toLowerCase().includes(searchLower) ||
      artist.lastname.toLowerCase().includes(searchLower) ||
      (artist.bio && artist.bio.toLowerCase().includes(searchLower)) ||
      (artist.address && artist.address.toLowerCase().includes(searchLower))
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredArtists.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Fetch best matches using Gale-Shapley Algorithm
  const findMatches = async () => {
    if (!user || !user.id) {
      setError("User is not authenticated or missing user ID.");
      return;
    }
  
    setMatching(true);
    setModalOpen(true);
  
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/match-artists/${user.id}`
      );
      setMatchedArtists(response.data.matches || []);
    } catch (err: any) {
      console.error("Error fetching matched artists:", err);
      setMatchedArtists([]);
      setError("Failed to find matches. Please try again later.");
    } finally {
      setMatching(false);
    }
  };

  if (loading) return <div className="text-center py-16">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-16">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="container mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Discover Artists</h1>
          <p className="text-gray-600 text-lg">Explore talented artists and find the best match.</p>
        </header>
        <hr className="border-gray-300 mb-6" />

        {/* Search Bar & Find Match Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              placeholder="Search artists by name, bio, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 pl-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-500" />
          </div>
          <button
            onClick={findMatches}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Find Match
          </button>
        </div>

        {/* Artists Grid */}
        {currentItems.length > 0 ? (
          <Masonry breakpointCols={{ default: 4, 1100: 3, 700: 2, 500: 1 }} className="my-masonry-grid" columnClassName="my-masonry-grid_column">
            {currentItems.map((artist) => (
              <div key={artist.user_id} onClick={() => navigate(`/profile/artist/${artist.user_id}`)} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 mb-6 cursor-pointer">
                <div className="relative">
                  {artist.profile_image ? (
                    <img src={artist.profile_image} alt={`${artist.firstname} ${artist.lastname}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100">
                      <FaUserCircle className="text-gray-300 w-20 h-20" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-900">{artist.firstname} {artist.lastname}</h3>
                  <p className="text-gray-600 italic text-sm mb-2">{artist.bio || "No bio available"}</p>
                  <div className="flex items-center space-x-2 mb-1">
                    <FaMapMarkerAlt className="text-gray-500" />
                    <p className="text-gray-700 text-sm">{artist.address || "No address available"}</p>
                  </div>
                </div>
              </div>
            ))}
          </Masonry>
        ) : (
          <div className="text-center mt-12">
            <p className="text-gray-600">No artists found. Try adjusting your search.</p>
          </div>
        )}

        {/* Matching Modal */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
              <h2 className="text-xl font-bold mb-4">Best Matches</h2>
              {matching ? (
                <p>Finding the best matches...</p>
              ) : matchedArtists.length > 0 ? (
                matchedArtists.map((match, index) => (
                  <p key={index} className="border-b py-2">{`${match.artist_name} matched with ${match.client_name}`}</p>
                ))
              ) : (
                <p>No matches found.</p>
              )}
              <button onClick={() => setModalOpen(false)} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex justify-between items-center py-4 mt-4">
          <p className="text-gray-600">
            Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} of {totalItems} items
          </p>
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} onClick={() => handlePageChange(i + 1)} className={`px-3 py-1 border ${currentPage === i + 1 ? "bg-gray-300" : "bg-white"} rounded-md`}>
                {i + 1}
              </button>
            ))}
          </div>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border rounded-md p-2"
          >
            {[10, 25, 50, 100].map((number) => (
              <option key={number} value={number}>
                {number} Results Per Page
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default BrowseArtist;