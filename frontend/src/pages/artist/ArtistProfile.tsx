import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaPalette,
  FaUser,
  FaMapMarkerAlt,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaHeart,
  FaTrash,
  FaShoppingCart,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthProvider";
import Swal from "sweetalert2";
import ClipLoader from "react-spinners/ClipLoader";
import TransactionHistory from '../TransactionHistory'; // Adjust the path as necessary

interface ArtistProfileData {
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
  verification_id?: string | null;
  status?: string;
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

const ArtistProfile: React.FC = () => {
  const [artistProfile, setArtistProfile] = useState<ArtistProfileData | null>(null);
  const [preferences, setPreferences] = useState<ArtistPreferences | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [activeSection, setActiveSection] = useState<"profile" | "preferences" | "address" | "orders" | "wishlist">("profile");
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
        const [profileResponse, preferencesResponse, wishlistResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/artist-profile/${user.id}`),
          axios.get(`${API_BASE_URL}/artist-preferences/${user.id}`),
          axios.get(`${API_BASE_URL}/wishlist/${user.id}`),
        ]);

        setArtistProfile(profileResponse.data);

        const preferencesData = preferencesResponse.data;
        if (preferencesData.preferences === null) {
          setPreferences(null);
        } else {
          setPreferences({
            ...preferencesData,
            art_style_specialization: preferencesData.art_style_specialization || [],
            preferred_medium: preferencesData.preferred_medium || [],
            crafting_techniques: preferencesData.crafting_techniques || [],
            preferred_communication: preferencesData.preferred_communication || [],
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
        console.error("Error fetching artist data:", err);
        setError(err.response?.data?.error || "Failed to fetch artist data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndPreferences();
  }, [user]);

  const handleEditClick = () => {
    navigate("/edit-artist-profile");
  };

  const handleVerificationClick = () => {
    navigate("/artist-verification");
  };

  const handleArtClick = (artId: string) => {
    navigate(`/art/${artId}`);
  };

  const handleDeleteAllWishlist = async () => {
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'Not Logged In',
        text: 'Please log in to manage your wishlist.',
        confirmButtonText: 'OK',
      });
      return;
    }
  
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });
  
    if (result.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/wishlist/${user.id}/all`);
        setWishlist([]);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Your wishlist has been cleared.',
          confirmButtonText: 'OK',
        });
      } catch (err) {
        console.error("Error clearing wishlist:", err);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to clear wishlist. Please try again.',
          confirmButtonText: 'OK',
        });
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <ClipLoader color="#3498db" loading={loading} size={80} />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>);  
  

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  const renderProfile = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">Profile Information</h2>
      {[
        { label: "Bio", value: artistProfile?.bio },
        { label: "First Name", value: artistProfile?.firstname },
        { label: "Last Name", value: artistProfile?.lastname },
        { label: "Gender", value: artistProfile?.gender || "Not specified" },
        { label: "Date Of Birth", value: artistProfile?.date_of_birth || "Not specified" },
        { label: "Email", value: artistProfile?.email },
        { label: "Role", value: artistProfile?.role },
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
          <h2 className="text-lg font-semibold text-gray-700">Artist Preferences</h2>
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
      <h2 className="text-lg font-semibold text-gray-700">Address & Contact</h2>
      {[
        { label: "Address", value: artistProfile?.address || "Not provided" },
        { label: "Contact Number", value: artistProfile?.phone || "Not provided" },
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
              <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
              <p className="text-sm text-gray-600">
                {item.artist ? `${item.artist.firstname} ${item.artist.lastname}` : "Unknown Artist"}
              </p>
              <p className="text-sm font-bold text-orange-600 mt-2">₱{item.price}</p>
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
      <h2 className="text-lg font-semibold text-gray-700">Your Orders</h2>
      <TransactionHistory />
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row">
        <aside className="w-full md:w-64 p-4 bg-white shadow-md rounded-lg mb-6 md:mb-0 md:mr-6">
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
            <h2 className="text-xl font-semibold">
              {artistProfile?.firstname} {artistProfile?.lastname}
            </h2>
            <p className="text-sm text-gray-500">{artistProfile?.email}</p>

            {/* Verification Button */}
            <div className="mt-4">
              {artistProfile?.verification_id ? (
                artistProfile?.status === "pending" ? (
                  <div className="flex items-center justify-center gap-2 text-yellow-600 font-medium">
                    <FaTimesCircle className="text-yellow-600" /> Verification Pending
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                    <FaCheckCircle /> Verified Artist
                  </div>
                )
              ) : (
                <button
                  onClick={handleVerificationClick}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition"
                >
                  <FaTimesCircle className="text-blue-600" /> Get Verified Now
                </button>
              )}
            </div>
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
              <FaUser  /> <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveSection("preferences")}
              className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md ${
                activeSection === "preferences"
                  ? "bg-blue-600 text-white font-semibold"
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

export default ArtistProfile;