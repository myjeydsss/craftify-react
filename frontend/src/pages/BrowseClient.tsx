import React, { useEffect, useState } from "react";
import { FaSearch, FaMapMarkerAlt, FaUserCircle } from "react-icons/fa";
import Masonry from "react-masonry-css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";

// TypeScript Interfaces
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
  const { user } = useAuth(); // Get logged-in artist
  const [clients, setClients] = useState<Client[]>([]);
  const [matchedClients, setMatchedClients] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [matching, setMatching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const totalItems = clients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
    const [userRole, setUserRole] = useState<string | null>(null); // State to hold user role
  

  // Fetch clients from the server
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const response = await axios.get<Client[]>(`${import.meta.env.VITE_API_URL}/clients`);
        setClients(response.data);
      } catch (err: any) {
        console.error("Error fetching clients:", err.message);
        setError("Failed to fetch clients. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user && user.id) {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/user-role/${user.id}`);
          setUserRole(response.data.role);
          console.log("Fetched user role:", response.data.role); // Debugging line
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
      (client.address && client .address.toLowerCase().includes(searchLower))
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

  // Fetch best matches using Gale-Shapley Algorithm
  const findMatches = async () => {
    if (!user || !user.id) {
      setError("User  is not authenticated or missing user ID.");
      return;
    }

    setMatching(true);
    setModalOpen(true);

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/match-clients/${user.id}`);
      setMatchedClients(response.data.matches || []);
    } catch (err: any) {
      console.error("Error fetching matched clients:", err);
      setMatchedClients([]);
      setError("Failed to find matches. Please try again later.");
    } finally {
      setMatching(false);
    }
  };

  const handleProfileClick = async (clientId: string) => {
    if (!user || !user.id) {
        console.error("User  is not authenticated.");
        return; // Exit the function if the user is not authenticated
    }

    console.log("Logging profile visit for clientId:", clientId); // Log the client ID

    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/log-profile-visit/${clientId}`, {
            visitorId: user.id // Use the actual visitor ID from the logged-in user
        });
        
        navigate(`/profile/client/${clientId}`);
    } catch (error) {
        console.error("Error logging profile visit:", error);
    }
};

  if (loading) return <div className="text-center py-16">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-16">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="container mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Discover Clients</h1>
          <p className="text-gray-600 text-lg">Explore potential clients and find collaboration opportunities.</p>
        </header>
        <hr className="border-gray-300 mb-6" />

        {/* Search Bar & Find Match Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-lg">
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
    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
  >
    Find Match
  </button>
)}
        </div>

        {/* Clients Grid */}
        {currentItems.length > 0 ? (
          <Masonry breakpointCols={{ default: 4, 1100: 3, 700: 2, 500: 1 }} className="my-masonry-grid" columnClassName="my-masonry-grid_column">
            {currentItems.map((client) => (
              <div key={client.user_id} onClick={() => handleProfileClick(client.user_id)} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 mb-6 cursor-pointer">
                <div className="relative">
                  {client.profile_image ? (
                    <img src={client.profile_image} alt={`${client.firstname} ${client.lastname}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100">
                      <FaUserCircle className="text-gray-300 w-20 h-20" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-900">{client.firstname} {client.lastname}</h3>
                  <p className="text-gray-600 italic text-sm mb-2">{client.bio || "No bio available"}</p>
                  <div className="flex items-center space-x-2 mb-1">
                    <FaMapMarkerAlt className="text-gray-500" />
                    <p className="text-gray-700 text -sm">{client.address || "No address available"}</p>
                  </div>
                </div>
              </div>
            ))}
          </Masonry>
        ) : (
          <div className="text-center mt-12">
            <p className="text-gray-600">No clients found. Try adjusting your search.</p>
          </div>
        )}

        {/* Matching Modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setModalOpen(false)} // Close modal when clicking outside
          >
            <div
              className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full relative"
              onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
            >
              <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">
                Best Match Found
              </h2>
              {matching ? (
                <p className="text-center text-lg text-gray-600">
                  Finding the best matches...
                </p>
              ) : matchedClients.length > 0 ? (
                matchedClients.map((match, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    {/* Artist Section */}
                    <div className="flex flex-col items-center w-1/2 text-center">
                      {match.artist.profile_image ? (
                        <img
                          src={match.artist.profile_image}
                          alt={match.artist.name}
                          className="w-48 h-48 rounded-full object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-full shadow-lg">
                          <FaUserCircle className="text-gray-300 w-28 h-28" />
                        </div>
                      )}
                      <h3 className="text-2xl font-bold text-gray-800 mt-4">
                        {match.artist.name}
                        {user?.id === match.artist.id && (
                          <span className="text-black-600"> (You)</span>
                        )}
                      </h3>
                      <p className="text-lg text-gray-500 mt-1">{match.artist.role}</p>
                      <p className="text-gray-600 text-sm mt-1">
                        {match.artist.address || "No address provided"}
                      </p>
                    </div>

                    {/* Client Section */}
                    <div className="flex flex-col items-center w-1/2 text-center">
                      {match.client.profile_image ? (
                        <img
                          src={match.client.profile_image}
                          alt={match.client.name}
                          className="w-48 h-48 rounded-full object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-full shadow-lg">
                          <FaUserCircle className="text-gray-300 w-28 h-28" />
                        </div>
                      )}
                      <h3 className="text-2xl font-bold text-gray-800 mt-4">
                        {match.client.name}
                      </h3>
                      <p className="text-lg text-gray-500 mt-1">{match.client.role}</p>
                      <p className="text-gray-600 text-sm mt-1">
                        {match.client.address || "No address provided"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-lg text-gray-600">No matches found.</p>
              )}
              {/* Centered View Profile Button */}
              {matchedClients.length > 0 && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() =>
                      navigate(
                        `/profile/client/${matchedClients[0].client.id || "Unknown"}`
                      )
                    }
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    View Client Profile
                  </button>
                </div>
              )}
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
              <button key={i + 1} onClick={() => handlePageChange(i + 1)} className={`px-3 py-1 border ${ currentPage === i + 1 ? "bg-gray-300" : "bg-white"} rounded-md`}>
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

export default BrowseClient;