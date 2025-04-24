import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";
import {
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
  FaChevronDown,
  FaChevronUp,
  FaUserCircle,
} from "react-icons/fa";
import MessagePopup from "./MessagePopup.tsx";
import ClipLoader from "react-spinners/ClipLoader";
import Swal from "sweetalert2";

interface Client {
  user_id: string;
  firstname: string;
  lastname: string;
  bio: string | null;
  address: string | null;
  email: string;
  phone: string | null;
  profile_image: string | null;
}

interface Preferences {
  preferred_art_style?: string[];
  project_requirements?: string | null;
  budget_range?: string | null;
  location_requirement?: string | null;
  timeline?: string | null;
  artist_experience_level?: string | null;
  communication_preferences?: string[];
  project_type?: string[];
}

const ViewProfileClient: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllPreferences, setShowAllPreferences] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  const [projectName, setProjectName] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);
  const [showBudgetAlert, setShowBudgetAlert] = useState(false); // State to control the visibility of the alert

  useEffect(() => {
    const fetchClientDetails = async () => {
      setLoading(true);
      try {
        const clientResponse = await axios.get<Client>(
          `${import.meta.env.VITE_API_URL}/client-profile/${userId}`
        );
        setClient(clientResponse.data);

        // Set the document title
        document.title = `${clientResponse.data.firstname} ${clientResponse.data.lastname} | Craftify`;

        const preferencesResponse = await axios.get<Preferences | null>(
          `${import.meta.env.VITE_API_URL}/client-preferences/${userId}`
        );
        setPreferences(preferencesResponse.data);
      } catch (err) {
        console.error("Error fetching client details:", err);
        setError("Failed to load client details.");
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [userId, user]);

  const togglePreferences = () => setShowAllPreferences(!showAllPreferences);

  const hasValidPreferences =
    preferences &&
    Object.values(preferences).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    });

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      Swal.fire({
        icon: "error",
        title: "Authentication Required",
        text: "You must be logged in to send a proposal.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    if (!client || !client.user_id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Client ID is missing! Please refresh the page.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    if (
      !projectName.trim() ||
      !projectDescription.trim() ||
      !budget.trim() ||
      !dueDate.trim()
    ) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "All fields are required.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/send-proposal`,
        {
          sender_id: user.id,
          recipient_id: client.user_id,
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
        setShowModal(false);
        setProjectName("");
        setProjectDescription("");
        setBudget("");
        setDueDate("");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
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
        title: "Server Error",
        text: "Failed to send proposal. Please check the server.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  const handleSendMessageClick = () => {
    setIsMessagePopupOpen(true);
  };

  const handleCloseMessagePopup = () => {
    setIsMessagePopupOpen(false);
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
            {client?.profile_image ? (
              <img
                src={client.profile_image}
                alt={`${client.firstname} ${client.lastname}`}
                className="w-60 h-60 object-cover rounded-full border-4 border-gray- 300"
              />
            ) : (
              <FaUserCircle className="w-60 h-60 text-gray-400 border-4 border-gray-300 rounded-full" />
            )}
            <h1 className="text-4xl font-bold text-gray-900 mt-4">
              {client?.firstname} {client?.lastname}
            </h1>
            <p className="text-gray-600 mt-2">
              {client?.bio || "No bio available"}
            </p>
            <div className="flex flex-wrap justify-center gap-6 mt-4 text-gray-600">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt />
                <span>{client?.address || "Location not available"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaEnvelope />
                <span>{client?.email || "Email not available"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaPhoneAlt />
                <span>{client?.phone || "Phone not available"}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={() => setShowModal(true)}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg shadow hover:bg-orange-600 transition"
              >
                Send Proposal
              </button>
              <button
                onClick={handleSendMessageClick}
                className="bg-yellow-500 text-white px-6 py-2 rounded-lg shadow hover:bg-yellow-600 transition"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>

        {/* Proposal Modal */}
        {showModal && (
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
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:border-blue-500 transition duration-200"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
              {Object.entries(preferences!).map(([key, value]) =>
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
      </div>
      {isMessagePopupOpen && user && client && (
        <MessagePopup
          onClose={handleCloseMessagePopup}
          sender_id={user.id}
          receiver_id={client.user_id}
        />
      )}
    </div>
  );
};

export default ViewProfileClient;
