import React, { useEffect, useState } from "react";
import { FaSearch, FaMapMarkerAlt, FaUserCircle } from "react-icons/fa";
import Masonry from "react-masonry-css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";
import ClipLoader from "react-spinners/ClipLoader";

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

interface Match {
  artist: {
    id: string;
    name: string;
    role: string;
    address: string | null;
    profile_image: string | null;
  };
  client: {
    id: string;
    name: string;
    role: string;
    address: string | null;
    profile_image: string | null;
  };
}

const BrowseArtist: React.FC = () => {
  useEffect(() => {
    document.title = "Browse Artist";
  }, []);

  const { user } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [matchedArtists, setMatchedArtists] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [matching, setMatching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
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
        const response = await axios.get<Artist[]>(
          `${import.meta.env.VITE_API_URL}/artists`
        );
        const allArtists = response.data;

        // Exclude the logged-in user from the artist list
        const filtered = allArtists.filter(
          (artist) => artist.user_id !== user?.id
        );
        setArtists(filtered);
      } catch (err: any) {
        console.error("Error fetching artists:", err.message);
        setError("Failed to fetch artists. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [user]);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user && user.id) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/user-role/${user.id}`
          );
          setUserRole(response.data.role);
        } catch (err: any) {
          console.error("Error fetching user role:", err.message);
          setError("Failed to fetch user role.");
        }
      }
    };

    fetchUserRole();
  }, [user]);

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

  // Gale-Shapley Algorithm
  const findMatches = async () => {
    if (!user || !user.id) {
      setError("User is not authenticated or missing user ID.");
      return;
    }

    setMatching(true);
    setModalOpen(true);
    setProgress(0); // Reset progress bar

    try {
      // Step 1: Start matching (initial progress)
      setProgress(20);

      // Simulate progress with a delay for smoother UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/match-artists/${user.id}`
      );

      // Step 2: Matching in progress (mid progress)
      setProgress(70);

      // Simulate progress with a delay for smoother UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 3: Process and set matched artists (final progress)
      setMatchedArtists(response.data.matches || []);
      setProgress(100); // Complete the progress bar
    } catch (err) {
      console.error("Error fetching matched artists:", err);
      setMatchedArtists([]);
      setError("Failed to find matches. Please try again later.");
      setProgress(0); // Reset progress on error
    } finally {
      setMatching(false);
    }
  };

  // Log profile visit
  const logProfileVisit = async (artistId: string) => {
    if (!user || !user.id) {
      console.error("User  is not authenticated.");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/log-profile-visit/${artistId}`,
        {
          visitorId: user.id,
        }
      );
    } catch (error) {
      console.error("Error logging profile visit:", error);
    }
  };

  const handleArtistClick = async (artistId: string) => {
    await logProfileVisit(artistId);
    navigate(`/profile/artist/${artistId}`);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <ClipLoader color="#3498db" loading={loading} size={80} />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );

  if (error)
    return <div className="text-center text-red-500 py-16">{error}</div>;

  return (
    <div className="min-h-screen bg-white px-6 py-16">
      <div className="container mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#5C0601] mb-2">
            Discover Artists
          </h1>
          <p className="text-gray-600 text-lg">
            Explore talented artists and find the best match.
          </p>
        </header>
        <hr className="border-gray-300 mb-6" />

        {/* Search Bar & Find Match Button */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="relative w-full max-w-lg mb-4 md:mb-0">
            <input
              type="text"
              placeholder="Search artists by name, bio, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 pl-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-500" />
          </div>
          {userRole && userRole.trim().toLowerCase() !== "artist" && (
            <button
              onClick={findMatches}
              className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Find Match
            </button>
          )}
        </div>

        {/* Artists Grid */}
        {currentItems.length > 0 ? (
          <Masonry
            breakpointCols={{ default: 4, 1100: 3, 700: 2, 500: 1 }}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {currentItems.map((artist) => (
              <div
                key={artist.user_id}
                onClick={() => handleArtistClick(artist.user_id)}
                className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 mb-6 cursor-pointer"
              >
                <div className="relative">
                  {artist.profile_image ? (
                    <img
                      src={artist.profile_image}
                      alt={`${artist.firstname} ${artist.lastname}`}
                      className="w-full object-cover" // Set a fixed height for images
                    />
                  ) : (
                    <div className="flex items-center justify-center h-48 bg-gray-100">
                      <FaUserCircle className="text-gray-300 w-20 h-20" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {artist.firstname} {artist.lastname}
                  </h3>
                  <p className="text-gray-600 italic text-sm mb-2">
                    {artist.bio || "No bio available"}
                  </p>
                  <div className="flex items-center space-x-2 mb-1">
                    <FaMapMarkerAlt className="text-gray-500" />
                    <p className="text-gray-700 text-sm">
                      {artist.address || "No address available"}
                    </p>
                  </div>
                  {artist.status === "approved" && (
                    <div className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded mt-1">
                      I.D. Verified
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Masonry>
        ) : (
          <div className="text-center mt-12">
            <p className="text-gray-600">
              No artists found. Try adjusting your search.
            </p>
          </div>
        )}

        {/* Matching Modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white p-6 md:p-8 rounded-lg shadow-lg w-full max-w-4xl mx-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-center text-gray-800">
                Artist Matching Results
              </h2>

              {matching ? (
                <>
                  <div className="w-full bg-gray-300 rounded-full h-6 mb-4 overflow-hidden">
                    <div
                      className={`progress-bar transition-all duration-500 ease-out ${
                        progress < 50
                          ? "bg-blue-400"
                          : progress < 100
                          ? "bg-blue-600"
                          : "bg-green-600"
                      }`}
                      style={{ width: `${progress}%` }}
                    >
                      {Math.round(progress)}%
                    </div>
                  </div>
                  <p className="text-center text-lg text-gray-600 animate-pulse">
                    Please wait while we find your best match.
                  </p>
                </>
              ) : matchedArtists.length > 0 ? (
                <>
                  {/* Top Section: You (Client) and Best Matched Artist */}
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    {/* Client Section */}
                    <div className="flex flex-col items-center w-full md:w-1/2 text-center mb-4 md:mb-0">
                      {matchedArtists[0]?.client.profile_image ? (
                        <img
                          src={matchedArtists[0].client.profile_image}
                          alt={matchedArtists[0].client.name}
                          className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover shadow-lg border-4 border-orange-300"
                        />
                      ) : (
                        <div className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center bg-gray-100 rounded-full shadow-lg">
                          <FaUserCircle className="text-gray-300 w-20 h-20" />
                        </div>
                      )}
                      <h3 className="text-lg md:text-xl font-semibold text-gray-800 mt-2">
                        {matchedArtists[0]?.client.name}
                        {user?.id === matchedArtists[0]?.client.id && (
                          <span className="text-black-600"> (You)</span>
                        )}
                      </h3>
                      <p className="text-md text-gray-500">
                        {matchedArtists[0]?.client.role}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {matchedArtists[0]?.client.address ||
                          "No address provided"}
                      </p>
                    </div>

                    {/* Best Matched Artist Section */}
                    <div className="flex flex-col items-center w-full md:w-1/2 text-center">
                      {matchedArtists[0]?.artist.profile_image ? (
                        <img
                          src={matchedArtists[0]?.artist.profile_image}
                          alt={matchedArtists[0]?.artist.name}
                          className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover shadow-lg border-4 border-yellow-300"
                        />
                      ) : (
                        <div className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center bg-gray-100 rounded-full shadow-lg">
                          <FaUserCircle className="text-gray-300 w-20 h-20" />
                        </div>
                      )}
                      <h3 className="text-lg md:text-xl font-bold text-yellow-600 mt-2">
                        🥇 {matchedArtists[0]?.artist.name}
                      </h3>
                      <p className="text-md text-gray-500">
                        {matchedArtists[0]?.artist.role}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {matchedArtists[0]?.artist.address ||
                          "No address provided"}
                      </p>
                    </div>
                  </div>

                  {/* View Profile Button for Best Match */}
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() =>
                        navigate(
                          `/profile/artist/${matchedArtists[0]?.artist.id}`
                        )
                      }
                      className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
                    >
                      View Best Match Profile
                    </button>
                  </div>

                  {/* Ranked List of Other Recommended Artists */}
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">
                      Other Recommended Artists
                    </h3>
                    <ul className="space-y-3 max-h-60 overflow-y-auto">
                      {matchedArtists.slice(1).map((match, index) => {
                        const rank = index + 2;
                        const rankLabel =
                          rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
                        const rankColor =
                          rank === 2
                            ? "bg-gray-100 text-gray-800"
                            : rank === 3
                            ? "bg-yellow-50 text-yellow-800"
                            : "bg-white text-gray-800";

                        return (
                          <li
                            key={match.artist.id}
                            className={`flex justify-between items-center p-3 ${rankColor} rounded-md shadow-md hover:shadow-lg transition`}
                          >
                            <div className="flex items-center space-x-3">
                              {match.artist.profile_image ? (
                                <img
                                  src={match.artist.profile_image}
                                  alt={match.artist.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
                                  <FaUserCircle className="text-gray-300 w-6 h-6" />
                                </div>
                              )}
                              <div>
                                <h4 className="text-lg font-bold text-gray-800 flex items-center">
                                  {rankLabel} {match.artist.name}
                                </h4>
                                <p className="text-gray-600 text-sm">
                                  {match.artist.address ||
                                    "No Address Provided"}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                navigate(`/profile/artist/${match.artist.id}`)
                              }
                              className="px-4 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                            >
                              View
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-center text-lg text-gray-600">
                  No matches found.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center py-4 mt-4">
          <p className="text-gray-600 mb-2 md:mb-0">
            Showing {indexOfFirstItem + 1} -{" "}
            {Math.min(indexOfLastItem, totalItems)} of {totalItems} items
          </p>
          <div className="flex items-center space-x-2 mb-2 md:mb-0">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 border ${
                  currentPage === i + 1 ? "bg-gray-300" : "bg-white"
                } rounded-md w-full md:w-auto`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border rounded-md p-2 w-full md:w-auto"
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
