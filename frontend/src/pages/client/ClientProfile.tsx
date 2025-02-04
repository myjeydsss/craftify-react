import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaPalette, FaUser, FaMapMarkerAlt, FaEdit, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthProvider";

interface ClientProfileData {
  firstname: string;
  lastname: string;
  bio: string;
  gender: string;
  date_of_birth: string;
  email: string;
  role: string;
  profile_image?: string;
  address?: string;
  phone?: string;
}

interface ClientPreferences {
  preferred_art_style: string[];
  project_requirements: string;
  budget_range: string;
  location_requirement: string;
  timeline: string;
  artist_experience_level: string;
  communication_preferences: string[];
  project_type: string[];
}

const ClientProfile: React.FC = () => {
  const [clientProfile, setClientProfile] = useState<ClientProfileData | null>(null);
  const [preferences, setPreferences] = useState<ClientPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [activeSection, setActiveSection] = useState<"profile" | "preferences" | "address">("profile");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileAndPreferences = async () => {
      if (!user) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL;

      try {
        const [profileResponse, preferencesResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/client-profile/${user.id}`),
          axios.get(`${API_BASE_URL}/client-preferences/${user.id}`),
        ]);

        setClientProfile(profileResponse.data);

        const preferencesData = preferencesResponse.data;
        if (preferencesData.preferences === null) {
          setPreferences(null);
        } else {
          // Now no need for JSON.parse because the data is already in proper array format
          setPreferences({
            ...preferencesData,
            preferred_art_style: preferencesData.preferred_art_style || [],
            communication_preferences: preferencesData.communication_preferences || [],
            project_type: preferencesData.project_type || [],
          });
        }
      } catch (err: any) {
        console.error("Error fetching client data:", err);
        setError(err.response?.data?.error || "Failed to fetch client data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndPreferences();
  }, [user]);

  const handleEditClick = () => {
    navigate("/edit-client-profile");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500 text-lg">Loading client profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  const renderProfile = () => (
    <div className="space-y-4">
      {[
        { label: "Bio", value: clientProfile?.bio },
        { label: "First Name", value: clientProfile?.firstname },
        { label: "Last Name", value: clientProfile?.lastname },
        { label: "Gender", value: clientProfile?.gender || "Not specified" },
        { label: "Date Of Birth", value: clientProfile?.date_of_birth || "Not specified" },
        { label: "Email", value: clientProfile?.email },
        { label: "Role", value: clientProfile?.role },
      ].map(({ label, value }) => (
        <div key={label} className="flex justify-between border-b pb-2">
          <span className="font-medium text-gray-600">{label}:</span>
          <span className="text-gray-700">{value}</span>
        </div>
      ))}


      <button
        onClick={handleEditClick}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        <FaEdit className="inline mr-2" /> Edit Profile
      </button>
    </div>
  );

  const renderPreferences = () => (
    <div>
      {preferences ? (
        <div className="space-y-4">
          {Object.entries(preferences).map(([key, value]) =>
            Array.isArray(value) ? (
              <div key={key} className="border-b pb-2">
                <h3 className="font-medium text-gray-600 mb-1 capitalize">{key.replace(/_/g, " ")}:</h3>
                {value.length ? (
                  <div className="flex flex-wrap gap-2">
                    {value.map((item) => (
                      <span key={item} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-700">Not specified</span>
                )}
              </div>
            ) : (
              <div key={key} className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-600 capitalize">{key.replace(/_/g, " ")}:</span>
                <span className="text-gray-700">{value || "Not specified"}</span>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="text-center text-gray-700">
          <p className="text-lg">You haven't set up your preferences yet.</p>
        </div>
      )}
      <button
        onClick={handleEditClick}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        <FaEdit className="inline mr-2" /> Edit Preferences
      </button>
    </div>
  );

  const renderAddress = () => (
    <div className="space-y-4">
      {[
        { label: "Address", value: clientProfile?.address || "Not provided" },
        { label: "Contact Number", value: clientProfile?.phone || "Not provided" },
      ].map(({ label, value }) => (
        <div key={label} className="flex justify-between border-b pb-2">
          <span className="font-medium text-gray-600">{label}:</span>
          <span className="text-gray-700">{value}</span>
        </div>
      ))}
      <button
        onClick={handleEditClick}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        <FaEdit className="inline mr-2" /> Edit Address & Contact
      </button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex">
        <aside className="w-64 p-4 bg-white shadow-md rounded-lg mr-6">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg mb-2">
              {clientProfile?.profile_image ? (
                <img
                  src={clientProfile.profile_image}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUserCircle className="text-gray-300" size={72} />
              )}
            </div>
            <h2 className="text-xl font-semibold">
              {clientProfile?.firstname} {clientProfile?.lastname}
            </h2>
            <p className="text-sm text-gray-500">{clientProfile?.email}</p>
  
          </div>
          <nav className="space-y-4">
            <button
              onClick={() => setActiveSection("profile")}
              className={`flex items-center space-x-2 w-full ${
                activeSection === "profile" ? "text-blue-600 font-semibold" : "text-gray-700"
              }`}
            >
              <FaUser /> <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveSection("preferences")}
              className={`flex items-center space-x-2 w-full ${
                activeSection === "preferences" ? "text-blue-600 font-semibold" : "text-gray-700"
              }`}
            >
              <FaPalette /> <span>Preferences</span>
            </button>
            <button
              onClick={() => setActiveSection("address")}
              className={`flex items-center space-x-2 w-full ${
                activeSection === "address" ? "text-blue-600 font-semibold" : "text-gray-700"
              }`}
            >
              <FaMapMarkerAlt /> <span>Address & Contact</span>
            </button>
          </nav>
        </aside>
        <main className="flex-1 p-6 bg-white shadow-lg rounded-lg">
          {activeSection === "profile"
            ? renderProfile()
            : activeSection === "preferences"
            ? renderPreferences()
            : renderAddress()}
        </main>
      </div>
    </div>
  );
};

export default ClientProfile;