import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaSpinner } from "react-icons/fa";

interface Job {
  job_id: string;
  title: string;
  description: string;
  budget: string;
  deadline: string;
  preferred_art_styles: string | string[];
  status?: "Open" | "Closed" | "Completed" | "In Progress";
}

interface Props {
  job: Job;
  onClose: () => void;
  onUpdated: () => void;
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

const EditJobModal: React.FC<Props> = ({ job, onClose, onUpdated }) => {
  const [title, setTitle] = useState(job.title);
  const [description, setDescription] = useState(job.description);
  const [budget, setBudget] = useState(job.budget);
  const [deadline, setDeadline] = useState(job.deadline);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    typeof job.preferred_art_styles === "string"
      ? job.preferred_art_styles.split(",").map((s) => s.trim())
      : job.preferred_art_styles
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<Job["status"]>(job.status || "Open");
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    setShowModal(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleSave = async () => {
    if (
      !title ||
      !description ||
      !budget ||
      !deadline ||
      selectedStyles.length === 0
    ) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: "Please complete all fields",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/jobs/${job.job_id}`,
        {
          title,
          description,
          budget,
          deadline,
          preferred_art_styles: selectedStyles,
          status,
        }
      );
      onUpdated();
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Job updated successfully",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      onClose();
    } catch (err) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Failed to update job",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-300 ${
        showModal ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        ref={modalRef}
        className={`bg-white w-full max-w-2xl rounded-xl shadow-xl p-6 transform transition-all duration-300 ${
          showModal ? "scale-100 translate-y-0" : "scale-95 translate-y-5"
        }`}
      >
        <h2 className="text-2xl font-bold mb-4 text-[#5C0601]">
          Edit Job Post
        </h2>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-3 p-3 border border-gray-300 rounded-md"
          placeholder="Job Title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full mb-3 p-3 border border-gray-300 rounded-md"
          placeholder="Job Description"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="p-3 border border-gray-300 rounded-md"
          >
            <option value="">Select Budget</option>
            {budgetRanges.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="p-3 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <p className="mb-2 font-medium text-gray-700">Preferred Styles:</p>
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
          <div className="mb-4">
            <p className="mb-2 font-medium text-gray-700">Job Visibility:</p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Job["status"])}
              className="w-full p-3 border border-gray-300 rounded-md"
            >
              <option value="Open">Open (Visible to Artists)</option>
              <option value="Closed">
                Closed (Not Accepting Applications)
              </option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-md border text-gray-700 border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              isSaving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#5C0601] hover:bg-[#7b0802]"
            }`}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <FaSpinner className="animate-spin" /> Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditJobModal;
