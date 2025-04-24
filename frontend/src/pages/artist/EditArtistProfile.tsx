import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { FaPlus, FaUserCircle } from "react-icons/fa";

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
  profile_image: string;
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

const EditArtistProfile: React.FC = () => {
  useEffect(() => {
    document.title = "Edit Profile";
  }, []);

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
    profile_image: "",
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch artist profile
        const profileResponse = await axios.get(
          `${API_BASE_URL}/artist-profile/${user.id}`
        );
        setArtistProfile(profileResponse.data);

        // Fetch artist preferences
        const preferencesResponse = await axios.get(
          `${API_BASE_URL}/artist-preferences/${user.id}`
        );
        setPreferences({
          crafting: preferencesResponse.data?.crafting || "",
          art_style_specialization:
            preferencesResponse.data?.art_style_specialization || [],
          collaboration_type:
            preferencesResponse.data?.collaboration_type || "",
          preferred_medium: preferencesResponse.data?.preferred_medium || [],
          location_preference:
            preferencesResponse.data?.location_preference || "",
          crafting_techniques:
            preferencesResponse.data?.crafting_techniques || [],
          budget_range: preferencesResponse.data?.budget_range || "",
          project_type: preferencesResponse.data?.project_type || "",
          project_type_experience:
            preferencesResponse.data?.project_type_experience || "",
          preferred_project_duration:
            preferencesResponse.data?.preferred_project_duration || "",
          availability: preferencesResponse.data?.availability || "",
          client_type_preference:
            preferencesResponse.data?.client_type_preference || "",
          project_scale: preferencesResponse.data?.project_scale || "",
          portfolio_link: preferencesResponse.data?.portfolio_link || "",
          preferred_communication:
            preferencesResponse.data?.preferred_communication || [],
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
    setArtistProfile((prev) => ({ ...prev, [name]: value }));
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
        `${API_BASE_URL}/upload-profile-image/${user.id}`,
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
      let uploadedImage = artistProfile.profile_image;

      if (imageFile) {
        const newImage = await uploadImage();
        if (newImage) uploadedImage = newImage;
      }

      // Ensure only the filename is sent, not the full CDN URL
      // If no image is uploaded or selected, set uploadedImage as an empty string
      if (!uploadedImage) {
        uploadedImage = "";
      }

      const payload = {
        userId: user.id,
        profile: { ...artistProfile, profile_image: uploadedImage },
        preferences: { ...preferences },
      };

      await axios.put(`${API_BASE_URL}/artist-profile`, payload);
      navigate("/artist-profile");
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
          {imagePreview || artistProfile.profile_image ? (
            <img
              src={imagePreview || `${artistProfile.profile_image}`}
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
              value={artistProfile.firstname}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Last Name</label>
            <input
              name="lastname"
              value={artistProfile.lastname}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Bio</label>
            <textarea
              name="bio"
              value={artistProfile.bio}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Gender</label>
            <select
              name="gender"
              value={artistProfile.gender}
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
              value={artistProfile.date_of_birth}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Address</label>
            <input
              name="address"
              value={artistProfile.address}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={artistProfile.email}
              onChange={handleProfileChange}
              className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="text-gray-700">Phone</label>
            <input
              name="phone"
              value={artistProfile.phone}
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
            {/* Crafting */}
            <div>
              <label className="text-gray-700">Crafting</label>
              <select
                name="crafting"
                value={preferences.crafting}
                onChange={handlePreferencesChange}
                className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
              >
                <option value="">Select...</option>
                <option value="Digital Art & Crafting">
                  Digital Art & Crafting
                </option>
                <option value="Traditional / Physical Art">
                  Traditional / Physical Art
                </option>
                <option value="Mixed Media & Crafts">
                  Mixed Media & Crafts
                </option>
                <option value="Open to All Media">Open to All Media</option>
              </select>
            </div>

            {/* Art Style Specialization */}
            <div>
              <label className="text-gray-700">Art Style Specialization</label>
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
                  "Geometric Patterns",
                  "Pattern-Based Art",
                  "Pop Art",
                  "Urban Style",
                  "Traditional Art (Paintings & Drawings)",
                  "Digital Art & Illustrations",
                  "Sculpture",
                  "3D Art",
                  "Furniture Making",
                  "Woodworking",
                  "Handmade Crafts",
                  "DIY Projects",
                  "Beginner / Exploring Styles",
                  "Others",
                  "Open to All Styles",
                ].map((style) => (
                  <button
                    type="button"
                    key={style}
                    onClick={() =>
                      togglePreference("art_style_specialization", style)
                    }
                    className={`px-4 py-2 rounded-lg border ${
                      preferences.art_style_specialization.includes(style)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "border-gray-300 text-gray-700"
                    } hover:bg-blue-500 hover:text-white`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Collaboration Type */}
            <div>
              <label className="text-gray-700">Collaboration Type</label>
              <select
                name="collaboration_type"
                value={preferences.collaboration_type}
                onChange={handlePreferencesChange}
                className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
              >
                <option value="">Select...</option>
                <option value="Remote">Remote</option>
                <option value="In-Person">In-Person</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {/* Preferred Medium */}
            <div>
              <label className="text-gray-700">Preferred Medium</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  "Pencil & Paper",
                  "Watercolor",
                  "Gouache",
                  "Acrylic Painting",
                  "Oil Painting",
                  "Digital Drawing Tools (Tablet, App)",
                  "Mixed Media / Experimental",
                  "Craft Supplies (Glue, Paper, Scissors)",
                  "Sculpting Materials (Clay, Resin)",
                  "Wood Materials",
                  "Metal Materials",
                  "Fabric & Textiles",
                  "Recycled / Found Objects",
                  "Still Exploring / Beginner",
                  "Flexible / Open to Medium",
                ].map((medium) => (
                  <button
                    type="button"
                    key={medium}
                    onClick={() => togglePreference("preferred_medium", medium)}
                    className={`px-4 py-2 rounded-lg border ${
                      preferences.preferred_medium.includes(medium)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "border-gray-300 text-gray-700"
                    } hover:bg-blue-500 hover:text-white`}
                  >
                    {medium}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Preference */}
            <div>
              <label className="text-gray-700">Location Preference</label>
              <select
                name="location_preference"
                value={preferences.location_preference}
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

            {/* Crafting Techniques */}
            <div>
              <label className="text-gray-700">Crafting Techniques</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  "Drawing",
                  "Sketching",
                  "Painting (Acrylic, Oil, Watercolor)",
                  "Digital Illustration",
                  "Clay Modeling",
                  "Pottery",
                  "Wood Carving",
                  "Wood Crafting",
                  "Sewing",
                  "Embroidery",
                  "Jewelry Making",
                  "DIY Jewelry",
                  "Scrapbooking",
                  "Papercraft",
                  "3D Printing",
                  "3D Modeling",
                  "Metal Forging",
                  "Fabric Weaving",
                  "Recycled Art",
                  "Eco-Friendly Crafting",
                ].map((technique) => (
                  <button
                    type="button"
                    key={technique}
                    onClick={() =>
                      togglePreference("crafting_techniques", technique)
                    }
                    className={`px-4 py-2 rounded-lg border ${
                      preferences.crafting_techniques.includes(technique)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "border-gray-300 text-gray-700"
                    } hover:bg-blue-500 hover:text-white`}
                  >
                    {technique}
                  </button>
                ))}
              </div>
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
                <option value="Under ₱1,000">Under ₱1,000</option>
                <option value="₱1,000 - ₱5,000">₱1,000 - ₱5,000</option>
                <option value="₱5,000 - ₱10,000">₱5,000 - ₱10,000</option>
                <option value="₱10,000 - ₱20,000">₱10,000 - ₱20,000</option>
                <option value="₱20,000 and above">₱20,000 and above</option>
                <option value="Flexible Budget / Open">
                  Flexible Budget / Open
                </option>
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
                <option value="Commissioned Artworks">
                  Commissioned Artworks
                </option>
                <option value="Custom Crafts / Handmade Gifts">
                  Custom Crafts / Handmade Gifts
                </option>
                <option value="Illustration / Concept Design">
                  Illustration / Concept Design
                </option>
                <option value="Branding / Logo Design">
                  Branding / Logo Design
                </option>
                <option value="Gallery / Showcase Pieces">
                  Gallery / Showcase Pieces
                </option>
                <option value="School or Community Projects">
                  School or Community Projects
                </option>
                <option value="Personal Art / Hobby Projects">
                  Personal Art / Hobby Projects
                </option>
                <option value="Collaborative Group Projects">
                  Collaborative Group Projects
                </option>
                <option value="Commercial Projects">Commercial Projects</option>
                <option value="Other / Unlisted">Other / Unlisted</option>
              </select>
            </div>

            {/* Project Type Experience */}
            <div>
              <label className="text-gray-700">Project Type Experience</label>
              <select
                name="project_type_experience"
                value={preferences.project_type_experience}
                onChange={handlePreferencesChange}
                className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
              >
                <option value="">Select...</option>
                <option value="Hobby Art / Personal Projects">
                  Hobby Art / Personal Projects
                </option>
                <option value="Client Work / Commissions">
                  Client Work / Commissions
                </option>
                <option value="Corporate / Brand Projects">
                  Corporate / Brand Projects
                </option>
                <option value="Freelance / Digital Design">
                  Freelance / Digital Design
                </option>
                <option value="Craft Fairs / Handmade Markets">
                  Craft Fairs / Handmade Markets
                </option>
                <option value="Community or School Projects">
                  Community or School Projects
                </option>
                <option value="Gallery or Public Exhibits">
                  Gallery or Public Exhibits
                </option>
                <option value="No Experience Yet / Beginner">
                  No Experience Yet / Beginner
                </option>
                <option value="Open to All Types">Open to All Types</option>
              </select>
            </div>

            {/* Preferred Project Duration */}
            <div>
              <label className="text-gray-700">
                Preferred Project Duration
              </label>
              <select
                name="preferred_project_duration"
                value={preferences.preferred_project_duration}
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

            {/* Availability */}
            <div>
              <label className="text-gray-700">Availability</label>
              <select
                name="availability"
                value={preferences.availability}
                onChange={handlePreferencesChange}
                className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
              >
                <option value="">Select...</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Open to Occasional Projects">
                  Open to Occasional Projects
                </option>
              </select>
            </div>

            {/* Client Type Preference */}
            <div>
              <label className="text-gray-700">Client Type Preference</label>
              <select
                name="client_type_preference"
                value={preferences.client_type_preference}
                onChange={handlePreferencesChange}
                className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
              >
                <option value="">Select...</option>
                <option value="Individual Clients">Individual Clients</option>
                <option value="Small Businesses">Small Businesses</option>
                <option value="Corporate / Organizations">
                  Corporate / Organizations
                </option>
                <option value="Open to All Types">Open to All Types</option>
              </select>
            </div>

            {/* Project Scale */}
            <div>
              <label className="text-gray-700">Project Scale</label>
              <select
                name="project_scale"
                value={preferences.project_scale}
                onChange={handlePreferencesChange}
                className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
              >
                <option value="">Select...</option>
                <option value="Small-scale">Small-scale</option>
                <option value="Medium-scale">Medium-scale</option>
                <option value="Large-scale">Large-scale</option>
              </select>
            </div>

            {/* Portfolio Link */}
            <div>
              <label className="text-gray-700">Portfolio Link</label>
              <input
                type="text"
                name="portfolio_link"
                value={preferences.portfolio_link}
                onChange={handlePreferencesChange}
                className="block w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
                placeholder="Enter your portfolio link"
              />
            </div>

            {/* Preferred Communication */}
            <div>
              <label className="text-gray-700">Preferred Communication</label>
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
                      togglePreference("preferred_communication", method)
                    }
                    className={`px-4 py-2 rounded-lg border ${
                      preferences.preferred_communication.includes(method)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "border-gray-300 text-gray-700"
                    } hover:bg-blue-500 hover:text-white`}
                  >
                    {method}
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
            to="/artist-profile"
            className="w-full md:w-auto px-6 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition duration-200"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EditArtistProfile;
