import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaEye } from "react-icons/fa";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate } from "react-router-dom";

// Interfaces for Art and Artist
interface Artist {
  artist_id: string;
  firstname: string;
  lastname: string;
}

interface Art {
  art_id: number;
  artist: Artist | null;
  title: string;
  description: string;
  price: number | null;
  location: string;
  image_url: string;
  art_style: string;
  medium: string;
  subject: string;
  tags: string[]; // Array of tag names
  created_at: string;
  updated_at: string;
}

const ArtsTable: React.FC = () => {
  const [arts, setArts] = useState<Art[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [artsPerPage] = useState(10);
  const [selectedArt, setSelectedArt] = useState<Art | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const modalRef = useRef<HTMLDivElement | null>(null);

  const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchArts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/arts`);
        setArts(response.data || []);
      } catch (error) {
        console.error("Error fetching arts:", error);
        Swal.fire("Error", "Failed to load arts.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchArts();
  }, [user, navigate, API_BASE_URL]);

  const filteredArts = arts.filter((art) => {
    const search = searchTerm.toLowerCase();
    return (
      art.title.toLowerCase().includes(search) ||
      art.description.toLowerCase().includes(search) ||
      art.location.toLowerCase().includes(search) ||
      (art.artist &&
        `${art.artist.firstname} ${art.artist.lastname}`
          .toLowerCase()
          .includes(search))
    );
  });

  const indexOfLastArt = currentPage * artsPerPage;
  const indexOfFirstArt = indexOfLastArt - artsPerPage;
  const currentArts = filteredArts.slice(indexOfFirstArt, indexOfLastArt);
  const totalPages = Math.ceil(filteredArts.length / artsPerPage);

  const handleViewArt = (art: Art) => {
    setSelectedArt(art);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedArt(null);
    setIsModalOpen(false);
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      closeModal();
    }
  };

  const handlePagination = (direction: string) => {
    if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-2xl font-bold mb-6">Arts Management</h1>

      {/* Search Bar */}
      <div className="mb-6 flex justify-between">
        <input
          type="text"
          placeholder="Search by title, description, location, or artist name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 text-gray-900 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
            <tr>
              <th className="px-6 py-3 text-center">Artist Name</th>
              <th className="px-6 py-3 text-center">Title</th>
              <th className="px-6 py-3 text-center">Description</th>
              <th className="px-6 py-3 text-center">Price</th>
              <th className="px-6 py-3 text-center">Location</th>
              <th className="px-6 py-3 text-center">Date Created</th>
              <th className="px-6 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentArts.map((art) => (
              <tr key={art.art_id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-center">
                  {art.artist
                    ? `${art.artist.firstname} ${art.artist.lastname}`
                    : "Unknown Artist"}
                </td>
                <td className="px-6 py-4 text-center">{art.title}</td>
                <td className="px-6 py-4 text-center">{art.description}</td>
                <td className="px-6 py-4 text-center">
                  {art.price ? `₱${art.price.toLocaleString()}` : "N/A"}
                </td>
                <td className="px-6 py-4 text-center">{art.location}</td>
                <td className="px-6 py-4 text-center">
                  {new Date(art.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleViewArt(art)}
                    className="text-black hover:text-gray-800"
                  >
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4">
          <span className="text-sm">
            Showing {indexOfFirstArt + 1} to{" "}
            {Math.min(indexOfLastArt, filteredArts.length)} of{" "}
            {filteredArts.length} entries
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePagination("prev")}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              &lt;
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePagination("next")}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Art Modal */}
      {isModalOpen && selectedArt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleOutsideClick}
        >
          <div
            ref={modalRef}
            className="bg-white p-8 rounded-lg w-full max-w-4xl shadow-lg relative overflow-y-auto max-h-[90vh]"
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>

            {/* Modal Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Section */}
              <div className="flex justify-center items-center">
                <img
                  src={selectedArt.image_url}
                  alt={selectedArt.title}
                  className="w-full h-auto max-h-[600px] object-contain rounded-lg shadow-md"
                />
              </div>

              {/* Details Section */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-center text-gray-800">
                  {selectedArt.title}
                </h2>
                <p className="text-gray-600 text-center">
                  {selectedArt.description}
                </p>

                <div className="space-y-2">
                  <p className="text-gray-800">
                    <strong>Artist:</strong>{" "}
                    {selectedArt.artist
                      ? `${selectedArt.artist.firstname} ${selectedArt.artist.lastname}`
                      : "Unknown Artist"}
                  </p>
                  <p className="text-gray-800">
                    <strong>Location:</strong> {selectedArt.location}
                  </p>
                  <p className="text-gray-800">
                    <strong>Price:</strong>{" "}
                    {selectedArt.price
                      ? `₱${selectedArt.price.toLocaleString()}`
                      : "N/A"}
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
                  <div className="space-y-2">
                    <p className="text-gray-800 font-bold">Tags:</p>
                    {selectedArt.tags && selectedArt.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedArt.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 italic">No tags specified.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtsTable;