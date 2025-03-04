import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import Modal from "../../components/Modal";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";

interface Art {
  art_id: number;
  user_id: string;
  title: string;
  description: string;
  price: number | null;
  quantity: number | null;
  location: string;
  image_url: string;
  art_style: string;
  medium: string;
  subject: string;
  tags: string[];
}

const MyArts: React.FC = () => {
  const [arts, setArts] = useState<Art[]>([]);
  const [selectedArt, setSelectedArt] = useState<Art | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6; // Number of items per page

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      if (!user) {
        setError("User  not logged in.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/arts/${user.id}`);
        setArts(response.data);
      } catch (err: any) {
        console.error("Error fetching arts:", err);
        setError("Failed to fetch arts. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleArtClick = (art: Art) => {
    setSelectedArt(art);
    setShowModal(true);
  };

  const handleEdit = (artId: number) => {
    navigate(`/edit-art/${artId}`);
  };

  // Pagination logic
  const totalPages = Math.ceil(arts.length / itemsPerPage);
  const paginatedArts = arts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <ClipLoader color="#3498db" loading={loading} size={80} />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  );

  if (error) {
    return <div className="text-center text-red-500 mt-12">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#5C0601] mb-4">Uploaded Arts</h1>
        <hr className="border-gray-300 mb-6" />
      </div>

      {/* Arts Display Container */}
      <div className="grid grid-cols-1 py-4 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {paginatedArts.map((art) => (
          <div
            key={art.art_id}
            className="bg-white shadow-lg rounded-lg overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-2xl"
            onClick={() => handleArtClick(art)}
          >
            <img
              src={art.image_url}
              alt={art.title}
              className="w-full h-64 object-cover rounded-t-lg"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{art.title}</h3>
              <p className="text-gray-600 mb-2">{art.description}</p>
              <p className="text-gray-500 mb-2">{art.location}</p>
              <p className="text-gray-900 font-bold text-lg">
                {art.price ? `₱${art.price.toLocaleString ()}` : "Price not available"}
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <strong>Quantity:</strong> {art.quantity}
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <strong>Art Style:</strong> {art.art_style}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Medium:</strong> {art.medium}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Subject:</strong> {art.subject}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {art.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center py-4 mt-4">
        <p className="text-gray-600">
          Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
          {Math.min(currentPage * itemsPerPage, arts.length)} of {arts.length} items
        </p>
        <div className="flex items-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border ${
                currentPage === i + 1 ? "bg-gray-300" : "bg-white"
              } rounded-md`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-12">
        <Link
          to="/artist-post-arts"
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 transition duration-300"
        >
          Upload Your Art
        </Link>
      </div>

      {selectedArt && (
        <Modal show={showModal} onClose={() => setShowModal(false)}>
          <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            {/* Image Section */}
            <div className="w-full h-[900px] overflow-hidden">
              <img
                src={selectedArt.image_url}
                alt={selectedArt.title}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Details Section */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-center">{selectedArt.title}</h2>
              <p className="text-gray-600 text-center">{selectedArt.description}</p>

              <div className="space-y-2">
                <p className="text-gray-800">
                  <strong>Location:</strong> {selectedArt.location}
                </p>
                <p className="text-gray-800">
                  <strong>Price:</strong>{" "}
                  {selectedArt.price ? `₱${selectedArt.price.toLocaleString()}` : "N/A"}
                </p>
                <p className="text-gray-800">
                  <strong>Quantity:</strong> {selectedArt.quantity}
                </p>
                <p className="text-gray-800">
                  <strong>Art Style:</strong> {selectedArt.art_style}
                </p>
                <p className="text-gray-800">
                  <strong>Medium:</strong> {selectedArt.medium}
                </p>
                <p className="text-gray-800">
                  <strong>Subject:</strong> {selectedArt.subject}
                </p>
              </div>

              {/* Tags Section */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {selectedArt.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-orange-100 text-orange-700 text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => handleEdit(selectedArt.art_id)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 transition duration-300"
              >
                Edit Your Art
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyArts;