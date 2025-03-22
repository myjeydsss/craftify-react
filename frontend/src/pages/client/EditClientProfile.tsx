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
  useEffect(() => {
    document.title = "Edit Profile";
  }, []);

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const profileResponse = await axios.get(
          `${API_BASE_URL}/client-profile/${user.id}`
        );
        setClientProfile(profileResponse.data);

        const preferencesResponse = await axios.get(
          `${API_BASE_URL}/client-preferences/${user.id}`
        );

        // Ensure fetched preferences contain arrays instead of undefined
        setPreferences({
          preferred_art_style:
            preferencesResponse.data.preferred_art_style || [],
          project_requirements:
            preferencesResponse.data.project_requirements || "",
          budget_range: preferencesResponse.data.budget_range || "",
          location_requirement:
            preferencesResponse.data.location_requirement || "",
          timeline: preferencesResponse.data.timeline || "",
          artist_experience_level:
            preferencesResponse.data.artist_experience_level || "",
          communication_preferences:
            preferencesResponse.data.communication_preferences || [],
          project_type: preferencesResponse.data.project_type || [],
        });
      } catch (err) {
        console.error("Failed to fetch profile or preferences:", err);
        setError(
          "Failed to load profile or preferences. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleProfileChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setClientProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreferencesChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  const togglePreference = (field: keyof Preferences, value: string) => {
    setPreferences((prev) => {
      const currentValues = Array.isArray(prev[field]) ? prev[field] : [];
      const updatedValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      return { ...prev, [field]: updatedValues };
    });
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
      const response = await axios.post(
        `${API_BASE_URL}/upload-client-profile-image/${user.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

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

      // Ensure only the filename is sent, not the full CDN URL
      if (uploadedImage.startsWith("http")) {
        uploadedImage = uploadedImage.split("/").pop() || uploadedImage;
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
      setError("Failed to save profile. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {error && <div className="text-red-500 text-center mb-4">{error}</div>}
      <form
        onSubmit={handleSave}
        className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8 space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-[#5C0601] mb-4">
            My Profile
          </h2>
          <hr className="border-gray-300 mb-6" />
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
              value={clientProfile.firstname || ""}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Last Name</label>
            <input
              name="lastname"
              value={clientProfile.lastname || ""}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Bio</label>
            <textarea
              name="bio"
              value={clientProfile.bio || ""}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Gender</label>
            <select
              name="gender"
              value={clientProfile.gender || ""}
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
              value={clientProfile.date_of_birth || ""}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Address</label>
            <input
              name="address"
              value={clientProfile.address || ""}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={clientProfile.email || ""}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Phone</label>
            <input
              name="phone"
              value={clientProfile.phone || ""}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Preferences Section */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Preferences
          </h3>
          <div className="space-y-6">
            {/* Preferred Art Style */}
            <div>
              <label className="text-gray-700">Preferred Art Style</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  "Realism",
                  "Portraiture",
                  "Abstract",
                  "Expressionism",
                  "Anime",
                  "Manga",
                  "Cartoon",
                  "Comic Art",
                  "Fantasy",
                  "Sci-Fi",
                  "Nature Art",
                  "Botanical Illustration",
                  "Geometric Art",
                  "Pattern-Based Design",
                  "Pop Art",
                  "Urban Style",
                  "Minimalist",
                  "Modern Art",
                  "Craft & Handmade Art",
                  "Sculpture",
                  "Statues",
                  "Digital Art & Illustrations",
                  "Beginner / Exploring Styles",
                  "Open to All Styles",
                ].map((style) => (
                  <button
                    type="button"
                    key={style}
                    onClick={() =>
                      togglePreference("preferred_art_style", style)
                    }
                    className={`px-4 py-2 rounded-lg border ${
                      preferences.preferred_art_style.includes(style)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "border-gray-300 text-gray-700"
                    } hover:bg-blue-500 hover:text-white`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Requirements */}
            <div>
              <label className="text-gray-700">Project Requirements</label>
              <textarea
                name="project_requirements"
                value={preferences.project_requirements || ""}
                onChange={handlePreferencesChange}
                className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
              />
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
                <option value="under-1000">Under ₱1,000</option>
                <option value="1000-5000">₱1,000 - ₱5,000</option>
                <option value="5000-10000">₱5,000 - ₱10,000</option>
                <option value="10000-20000">₱10,000 - ₱20,000</option>
                <option value="20000-above">₱20,000 and above</option>
                <option value="Flexible Budget / Open">
                  Flexible Budget / Open
                </option>
              </select>
            </div>

            {/* Location Requirement */}
            <div>
              <label className="text-gray-700">Location Requirement</label>
              <select
                name="location_requirement"
                value={preferences.location_requirement}
                onChange={handlePreferencesChange}
                className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
              >
                <option value="">Select...</option>
                <option value="Local Only">Local Only</option>
                <option value="Nationwide / Regional">
                  Nationwide / Regional
                </option>
                <option value="International">International</option>
              </select>
            </div>

            {/* Timeline */}
            <div>
              <label className="text-gray-700">Timeline</label>
              <select
                name="timeline"
                value={preferences.timeline}
                onChange={handlePreferencesChange}
                className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
              >
                <option value="">Select...</option>
                <option value="Short-Term (Under 1 Month)">
                  Short-Term (Under 1 Month)
                </option>
                <option value="Medium-Term (1-3 Months)">
                  Medium-Term (1-3 Months)
                </option>
                <option value="Long-Term (Over 3 Months)">
                  Long-Term (Over 3 Months)
                </option>
              </select>
            </div>

            {/* Artist Experience Level */}
            <div>
              <label className="text-gray-700">Artist Experience Level</label>
              <select
                name="artist_experience_level"
                value={preferences.artist_experience_level}
                onChange={handlePreferencesChange}
                className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
              >
                <option value="">Select...</option>
                <option value="Beginner Friendly">Beginner Friendly</option>
                <option value="Intermediate to Advanced">
                  Intermediate to Advanced
                </option>
                <option value="Open to All Levels">Open to All Levels</option>
              </select>
            </div>

            {/* Communication Preferences */}
            <div>
              <label className="text-gray-700">Communication Preferences</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  "Email",
                  "Phone",
                  "In-app Messaging",
                  "Video Calls",
                  "Open to Any Method",
                ].map((method) => (
                  <button
                    type="button"
                    key={method}
                    onClick={() =>
                      togglePreference("communication_preferences", method)
                    }
                    className={`px-4 py-2 rounded-lg border ${
                      preferences.communication_preferences.includes(method)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "border-gray-300 text-gray-700"
                    } hover:bg-blue-500 hover:text-white`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Type */}
            <div>
              <label className="text-gray-700">Project Type</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  "Commissioned Artworks",
                  "Custom Crafts / Handmade Gifts",
                  "Illustration / Concept Design",
                  "Branding / Logo Design",
                  "Gallery / Showcase Pieces",
                  "School or Community Projects",
                  "Personal Art / Hobby Projects",
                  "Collaborative Group Projects",
                ].map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => togglePreference("project_type", type)}
                    className={`px-4 py-2 rounded-lg border ${
                      preferences.project_type.includes(type)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "border-gray-300 text-gray-700"
                    } hover:bg-blue-500 hover:text-white`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="text-center flex flex-col md:flex-row md:justify-center md:space-x-4">
          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-200 mb-2 md:mb-0"
          >
            Save Changes
          </button>
          <Link
            to="/client-profile"
            className="w-full md:w-auto px-6 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition duration-200"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EditClientProfile;
