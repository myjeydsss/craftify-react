import React, { useEffect, useState } from "react";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaUserCircle,
  FaInfoCircle,
} from "react-icons/fa";
import Masonry from "react-masonry-css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";
import ClipLoader from "react-spinners/ClipLoader";

interface Client {
  user_id: string;
  firstname: string;
  lastname: string;
  bio: string | null;
  gender: string | null;
  date_of_birth: string | null;
  email: string;
  role: string;
  address: string | null;
  status: string;
  phone: string | null;
  profile_image: string | null;
}

interface Match {
  client: {
    id: string;
    name: string;
    role: string;
    address: string | null;
    profile_image: string | null;
    score1?: number;
    matchBreakdown1?: {
      matchedStyles1?: string[];
      location1?: boolean;
      budget1?: boolean;
      timeline1?: boolean;
      communication1?: boolean;
      projectType1?: boolean;
      collaboration1?: boolean;
      clientType1?: boolean;
      projectScale1?: boolean;
      collaborativeBoost1?: number;
    };
  };
  artist: {
    id: string;
    name: string;
    role: string;
    address: string | null;
    profile_image: string | null;
  };
}

const BrowseClient: React.FC = () => {
  useEffect(() => {
    document.title = "Browse Client";
  }, []);

  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [matchedClients, setMatchedClients] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [matching, setMatching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const totalItems = clients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [openBreakdownIndex, setOpenBreakdownIndex] = useState<number | null>(
    null
  );

  // Fetch clients from the server
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const response = await axios.get<Client[]>(
          `${import.meta.env.VITE_API_URL}/clients`
        );

        // Filter out the logged-in client from the list
        const filtered = response.data.filter(
          (client) => client.user_id !== user?.id
        );
        setClients(filtered);
      } catch (err: any) {
        console.error("Error fetching clients:", err.message);
        setError("Failed to fetch clients. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
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

  // Filter clients by search term
  const filteredClients = clients.filter((client) => {
    const searchLower = search.toLowerCase();
    return (
      client.firstname.toLowerCase().includes(searchLower) ||
      client.lastname.toLowerCase().includes(searchLower) ||
      (client.bio && client.bio.toLowerCase().includes(searchLower)) ||
      (client.address && client.address.toLowerCase().includes(searchLower))
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClients.slice(indexOfFirstItem, indexOfLastItem);

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
        `${import.meta.env.VITE_API_URL}/match-clients/${user.id}`
      );

      // Step 2: Matching in progress (mid progress)
      setProgress(70);

      // Simulate progress with a delay for smoother UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 3: Process and set matched clients (final progress)
      setMatchedClients(response.data.matches1 || []);
      setProgress(100); // Complete the progress bar
    } catch (err) {
      console.error("Error fetching matched clients:", err);
      setMatchedClients([]);
      setError("Failed to find matches. Please try again later.");
      setProgress(0); // Reset progress on error
    } finally {
      setMatching(false);
    }
  };

  const handleProfileClick = async (clientId: string) => {
    if (!user || !user.id) {
      console.error("User  is not authenticated.");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/log-profile-visit/${clientId}`,
        {
          visitorId: user.id,
        }
      );

      navigate(`/profile/client/${clientId}`);
    } catch (error) {
      console.error("Error logging profile visit:", error);
    }
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
            Discover Clients
          </h1>
          <p className="text-gray-600 text-lg">
            Explore potential clients and find collaboration opportunities.
          </p>
        </header>
        <hr className="border-gray-300 mb-6" />

        {/* Search Bar & Find Match Button */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="relative w-full max-w-lg mb-4 md:mb-0">
            <input
              type="text"
              placeholder="Search clients by name, bio, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 pl-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-500" />
          </div>
          {userRole && userRole.trim().toLowerCase() !== "client" && (
            <button
              onClick={findMatches}
              className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Find Match
            </button>
          )}
        </div>

        {/* Clients Grid */}
        {currentItems.length > 0 ? (
          <Masonry
            breakpointCols={{ default: 4, 1100: 3, 700: 2, 500: 1 }}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {currentItems.map((client) => (
              <div
                key={client.user_id}
                onClick={() => handleProfileClick(client.user_id)}
                className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 mb-6 cursor-pointer"
              >
                <div className="relative">
                  {client.profile_image ? (
                    <img
                      src={client.profile_image}
                      alt={`${client.firstname} ${client.lastname}`}
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
                    {client.firstname} {client.lastname}
                  </h3>
                  <p className="text-gray-600 italic text-sm mb-2">
                    {client.bio || "No bio available"}
                  </p>
                  <div className="flex items-center space-x-2 mb-1">
                    <FaMapMarkerAlt className="text-gray-500" />
                    <p className="text-gray-700 text-sm">
                      {client.address || "No address available"}
                    </p>
                  </div>
                  {client.status === "approved" && (
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
              No clients found. Try adjusting your search.
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
                Client Matching Results
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
              ) : matchedClients.length > 0 ? (
                <>
                  {/* Top Section: You (Client) and Best Matched Artist */}
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    {/* Client Section */}
                    <div className="flex flex-col items-center w-full md:w-1/2 text-center mb-4 md:mb-0">
                      {matchedClients[0]?.artist.profile_image ? (
                        <img
                          src={matchedClients[0].artist.profile_image}
                          alt={matchedClients[0].artist.name}
                          className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover shadow-lg border-4 border-orange-300"
                        />
                      ) : (
                        <div className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center bg-gray-100 rounded-full shadow-lg">
                          <FaUserCircle className="text-gray-300 w-20 h-20" />
                        </div>
                      )}
                      <h3 className="text-lg md:text-xl font-semibold text-gray-800 mt-2">
                        {matchedClients[0]?.artist.name}
                        {user?.id === matchedClients[0]?.artist.id && (
                          <span className="text-black-600"> (You)</span>
                        )}
                      </h3>
                      <p className="text-md text-gray-500">
                        {matchedClients[0]?.artist.role}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {matchedClients[0]?.artist.address ||
                          "No address provided"}
                      </p>
                    </div>

                    {/* Best Matched Artist Section */}
                    <div className="flex flex-col items-center w-full md:w-1/2 text-center">
                      {matchedClients[0]?.client.profile_image ? (
                        <img
                          src={matchedClients[0]?.client.profile_image}
                          alt={matchedClients[0]?.client.name}
                          className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover shadow-lg border-4 border-yellow-300"
                        />
                      ) : (
                        <div className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center bg-gray-100 rounded-full shadow-lg">
                          <FaUserCircle className="text-gray-300 w-20 h-20" />
                        </div>
                      )}
                      <h3 className="text-lg md:text-xl font-bold text-yellow-600 mt-2">
                        🥇 {matchedClients[0]?.client.name}
                      </h3>
                      <p className="text-md text-gray-500">
                        {matchedClients[0]?.client.role}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {matchedClients[0]?.client.address ||
                          "No address provided"}
                      </p>

                      {/* Match Score and Tooltip */}
                      <div className="flex items-center space-x-2 mt-2 relative group">
                        <p className="text-sm text-blue-600 font-semibold">
                          Match Score: {matchedClients[0]?.client.score1 ?? 0}%
                        </p>

                        <FaInfoCircle className="text-gray-500 w-4 h-4 hover:text-gray-700 cursor-pointer" />

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 translate-y-[-8px] w-72 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-sm text-gray-700 z-50 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none">
                          {/* Arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-300 rotate-45 z-10"></div>

                          <ul className="list-disc pl-4 space-y-1 text-left">
                            {Array.isArray(
                              matchedClients[0]?.client.matchBreakdown1
                                ?.matchedStyles1
                            ) &&
                              matchedClients[0].client.matchBreakdown1
                                .matchedStyles1.length > 0 && (
                                <li>
                                  <strong>Matched Styles:</strong>{" "}
                                  {matchedClients[0].client.matchBreakdown1.matchedStyles1.join(
                                    ", "
                                  )}
                                </li>
                              )}
                            {matchedClients[0]?.client.matchBreakdown1
                              ?.location1 && (
                              <li>
                                <strong>Location:</strong> Matched
                              </li>
                            )}
                            {matchedClients[0]?.client.matchBreakdown1
                              ?.budget1 && (
                              <li>
                                <strong>Budget:</strong> Matched
                              </li>
                            )}
                            {matchedClients[0]?.client.matchBreakdown1
                              ?.timeline1 && (
                              <li>
                                <strong>Timeline:</strong> Matched
                              </li>
                            )}
                            {matchedClients[0]?.client.matchBreakdown1
                              ?.communication1 && (
                              <li>
                                <strong>Communication:</strong> Matched
                              </li>
                            )}
                            {matchedClients[0]?.client.matchBreakdown1
                              ?.projectType1 && (
                              <li>
                                <strong>Project Type:</strong> Matched
                              </li>
                            )}
                            {matchedClients[0]?.client.matchBreakdown1
                              ?.collaboration1 && (
                              <li>
                                <strong>Collaboration:</strong> Matched
                              </li>
                            )}
                            {matchedClients[0]?.client.matchBreakdown1
                              ?.clientType1 && (
                              <li>
                                <strong>Client Type:</strong> Matched
                              </li>
                            )}
                            {matchedClients[0]?.client.matchBreakdown1
                              ?.projectScale1 && (
                              <li>
                                <strong>Project Scale:</strong> Matched
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* View Profile Button for Best Match */}
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() =>
                        navigate(
                          `/profile/client/${matchedClients[0]?.client.id}`
                        )
                      }
                      className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
                    >
                      View Best Match Profile
                    </button>
                  </div>

                  {/* Ranked List of Other Recommended Clients */}
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">
                      Other Recommended Clients
                    </h3>
                    <ul className="space-y-3 max-h-60 overflow-y-auto">
                      {matchedClients.slice(1).map((match, index) => {
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
                            key={match.client.id}
                            className={`flex flex-col md:flex-row justify-between items-start md:items-center p-3 ${rankColor} rounded-md shadow-md hover:shadow-lg transition`}
                          >
                            <div className="flex items-start space-x-3 w-full">
                              {match.client.profile_image ? (
                                <img
                                  src={match.client.profile_image}
                                  alt={match.client.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
                                  <FaUserCircle className="text-gray-300 w-6 h-6" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-800 flex items-center">
                                  {rankLabel} {match.client.name}
                                </h4>
                                <p className="text-gray-600 text-sm">
                                  {match.client.address ||
                                    "No Address Provided"}
                                </p>
                                <p className="text-sm text-blue-600 mt-1 font-semibold">
                                  Match Score: {match.client.score1 ?? 0}%
                                </p>

                                {/* Toggle Breakdown */}
                                <button
                                  onClick={() =>
                                    setOpenBreakdownIndex(
                                      openBreakdownIndex === index
                                        ? null
                                        : index
                                    )
                                  }
                                  className="text-sm text-blue-500 underline hover:text-blue-700 mt-1"
                                >
                                  {openBreakdownIndex === index
                                    ? "Hide Details"
                                    : "Show Match Breakdown"}
                                </button>

                                {openBreakdownIndex === index && (
                                  <ul className="mt-2 text-xs text-gray-600 list-disc pl-5 space-y-1">
                                    {Array.isArray(
                                      match.client.matchBreakdown1
                                        ?.matchedStyles1
                                    ) &&
                                      match.client.matchBreakdown1
                                        .matchedStyles1.length > 0 && (
                                        <>
                                          <li>
                                            <strong>Matched Styles:</strong>
                                          </li>
                                          {match.client.matchBreakdown1.matchedStyles1.map(
                                            (style, i) => (
                                              <li key={i} className="ml-4">
                                                – {style}
                                              </li>
                                            )
                                          )}
                                        </>
                                      )}
                                    {match.client.matchBreakdown1
                                      ?.location1 && (
                                      <li>✔️ Location matched</li>
                                    )}
                                    {match.client.matchBreakdown1?.budget1 && (
                                      <li>✔️ Budget matched</li>
                                    )}
                                    {match.client.matchBreakdown1
                                      ?.timeline1 && (
                                      <li>✔️ Project duration matched</li>
                                    )}
                                    {match.client.matchBreakdown1
                                      ?.communication1 && (
                                      <li>
                                        ✔️ Communication preference matched
                                      </li>
                                    )}
                                    {match.client.matchBreakdown1
                                      ?.projectType1 && (
                                      <li>✔️ Project type matched</li>
                                    )}
                                    {match.client.matchBreakdown1
                                      ?.collaboration1 && (
                                      <li>✔️ Collaboration type matched</li>
                                    )}
                                    {match.client.matchBreakdown1
                                      ?.clientType1 && (
                                      <li>✔️ Client type preference matched</li>
                                    )}
                                    {match.client.matchBreakdown1
                                      ?.projectScale1 && (
                                      <li>✔️ Project scale matched</li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 md:mt-0">
                              <button
                                onClick={() =>
                                  navigate(`/profile/client/${match.client.id}`)
                                }
                                className="px-4 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                              >
                                View
                              </button>
                            </div>
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

export default BrowseClient;
