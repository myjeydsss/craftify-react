﻿import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthProvider"; // Import AuthProvider
import {
    FaMapMarkerAlt,
    FaEnvelope,
    FaPhoneAlt,
    FaChevronDown,
    FaChevronUp,
    FaUserCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // Make sure to import useNavigate
import MessagePopup from "./MessagePopup.tsx";

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
  const navigate = useNavigate(); // Initialize navigate
  const { user } = useAuth(); // Get authenticated user
  const [client, setClient] = useState<Client | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllPreferences, setShowAllPreferences] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [recommendedClients, setRecommendedClients] = useState<Client[]>([]); // New state for recommended clients

    const [projectName, setProjectName] = useState<string>("");
    const [projectDescription, setProjectDescription] = useState<string>("");
    const [budget, setBudget] = useState<string>("");
    const [dueDate, setDueDate] = useState<string>("");

  const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);

  useEffect(() => {
    const fetchClientDetails = async () => {
      setLoading(true);
      try {
        const clientResponse = await axios.get<Client>(
          `${import.meta.env.VITE_API_URL}/client-profile/${userId}`
        );
        setClient(clientResponse.data);
  
        const preferencesResponse = await axios.get<Preferences | null>(
          `${import.meta.env.VITE_API_URL}/client-preferences/${userId}`
        );
        setPreferences(preferencesResponse.data);
  
        // Check if user is authenticated before fetching recommendations
        if (user && user.id) {
          // Fetch recommended clients with visitorId as a query parameter
          const recommendationsResponse = await axios.get<Client[]>(
            `${import.meta.env.VITE_API_URL}/recommend-clients/${userId}?visitorId=${user.id}`
          );
          setRecommendedClients(recommendationsResponse.data);
        } else {
          setError("User  is not authenticated.");
        }
      } catch (err) {
        console.error("Error fetching client details:", err);
        setError("Failed to load client details.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchClientDetails();
  }, [userId, user]); // Include user in the dependency array
  
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
            alert("You must be logged in to send a proposal.");
            return;
        }

        if (!client || !client.user_id) {
            alert("Client ID is missing! Please refresh the page.");
            return;
        }

        if (!projectName.trim() || !projectDescription.trim() || !budget.trim() || !dueDate.trim()) {
            alert("All fields are required.");
            return;
        }

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/send-proposal`, {
                sender_id: user.id,
                recipient_id: client.user_id,
                project_name: projectName.trim(),
                project_description: projectDescription.trim(),
                budget: parseFloat(budget),
                due_date: new Date(dueDate).toISOString().split("T")[0],
                status: "Pending",
            });

      if (response.status === 201) {
        alert("Proposal sent successfully!");
        setShowModal(false);
        setProjectName("");
        setProjectDescription("");
        setBudget("");
        setDueDate("");
      } else {
        alert("Failed to send proposal. Please try again.");
      }
    } catch (err) {
      alert("Failed to send proposal. Please check the server.");
    }
  };

  const handleSendMessageClick = () => {
    setIsMessagePopupOpen(true);
  };

  const handleCloseMessagePopup = () => {
    setIsMessagePopupOpen(false);
  };

    if (loading) return <div className="text-center mt-10">Loading...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

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
            <p className="text-gray-600 mt-2">{client?.bio || "No bio available"}</p>
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
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Send Proposal</h2>
                            <form onSubmit={handleProposalSubmit}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">Project Name</label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">Project Description</label>
                                    <textarea
                                        value={projectDescription}
                                        onChange={(e) => setProjectDescription(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:border-blue-500"
                                        rows={4}
                                        required
                                    ></textarea>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">Budget</label>
                                    <input
                                        type="text"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="py-2 px-4 bg-gray-300 rounded-md shadow hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="py-2 px-4 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600"
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Preferences</h2>
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

        {/* Recommended Clients Section */}
        {recommendedClients.length > 0 ? (
          <div className="bg-white shadow-lg rounded-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">Recommended Clients</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {recommendedClients.map((recClient) => (
                <div
                  key={recClient.user_id}
                  className="bg-gray-50 shadow-md rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 mb-6 cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center p-6">
                    {recClient.profile_image ? (
                      <img
                        src={recClient.profile_image}
                        alt={`${recClient.firstname} ${recClient.lastname}`}
                        className="w-32 h-32 object-cover rounded-full border-4 border-gray-300 mb-4"
                      />
                    ) : (
                      <FaUserCircle className="w-32 h-32 text-gray-400 border-4 border-gray-300 rounded-full mb-4" />
                    )}
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                      {recClient.firstname} {recClient.lastname}
                    </h3>
                    <p className="text-gray-600 mb-4">{recClient.address || "No address available"}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent the card click event
                        navigate(`/profile/client/${recClient.user_id}`);
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
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">Recommended Clients</h2>
            <p className="text-gray-600">No recommended clients for you at this time.</p>
          </div>
        )}
      </div>
      {isMessagePopupOpen && user && client && (
        <MessagePopup
          onClose={handleCloseMessagePopup}
          sender_id={user.id} // Pass the sender_id
          receiver_id={client.user_id} // Pass the receiver_id
        />
      )}
    </div>
  );
};

export default ViewProfileClient;
