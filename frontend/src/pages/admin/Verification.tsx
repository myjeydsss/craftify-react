import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaEye } from "react-icons/fa";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate } from "react-router-dom";

// Interface for Artist Verification
interface ArtistVerification {
  verification_id: string;
  user_id: string;
  status: string;
  created_at: string;
  document_url: string;
  valid_id: string;
  artist?: {
    firstname: string;
    lastname: string;
    role: string;
  } | null; // Allow artist to be null
}

const Verification: React.FC = () => {
  const [verifications, setVerifications] = useState<ArtistVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVerification, setSelectedVerification] = useState<ArtistVerification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchVerifications = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/artist-verifications`);
        setVerifications(response.data || []);
      } catch (error) {
        console.error('Error fetching verifications:', error);
        Swal.fire("Error", "Failed to load verifications.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchVerifications();
  }, [user, navigate, API_BASE_URL]);

  const filteredVerifications = verifications.filter((verification) => {
    const search = searchTerm.toLowerCase();
    return (
      verification.artist &&
      (`${verification.artist.firstname} ${verification.artist.lastname}`.toLowerCase().includes(search) ||
      verification.status.toLowerCase().includes(search))
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVerifications = filteredVerifications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVerifications.length / itemsPerPage);

  const handleView = (verification: ArtistVerification) => {
    setSelectedVerification(verification);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedVerification(null);
    setIsModalOpen(false);
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setIsImageModalOpen(false);
  };

  const handleApprove = async (verificationId: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/artist-verification/${verificationId}/approved`);
      if (response.status === 200) {
        Swal.fire('Success', 'The verification has been approved.', 'success');
        setVerifications(verifications.map((v) =>
          v.verification_id === verificationId ? { ...v, status: 'approved' } : v
        ));
        closeModal();
      } else {
        Swal.fire('Error', 'Failed to approve the verification.', 'error');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      Swal.fire('Error', 'An unexpected error occurred.', 'error');
    }
  };

  const handleReject = async (verificationId: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/artist-verification/${verificationId}/rejected`);
      if (response.status === 200) {
        Swal.fire('Success', 'The verification has been rejected.', 'success');
        setVerifications(verifications.map((v) =>
          v.verification_id === verificationId ? { ...v, status: 'rejected' } : v
        ));
        closeModal();
      } else {
        Swal.fire('Error', 'Failed to reject the verification.', 'error');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      Swal.fire('Error', 'An unexpected error occurred.', 'error');
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
    <div className="container mx-auto px-4 py-16">

    {/* Header Section */}
    <div className="text-center mb-8">
             <h1 className="text-4xl font-bold text-[#5C0601] mb-4">Verification Management</h1>
             <hr className="border-gray-300 mb-6" />
           </div>

      {/* Search Bar */}
      <div className="mb-6 flex justify-between">
        <input
          type="text"
          placeholder="Search by artist name or status"
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
              <th className="px-6 py-3 text-center">Role</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 text-center">Submitted (Created At)</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentVerifications.map((verification) => (
              <tr key={verification.verification_id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-center">
                  {verification.artist ? `${verification.artist.firstname} ${verification.artist.lastname}` : 'Unknown Artist'}
                </td>
                <td className="px-6 py-4 text-center">
                  {verification.artist ? verification.artist.role : 'N/A'}
                </td>
                <td className="px-6 py-4 text-center">{verification.status}</td>
                <td className="px-6 py-4 text-center">{new Date(verification.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => handleView(verification)} className="text-black hover:text-gray-800">
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
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredVerifications.length)} of{" "}
            {filteredVerifications.length} entries
          </span>
          <div className="flex items-center space-x-2">
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
              className="px-3 py-1 bg -gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && selectedVerification && (
        <div 
          ref={modalRef} 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70" 
          onClick={closeModal} 
          onKeyDown={(e) => e.key === 'Escape' && closeModal()} 
          tabIndex={0}
        >
          <div 
            className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Verification Details</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-800">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <div className="mb-4">
                  <p className="font-semibold">Artist Name:</p>
                  <p className="text-gray-700">{selectedVerification.artist ? `${selectedVerification.artist.firstname} ${selectedVerification.artist.lastname}` : 'Unknown Artist'}</p>
                </div>
                <div className="mb-4">
                  <p className="font-semibold">Status:</p>
                  <p className="text-gray-700">{selectedVerification.status}</p>
                </div>
                <div className="mb-4">
                  <p className="font-semibold">Submitted On:</p>
                  <p className="text-gray-700">{new Date(selectedVerification.created_at).toLocaleDateString()}</p>
                </div>
                <div className="mb-4">
                  <p className="font-semibold">Document URL:</p>
                  <a href={selectedVerification.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    View Document
                  </a>
                </div>
                <div className="mb-4">
                  <p className="font-semibold">Valid ID:</p>
                  <a href={selectedVerification.valid_id} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    View Valid ID
                  </a>
                </div>
              </div>
              <div className="flex flex-col space-y-4">
                <div className="border rounded-lg overflow-hidden cursor-pointer" onClick={() => openImageModal(selectedVerification.document_url)}>
                  <img 
                    src={selectedVerification.document_url} 
                    alt="Document" 
                    className="w-full h-48 object-cover transition-transform duration-300 transform hover:scale-105" 
                  />
                </div>
                <div className="border rounded-lg overflow-hidden cursor-pointer" onClick={() => openImageModal(selectedVerification.valid_id)}>
                  <img 
                    src={selectedVerification.valid_id} 
                    alt="Valid ID" 
                    className="w-full h-48 object-cover transition-transform duration-300 transform hover:scale-105" 
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-6 space-x-4">
              <button 
                onClick={() => handleApprove(selectedVerification.verification_id)} 
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200"
              >
                Accept
              </button>
              <button 
                onClick={() => handleReject(selectedVerification.verification_id)} 
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition duration-200"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {isImageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75" 
          onClick={closeImageModal} 
          onKeyDown={(e) => e.key === 'Escape' && closeImageModal()} 
          tabIndex={0}
        >
          <div 
            className="bg-white p-4 rounded-lg shadow-lg max-w-3xl w-full" 
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedImage} 
              alt="Full Size" 
              className="w-full h-auto object-contain transition-transform duration-300 transform hover:scale-110" 
            />
            <button 
              onClick={closeImageModal} 
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Verification;