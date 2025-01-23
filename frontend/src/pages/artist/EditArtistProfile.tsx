import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface ArtistProfile {
  firstname: string;
  lastname: string;
  bio: string;
  gender: string;
  date_of_birth: string;
  address: string;
  email: string;
  phone: string;
}

interface Preferences {
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
const handleNullValue = (value: string | null | undefined): string => value ?? "";

const EditArtistProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [artistProfile, setArtistProfile] = useState<ArtistProfile>({
    firstname: "",
    lastname: "",
    bio: "",
    gender: "",
    date_of_birth: "",
    address: "",
    email: "",
    phone: "",
  });

  const [preferences, setPreferences] = useState<Preferences>({
    crafting: "",
    art_style_specialization: [],
    collaboration_type: "",
    preferred_medium: [],
    location_preference: "",
    crafting_techniques: [],
    budget_range: "",
    project_type: "",
    project_type_experience: "",
    preferred_project_duration: "",
    availability: "",
    client_type_preference: "",
    project_scale: "",
    portfolio_link: "",
    preferred_communication: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setError("User not logged in.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const profileResponse = await axios.get(`${API_BASE_URL}/artist-profile/${user.id}`);
        const preferencesResponse = await axios.get(`${API_BASE_URL}/artist-preferences/${user.id}`);

        setArtistProfile({
          firstname: handleNullValue(profileResponse.data?.firstname),
          lastname: handleNullValue(profileResponse.data?.lastname),
          bio: handleNullValue(profileResponse.data?.bio),
          gender: handleNullValue(profileResponse.data?.gender),
          date_of_birth: handleNullValue(profileResponse.data?.date_of_birth),
          address: handleNullValue(profileResponse.data?.address),
          email: handleNullValue(profileResponse.data?.email),
          phone: handleNullValue(profileResponse.data?.phone),
        });

        setPreferences({
          crafting: handleNullValue(preferencesResponse.data?.crafting),
          art_style_specialization: preferencesResponse.data?.art_style_specialization || [],
          collaboration_type: handleNullValue(preferencesResponse.data?.collaboration_type),
          preferred_medium: preferencesResponse.data?.preferred_medium || [],
          location_preference: handleNullValue(preferencesResponse.data?.location_preference),
          crafting_techniques: preferencesResponse.data?.crafting_techniques || [],
          budget_range: handleNullValue(preferencesResponse.data?.budget_range),
          project_type: handleNullValue(preferencesResponse.data?.project_type),
          project_type_experience: handleNullValue(preferencesResponse.data?.project_type_experience),
          preferred_project_duration: handleNullValue(preferencesResponse.data?.preferred_project_duration),
          availability: handleNullValue(preferencesResponse.data?.availability),
          client_type_preference: handleNullValue(preferencesResponse.data?.client_type_preference),
          project_scale: handleNullValue(preferencesResponse.data?.project_scale),
          portfolio_link: handleNullValue(preferencesResponse.data?.portfolio_link),
          preferred_communication: preferencesResponse.data?.preferred_communication || [],
        });

        setError(null);
      } catch (err: any) {
        console.error("Error fetching artist data:", err);
        setError("Failed to load artist profile or preferences. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setArtistProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handlePreferencesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences((prevPreferences) => ({
      ...prevPreferences,
      [name]: value,
    }));
  };

  const togglePreference = (field: keyof Preferences, value: string) => {
    setPreferences((prevPreferences) => {
      const currentValues = Array.isArray(prevPreferences[field]) ? prevPreferences[field] : [];
      const updatedValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return { ...prevPreferences, [field]: updatedValues };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!user) {
      setError("User not logged in.");
      return;
    }
  
    try {
      setLoading(true);
  
      // Filter out unchanged fields for profile
      const profilePayload = Object.entries(artistProfile).reduce((acc, [key, value]) => {
        if (value !== "") {
          acc[key as keyof ArtistProfile] = value; // Cast key as keyof ArtistProfile
        }
        return acc;
      }, {} as Partial<ArtistProfile>);
  
      // Prepare preferences payload
      const preferencesPayload = {
        ...preferences,
        art_style_specialization: preferences.art_style_specialization || [],
        preferred_medium: preferences.preferred_medium || [],
        crafting_techniques: preferences.crafting_techniques || [],
        preferred_communication: preferences.preferred_communication || [],
      };
  
      const payload = {
        userId: user.id,
        profile: profilePayload,
        preferences: preferencesPayload,
      };
  
      await axios.put(`${API_BASE_URL}/artist-profile`, payload);
      navigate("/artist-profile");
    } catch (err) {
      console.error("Error saving changes:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

 
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <form onSubmit={handleSave} className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-6 space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Edit Artist Profile</h2>
  
        {/* Artist Profile Fields */}
        <div className="flex flex-col space-y-2">
          <label>First Name</label>
          <input
            name="firstname"
            value={artistProfile.firstname}
            onChange={handleProfileChange}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label>Last Name</label>
          <input
            name="lastname"
            value={artistProfile.lastname}
            onChange={handleProfileChange}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label>Bio</label>
          <textarea
            name="bio"
            value={artistProfile.bio}
            onChange={handleProfileChange}
            className="border p-2 rounded"
            rows={3}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label>Gender</label>
          <select
            name="gender"
            value={artistProfile.gender}
            onChange={handleProfileChange}
            className="border p-2 rounded"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="flex flex-col space-y-2">
          <label>Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            value={artistProfile.date_of_birth}
            onChange={handleProfileChange}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label>Address</label>
          <input
            name="address"
            value={artistProfile.address}
            onChange={handleProfileChange}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={artistProfile.email}
            onChange={handleProfileChange}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label>Phone</label>
          <input
            name="phone"
            value={artistProfile.phone}
            onChange={handleProfileChange}
            className="border p-2 rounded"
          />
        </div>
  
        <h2 className="text-2xl font-semibold text-gray-800 mt-8">Edit Preferences</h2>
  
          {/* Preferences Fields */}
<div className="flex flex-col space-y-2">
  <label>Crafting</label>
  <input
    name="crafting"
    value={preferences?.crafting || ""}
    onChange={handlePreferencesChange}
    className="border p-2 rounded"
  />
</div>

<div className="flex flex-col space-y-2">
          <label>Art Style Specialization</label>
          <div className="flex flex-wrap gap-2">
            {["Traditional & Physical Art", "Digital Art & Illustrations", "Sculpture & 3D Art"].map((style) => (
              <button
                type="button"
                key={style}
                onClick={() => togglePreference("art_style_specialization", style)}
                className={`px-4 py-2 rounded ${
                  preferences?.art_style_specialization?.includes(style) ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

<div className="flex flex-col space-y-2">
  <label>Collaboration Type</label>
  <select
    name="collaboration_type"
    value={preferences?.collaboration_type || ""}
    onChange={handlePreferencesChange}
    className="border p-2 rounded"
  >
    <option value="">Select collaboration type</option>
    <option value="Solo">Solo</option>
    <option value="Collaboration">Collaboration</option>
  </select>
</div>

<div className="flex flex-col space-y-2">
  <label>Preferred Medium</label>
  <div className="flex flex-wrap gap-2">
    {["Oil Paint", "Watercolor", "Acrylic", "Digital", "Mixed Media", "Clay", "Metal", "Wood"].map((medium) => (
      <button
        type="button"
        key={medium}
        onClick={() => togglePreference("preferred_medium", medium)}
        className={`px-4 py-2 rounded ${
          preferences?.preferred_medium.includes(medium)
            ? "bg-blue-500 text-white"
            : "bg-gray-200"
        }`}
      >
        {medium}
      </button>
    ))}
  </div>
</div>

<div className="flex flex-col space-y-2">
  <label>Location Preference</label>
  <select
    name="location_preference"
    value={preferences?.location_preference || ""}
    onChange={handlePreferencesChange}
    className="border p-2 rounded"
  >
    <option value="">Select location preference</option>
    <option value="Local">Local</option>
    <option value="Regional">Regional</option>
    <option value="Global">Global</option>
  </select>
</div>

<div className="flex flex-col space-y-2">
  <label>Crafting Techniques</label>
  <div className="flex flex-wrap gap-2">
    {["Wood Carving", "Clay Modeling", "Fabric Weaving", "Metal Forging", "Jewelry Making", "Recycling & Upcycling"].map((technique) => (
      <button
        type="button"
        key={technique}
        onClick={() => togglePreference("crafting_techniques", technique)}
        className={`px-4 py-2 rounded ${
          preferences?.crafting_techniques.includes(technique)
            ? "bg-blue-500 text-white"
            : "bg-gray-200"
        }`}
      >
        {technique}
      </button>
    ))}
  </div>
</div>

  {/* Budget Range */}
  <div className="flex flex-col space-y-2">
  <label className="font-medium text-gray-600">Budget Range</label>
  <select
    name="budget_range"
    value={preferences.budget_range || ""}
    onChange={handlePreferencesChange}
    className="border p-2 rounded focus:outline-none focus:border-blue-400 transition duration-200"
  >
    <option value="">Select...</option>
    <option value="under-1000">Under ₱1,000</option>
    <option value="1000-5000">₱1,000 - ₱5,000</option>
    <option value="5000-10000">₱5,000 - ₱10,000</option>
    <option value="10000-20000">₱10,000 - ₱20,000</option>
    <option value="20000-above">₱20,000 and above</option>
  </select>
</div>

<div className="flex flex-col space-y-2">
  <label>Project Type</label>
  <select
    name="project_type"
    value={preferences?.project_type || ""}
    onChange={handlePreferencesChange}
    className="border p-2 rounded"
  >
    <option value="">Select project type</option>
    <option value="Commissioned Art">Commissioned Art</option>
    <option value="Gallery Exhibit">Gallery Exhibit</option>
    <option value="Commercial Project">Commercial Project</option>
    <option value="Personal Project">Personal Project</option>
  </select>
</div>

<div className="flex flex-col space-y-2">
  <label>Project Type Experience</label>
  <input
    name="project_type_experience"
    value={preferences?.project_type_experience || ""}
    onChange={handlePreferencesChange}
    className="border p-2 rounded"
  />
</div>

<div className="flex flex-col space-y-2">
  <label>Preferred Project Duration</label>
  <select
    name="preferred_project_duration"
    value={preferences?.preferred_project_duration || ""}
    onChange={handlePreferencesChange}
    className="border p-2 rounded"
  >
    <option value="">Select project duration</option>
    <option value="Short-Term (Under 1 Month)">Short-Term (Under 1 Month)</option>
    <option value="Medium-Term (1-3 Months)">Medium-Term (1-3 Months)</option>
    <option value="Long-Term (Over 3 Months)">Long-Term (Over 3 Months)</option>
  </select>
</div>

<div className="flex flex-col space-y-2">
  <label>Availability</label>
  <select
    name="availability"
    value={preferences?.availability || ""}
    onChange={handlePreferencesChange}
    className="border p-2 rounded"
  >
    <option value="">Select availability</option>
    <option value="Part-Time">Part-Time</option>
    <option value="Full-Time">Full-Time</option>
    <option value="Freelance">Freelance</option>
  </select>
</div>

<div className="flex flex-col space-y-2">
  <label>Client Type Preference</label>
  <select
    name="client_type_preference"
    value={preferences?.client_type_preference || ""}
    onChange={handlePreferencesChange}
    className="border p-2 rounded"
  >
    <option value="">Select client type</option>
    <option value="Individuals">Individuals</option>
    <option value="Businesses">Businesses</option>
    <option value="Organizations">Organizations</option>
  </select>
</div>

<div className="flex flex-col space-y-2">
  <label>Project Scale</label>
  <select
    name="project_scale"
    value={preferences?.project_scale || ""}
    onChange={handlePreferencesChange}
    className="border p-2 rounded"
  >
    <option value="">Select project scale</option>
    <option value="Small">Small</option>
    <option value="Medium">Medium</option>
    <option value="Large">Large</option>
  </select>
</div>

<div className="flex flex-col space-y-2">
  <label>Portfolio Link</label>
  <input
    name="portfolio_link"
    value={preferences?.portfolio_link || ""}
    onChange={handlePreferencesChange}
    className="border p-2 rounded"
  />
</div>

<div className="flex flex-col space-y-2">
  <label>Preferred Communication</label>
  <div className="flex flex-wrap gap-2">
    {["Email", "Phone", "Video Call", "Messaging App"].map((method) => (
      <button
        type="button"
        key={method}
        onClick={() => togglePreference("preferred_communication", method)}
        className={`px-4 py-2 rounded ${
          preferences?.preferred_communication.includes(method)
            ? "bg-blue-500 text-white"
            : "bg-gray-200"
        }`}
      >
        {method}
      </button>
    ))}
  </div>
</div>

<div className="text-center mt-8">
  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded shadow">
    Save Changes
  </button>
</div>
      </form>
    </div>
  );
};

export default EditArtistProfile;