import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import axios from "axios";
import { FaSpinner } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import moment from "moment";
import EditJobModal from "../../components/EditJobModal";
import ViewApplicantsModal from "../../components/ViewApplicantsModal";
import Swal from "sweetalert2";

interface Job {
  job_id: string;
  title: string;
  description: string;
  budget: string;
  deadline: string;
  preferred_art_styles: string | string[];
  created_at: string;
  status?: "Open" | "Closed" | "Completed" | "In Progress";
}

interface Applicant {
  user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  profile_image?: string;
  status: "Pending" | "Accepted" | "Rejected";
}

const artStyles = [
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
];

const budgetRanges = [
  "Under ₱1,000",
  "₱1,000 - ₱5,000",
  "₱5,000 - ₱10,000",
  "₱10,000 - ₱20,000",
  "₱20,000 and above",
  "Flexible / Open to Offers",
];

const ClientPostJob: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editJobData, setEditJobData] = useState<Job | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [applicantCounts, setApplicantCounts] = useState<
    Record<string, number>
  >({});

  const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveMenuId(null);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const fetchJobs = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/jobs/client/${user.id}`
      );
      const jobList = res.data || [];
      setJobs(jobList);

      // Fetch applicant counts
      const counts: Record<string, number> = {};
      await Promise.all(
        jobList.map(async (job: Job) => {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/job-applicants/${job.job_id}`
          );
          counts[job.job_id] = res.data.length;
        })
      );
      setApplicantCounts(counts);
    } catch {
      setError("Failed to load job posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Post a Job";
    fetchJobs();
  }, [user]);

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handlePostJob = async () => {
    if (!title || !description || !budget || !deadline) {
      setError("All fields are required.");
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/jobs`, {
        user_id: user?.id,
        title,
        description,
        budget,
        deadline,
        preferred_art_styles: selectedStyles,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setBudget("");
      setDeadline("");
      setSelectedStyles([]);
      setShowForm(false);
      fetchJobs();

      // Toast success
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Job post created",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch {
      // Toast error
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Failed to post the job",
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    const confirm = await Swal.fire({
      title: "Delete this job?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: true,
      customClass: {
        popup: "rounded-lg",
      },
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/jobs/${jobId}`);
        setJobs((prev) => prev.filter((job) => job.job_id !== jobId));
        setActiveMenuId(null);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Job post deleted",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      } catch {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Failed to delete job",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    }
  };

  const handleEdit = (job: Job) => {
    setEditJobData(job);
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-wrapper")) {
        setActiveMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const togglePostForm = () => {
    if (showForm) {
      setTitle("");
      setDescription("");
      setBudget("");
      setDeadline("");
      setSelectedStyles([]);
      setError(null);
    }
    setShowForm((prev) => !prev);
  };

  const isFormValid =
    title && description && budget && deadline && selectedStyles.length > 0;
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = jobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(jobs.length / jobsPerPage);

  const handleViewApplicants = async (job: Job) => {
    setSelectedJobId(job.job_id);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/job-applicants/${job.job_id}`
      );
      setApplicants(res.data);
      setIsApplicantsModalOpen(true);

      // Save count
      setApplicantCounts((prev) => ({
        ...prev,
        [job.job_id]: res.data.length,
      }));
    } catch (err) {
      console.error("Failed to fetch applicants", err);
      Swal.fire("Error", "Unable to fetch applicants.", "error");
    }
  };

  const handleUpdateStatus = async (
    userId: string,
    status: "Accepted" | "Rejected"
  ) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/job-applicants/status`,
        {
          user_id: userId,
          job_id: selectedJobId,
          status,
        }
      );

      setApplicants((prev) =>
        prev.map((app) => (app.user_id === userId ? { ...app, status } : app))
      );

      Swal.fire({
        toast: true,
        icon: "success",
        title: "Status updated",
        position: "top-end",
        timer: 1500,
        showConfirmButton: false,
      });

      setIsApplicantsModalOpen(false);
      fetchJobs();
    } catch {
      Swal.fire("Error", "Failed to update status.", "error");
    }
  };

  const handleMarkAsCompleted = async (jobId: string) => {
    const confirm = await Swal.fire({
      title: "Mark this job as completed?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, complete it",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/jobs/${jobId}`, {
        status: "Completed",
      });

      Swal.fire({
        toast: true,
        icon: "success",
        title: "Job marked as completed",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });

      fetchJobs();
    } catch {
      Swal.fire("Error", "Failed to update job status.", "error");
    }
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold text-center text-[#5C0601] mb-4">
        Post a Job Offer
      </h1>
      <hr className="border-gray-300 mb-6" />

      {/* Collapsible Post Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-10">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Need an artist? Post your job here.
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Describe your commission and invite artists to apply.
          </p>
          <button
            className="text-sm font-medium text-white bg-[#5C0601] px-6 py-2 rounded-full shadow hover:bg-[#7b0802] transition-transform duration-200 transform hover:scale-105"
            onClick={togglePostForm}
          >
            {showForm ? "Cancel" : "Create Job Offer"}
          </button>
        </div>

        {/* Expandable Form */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            showForm ? "max-h-screen opacity-100 mt-6" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-gray-200 pt-6 mt-4 space-y-4">
            {error && (
              <div className="text-center text-red-600 font-semibold">
                {error}
              </div>
            )}
            <input
              type="text"
              placeholder="Job Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C0601]"
            />
            <textarea
              placeholder="Describe your project..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C0601]"
            ></textarea>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C0601]"
              >
                <option value="">Select a Budget Range</option>
                {budgetRanges.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
              <input
                type="date"
                placeholder="Deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C0601]"
              />
            </div>
            <div>
              <p className="mb-2 text-lg font-bold text-gray-700">
                Preferred Art Styles
              </p>
              <div className="flex flex-wrap gap-2">
                {artStyles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={`px-4 py-2 rounded-full border text-sm ${
                      selectedStyles.includes(style)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 text-gray-700 hover:bg-blue-100"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-right">
              <button
                onClick={handlePostJob}
                disabled={isPosting || !isFormValid}
                className={`py-2 px-8 rounded-full text-white font-semibold text-base shadow-md ${
                  isPosting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#5C0601] hover:bg-[#7b0802] transition-transform duration-200 transform hover:scale-105"
                }`}
              >
                {isPosting ? (
                  <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" /> Posting...
                  </div>
                ) : (
                  "Post Job"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Job Listing */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-[#5C0601] mb-6">My Job Posts</h2>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : jobs.length === 0 ? (
          <p className="text-gray-600">You haven't posted any jobs yet.</p>
        ) : (
          <>
            <div className="grid gap-6">
              {currentJobs.map((job) => (
                <div
                  key={job.job_id}
                  className="relative bg-white border border-gray-200 p-6 rounded-xl shadow-md"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-[#5C0601]">
                      {job.title}
                    </h3>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        job.status === "Closed"
                          ? "bg-gray-200 text-gray-600"
                          : job.status === "In Progress"
                          ? "bg-yellow-100 text-yellow-700"
                          : job.status === "Completed"
                          ? "bg-blue-100 text-blue-700"
                          : job.status === "Open"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {job.status ?? "Unknown"}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 z-20 dropdown-wrapper">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId((prev) =>
                            prev === job.job_id ? null : job.job_id
                          );
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 transition"
                      >
                        <HiDotsHorizontal className="w-5 h-5 text-gray-600" />
                      </button>

                      <div
                        className={`transition-all duration-200 origin-top-right transform scale-95 opacity-0 ${
                          activeMenuId === job.job_id
                            ? "scale-100 opacity-100"
                            : "pointer-events-none"
                        } absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-md`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleEdit(job)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(job.job_id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                        {job.status !== "Completed" && (
                          <button
                            onClick={() => handleMarkAsCompleted(job.job_id)}
                            className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-100"
                          >
                            Mark as Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-2">
                    Posted {moment(job.created_at).format("MMM D, YYYY")}
                  </p>
                  <p className="text-gray-700 mb-4">{job.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(typeof job.preferred_art_styles === "string"
                      ? job.preferred_art_styles.split(",").map((s) => s.trim())
                      : job.preferred_art_styles
                    )?.map((style, idx) => (
                      <span
                        key={`${job.job_id}-style-${idx}`}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-700 font-medium mt-4">
                    <div className="flex gap-6">
                      <div>
                        <strong>Budget:</strong> {job.budget}
                      </div>
                      <div>
                        <strong>Deadline:</strong>{" "}
                        {moment(job.deadline).format("MMM D, YYYY")}
                      </div>
                    </div>
                    {applicantCounts[job.job_id] !== undefined && (
                      <button
                        onClick={() => handleViewApplicants(job)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-4 py-1 rounded-full shadow transition"
                      >
                        {applicantCounts[job.job_id]} Applicant
                        {applicantCounts[job.job_id] !== 1 && "s"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 rounded-md border ${
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

      {isEditModalOpen && editJobData && (
        <EditJobModal
          job={editJobData}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={fetchJobs}
        />
      )}

      {isApplicantsModalOpen && (
        <ViewApplicantsModal
          applicants={applicants}
          onClose={() => setIsApplicantsModalOpen(false)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default ClientPostJob;
