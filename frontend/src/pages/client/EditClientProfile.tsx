import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { FaPlus, FaUserCircle } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface ClientProfile {
  firstname: string;
  lastname: string;
  bio: string;
  gender: string;
  date_of_birth: string;
  address: string;
  email: string;
  phone: string;
  profile_image: string;
}

interface Preferences {
    preferred_art_style: string[];
    project_requirements: string;
    budget_range: string;
    location_requirement: string;
    timeline: string;
    artist_experience_level: string;
    communication_preferences: string[];
    project_type: string[];
}

const EditClientProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clientProfile, setClientProfile] = useState<ClientProfile>({
    firstname: "",
    lastname: "",
    bio: "",
    gender: "",
    date_of_birth: "",
    address: "",
    email: "",
    phone: "",
    profile_image: "",
  });

  const [preferences, setPreferences] = useState<Preferences>({
    preferred_art_style: [],
    project_requirements: "",
    budget_range: "",
    location_requirement: "",
    timeline: "",
    artist_experience_level: "",
    communication_preferences: [],
    project_type: [],
  });

  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const profileResponse = await axios.get(`${API_BASE_URL}/client-profile/${user.id}`);
        const preferencesResponse = await axios.get(`${API_BASE_URL}/client-preferences/${user.id}`);

        setClientProfile(profileResponse.data);
        setPreferences(preferencesResponse.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setClientProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreferencesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!imageFile || !user) return null;

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload-profile-image/${user.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data.fileName || null;
    } catch (error) {
      console.error("Image upload failed:", error);
      return null;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setLoading(true);

    try {
      let uploadedImage = clientProfile.profile_image;
      if (imageFile) {
        const newImage = await uploadImage();
        if (newImage) uploadedImage = newImage;
      }

      const payload = {
        userId: user.id,
        profile: { ...clientProfile, profile_image: uploadedImage },
        preferences: { ...preferences },
      };

      await axios.put(`${API_BASE_URL}/client-profile`, payload);
      navigate("/client-profile");
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <form
      onSubmit={handleSave}
      className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8 space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-gray-800">
          My Profile
        </h2>
      </div>

      {/* Profile Picture Upload Section */}
      <div className="relative mx-auto w-40 h-40">
        {imagePreview || clientProfile.profile_image ? (
          <img
            src={imagePreview || `${clientProfile.profile_image}`}
            alt="Profile"
            className="rounded-full w-full h-full object-cover border-4 border-gray-200 shadow"
          />
        ) : (
          <div className="flex items-center justify-center bg-gray-100 rounded-full w-full h-full border-4 border-gray-200 shadow">
            <FaUserCircle className="text-gray-300 w-24 h-24" />
          </div>
        )}
        <label
          htmlFor="image-upload"
          className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-2 shadow cursor-pointer hover:bg-blue-700"
        >
          <FaPlus />
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>
  
        {/* Profile Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-gray-700">First Name</label>
            <input
              name="firstname"
              value={clientProfile.firstname}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Last Name</label>
            <input
              name="lastname"
              value={clientProfile.lastname}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Bio</label>
            <textarea
              name="bio"
              value={clientProfile.bio}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Gender</label>
            <select
              name="gender"
              value={clientProfile.gender}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-gray-700">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={clientProfile.date_of_birth}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Address</label>
            <input
              name="address"
              value={clientProfile.address}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={clientProfile.email}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Phone</label>
            <input
              name="phone"
              value={clientProfile.phone}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
        </div>
  
   {/* Preferences Section */}
<div>
  <h3 className="text-2xl font-semibold text-gray-800 mb-4">Preferences</h3>
  <div className="space-y-6">
    {/* Preferred Art Style */}
    <div>
      <label className="text-gray-700">Preferred Art Style</label>
      <select
        name="Preferred_art_style"
        value={preferences.preferred_art_style}
        onChange={handlePreferencesChange}
        className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
      >
        <option value="">Select...</option>
        <option value="Realistic Art / Portraits">Realistic Art / Portraits</option>
        <option value="Digital Art & Illustrations">Digital Art & Illustrations</option>
        <option value="Sculptures & Statues">Sculptures & Statues</option>
        <option value="Nature & Landscapes">Nature & Landscapes</option>
        <option value="Nature & Landscapes">Craft & Handmade Art</option>
        <option value="Nature & Landscapes">Portraits & People</option>
        <option value="Nature & Landscapes">Minimalist & Modern</option>
        <option value="Nature & Landscapes">Flexible / Open to All Style</option>
        <option value="Nature & Landscapes">Abstract & Conceptual</option>
      </select>
    </div>

    {/* Project Requirements */}
    <div>
      <label className="text-gray-700">Project Requirements </label>
        <textarea
            name="project_requirements"
            value={preferences.project_requirements}
            onChange={handlePreferencesChange}
            className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300" />
    </div>

    {/* Budget Range */}
    <div>
      <label className="text-gray-700">Budget Range</label>
      <select
        name="budget_range"
        value={preferences.budget_range}
        onChange={handlePreferencesChange}
        className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
      >
        <option value="">Select...</option>
        <option value="1-500">₱1 - ₱500</option>
        <option value="500-1000">₱500 - ₱1000</option>
        <option value="1000+">₱1,000+</option>
      </select>
    </div>

    {/* Location Requirement */}
    <div>
      <label className="text-gray-700">Location Requirement</label>
      <select
        name="location_preference"
        value={preferences.location_requirement}
        onChange={handlePreferencesChange}
        className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
      >
        <option value="">Select...</option>
        <option value="Local">Local</option>
        <option value="Regional">Regional</option>
        <option value="Global">Global</option>
      </select>
    </div>

        {/* Timeline */}
        <div>
      <label className="text-gray-700"> Timeline </label>
      <select
        name="timeline"
        value={preferences.timeline}
        onChange={handlePreferencesChange}
        className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
      >
        <option value="">Select...</option>
        <option value="medium-term">Medium-Term (1-3 Months)</option>
        <option value="short-term">Short-Term (1-2 Weeks)</option>
        <option value="long-term">Long-Term (6-12 Months)</option>
      </select>
    </div>

        {/* Artist Experience Level */}
        <div>
      <label className="text-gray-700"> Artist Experience Level </label>
      <select
        name="artist_experience_level"
        value={preferences.artist_experience_level}
        onChange={handlePreferencesChange}
        className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
      >
        <option value="">Select...</option>
        <option value="open-to-all">Open to All</option>
        <option value="beginner-friendly">Beginner Friendly</option>
      </select>
    </div>

    {/* Communication Preferences */}
    <div>
      <label className="text-gray-700">Communication Preferences</label>
      <select
        name="communication_preferences"
        value={preferences.communication_preferences}
        onChange={handlePreferencesChange}
        className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
      >
        <option value="">Select...</option>
        <option value="In-app Messaging">In-app Messaging</option>
        <option value="Flexible Communication">Flexible Communication</option>
      </select>
    </div>

    {/* Project Type */}
    <div>
      <label className="text-gray-700">Project Type</label>
      <select
        name="project_type"
        value={preferences.project_type}
        onChange={handlePreferencesChange}
        className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
      >
        <option value="">Select...</option>
        <option value="Personal">Personal</option>
        <option value="Corporate">Corporate</option>
        <option value="Public Display">Public Display</option>
        <option value="Gift">Gift</option>
      </select>
    </div>
  </div>
</div>
  
        {/* Save Button */}
        <div className="text-center">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-200"
          >
            Save Changes
          </button>
          <Link
    to="/artist-profile"
    className="px-6 py-2 ml-4 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition duration-200"
  >
    Cancel
  </Link>
        </div>
      </form>
    </div>
  );
};

export default EditClientProfile;