import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaPalette,
  FaUser,
  FaMapMarkerAlt,
  FaEdit,
  FaHeart,
  FaTrash,
  FaShoppingCart,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthProvider";
import TransactionHistory from "../TransactionHistory"; // Adjust the path as necessary

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

interface WishlistItem {
  art_id: string;
  title: string;
  image_url: string;
  artist: {
    firstname: string;
    lastname: string;
  };
  price: string;
}

const ClientProfile: React.FC = () => {
  useEffect(() => {
    document.title = "My Profile";
  }, []);

  const [clientProfile, setClientProfile] = useState<ClientProfileData | null>(
    null
  );
  const [preferences, setPreferences] = useState<ClientPreferences | null>(
    null
  );
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [activeSection, setActiveSection] = useState<
    "profile" | "preferences" | "address" | "wishlist" | "orders"
  >("profile");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileAndPreferences = async () => {
      if (!user) {
        setError("User  not logged in.");
        setLoading(false);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL;

      try {
        const [profileResponse, preferencesResponse, wishlistResponse] =
          await Promise.all([
            axios.get(`${API_BASE_URL}/client-profile/${user.id}`),
            axios.get(`${API_BASE_URL}/client-preferences/${user.id}`),
            axios.get(`${API_BASE_URL}/wishlist/${user.id}`),
          ]);

        setClientProfile(profileResponse.data);

        const preferencesData = preferencesResponse.data;
        if (preferencesData.preferences === null) {
          setPreferences(null);
        } else {
          setPreferences({
            ...preferencesData,
            preferred_art_style: preferencesData.preferred_art_style || [],
            communication_preferences:
              preferencesData.communication_preferences || [],
            project_type: preferencesData.project_type || [],
          });
        }

        // Fetch wishlist items
        const wishlistIds = wishlistResponse.data;
        const wishlistItems = await Promise.all(
          wishlistIds.map(async (artId: string) => {
            const artResponse = await axios.get(`${API_BASE_URL}/art/${artId}`);
            return artResponse.data;
          })
        );
        setWishlist(wishlistItems);
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

  const handleArtClick = (artId: string) => {
    navigate(`/art/${artId}`);
  };

  const handleDeleteAllWishlist = async () => {
    if (!user) {
      alert("Please log in to manage your wishlist.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete all items from your wishlist?"
      )
    )
      return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/wishlist/${user.id}/all`
      );
      setWishlist([]);
      alert("Wishlist cleared successfully!");
    } catch (err) {
      console.error("Error clearing wishlist:", err);
      alert("Failed to clear wishlist. Please try again.");
    }
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
      <h2 className="text-lg font-semibold text-gray-700">
        Profile Information
      </h2>
      {[
        { label: "Bio", value: clientProfile?.bio || "Not provided" },
        { label: "First Name", value: clientProfile?.firstname },
        { label: "Last Name", value: clientProfile?.lastname },
        { label: "Gender", value: clientProfile?.gender || "Not specified" },
        {
          label: "Date Of Birth",
          value: clientProfile?.date_of_birth || "Not specified",
        },
        { label: "Email", value: clientProfile?.email },
        { label: "Role", value: clientProfile?.role },
      ].map(({ label, value }) => (
        <div key={label} className="flex justify-between border-b pb-2">
          <span className="font-medium text-gray-600">{label}:</span>
          <span className="text-gray-700">{value}</span>
        </div>
      ))}

      <div className="mt-4 text-right">
        <button
          onClick={handleEditClick}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        >
          <FaEdit className="inline mr-2" /> Edit Profile
        </button>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">
        Client Preferences
      </h2>
      {preferences ? (
        Object.entries(preferences).map(([key, value]) =>
          Array.isArray(value) ? (
            <div key={key} className="border-b pb-2">
              <h3 className="font-medium text-gray-600 mb-1 capitalize">
                {key.replace(/_/g, " ")}:
              </h3>
              {value.length ? (
                <div className="flex flex-wrap gap-2">
                  {value.map((item) => (
                    <span
                      key={item}
                      className="bg-gray-200 px-3 py-1 rounded-full text-sm"
                    >
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
              <span className="font-medium text-gray-600 capitalize">
                {key.replace(/_/g, " ")}:
              </span>
              <span className="text-gray-700">{value || "Not specified"}</span>
            </div>
          )
        )
      ) : (
        <p className="text-gray-700">
          You haven't set up your preferences yet.
        </p>
      )}
      <div className="mt-4 text-right">
        <button
          onClick={handleEditClick}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        >
          <FaEdit className="inline mr-2" /> Edit Preferences
        </button>
      </div>
    </div>
  );

  const renderAddress = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">Address & Contact</h2>
      {[
        { label: "Address", value: clientProfile?.address || "Not provided" },
        {
          label: "Contact Number",
          value: clientProfile?.phone || "Not provided",
        },
      ].map(({ label, value }) => (
        <div key={label} className="flex justify-between border-b pb-2">
          <span className="font-medium text-gray-600">{label}:</span>
          <span className="text-gray-700">{value}</span>
        </div>
      ))}

      <div className="mt-4 text-right">
        <button
          onClick={handleEditClick}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        >
          <FaEdit className="inline mr-2" /> Edit Address & Contact
        </button>
      </div>
    </div>
  );

  const renderWishlist = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Wishlist</h2>
        {wishlist.length > 0 && (
          <button
            onClick={handleDeleteAllWishlist}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <FaTrash className="mr-2" /> Delete All
          </button>
        )}
      </div>
      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map((item) => (
            <div
              key={item.art_id}
              className="bg-white border rounded-lg shadow hover:shadow-md transition p-4 cursor-pointer"
              onClick={() => handleArtClick(item.art_id)}
            >
              <img
                src={item.image_url || "https://via.placeholder.com/150"}
                alt={item.title}
                className="w-full h-48 object-cover rounded-md mb-2"
              />
              <h3 className="text-lg font-semibold text-gray-800">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600">
                {item.artist
                  ? `${item.artist.firstname} ${item.artist.lastname}`
                  : "Unknown Artist"}
              </p>
              <p className="text-sm font-bold text-orange-600 mt-2">
                ₱{item.price}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-700">Your wishlist is currently empty.</p>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      <TransactionHistory />
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar Section */}
        <aside className="w-full md:w-64 p-4 bg-white shadow-md rounded-lg mb-6 md:mb-0 md:mr-6">
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
            <h2 className="text-xl font-semibold text-center">
              {clientProfile?.firstname} {clientProfile?.lastname}
            </h2>
            <p className="text-sm text-gray-500">{clientProfile?.email}</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-4">
            <button
              onClick={() => setActiveSection("profile")}
              className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md ${
                activeSection === "profile"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaUser /> <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveSection("preferences")}
              className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md ${
                activeSection === "preferences"
                  ? "bg-blue- 600 text-white font-semibold"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaPalette /> <span>Preferences</span>
            </button>
            <button
              onClick={() => setActiveSection("address")}
              className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md ${
                activeSection === "address"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaMapMarkerAlt /> <span>Address & Contact</span>
            </button>
            <button
              onClick={() => setActiveSection("orders")}
              className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md ${
                activeSection === "orders"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaShoppingCart /> <span>Orders</span>
            </button>
            <button
              onClick={() => setActiveSection("wishlist")}
              className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md ${
                activeSection === "wishlist"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaHeart /> <span>Wishlist</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Section */}
        <main className="flex-1 p-6 bg-white shadow-lg rounded-lg">
          {activeSection === "profile"
            ? renderProfile()
            : activeSection === "preferences"
            ? renderPreferences()
            : activeSection === "address"
            ? renderAddress()
            : activeSection === "orders"
            ? renderOrders()
            : renderWishlist()}
        </main>
      </div>
    </div>
  );
};

export default ClientProfile;
