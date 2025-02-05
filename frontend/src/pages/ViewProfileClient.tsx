import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
  FaChevronDown,
  FaChevronUp,
  FaUserCircle,
} from "react-icons/fa";

interface Client {
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
  const [client, setClient] = useState<Client | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllPreferences, setShowAllPreferences] = useState<boolean>(false);

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
      } catch (err) {
        console.error("Error fetching client details:", err);
        setError("Failed to load client details.");
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [userId]);

  const togglePreferences = () => setShowAllPreferences(!showAllPreferences);

  const hasValidPreferences =
    preferences &&
    Object.values(preferences).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    });

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
                className="w-60 h-60 object-cover rounded-full border-4 border-gray-300"
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
          </div>
        </div>

        {/* Preferences Section */}
        {hasValidPreferences && (
          <div className="bg-white shadow-md rounded-lg p-8">
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
      </div>
    </div>
  );
};

export default ViewProfileClient;