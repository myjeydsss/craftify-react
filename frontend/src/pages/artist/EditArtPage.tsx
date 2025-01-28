import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthProvider";
import axios from "axios";
import Swal from "sweetalert2";

// Interface for Tag and Art
interface Tag {
  id: string;
  name: string;
}

interface Art {
  art_id: string;
  title: string;
  description: string;
  price: number | null;
  location: string;
  image_url: string;
  art_style: string;
  medium: string;
  subject: string;
  tags: Tag[];
}

// Constants for dropdown options
const ART_STYLES = ["Abstract", "Realism", "Impressionism", "Pop Art", "Cubism"];
const MEDIUMS = ["Oil", "Canvas", "Acrylic", "Watercolor", "Digital", "Charcoal"];
const SUBJECTS = ["Landscape", "Portrait", "Still Life", "Animals", "Fantasy"];

const EditArtPage: React.FC = () => {
  const { artId } = useParams<{ artId: string }>();
  const { user } = useAuth();
  const { register, handleSubmit, setValue } = useForm<Art>();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchArtDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const artResponse = await axios.get(`${API_BASE_URL}/api/art/${artId}`);
        const artData = artResponse.data;

        // Populate form fields with existing art data
        setValue("title", artData.title);
        setValue("description", artData.description);
        setValue("price", artData.price);
        setValue("location", artData.location);
        setValue("art_style", artData.art_style);
        setValue("medium", artData.medium);
        setValue("subject", artData.subject);

        // Initialize selected tags as an array of tag IDs
        const tagIds = artData.tags.map((tag: Tag) => tag.id.toString());
        setSelectedTags(tagIds);

        setImagePreview(artData.image_url);

        // Fetch all available tags
        const tagsResponse = await axios.get(`${API_BASE_URL}/api/tags`);
        setTags(tagsResponse.data);
      } catch (err: any) {
        console.error("Error fetching art details:", err);
        setError(err.message || "Failed to fetch art details.");
      } finally {
        setLoading(false);
      }
    };

    fetchArtDetails();
  }, [artId, setValue]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tagId)
        ? prevTags.filter((id) => id !== tagId)
        : [...prevTags, tagId]
    );
  };

  const onSubmit = async (data: Art) => {
    if (!user) {
      setError("User not logged in.");
      return;
    }

    setError(null);

    try {
      const formData = {
        title: data.title,
        description: data.description,
        price: data.price,
        location: data.location,
        art_style: data.art_style,
        medium: data.medium,
        subject: data.subject,
        tags: JSON.stringify(selectedTags), // Ensure tags are stringified correctly
      };

      const confirmSave = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to save these changes?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, save it!",
      });

      if (!confirmSave.isConfirmed) return;

      await axios.put(`${API_BASE_URL}/api/arts/${artId}`, formData);

      Swal.fire({
        icon: "success",
        title: "Art updated successfully!",
        text: "Your changes have been saved.",
      });

      navigate("/artist-arts");
    } catch (err) {
      console.error("Error updating art:", err);
      Swal.fire({
        icon: "error",
        title: "Failed to update art.",
        text: "An error occurred while saving changes.",
      });
    }
  };

  const onDelete = async () => {
    if (!user) {
      setError("User not logged in.");
      return;
    }

    try {
      const confirmDelete = await Swal.fire({
        title: "Are you sure?",
        text: "This action cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (!confirmDelete.isConfirmed) return;

      await axios.delete(`${API_BASE_URL}/api/arts/${artId}`);
      Swal.fire({
        icon: "success",
        title: "Art deleted!",
        text: "The art has been removed successfully.",
      });

      navigate("/artist-arts");
    } catch (err) {
      console.error("Error deleting art:", err);
      Swal.fire({
        icon: "error",
        title: "Failed to delete art.",
        text: "An error occurred while deleting the art.",
      });
    }
  };

  if (loading) {
    return <div className="text-center mt-12">Loading art details...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-12">{error}</div>;
  }

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold mb-8 text-center text-gray-800">Edit Art</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-lg mx-auto">
        {/* Display Current Art Image */}
        <div className="flex flex-col mb-4">
          <label className="text-gray-700 font-medium mb-2">Current Art Image</label>
          {imagePreview && (
            <div>
              <img
                src={imagePreview}
                alt="Art Preview"
                className="w-full h-auto rounded-md shadow-md"
              />
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="text-gray-700 font-medium">
              Art Title
            </label>
            <input
              id="title"
              type="text"
              {...register("title", { required: true })}
              className="border border-gray-300 rounded-lg p-3 w-full"
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
            placeholder="Enter price (e.g., 10000)"
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
            {ART_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
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
            {MEDIUMS.map((medium) => (
              <option key={medium} value={medium}>
                {medium}
              </option>
            ))}
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
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

          {/* Tags */}
          <div>
            <label className="text-gray-700 font-medium">Select Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => toggleTag(tag.id.toString())}
                  className={`px-4 py-2 rounded-full border ${
                    selectedTags.includes(tag.id.toString())
                      ? "bg-blue-500 text-white border-blue-500"
                      : "border-gray-300 text-gray-700"
                  } transition duration-200`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditArtPage;