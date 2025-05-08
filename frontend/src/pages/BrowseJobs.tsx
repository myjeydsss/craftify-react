import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import moment from "moment";
import { FaSpinner, FaList, FaCheckCircle } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import { useAuth } from "../context/AuthProvider";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

interface Job {
  job_id: string;
  title: string;
  description: string;
  budget: string;
  deadline: string;
  preferred_art_styles: string | string[];
  created_at: string;
  status?: "Open" | "Closed";
  user_id: string;
}

interface ClientProfile {
  firstname: string;
  lastname: string;
  address: string;
  profile_image?: string;
}

interface Application {
  job_id: string;
  status: "Pending" | "Accepted" | "Rejected";
}

const BrowseJobs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clientProfiles, setClientProfiles] = useState<
    Record<string, ClientProfile>
  >({});
  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeView, setActiveView] = useState<"Offers" | "Applied">("Offers");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  const appliedJobIds = applications.map((app) => app.job_id);
  const filteredJobs =
    activeView === "Offers"
      ? jobs.filter((job) => !appliedJobIds.includes(job.job_id))
      : jobs.filter((job) => appliedJobIds.includes(job.job_id));

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const currentJobs = filteredJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
  );

  const fetchJobs = async () => {
    try {
      const res =
        activeView === "Applied"
          ? await axios.get(
              `${import.meta.env.VITE_API_URL}/api/my-applied-job-details/${
                user?.id
              }`
            )
          : await axios.get(`${import.meta.env.VITE_API_URL}/api/open-jobs`);

      setJobs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/my-applied-jobs/${user?.id}`
      );
      setApplications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch applied jobs", err);
    }
  };

  const fetchClientProfiles = async (userIds: string[]) => {
    const profileMap: Record<string, ClientProfile> = {};
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/client-profile/${uid}`
          );
          profileMap[uid] = res.data;
        } catch (err) {
          console.error("Failed to fetch profile for user:", uid);
        }
      })
    );
    setClientProfiles(profileMap);
  };

  const handleApply = async (jobId: string) => {
    setApplyingJobId(jobId);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/apply-job`, {
        job_id: jobId,
        user_id: user?.id,
      });
      await fetchApplications();
      Swal.fire({
        toast: true,
        icon: "success",
        title: "Applied successfully",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch {
      Swal.fire({
        toast: true,
        icon: "error",
        title: "Already applied or failed",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleUnapply = async (jobId: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/unapply-job`, {
        data: { job_id: jobId, user_id: user?.id },
      });
      await fetchApplications();
      Swal.fire({
        toast: true,
        icon: "success",
        title: "Unapplied successfully",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch {
      Swal.fire({
        toast: true,
        icon: "error",
        title: "Failed to unapply",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  const handleDeleteApplication = async (jobId: string) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/delete-application`,
        {
          data: { job_id: jobId, user_id: user?.id },
        }
      );
      await fetchApplications();
      setOpenMenuId(null);
      Swal.fire({
        toast: true,
        icon: "success",
        title: "Removed from your applied list",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch {
      Swal.fire("Error", "Failed to remove application.", "error");
    }
  };

  const handleProfileClick = async (clientId: string) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/log-profile-visit/${clientId}`,
        { visitorId: user?.id }
      );
      navigate(`/profile/client/${clientId}`);
    } catch (err) {
      console.error("Failed to log profile visit", err);
    }
  };

  const getStatus = (jobId: string) =>
    applications.find((a) => a.job_id === jobId)?.status;

  useEffect(() => {
    const init = async () => {
      await fetchJobs();
      await fetchApplications();
    };
    init();
  }, [activeView]);

  useEffect(() => {
    if (jobs.length > 0) {
      const uniqueUserIds = Array.from(new Set(jobs.map((job) => job.user_id)));
      fetchClientProfiles(uniqueUserIds);
    }
  }, [jobs]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white px-6 py-16">
      <div className="container mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#5C0601] mb-2">
            Browse Job Offers
          </h1>
          <p className="text-gray-600 text-lg">
            Explore commission-based opportunities posted by clients and apply
            to the ones that match your artistic style.
          </p>
        </header>

        {/* View Toggle */}
        <div className="flex justify-center mb-8 gap-4">
          {["Offers", "Applied"].map((view) => (
            <button
              key={view}
              onClick={() => {
                setActiveView(view as "Offers" | "Applied");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition ${
                activeView === view
                  ? "bg-[#5C0601] text-white shadow"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {view === "Offers" ? <FaList /> : <FaCheckCircle />}
              {view}
            </button>
          ))}
        </div>

        <hr className="border-gray-300 mb-6" />

        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : currentJobs.length === 0 ? (
          <div className="text-center text-gray-600">No jobs in this view.</div>
        ) : (
          <>
            <div className="grid gap-6">
              {currentJobs.map((job) => {
                const client = clientProfiles[job.user_id];
                const applicationStatus = getStatus(job.job_id);

                return (
                  <div
                    key={job.job_id}
                    className="border border-gray-200 rounded-xl p-6 shadow bg-white relative"
                  >
                    {activeView === "Applied" &&
                      ["Accepted", "Rejected"].includes(
                        applicationStatus || ""
                      ) && (
                        <div
                          className="absolute top-4 right-4 dropdown-wrapper"
                          ref={dropdownRef}
                        >
                          {" "}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === job.job_id ? null : job.job_id
                                )
                              }
                              className="p-2 rounded-full hover:bg-gray-100 transition"
                            >
                              <HiDotsHorizontal className="w-5 h-5 text-gray-600" />
                            </button>
                            {openMenuId === job.job_id && (
                              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-md z-10">
                                <button
                                  onClick={() =>
                                    handleDeleteApplication(job.job_id)
                                  }
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    <div
                      className="flex items-center gap-4 mb-4 cursor-pointer"
                      onClick={() => handleProfileClick(job.user_id)}
                    >
                      <img
                        src={
                          client?.profile_image ??
                          `https://ui-avatars.com/api/?name=${
                            client?.firstname || "Client"
                          }`
                        }
                        alt="Client Profile"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {client?.firstname} {client?.lastname}
                        </p>
                        <p className="text-sm text-gray-500">
                          {client?.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-[#5C0601]">
                        {job.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          job.status === "Open"
                            ? "bg-green-100 text-green-800"
                            : job.status === "Closed"
                            ? "bg-gray-200 text-gray-600"
                            : job.status === "Completed"
                            ? "bg-blue-100 text-blue-800"
                            : job.status === "In Progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-2">
                      Posted {moment(job.created_at).format("MMM D, YYYY")}
                    </p>
                    <p className="text-gray-700 mb-4">{job.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {(typeof job.preferred_art_styles === "string"
                        ? job.preferred_art_styles
                            .split(",")
                            .map((s) => s.trim())
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

                    <div className="flex flex-wrap justify-between items-center text-sm text-gray-700 font-medium mt-4">
                      <div className="mr-4">
                        <strong>Budget:</strong> {job.budget}
                      </div>
                      <div>
                        <strong>Deadline:</strong>{" "}
                        {moment(job.deadline).format("MMM D, YYYY")}
                      </div>
                      <div className="mt-2 ml-auto">
                        {activeView === "Applied" ? (
                          applicationStatus === "Pending" ? (
                            <button
                              onClick={() => handleUnapply(job.job_id)}
                              className="text-xs font-semibold bg-red-100 text-red-600 px-4 py-1 rounded-full shadow hover:bg-red-200"
                            >
                              Unapply
                            </button>
                          ) : (
                            <span
                              className={`px-4 py-1 rounded-full text-xs font-semibold shadow ${
                                applicationStatus === "Accepted"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {applicationStatus}
                            </span>
                          )
                        ) : (
                          <button
                            onClick={() => handleApply(job.job_id)}
                            disabled={applyingJobId === job.job_id}
                            className={`text-sm text-white px-4 py-1 rounded-full shadow transition ${
                              applyingJobId === job.job_id
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-[#5C0601] hover:bg-[#7b0802]"
                            }`}
                          >
                            {applyingJobId === job.job_id ? (
                              <span className="flex items-center gap-2 justify-center">
                                <FaSpinner className="animate-spin" />
                                Applying...
                              </span>
                            ) : (
                              "Apply"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
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
    </div>
  );
};

export default BrowseJobs;
