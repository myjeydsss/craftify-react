import React, { useState } from "react";
import { FaCheck, FaTimes, FaRegEdit, FaTrash, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";

interface Milestone {
  milestone_id: number;
  milestone_name: string;
  due_date: string;
  status: string;
  completion_percentage: number;
  milestone_fee?: number;
  is_paid?: boolean;
  isNew?: boolean;
}

interface Project {
  project_id: string;
  project_name: string;
}

interface Props {
  milestones: Milestone[];
  selectedProject: Project;
  editMode: number | null;
  show: boolean;
  close: () => void;
  handleEditChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: string,
    milestone_id: number
  ) => void;
  handleEditMilestone: (id: number) => void;
  handleSaveEdit: (id: number) => void;
  handleCancelEdit: () => void;
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
  recalculateProjectCompletion: (
    projectId: string,
    updatedMilestones: Milestone[]
  ) => void;
}

const ArtistMilestoneModal: React.FC<Props> = ({
  milestones,
  selectedProject,
  editMode,
  show,
  close,
  handleEditChange,
  handleEditMilestone,
  handleSaveEdit,
  handleCancelEdit,
  setMilestones,
  recalculateProjectCompletion,
}) => {
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone> | null>(
    null
  );

  const handleAddMilestone = async () => {
    const { milestone_name, due_date, status, milestone_fee } =
      newMilestone || {};
    if (!milestone_name?.trim() || !due_date?.trim()) {
      Swal.fire(
        "Missing Fields",
        "Please fill out all required fields.",
        "warning"
      );
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects/${
          selectedProject.project_id
        }/milestones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            milestone_name: milestone_name.trim(),
            due_date: due_date.trim(),
            status: status || "Not Started",
            completion_percentage: 0,
            milestone_fee: milestone_fee || 0,
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        setNewMilestone(null);
        Swal.fire("Success", "Milestone added successfully!", "success");

        const milestoneRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/projects/${
            selectedProject.project_id
          }/milestones`
        );
        const updatedMilestones = await milestoneRes.json();
        setMilestones(updatedMilestones);
        recalculateProjectCompletion(
          selectedProject.project_id,
          updatedMilestones
        );
      } else {
        Swal.fire("Error", result.error || "Failed to add milestone.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong.", "error");
    }
  };

  const handleDeleteMilestone = async (milestone_id: number) => {
    const result = await Swal.fire({
      title: "Delete Milestone?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#f59e0b",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const deleteRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/milestones/${milestone_id}`,
          { method: "DELETE" }
        );

        if (!deleteRes.ok) throw new Error("Deletion failed");

        const updatedRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/projects/${
            selectedProject.project_id
          }/milestones`
        );
        const updatedMilestones = await updatedRes.json();
        setMilestones(updatedMilestones);
        recalculateProjectCompletion(
          selectedProject.project_id,
          updatedMilestones
        );
        Swal.fire("Deleted!", "Milestone has been removed.", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete milestone.", "error");
      }
    }
  };

  if (!show || !selectedProject) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[90rem] max-h-[90vh] overflow-hidden animate-fadeIn flex flex-col">
        {/* Header */}
        <div className="bg-gray-100 text-gray-900 p-6 border-b">
          <h2 className="text-xl md:text-3xl font-extrabold text-center uppercase tracking-wide">
            Milestones –{" "}
            <span className="text-[#5C0601]">
              {selectedProject.project_name}
            </span>
          </h2>
        </div>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-auto flex-grow">
          <table className="min-w-full text-sm text-gray-800 border-separate border-spacing-y-1">
            <thead className="bg-white text-xs uppercase text-gray-600">
              <tr>
                <th className="px-5 py-3 text-left font-bold bg-gray-100 rounded-l-lg">
                  Stage
                </th>
                <th className="px-5 py-3 text-left font-bold bg-gray-100">
                  Due Date
                </th>
                <th className="px-5 py-3 text-left font-bold bg-gray-100">
                  Status
                </th>
                <th className="px-5 py-3 text-left font-bold bg-gray-100">
                  Fee
                </th>
                <th className="px-5 py-3 text-left font-bold bg-gray-100">
                  Paid
                </th>
                <th className="px-5 py-3 text-center font-bold bg-gray-100 rounded-r-lg">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr
                  key={m.milestone_id}
                  className="bg-white shadow-sm rounded-md hover:shadow-md transition-all duration-150"
                >
                  <td className="px-5 py-3 font-medium">
                    {editMode === m.milestone_id ? (
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={m.milestone_name}
                        onChange={(e) =>
                          handleEditChange(e, "milestone_name", m.milestone_id)
                        }
                      />
                    ) : (
                      <span className="font-semibold">{m.milestone_name}</span>
                    )}
                  </td>

                  <td className="px-5 py-3">
                    {editMode === m.milestone_id ? (
                      <input
                        type="date"
                        className="w-full border rounded px-2 py-1"
                        value={m.due_date}
                        onChange={(e) =>
                          handleEditChange(e, "due_date", m.milestone_id)
                        }
                      />
                    ) : (
                      <span className="text-gray-700 font-medium">
                        {m.due_date}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3">
                    {editMode === m.milestone_id ? (
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={m.status}
                        onChange={(e) =>
                          handleEditChange(e, "status", m.milestone_id)
                        }
                      >
                        <option>Not Started</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    ) : (
                      <span
                        className={`font-bold ${
                          m.status === "Completed"
                            ? "text-green-700"
                            : m.status === "In Progress"
                            ? "text-yellow-700"
                            : "text-gray-600"
                        }`}
                      >
                        {m.status}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3 text-gray-800 font-semibold">
                    {editMode === m.milestone_id ? (
                      <input
                        type="number"
                        placeholder="₱ Fee"
                        className="w-full border rounded px-2 py-1"
                        value={m.milestone_fee ?? ""}
                        onChange={(e) =>
                          handleEditChange(e, "milestone_fee", m.milestone_id)
                        }
                      />
                    ) : (
                      `₱${m.milestone_fee?.toLocaleString() || 0}`
                    )}
                  </td>

                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        m.is_paid
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {m.is_paid ? "Paid" : "Unpaid"}
                    </span>
                  </td>

                  <td className="px-5 py-3 text-center">
                    {editMode === m.milestone_id ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleSaveEdit(m.milestone_id)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-green-700 border border-green-600 px-3 py-1.5 rounded-full hover:bg-green-50 transition"
                          title="Save"
                        >
                          <FaCheck className="text-sm" /> Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 border border-gray-500 px-3 py-1.5 rounded-full hover:bg-gray-100 transition"
                          title="Cancel"
                        >
                          <FaTimes className="text-sm" /> Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditMilestone(m.milestone_id)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 border border-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-50 transition"
                          title="Edit"
                        >
                          <FaRegEdit className="text-sm" /> Edit
                        </button>
                        {!m.is_paid && (
                          <button
                            onClick={() =>
                              handleDeleteMilestone(m.milestone_id)
                            }
                            className="inline-flex items-center gap-1 text-sm font-medium text-red-700 border border-red-600 px-3 py-1.5 rounded-full hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <FaTrash className="text-sm" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {newMilestone && (
                <tr className="bg-gray-50 border-t shadow">
                  <td className="px-5 py-3">
                    <input
                      type="text"
                      placeholder="Stage name"
                      className="w-full border rounded px-2 py-1"
                      value={newMilestone.milestone_name || ""}
                      onChange={(e) =>
                        setNewMilestone((prev) => ({
                          ...prev,
                          milestone_name: e.target.value,
                        }))
                      }
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="date"
                      className="w-full border rounded px-2 py-1"
                      value={newMilestone.due_date || ""}
                      onChange={(e) =>
                        setNewMilestone((prev) => ({
                          ...prev,
                          due_date: e.target.value,
                        }))
                      }
                    />
                  </td>
                  <td className="px-5 py-3">
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={newMilestone.status || "Not Started"}
                      onChange={(e) =>
                        setNewMilestone((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                    >
                      <option>Not Started</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      placeholder="₱ Fee"
                      className="w-full border rounded px-2 py-1"
                      value={newMilestone.milestone_fee || ""}
                      onChange={(e) =>
                        setNewMilestone((prev) => ({
                          ...prev,
                          milestone_fee: Number(e.target.value),
                        }))
                      }
                    />
                  </td>
                  <td />
                  <td className="px-5 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={handleAddMilestone}
                        title="Add"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-green-600 text-green-700 hover:bg-green-600 hover:text-white transition-all duration-200 shadow-sm"
                      >
                        <FaCheck className="text-sm" />
                      </button>
                      <button
                        onClick={() => setNewMilestone(null)}
                        title="Cancel"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-500 text-gray-700 hover:bg-gray-600 hover:text-white transition-all duration-200 shadow-sm"
                      >
                        <FaTimes className="text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden px-4 py-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {milestones.map((m) => (
            <div
              key={m.milestone_id}
              className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white"
            >
              {editMode === m.milestone_id ? (
                <>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">
                    Stage Name
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 mb-3 text-sm"
                    value={m.milestone_name}
                    onChange={(e) =>
                      handleEditChange(e, "milestone_name", m.milestone_id)
                    }
                  />
                  <label className="block text-sm font-semibold mb-1 text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2 mb-3 text-sm"
                    value={m.due_date}
                    onChange={(e) =>
                      handleEditChange(e, "due_date", m.milestone_id)
                    }
                  />
                  <label className="block text-sm font-semibold mb-1 text-gray-700">
                    Status
                  </label>
                  <select
                    className="w-full border rounded px-3 py-2 mb-3 text-sm"
                    value={m.status}
                    onChange={(e) =>
                      handleEditChange(e, "status", m.milestone_id)
                    }
                  >
                    <option value="Not Started" className="text-gray-600">
                      Not Started
                    </option>
                    <option value="In Progress" className="text-yellow-600">
                      In Progress
                    </option>
                    <option value="Completed" className="text-green-600">
                      Completed
                    </option>
                  </select>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">
                    Fee (₱)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    className="w-full border rounded px-3 py-2 mb-3 text-sm"
                    value={m.milestone_fee || ""}
                    onChange={(e) =>
                      handleEditChange(e, "milestone_fee", m.milestone_id)
                    }
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleSaveEdit(m.milestone_id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-green-600 text-green-700 font-medium hover:bg-green-600 hover:text-white transition-all duration-200 shadow-sm"
                    >
                      <FaCheck className="text-sm" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-gray-500 text-gray-700 font-medium hover:bg-gray-600 hover:text-white transition-all duration-200 shadow-sm"
                    >
                      <FaTimes className="text-sm" />
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h4 className="font-bold text-lg text-gray-800 mb-1">
                    {m.milestone_name}
                  </h4>
                  <p className="text-sm text-gray-600">Due: {m.due_date}</p>
                  <p className="text-sm text-gray-600">
                    Status:{" "}
                    <span
                      className={`font-semibold ${
                        m.status === "Completed"
                          ? "text-green-700"
                          : m.status === "In Progress"
                          ? "text-yellow-600"
                          : "text-gray-600"
                      }`}
                    >
                      {m.status}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Fee: ₱{m.milestone_fee?.toLocaleString()}
                  </p>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      m.is_paid
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {m.is_paid ? "Paid" : "Unpaid"}
                  </span>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleEditMilestone(m.milestone_id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-blue-600 text-blue-700 font-medium hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-sm"
                    >
                      <FaRegEdit className="text-sm" />
                      Edit
                    </button>

                    {!m.is_paid && (
                      <button
                        onClick={() => handleDeleteMilestone(m.milestone_id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-red-600 text-red-700 font-medium hover:bg-red-600 hover:text-white transition-all duration-200 shadow-sm"
                      >
                        <FaTrash className="text-sm" />
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add Milestone (Mobile) */}
          {newMilestone && (
            <div className="border border-gray-300 bg-white p-4 rounded-lg shadow">
              <label className="block text-sm font-semibold mb-1 text-gray-700">
                Stage Name
              </label>
              <input
                type="text"
                placeholder="Stage Name"
                className="w-full border rounded px-3 py-2 mb-3 text-sm"
                value={newMilestone.milestone_name || ""}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    milestone_name: e.target.value,
                  }))
                }
              />
              <label className="block text-sm font-semibold mb-1 text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 mb-3 text-sm"
                value={newMilestone.due_date || ""}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    due_date: e.target.value,
                  }))
                }
              />
              <label className="block text-sm font-semibold mb-1 text-gray-700">
                Status
              </label>
              <select
                className="w-full border rounded px-3 py-2 mb-3 text-sm"
                value={newMilestone.status || "Not Started"}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
              >
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
              <label className="block text-sm font-semibold mb-1 text-gray-700">
                Fee (₱)
              </label>
              <input
                type="number"
                placeholder="e.g. 2000"
                className="w-full border rounded px-3 py-2 mb-3 text-sm"
                value={newMilestone.milestone_fee || ""}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    milestone_fee: Number(e.target.value),
                  }))
                }
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAddMilestone}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-green-600 text-green-700 font-semibold hover:bg-green-600 hover:text-white transition-all duration-200 shadow-sm"
                >
                  <FaCheck className="text-sm" />
                  Add
                </button>

                <button
                  onClick={() => setNewMilestone(null)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-gray-500 text-gray-700 font-semibold hover:bg-gray-600 hover:text-white transition-all duration-200 shadow-sm"
                >
                  <FaTimes className="text-sm" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="p-5 border-t bg-white flex flex-col md:flex-row gap-3 md:gap-0 md:justify-between md:items-center">
          <button
            onClick={() =>
              setNewMilestone({
                milestone_id: Date.now(),
                milestone_name: "",
                due_date: "",
                status: "Not Started",
                completion_percentage: 0,
                isNew: true,
              })
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-blue-600 text-blue-700 font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-sm"
          >
            <FaPlus className="text-sm" />
            Add Milestone
          </button>

          <button
            onClick={close}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-500 text-gray-700 font-semibold hover:bg-gray-600 hover:text-white transition-all duration-200 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtistMilestoneModal;
