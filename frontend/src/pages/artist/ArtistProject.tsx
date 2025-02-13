


import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTh, FaList, FaUserCircle, FaEye } from "react-icons/fa";
import { useAuth } from "../../context/AuthProvider";
import { Link } from "react-router-dom";

interface Project {
  project_id: string;
  project_name: string;
  description: string;
  due_date: string;
  status: string;
  priority: string;
  proposal_id: string;
  budget?: string; // Optional budget field
  senderProfile?: any; // Optional sender profile field
}

interface Proposal {
  proposal_id: string;
  project_name: string;
  project_description: string;
  budget: string;
  due_date: string;
  sender_id: string;
  recipient_id: string;
  status: string;
  senderProfile?: any; // Improve later by defining Profile interface
}

const API_BASE_URL = import.meta.env.VITE_API_URL; // Ensure API URL is correctly set

const ArtistProject: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [activeView, setActiveView] = useState<"Board" | "List">("Board");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/api/artist-projects/${user.id}`);

        if (Array.isArray(response.data)) {
          setProjects(response.data);
        } else {
          console.warn("Unexpected response for projects:", response.data);
          setProjects([]);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    fetchProjects();
  }, [user]);

  useEffect(() => {
    const fetchProposals = async () => {
      if (!user?.id) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/api/proposals/${user.id}`);

        if (Array.isArray(response.data)) {
          setProposals(response.data);
        } else {
          console.warn("Unexpected response for proposals:", response.data);
          setProposals([]);
        }
      } catch (err) {
        console.error("Error fetching proposals:", err);
      }
    };

    fetchProposals();
  }, [user]);

  const closeProjectModal = () => {
    setSelectedProject(null);
  };

  const onAcceptProposal = async (proposal: Proposal) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/proposals/accept`, { proposal });
      const newProject = response.data.newProject;

      // Update frontend state
      setProposals((prev) => prev.filter((p) => p.proposal_id !== proposal.proposal_id));
      setProjects((prev) => [...prev, newProject]);

      // Close the modal
      setSelectedProposal(null);

      alert("Proposal accepted and project created!");
    } catch (err) {
      console.error("Error accepting proposal:", err);
      alert("Failed to accept proposal.");
    }
  };

  const onRejectProposal = async (proposal: Proposal) => {
    try {
      await axios.post(`${API_BASE_URL}/api/proposals/reject`, { proposalId: proposal.proposal_id });

      // Update frontend state
      setProposals((prev) => prev.filter((p) => p.proposal_id !== proposal.proposal_id));

      alert("Proposal rejected.");
    } catch (err) {
      console.error("Error rejecting proposal:", err);
      alert("Failed to reject proposal.");
    }
  };

  const updateProjectStatus = async (project: Project, newStatus: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/projects/update-status`, {
        project_id: project.project_id,
        status: newStatus,
      });

      if (response.data.success) {
        setProjects((prev) =>
          prev.map((p) => (p.project_id === project.project_id ? { ...p, status: newStatus } : p))
        );
        alert(`Project status updated to "${newStatus}"!`);
      }
    } catch (err) {
      console.error("Error updating project status:", err);
      alert("Failed to update project status.");
    }
  };

  const updateProjectPriority = async (project: Project, newPriority: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/projects/update-priority`, {
        project_id: project.project_id,
        priority: newPriority,
      });

      if (response.data.success) {
        setProjects((prev) =>
          prev.map((p) => (p.project_id === project.project_id ? { ...p, priority: newPriority } : p))
        );
        alert(`Project priority updated to "${newPriority}"!`);
      }
    } catch (err) {
      console.error("Error updating project priority:", err);
      alert("Failed to update project priority.");
    }
  };

  const handleViewDetails = async (project: Project) => {
    try {
      setSelectedProject(project);

      const response = await axios.get(`${API_BASE_URL}/api/projects/${project.project_id}/details`);

      if (response.data) {
        const updatedProject: Project = {
          ...project,
          budget: response.data.budget,
          senderProfile: response.data.senderProfile,
        };

        setSelectedProject(updatedProject);
      } else {
        console.error("Error fetching project details:", response);
      }
    } catch (err) {
      console.error("Error fetching project details:", err);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-poppins">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-8">Artist Project Tracking</h1>

        {/* View Options */}
        <div className="flex justify-center mb-8 space-x-6">
          {["Board", "List"].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view as "Board" | "List")}
              className={`flex items-center py-2 px-6 font-semibold rounded-lg shadow ${
                activeView === view
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              } transition duration-300`}
            >
              {view === "Board" ? <FaTh className="mr-2" /> : <FaList className="mr-2" />}
              {view}
            </button>
          ))}
        </div>

        {/* Board View */}
        {activeView === "Board" && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Project Board</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {["To Do", "In Progress", "Done", "Failed"].map((status) => (
                <div key={status} className="bg-white p-4 rounded-md shadow-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">{status}</h3>
                  <div className="space-y-3">
                    {projects
                      .filter((project) => project.status === status)
                      .map((project) => (
                        <div
                          key={project.project_id}
                          className="p-3 bg-gray-50 border-l-4 rounded-lg shadow-sm"
                          style={{
                            borderColor:
                              project.priority === "High"
                                ? "red"
                                : project.priority === "Normal"
                                ? "blue"
                                : "green",
                          }}
                        >
                          <h4 className="font-semibold text-gray-800">{project.project_name}</h4>
                          <p className="text-sm text-gray-500">
                            Due: {project.due_date || "No due date"}
                          </p>
                          <p className="text-sm font-medium">
                            Priority:{" "}
                            <span
                              className={`px-2 py-1 rounded-md text-white ${
                                project.priority === "High"
                                  ? "bg-red-500"
                                  : project.priority === "Normal"
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                              }`}
                            >
                              {project.priority}
                            </span>
                          </p>
                          <div className="flex space-x-2 mt-2">
                            {/* Status Dropdown */}
                            <select
                              onChange={(e) => updateProjectStatus(project, e.target.value)}
                              value={project.status || "To Do"}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="To Do">To Do</ option>
                              <option value="In Progress">In Progress</option>
                              <option value="Done">Done</option>
                              <option value="Failed">Failed</option>
                            </select>
                            {/* Priority Dropdown */}
                            <select
                              onChange={(e) => updateProjectPriority(project, e.target.value)}
                              value={project.priority || "Normal"}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="Low">Low</option>
                              <option value="Normal">Normal</option>
                              <option value="High">High</option>
                            </select>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* List View */}
        {activeView === "List" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Project List</h2>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-200">
                  <tr className="text-gray-700">
                    <th className="py-3 px-4 text-sm font-semibold">Name</th>
                    <th className="py-3 px-4 text-sm font-semibold">Due Date</th>
                    <th className="py-3 px-4 text-sm font-semibold">Priority</th>
                    <th className="py-3 px-4 text-sm font-semibold">Status</th>
                    <th className="py-3 px-4 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr
                      key={project.project_id}
                      className="border-b hover:bg-gray-100 transition duration-200"
                    >
                      <td className="py-3 px-4 text-sm">{project.project_name}</td>
                      <td className="py-3 px-4 text-sm">{project.due_date || "No due date"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded ${
                            project.priority === "High"
                              ? "bg-red-100 text-red-600"
                              : project.priority === "Normal"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {project.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{project.status}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewDetails(project)}
                          className="text-blue-500 hover:underline flex items-center"
                        >
                          <FaEye className="mr-2" /> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Project Details Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full relative">
              {/* Close Button */}
              <button
                onClick={closeProjectModal}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>

              {/* Modal Header */}
              <h3 className="text-2xl font-extrabold text-gray-900 mb-4 border-b pb-2">
                Project Details
              </h3>

              {/* Project Info */}
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">Project Name</p>
                  <p className="text-base font-bold text-gray-900">{selectedProject.project_name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">Description</p>
                  <p className="text-base text-gray-800">
                    {selectedProject.description || "No description available"}
                  </p>
                </div>

                <div>
  <p className="text-sm text-gray-500 uppercase font-semibold">Budget</p>
  <p className="text-base text-gray-800">
    {selectedProject.budget
      ? `₱ ${selectedProject.budget.toLocaleString()}`
      : "No budget available"}
  </p>
</div>

                <div>
  <p className="text-sm text-gray-500 uppercase font-semibold">Due Date</p>
  <p className="text-base text-gray-800">
    {selectedProject.due_date
      ? new Intl.DateTimeFormat("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(new Date(selectedProject.due_date))
      : "No due date"}
  </p>
</div>

                <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">Status</p>
                  <p className="text-base text-gray-800">{selectedProject.status}</p>
                </div>

                {/* Sender Details Section */}
                {selectedProject.senderProfile && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Sender Information</h4>
                    <div className="flex items-center mb-2">
                      {selectedProject.senderProfile.profile_image ? (
                        <img
                          src={selectedProject.senderProfile.profile_image}
                          alt="Sender Profile"
                          className="w-16 h-16 rounded-full object-cover border border-gray-200 mr-4"
                        />
                      ) : (
                        <FaUserCircle className="w-16 h-16 text-gray-400 mr-4" />
                      )}
                      <div>
                        <p className="text-base font-medium text-gray-900">
                          {selectedProject.senderProfile.firstname} {selectedProject.senderProfile.lastname}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Address:</strong> {selectedProject.senderProfile.address || "No address available"}
                        </p>
                        <Link
                          to={`/profile/${selectedProject.senderProfile.profileType}/${selectedProject.senderProfile.user_id}`}
                          className="text-blue-500 hover:underline text-sm mt-2"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="text-center mt-6">
                <button
                  onClick={closeProjectModal}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Proposals Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Proposal List</h2>
          {proposals.length === 0 ? (
            <div className="text-center text-gray-600 text-lg">No proposals yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposals.map((proposal) => (
                <div
                  key={proposal.proposal_id}
                  className="p-6 bg-white border rounded-lg shadow-md hover:shadow-lg transition duration-300"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    {proposal.senderProfile?.profile_image ? (
                      <img
                        src={proposal.senderProfile.profile_image}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <FaUserCircle className="w-12 h-12 text-gray-400" />
                    )}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {proposal.senderProfile?.firstname} {proposal.senderProfile?.lastname}
                      </h4>
                      <p className="text-sm text-gray-600">{proposal.senderProfile?.address}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProposal(proposal)}
                    className="w-full py-2 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal for Proposal Details */}
        {selectedProposal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full relative">
              <button
                onClick={() => setSelectedProposal(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Proposal Details</h3>

              {/* Sender Information */}
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Sender Information</h4>
              <div className="flex items-center mb-4">
                {selectedProposal .senderProfile?.profile_image ? (
                  <img
                    src={selectedProposal.senderProfile.profile_image}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border border-gray-200 mr-4"
                  />
                ) : (
                  <FaUserCircle className="w-16 h-16 text-gray-400 mr-4" />
                )}
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {selectedProposal.senderProfile?.firstname} {selectedProposal.senderProfile?.lastname}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Address:</strong> {selectedProposal.senderProfile?.address || "No address available"}
                  </p>
                  <Link
                    to={`/profile/${selectedProposal.senderProfile.profileType}/${selectedProposal.sender_id}`}
                    className="text-blue-500 hover:underline text-sm mt-2"
                  >
                    View Profile
                  </Link>
                </div>
              </div>

              {/* Proposal Information */}
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Proposal Information</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Project Name:</strong> {selectedProposal.project_name}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Description:</strong> {selectedProposal.project_description || "No description available"}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Due Date:</strong> {selectedProposal.due_date || "No due date"}
                </p>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => onRejectProposal(selectedProposal)} // Call the reject function
                  className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition duration-300"
                >
                  Reject
                </button>
                <button
                  onClick={() => onAcceptProposal(selectedProposal)} // Call the accept function
                  className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition duration-300"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistProject;
