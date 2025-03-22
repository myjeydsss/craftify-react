import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";
import {
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaUserCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import MessagePopup from "./MessagePopup.tsx";
import ClipLoader from "react-spinners/ClipLoader";
import Swal from "sweetalert2";

interface Artist {
  user_id: string;
  firstname: string;
  lastname: string;
  bio: string | null;
  address: string | null;
  email: string;
  phone: string | null;
  profile_image: string | null;
  status: string | null;
}

interface Preferences {
  art_style_specialization?: string[];
  crafting_techniques?: string[];
  preferred_medium?: string[];
  preferred_communication?: string[];
  collaboration_type?: string | null;
  location_preference?: string | null;
  budget_range?: string | null;
  project_type?: string | null;
  project_type_experience?: string | null;
  availability?: string | null;
  client_type_preference?: string | null;
  portfolio_link?: string | null;
}

interface Artwork {
  art_id: string;
  title: string;
  image_url: string;
  price: number;
}

interface RecommendedArtist {
  user_id: string;
  firstname: string;
  lastname: string;
  address: string;
  profile_image: string | null;
}

const ViewProfileArtist: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artistArts, setArtistArts] = useState<Artwork[]>([]);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendedArtists, setRecommendedArtists] = useState<
    RecommendedArtist[]
  >([]);

  const [showAllPreferences, setShowAllPreferences] = useState<boolean>(false);
  const [artworksDisplayed, setArtworksDisplayed] = useState<number>(6);
  const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);
  const [messages] = useState<{ text: string; sender: string }[]>([]);

  // Proposal state
  const [showProposalModal, setShowProposalModal] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [showBudgetAlert, setShowBudgetAlert] = useState(false);

  useEffect(() => {
    const fetchArtistDetails = async () => {
      setLoading(true);
      try {
        const artistResponse = await axios.get<Artist>(
          `${import.meta.env.VITE_API_URL}/artist-profile/${userId}`
        );
        setArtist(artistResponse.data);

        // Set the document title
        document.title = `${artistResponse.data.firstname} ${artistResponse.data.lastname} | Craftify`;

        const preferencesResponse = await axios.get<Preferences | null>(
          `${import.meta.env.VITE_API_URL}/view-artist-preferences/${userId}`
        );
        setPreferences(preferencesResponse.data);

        const artsResponse = await axios.get<Artwork[]>(
          `${import.meta.env.VITE_API_URL}/api/arts/${userId}`
        );
        setArtistArts(artsResponse.data);

        // Fetch recommended artists
        const recommendationsResponse = await axios.get<RecommendedArtist[]>(
          `${
            import.meta.env.VITE_API_URL
          }/recommend-artists/${userId}?visitorId=${user?.id}`
        );
        setRecommendedArtists(recommendationsResponse.data);
      } catch (err) {
        console.error("Error fetching artist details:", err);
        setError("Failed to load artist details.");
      } finally {
        setLoading(false);
      }
    };

    fetchArtistDetails();
  }, [userId, user]);
  const togglePreferences = () => setShowAllPreferences(!showAllPreferences);

  const loadMoreArtworks = () => {
    setArtworksDisplayed((prev) => {
      const remainingArtworks = artistArts.length - prev;
      return remainingArtworks > 6 ? prev + 6 : prev + remainingArtworks;
    });
  };

  const hasValidPreferences =
    preferences &&
    Object.values(preferences).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    });

  const handleSendMessageClick = () => {
    setIsMessagePopupOpen(true);
  };

  const handleCloseMessagePopup = () => {
    setIsMessagePopupOpen(false);
  };

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to send a proposal.");
      return;
    }

    if (!artist || !artist.user_id) {
      alert("Artist ID is missing! Please refresh the page.");
      return;
    }

    if (
      !projectName.trim() ||
      !projectDescription.trim() ||
      !budget.trim() ||
      !dueDate.trim()
    ) {
      alert("All fields are required.");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/send-proposal`,
        {
          sender_id: user.id,
          recipient_id: artist.user_id,
          project_name: projectName.trim(),
          project_description: projectDescription.trim(),
          budget: parseFloat(budget),
          due_date: new Date(dueDate).toISOString().split("T")[0],
          status: "Pending",
        }
      );

      if (response.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Proposal Sent!",
          text: "Your proposal has been sent successfully.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        setShowProposalModal(false);
        setProjectName("");
        setProjectDescription("");
        setBudget("");
        setDueDate("");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error Sending Proposal",
          text: "Failed to send proposal. Please try again.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error Sending Proposal",
        text: "Failed to send proposal. Please check the server.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
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
    return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Profile Section */}
        <div className="bg-white shadow-lg rounded-lg p-8 mb-12 relative">
          <div className="flex flex-col items-center text-center">
            <img
              src={artist?.profile_image || "/default-profile.png"}
              alt={`${artist?.firstname} ${artist?.lastname}`}
              className="w-60 h-60 object-cover rounded-full border-4 border-gray-300"
            />
            <div className="flex items-center mt-4 space-x-3">
              <h1 className="text-4xl font-bold text-gray-900">
                {artist?.firstname} {artist?.lastname}
              </h1>
              {artist?.status === "approved" && (
                <FaCheckCircle className="text-green-500 text-3xl" />
              )}
            </div>
            <p className="text-gray-600 mt-2">
              {artist?.bio || "No bio available"}
            </p>
            <div className="flex flex-wrap justify-center gap-6 mt-4 text-gray-600">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt />
                <span>{artist?.address || "Location not available"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaEnvelope />
                <span>{artist?.email || "Email not available"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaPhoneAlt />
                <span>{artist?.phone || "Phone not available"}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={() => setShowProposalModal(true)}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg shadow hover:bg-orange-700 transition"
              >
                Send Proposal
              </button>
              <button
                onClick={handleSendMessageClick}
                className="bg-yellow-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
        {/* Proposal Modal */}
        {showProposalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-3xl w-full transition-transform transform scale-100 hover:scale-105">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Send Proposal
              </h2>
              <form onSubmit={handleProposalSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:border-blue-500 transition duration-200"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Project Description
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:border-blue-500 transition duration-200"
                    rows={4}
                    required
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Budget
                  </label>
                  <input
                    type="text" // Keep as text to control input
                    value={budget}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only numbers and decimal point
                      if (/^\d*\.?\d*$/.test(value) || value === "") {
                        setBudget(value);
                        setShowBudgetAlert(false); // Hide alert if input is valid
                      } else {
                        setShowBudgetAlert(true); // Show alert if input is invalid
                      }
                    }}
                    onKeyPress={(e) => {
                      // Prevent letters from being input
                      if (!/[0-9.]/.test(e.key) && e.key !== "Backspace") {
                        e.preventDefault();
                        setShowBudgetAlert(true); // Show alert if input is invalid
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:border-blue-500 transition duration-200"
                    required
                  />
                  {showBudgetAlert && (
                    <div
                      className="flex items-center p-4 mb-4 mt-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50"
                      role="alert"
                    >
                      <svg
                        className="shrink-0 inline w-4 h-4 me-3"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                      </svg>
                      <span className="font-medium">
                        Invalid input! Please enter a valid number for the
                        budget.
                      </span>
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text -gray-800 focus:outline-none focus:border-blue-500 transition duration-200"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowProposalModal(false)}
                    className="py-2 px-4 bg-gray-300 rounded-md shadow hover:bg-gray-400 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition duration-200"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preferences Section */}
        {hasValidPreferences && (
          <div className="bg-white shadow-md rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Preferences
            </h2>
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${
                showAllPreferences ? "" : "max-h-48 overflow-hidden"
              }`}
            >
              {Object.entries(preferences).map(([key, value]) =>
                value ? (
                  <div key={key}>
                    <strong className="block text-gray-800 capitalize">
                      {key.replace(/_/g, " ")}:
                    </strong>
                    {Array.isArray(value) && value.length > 0 ? (
                      value.map((v) => (
                        <span
                          key={v}
                          className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-2"
                        >
                          {v}
                        </span>
                      ))
                    ) : (
                      <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                        {value}
                      </span>
                    )}
                  </div>
                ) : null
              )}
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={togglePreferences}
                className="text-orange-500 hover:text-orange-700 flex items-center"
              >
                {showAllPreferences ? (
                  <>
                    <FaChevronUp className="mr-2" /> View Less
                  </>
                ) : (
                  <>
                    <FaChevronDown className="mr-2" /> View All Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Artworks Section */}
        <div className="bg-white shadow-md rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Artworks by {artist?.firstname}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {artistArts.slice(0, artworksDisplayed).map((art) => (
              <div
                key={art.art_id}
                className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <img
                  src={art.image_url}
                  alt={art.title}
                  className="w-full h-40 sm:h-60 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    {art.title}
                  </h3>
                  <p className="text-gray-600">₱{art.price.toLocaleString()}</p>
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
          {artworksDisplayed < artistArts.length && (
            <div className="text-center mt-6">
              <button
                onClick={loadMoreArtworks}
                className="bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 transition"
              >
                Load More Artworks
              </button>
            </div>
          )}
        </div>

        {/* Recommended Clients Section */}
        {recommendedArtists.length > 0 ? (
          <div className="bg-white shadow-lg rounded-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">
              Recommended Artists
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {recommendedArtists.map((recArtist) => (
                <div
                  key={recArtist.user_id}
                  className="bg-gray-50 shadow-md rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 mb-6 cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center p-6">
                    {recArtist.profile_image ? (
                      <img
                        src={recArtist.profile_image}
                        alt={`${recArtist.firstname} ${recArtist.lastname}`}
                        className="w-32 h-32 object-cover rounded-full border-4 border-gray-300 mb-4"
                      />
                    ) : (
                      <FaUserCircle className="w-32 h-32 text-gray-400 border-4 border-gray-300 rounded-full mb-4" />
                    )}
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                      {recArtist.firstname} {recArtist.lastname}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {recArtist.address || "No address available"}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/artist/${recArtist.user_id}`);
                      }}
                      className="bg-orange-600 text-white px-5 py-2 rounded-lg shadow hover:bg-orange-700 transition duration-200"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-8 mb-12 text-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Recommended Clients
            </h2>
            <p className="text-gray-600">
              No recommended clients for you at this time.
            </p>
          </div>
        )}
      </div>
      {isMessagePopupOpen && user && artist && (
        <MessagePopup
          onClose={handleCloseMessagePopup}
          sender_id={user.id}
          receiver_id={artist.user_id}
        />
      )}

      {/* Display messages */}
      <div className="mt-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-3 flex ${msg.sender === "You" ? "justify-end" : ""}`}
          >
            <div
              className={`px-4 py-2 rounded-lg ${
                msg.sender === "You" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewProfileArtist;
