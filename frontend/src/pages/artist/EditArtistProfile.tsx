import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

const EditArtistProfile: React.FC = () => {
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch artist profile
  useEffect(() => {
    const fetchArtistProfile = async () => {
      setLoading(true);
      setError(null);

      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/artist-profile/${userId}`);
        const data = response.data;
        const sanitizedData = {
          firstname: data.firstname || "",
          lastname: data.lastname || "",
          bio: data.bio || "",
          gender: data.gender || "",
          date_of_birth: data.date_of_birth || "",
          address: data.address || "",
          email: data.email || "",
          phone: data.phone || "",
        };
        setArtistProfile(sanitizedData);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch artist profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchArtistProfile();
  }, []);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setArtistProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  // Save updated artist details
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Clear previous errors

    const userId = localStorage.getItem("userId");

    if (!userId) {
      setError("User not logged in.");
      setLoading(false);
      return;
    }

    const payload = {
      userId,
      firstname: artistProfile.firstname,
      lastname: artistProfile.lastname,
      bio: artistProfile.bio,
      gender: artistProfile.gender,
      date_of_birth: artistProfile.date_of_birth,
      address: artistProfile.address,
      email: artistProfile.email,
      phone: artistProfile.phone,
    };

    try {
      const response = await axios.put(`${API_BASE_URL}/artist-profile`, payload);

      if (response.status === 200) {
        navigate("/artist-profile"); // Redirect to the profile page on success
      } else {
        setError("Unexpected error occurred. Please try again.");
      }
    } catch (err: any) {
      const backendError = err.response?.data?.error || "Failed to update profile.";
      setError(backendError);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500 text-lg">Loading profile...</div>
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Edit Artist Profile</h2>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-6 space-y-4">
        <div className="flex flex-col space-y-2">
          <label className="font-medium text-gray-600">First Name</label>
          <input
            type="text"
            name="firstname"
            value={artistProfile.firstname}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:border-blue-400 transition duration-200"
            placeholder="Enter your first name"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label className="font-medium text-gray-600">Last Name</label>
          <input
            type="text"
            name="lastname"
            value={artistProfile.lastname}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:border-blue-400 transition duration-200"
            placeholder="Enter your last name"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label className="font-medium text-gray-600">Bio</label>
          <textarea
            name="bio"
            value={artistProfile.bio}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:border-blue-400 transition duration-200"
            rows={3}
            placeholder="Tell us about yourself"
          ></textarea>
        </div>
        <div className="flex flex-col space-y-2">
          <label className="font-medium text-gray-600">Gender</label>
          <select
            name="gender"
            value={artistProfile.gender}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:border-blue-400 transition duration-200"
          >
            <option value="">Select your gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="flex flex-col space-y-2">
          <label className="font-medium text-gray-600">Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            value={artistProfile.date_of_birth}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:border-blue-400 transition duration-200"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label className="font-medium text-gray-600">Address</label>
          <input
            type="text"
            name="address"
            value={artistProfile.address}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:border-blue-400 transition duration-200"
            placeholder="Enter your address"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label className="font-medium text-gray-600">Email</label>
          <input
            type="email"
            name="email"
            value={artistProfile.email}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:border-blue-400 transition duration-200"
            placeholder="Enter your email"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label className="font-medium text-gray-600">Phone</label>
          <input
            type="text"
            name="phone"
            value={artistProfile.phone}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:border-blue-400 transition duration-200"
            placeholder="Enter your phone number"
          />
        </div>
        <div className="text-center">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditArtistProfile;