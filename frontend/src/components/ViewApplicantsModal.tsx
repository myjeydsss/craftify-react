import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";

interface Applicant {
  user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  profile_image?: string;
  status: "Pending" | "Accepted" | "Rejected";
}

interface Props {
  applicants: Applicant[];
  onClose: () => void;
  onUpdateStatus: (userId: string, status: "Accepted" | "Rejected") => void;
}

const ViewApplicantsModal: React.FC<Props> = ({
  applicants,
  onClose,
  onUpdateStatus,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;
  const totalPages = Math.ceil(applicants.length / perPage);
  const current = applicants.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTimeout(() => setLoading(false), 400);
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);

  const handleOutsideClick = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleEscKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  const handleViewProfile = async (applicantId: string) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/log-profile-visit/${applicantId}`,
        { visitorId: user?.id }
      );
      navigate(`/profile/artist/${applicantId}`);
    } catch (err) {
      console.error("Error logging profile visit:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div
        ref={modalRef}
        className="bg-white w-[95%] sm:w-[90%] max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-4 sm:p-6 relative"
      >
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
          onClick={onClose}
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-[#5C0601]">
          Applicants
        </h2>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : applicants.length === 0 ? (
          <p className="text-gray-500 text-center">No applicants yet.</p>
        ) : (
          <>
            <ul className="space-y-4">
              {current.map((applicant) => (
                <li
                  key={applicant.user_id}
                  className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                    <img
                      src={
                        applicant.profile_image ||
                        `https://ui-avatars.com/api/?name=${applicant.firstname}+${applicant.lastname}&background=random`
                      }
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border border-gray-300 mx-auto sm:mx-0"
                    />
                    <div className="text-center sm:text-left flex-1">
                      <p className="text-lg font-semibold text-gray-800">
                        {applicant.firstname} {applicant.lastname}
                      </p>
                      <p className="text-sm text-gray-500 mb-1">
                        {applicant.email}
                      </p>
                      <button
                        onClick={() => handleViewProfile(applicant.user_id)}
                        className="text-blue-600 text-sm font-medium hover:underline"
                      >
                        View Full Profile
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 mt-2 sm:mt-0">
                    <span
                      className={`text-sm font-semibold px-4 py-1 rounded-full capitalize ${
                        applicant.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : applicant.status === "Accepted"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {applicant.status}
                    </span>

                    {applicant.status === "Pending" && (
                      <>
                        <button
                          onClick={() =>
                            onUpdateStatus(applicant.user_id, "Accepted")
                          }
                          className="px-4 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            onUpdateStatus(applicant.user_id, "Rejected")
                          }
                          className="px-4 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2 flex-wrap">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`min-w-[36px] px-3 py-1 rounded-md border text-sm ${
                      currentPage === i + 1
                        ? "bg-[#5C0601] text-white"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ViewApplicantsModal;
