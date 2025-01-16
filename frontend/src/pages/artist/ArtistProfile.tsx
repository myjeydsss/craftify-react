import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUserCircle,
  FaPalette,
  FaUser,
  FaMapMarkerAlt,
} from "react-icons/fa";

interface ArtistProfileData {
  firstname: string;
  lastname: string;
  gender: string;
  date_of_birth: string;
  email: string;
  role: string;
  profile_image?: string;
  address?: string;
  phone?: string;
}

interface ArtistPreferences {
  crafting: string;
  art_style_specialization: string[];
  collaboration_type: string;
  preferred_medium: string[];
  location_preference: string;
  crafting_techniques: string[];
  budget_range: string;
  project_type: string;
  project_type_experience: string;
  preferred_project_duration: string;
  availability: string;
  client_type_preference: string;
  project_scale: string;
  portfolio_link: string;
  preferred_communication: string[];
}

const ArtistProfile: React.FC = () => {
  const [artistProfile, setArtistProfile] = useState<ArtistProfileData | null>(null);
  const [preferences, setPreferences] = useState<ArtistPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [activeSection, setActiveSection] = useState<"profile" | "preferences" | "address">(
    "profile"
  );

  useEffect(() => {
    const fetchProfileAndPreferences = async () => {
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const userId = localStorage.getItem("userId");

      if (!userId) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      try {
        const profileResponse = await axios.get(`${API_BASE_URL}/artist-profile/${userId}`);
        setArtistProfile(profileResponse.data);

        const preferencesResponse = await axios.get(`${API_BASE_URL}/artist-preferences/${userId}`);
        const preferencesData = preferencesResponse.data;

        setPreferences({
          ...preferencesData,
          art_style_specialization: JSON.parse(preferencesData.art_style_specialization || "[]"),
          preferred_medium: JSON.parse(preferencesData.preferred_medium || "[]"),
          crafting_techniques: JSON.parse(preferencesData.crafting_techniques || "[]"),
          preferred_communication: JSON.parse(preferencesData.preferred_communication || "[]"),
        });
      } catch (err: any) {
        console.error("Error fetching artist data:", err);
        setError(err.response?.data?.error || "Failed to fetch artist data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndPreferences();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500 text-lg">Loading artist profile...</div>
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
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">First Name:</span>
        <span className="text-gray-700">{artistProfile?.firstname}</span>
      </div>
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Last Name:</span>
        <span className="text-gray-700">{artistProfile?.lastname}</span>
      </div>
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Gender:</span>
        <span className="text-gray-700">{artistProfile?.gender || "Not specified"}</span>
      </div>
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Date Of Birth:</span>
        <span className="text-gray-700">{artistProfile?.date_of_birth || "Not specified"}</span>
      </div>
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Email:</span>
        <span className="text-gray-700">{artistProfile?.email}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-medium text-gray-600">Role:</span>
        <span className="text-gray-700">{artistProfile?.role}</span>
      </div>
    </div>
  );
  const renderPreferences = () => (
    <div className="space-y-4">
      {/* Crafting */}
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Crafting:</span>
        <span className="text-gray-700">{preferences?.crafting || "Not specified"}</span>
      </div>
  
      {/* Art Style Specialization */}
      <div className="border-b pb-2">
        <h3 className="font-medium text-gray-600 mb-1">Art Style Specialization:</h3>
        <div className="flex flex-wrap gap-2">
          {preferences?.art_style_specialization?.length ? (
            preferences.art_style_specialization.map((style) => (
              <span key={style} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                {style}
              </span>
            ))
          ) : (
            <span className="text-gray-700">Not specified</span>
          )}
        </div>
      </div>
  
      {/* Collaboration Type */}
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Collaboration Type:</span>
        <span className="text-gray-700">{preferences?.collaboration_type || "Not specified"}</span>
      </div>
  
      {/* Preferred Medium */}
      <div className="border-b pb-2">
        <h3 className="font-medium text-gray-600 mb-1">Preferred Medium:</h3>
        <div className="flex flex-wrap gap-2">
          {preferences?.preferred_medium?.length ? (
            preferences.preferred_medium.map((medium) => (
              <span key={medium} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                {medium}
              </span>
            ))
          ) : (
            <span className="text-gray-700">Not specified</span>
          )}
        </div>
      </div>
  
      {/* Location Preference */}
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Location Preference:</span>
        <span className="text-gray-700">{preferences?.location_preference || "Not specified"}</span>
      </div>
  
      {/* Crafting Techniques */}
      <div className="border-b pb-2">
        <h3 className="font-medium text-gray-600 mb-1">Crafting Techniques:</h3>
        <div className="flex flex-wrap gap-2">
          {preferences?.crafting_techniques?.length ? (
            preferences.crafting_techniques.map((technique) => (
              <span key={technique} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                {technique}
              </span>
            ))
          ) : (
            <span className="text-gray-700">Not specified</span>
          )}
        </div>
      </div>
  
      {/* Budget Range */}
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Budget Range:</span>
        <span className="text-gray-700">{preferences?.budget_range || "Not specified"}</span>
      </div>
  
      {/* Project Type */}
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Project Type:</span>
        <span className="text-gray-700">{preferences?.project_type || "Not specified"}</span>
      </div>
  
      {/* Project Type Experience */}
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Project Type Experience:</span>
        <span className="text-gray-700">{preferences?.project_type_experience || "Not specified"}</span>
      </div>
  
      {/* Preferred Project Duration */}
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Preferred Project Duration:</span>
        <span className="text-gray-700">{preferences?.preferred_project_duration || "Not specified"}</span>
      </div>
  
      {/* Availability */}
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Availability:</span>
        <span className="text-gray-700">{preferences?.availability || "Not specified"}</span>
      </div>
  
      {/* Client Type Preference */}
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Client Type Preference:</span>
        <span className="text-gray-700">{preferences?.client_type_preference || "Not specified"}</span>
      </div>
  
      {/* Project Scale */}
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Project Scale:</span>
        <span className="text-gray-700">{preferences?.project_scale || "Not specified"}</span>
      </div>
  
      {/* Portfolio Link */}
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Portfolio Link:</span>
        <a
          href={preferences?.portfolio_link || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          {preferences?.portfolio_link || "No portfolio provided"}
        </a>
      </div>
  
      {/* Preferred Communication */}
      <div className="border-b pb-2">
        <h3 className="font-medium text-gray-600 mb-1">Preferred Communication:</h3>
        <div className="flex flex-wrap gap-2">
          {preferences?.preferred_communication?.length ? (
            preferences.preferred_communication.map((method) => (
              <span key={method} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                {method}
              </span>
            ))
          ) : (
            <span className="text-gray-700">Not specified</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderAddress = () => (
    <div className="space-y-4">
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Address:</span>
        <span className="text-gray-700">{artistProfile?.address || "Not provided"}</span>
      </div>
      <div className="flex justify-between border-b pb-2">
        <span className="font-medium text-gray-600">Contact Number:</span>
        <span className="text-gray-700">{artistProfile?.phone || "Not provided"}</span>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex">
        <aside className="w-64 p-4 bg-white shadow-md rounded-lg mr-6">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg mb-2">
              {artistProfile?.profile_image ? (
                <img
                  src={artistProfile.profile_image}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUserCircle className="text-gray-300" size={72} />
              )}
            </div>
            <h2 className="text-xl font-semibold">{artistProfile?.firstname} {artistProfile?.lastname}</h2>
            <p className="text-sm text-gray-500">{artistProfile?.email}</p>
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

export default ArtistProfile;