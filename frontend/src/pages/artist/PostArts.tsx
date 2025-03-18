import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthProvider";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// Interface for Tag
interface Tag {
  id: string;
  name: string;
}

const PostArts: React.FC = () => {
   useEffect(() => {
          document.title = "Upload Arts";
        }, []);
      
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm();
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tags`);
        setTags(response.data);
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    };

    fetchTags();
  }, [API_BASE_URL]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tagId)
        ? prevTags.filter((id) => id !== tagId)
        : [...prevTags, tagId]
    );
  };

  const onSubmit = async (data: any) => {
    if (!user?.id) {
      setError("You must be logged in to upload art.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Ensure the price is a positive number
      const price = parseFloat(data.price);
      if (isNaN(price) || price <= 0) {
        alert("Please enter a valid price.");
        setUploading(false);
        return;
      }

      const quantity = parseFloat(data.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        alert("Please enter a valid quantity.");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("price", price.toFixed(2)); // Ensure the price is formatted correctly
      formData.append("quantity", quantity.toFixed(2)); // Ensure the quantity is formatted correctly
      formData.append("location", data.location);
      formData.append("art_style", data.art_style);
      formData.append("medium", data.medium);
      formData.append("subject", data.subject);
      formData.append("userId", user.id);
      formData.append("tags", JSON.stringify(selectedTags));
      if (imageFile) {
        formData.append("file", imageFile);
      }

      const response = await axios.post(`${API_BASE_URL}/api/upload-art`, formData);

      if (response.status === 201) {
        reset();
        setImageFile(null);
        setImagePreview(null);
        setSelectedTags([]);

        Swal.fire({
          icon: "success",
          title: "Art uploaded successfully!",
          text: "You will be redirected to your arts page.",
        });

        setTimeout(() => navigate("/artist-arts"), 2000);
      } else {
        alert("Failed to post art. Please try again.");
      }
    } catch (err) {
      setError("Failed to upload art. Please try again.");
      console.error("Error uploading art:", err);
      alert("An error occurred while posting the art. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#5C0601] mb-4">Upload New Arts</h1>
        <hr className="border-gray-300 mb-6" />
      </div>

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-lg mx-auto">
        {/* Image Upload */}
        <div className="flex flex-col mb-4">
          <label htmlFor="artImage" className="text-gray-700 font-medium mb-2">
            Upload Art Image
          </label>
          <input
            id="artImage"
            type="file"
            onChange={handleImageChange}
            className="border border-gray-300 rounded-lg p-3"
            accept="image/*"
            required
          />
          {imagePreview && (
            <div className="mt-4">
              <img
                src={imagePreview}
                alt="Art Preview"
                className="w-full h-auto rounded-md shadow-md"
              />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex flex-col mb-4">
          <label htmlFor="title" className="text-gray-700 font-medium mb-2">
            Art Title
          </label>
          <input
            id="title"
            type="text"
            {...register("title", { required: true })}
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Enter art title"
            required
          />
        </div>

        {/* Description */}
        <div className="flex flex-col mb-4">
          <label htmlFor="description" className="text-gray-700 font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            {...register("description", { required: true })}
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Describe your art"
            rows={3}
            required
          />
        </div>

        {/* Price */}
        <div className="flex flex-col mb-4">
          <label htmlFor="price" className="text-gray-700 font-medium mb-2">
            Price
          </label>
          <input
            id="price"
            type="number"
            {...register("price", { required: true })}
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Enter Price (e.g., 10000)"
            required
          />
        </div>

           {/* Quantity */}
        <div className="flex flex-col mb-4">
          <label htmlFor="quantity" className="text-gray-700 font-medium mb-2">
          Quantity
          </label>
          <input
            id="quantity"
            type="number"
            {...register("quantity", { required: true })}
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Enter Quantity"
            required
          />
        </div>

        {/* Location */}
        <div className="flex flex-col mb-4">
          <label htmlFor="location" className="text-gray-700 font-medium mb-2">
            Location
          </label>
          <input
            id="location"
            type="text"
            {...register("location", { required: true })}
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Enter location"
            required
          />
        </div>

        {/* Art Style */}
        <div className="flex flex-col mb-4">
          <label htmlFor="art_style" className="text-gray-700 font-medium mb-2">
            Art Style
          </label>
          <select
            id="art_style"
            {...register("art_style", { required: true })}
            className="border border-gray-300 rounded-lg p-3"
            required
          >
            <option value="">Select art style</option>
            <option value="Abstract">Abstract</option>
            <option value="Realism">Realism</option>
            <option value="Impressionism">Impressionism</option>
            <option value="Pop Art">Pop Art</option>
            <option value="Cubism">Cubism</option>
            <option value="Others">Others...</option>
          </select>
        </div>

        {/* Medium */}
        <div className="flex flex-col mb-4">
          <label htmlFor="medium" className="text-gray-700 font-medium mb-2">
            Medium
          </label>
          <select
            id="medium"
            {...register("medium", { required: true })}
            className="border border-gray-300 rounded-lg p-3"
            required
          >
            <option value="">Select medium</option>
            <option value="Oil">Oil</option>
            <option value="Canvas">Canvas</option>
            <option value="Acrylic">Acrylic</option>
            <option value="Watercolor">Watercolor</option>
            <option value="Wood">Wood</option>
            <option value="Paper">Paper</option>
            <option value="Digital">Digital</option>
            <option value="Charcoal">Charcoal</option>
            <option value="Others">Others...</option>
          </select>
        </div>

        {/* Subject */}
        <div className="flex flex-col mb-4">
          <label htmlFor="subject" className="text-gray-700 font-medium mb-2">
            Subject
          </label>
          <select
            id="subject"
            {...register("subject", { required: true })}
            className="border border-gray-300 rounded-lg p-3"
            required
          >
            <option value="">Select subject</option>
            <option value="Nature">Nature</option>
            <option value="LandScape">LandScape</option>
            <option value="Portrait">Portrait</option>
            <option value="Still Life">Still Life</option>
            <option value="Animals">Animals</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Others">Others...</option>
          </select>
        </div>



        {/* Tags */}
        <div className="flex flex-col mb-4">
          <label className="text-gray-700 font-medium mb-2">Select Tags</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                type="button"
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-4 py-2 rounded-full border ${
                  selectedTags.includes(tag.id)
                    ? "bg-blue-500 text-white border-blue-500"
                    : "border-gray-300 text-gray-700"
                } transition duration-200`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={uploading}
            className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {uploading ? "Uploading..." : "Upload Art"}
          </button>
        </div>
      </form>

      <div className="flex justify-center mt-8">
        <Link
          to="/artist-arts"
          className="text-gray-600 hover:text-blue-600 font-medium transition"
        >
          ← Back to My Arts
        </Link>
      </div>
    </div>
  );
};

export default PostArts;