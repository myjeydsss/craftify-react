import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaTh,
  FaList,
  FaUserCircle,
  FaEye,
  FaRegCheckCircle,
  FaRegClock,
  FaCheck,
  FaRegEdit,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthProvider";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

interface Project {
  project_id: string;
  project_name: string;
  description: string;
  due_date: string;
  status: string;
  priority: string;
  proposal_id: string;
  budget?: string;
  clientProfile?: any;
  completion_percentage?: number;
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
  senderProfile?: any;
}

interface Milestone {
  milestone_id: number;
  milestone_name: string;
  due_date: string;
  status: string;
  completion_percentage: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL; // Ensure API URL is correctly set

const ArtistProject: React.FC = () => {
  useEffect(() => {
    document.title = "My Projects";
  }, []);

  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );
  const [activeView, setActiveView] = useState<"Board" | "List" | "Milestones">(
    "Board"
  );
  const [editMode, setEditMode] = useState<number | null>(null); // Track which milestone is being edited
  const [showMilestoneSidebar, setShowMilestoneSidebar] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { user } = useAuth();

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) return;

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/artist-projects/${user.id}`
        );

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

  // Fetch Proposals
  useEffect(() => {
    const fetchProposals = async () => {
      if (!user?.id) return;

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/proposals/${user.id}`
        );

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

  // Accept Proposals
  const onAcceptProposal = async (proposal: Proposal) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/artist/proposals/accept`,
        { proposal }
      );
      const newProject = response.data.newProject;

      // Update frontend state
      setProposals((prev) =>
        prev.filter((p) => p.proposal_id !== proposal.proposal_id)
      );
      setProjects((prev) => [...prev, newProject]);

      // Close the modal
      setSelectedProposal(null);

      // Show success toast
      Toast.fire({
        icon: "success",
        title: "Proposal accepted and project created!",
      });
    } catch (err) {
      console.error("Error accepting proposal:", err);
      Toast.fire({
        icon: "error",
        title: "Failed to accept proposal.",
      });
    }
  };

  // Reject Proposals
  const onRejectProposal = async (proposal: Proposal) => {
    try {
      await axios.post(`${API_BASE_URL}/api/proposals/reject`, {
        proposalId: proposal.proposal_id,
      });

      // Update frontend state
      setProposals((prev) =>
        prev.filter((p) => p.proposal_id !== proposal.proposal_id)
      );

      // Show success toast
      Toast.fire({
        icon: "success",
        title: "Proposal rejected.",
      });

      // Close the modal
      setSelectedProposal(null); // Close the modal after rejection
    } catch (err) {
      console.error("Error rejecting proposal:", err);
      Toast.fire({
        icon: "error",
        title: "Failed to reject proposal.",
      });
    }
  };

  // Update Project Status
  const updateProjectStatus = async (project: Project, newStatus: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/projects/update-status`,
        {
          project_id: project.project_id,
          status: newStatus,
        }
      );

      if (response.data.success) {
        setProjects((prev) =>
          prev.map((p) =>
            p.project_id === project.project_id
              ? { ...p, status: newStatus }
              : p
          )
        );
        // Show success toast
        Toast.fire({
          icon: "success",
          title: `Project status updated to "${newStatus}"!`,
        });
      }
    } catch (err) {
      console.error("Error updating project status:", err);
      Toast.fire({
        icon: "error",
        title: "Failed to update project status.",
      });
    }
  };

  // Update Project Priority
  const updateProjectPriority = async (
    project: Project,
    newPriority: string
  ) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/projects/update-priority`,
        {
          project_id: project.project_id,
          priority: newPriority,
        }
      );

      if (response.data.success) {
        setProjects((prev) =>
          prev.map((p) =>
            p.project_id === project.project_id
              ? { ...p, priority: newPriority }
              : p
          )
        );
        // Show success toast
        Toast.fire({
          icon: "success",
          title: `Project priority updated to "${newPriority}"!`,
        });
      }
    } catch (err) {
      console.error("Error updating project priority:", err);
      Toast.fire({
        icon: "error",
        title: "Failed to update project priority.",
      });
    }
  };

  // View Project Details
  const handleViewDetails = async (project: Project) => {
    try {
      setSelectedProject(project);
      setShowProjectDetails(true); // Open project details modal

      const response = await axios.get(
        `${API_BASE_URL}/api/projects/${project.project_id}/client_project_details`
      );

      if (response.data) {
        const updatedProject: Project = {
          ...project,
          budget: response.data.budget,
          clientProfile: response.data.clientProfile,
        };
        setSelectedProject(updatedProject);
      } else {
        console.error("Error fetching project details:", response);
      }
    } catch (err) {
      console.error("Error fetching project details:", err);
    }
  };

  // Project Progress Status
  useEffect(() => {
    const fetchInProgressProjects = async () => {
      if (!user?.id) return;

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/projects/in-progress-with-milestones`
        );

        if (Array.isArray(response.data)) {
          setProjects((prevProjects) =>
            prevProjects.map((p) => {
              const matchingProject = response.data.find(
                (inProgress: any) => inProgress.project_id === p.project_id
              );
              if (matchingProject) {
                const milestones = matchingProject.milestones || [];
                const totalCompletion = milestones.reduce(
                  (acc: number, m: any) => acc + (m.completion_percentage || 0),
                  0
                );
                const averageCompletion = milestones.length
                  ? Math.round(totalCompletion / milestones.length)
                  : 0;
                return { ...p, completion_percentage: averageCompletion };
              }
              return p; // Leave other projects untouched
            })
          );
        }
      } catch (err) {
        console.error("Error fetching in-progress projects:", err);
      }
    };

    fetchInProgressProjects();
  }, [user]);

  const recalculateProjectCompletion = (
    projectId: string,
    updatedMilestones: Milestone[]
  ) => {
    const totalCompletion = updatedMilestones.reduce(
      (acc, m) => acc + (m.completion_percentage || 0),
      0
    );
    const averageCompletion = updatedMilestones.length
      ? Math.round(totalCompletion / updatedMilestones.length)
      : 0;

    setProjects((prevProjects) =>
      prevProjects.map((p) =>
        p.project_id === projectId
          ? { ...p, completion_percentage: averageCompletion }
          : p
      )
    );
  };

  // Handles changes in input fields for milestones
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: string,
    milestone_id: number
  ) => {
    const value = e.target.value;
    setMilestones((prev) =>
      prev.map((milestone) =>
        milestone.milestone_id === milestone_id
          ? { ...milestone, [field]: value }
          : milestone
      )
    );
  };

  // Starts editing a milestone
  const handleEditMilestone = (milestone_id: number) => {
    setEditMode(milestone_id); // Set edit mode for the specific milestone
  };

  // Saves edited milestone
  const handleSaveEdit = async (milestone_id: number) => {
    const milestoneToUpdate = milestones.find(
      (m) => m.milestone_id === milestone_id
    );
    if (!milestoneToUpdate || !selectedProject) return;

    try {
      await axios.put(`${API_BASE_URL}/api/milestones/${milestone_id}`, {
        milestone_name: milestoneToUpdate.milestone_name,
        due_date: milestoneToUpdate.due_date,
        status: milestoneToUpdate.status,
      });

      // Refetch milestones after update
      const response = await axios.get(
        `${API_BASE_URL}/api/projects/${selectedProject.project_id}/milestones`
      );
      const updatedMilestones = response.data;
      setMilestones(updatedMilestones);

      // Recalculate completion percentage for the project
      recalculateProjectCompletion(
        selectedProject.project_id,
        updatedMilestones
      );

      Toast.fire({ icon: "success", title: "Milestone updated!" });
    } catch (err) {
      console.error("Error updating milestone:", err);
      Toast.fire({ icon: "error", title: "Failed to update milestone." });
    }

    setEditMode(null);
  };

  // Cancels editing
  const handleCancelEdit = () => {
    setEditMode(null); // Exit edit mode without saving changes
  };

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  // Fetch Milestones
  useEffect(() => {
    const fetchMilestones = async () => {
      if (!selectedProject) return;

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/projects/${selectedProject.project_id}/milestones`
        );
        setMilestones(response.data);
      } catch (err) {
        console.error("Error fetching milestones:", err);
      }
    };

    fetchMilestones();
  }, [selectedProject]); // Refetch milestones when the project changes

  const closeProjectModal = () => {
    setSelectedProject(null);
    setShowProjectDetails(false); // Close project details modal
  };

  // Pagination for List View
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Customize how many projects per page

  // Pagination for Milestone View
  const [currentMilestonePage, setCurrentMilestonePage] = useState(1);
  const milestonesPerPage = 5; // Customize how many projects per page in Milestone View

  // Pagination logic for List View
  const indexOfLastProject = currentPage * itemsPerPage;
  const indexOfFirstProject = indexOfLastProject - itemsPerPage;
  const currentProjects = projects.slice(
    indexOfFirstProject,
    indexOfLastProject
  );

  const totalPages = Math.ceil(projects.length / itemsPerPage);

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#5C0601] mb-4">
          Project Dashboard
        </h1>
        <hr className="border-gray-300 mb-6" />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Projects */}
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Projects</p>
            <p className="text-2xl font-bold">{projects.length}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <FaRegClock className="text-blue-600 text-2xl" />
          </div>
        </div>

        {/* Pending Proposals */}
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Pending Proposals</p>
            <p className="text-2xl font-bold">{proposals.length}</p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-lg">
            <FaUserCircle className="text-yellow-600 text-2xl" />
          </div>
        </div>

        {/* Ongoing Projects */}
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Ongoing Projects</p>
            <p className="text-2xl font-bold">
              {
                projects.filter(
                  (project) =>
                    project.status?.trim().toLowerCase() === "in progress"
                ).length
              }
            </p>
          </div>
          <div className="p-3 bg-purple-100 rounded-lg">
            <FaTh className="text-purple-600 text-2xl" />
          </div>
        </div>

        {/* Completed Projects */}
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Completed Projects</p>
            <p className="text-2xl font-bold">
              {projects.filter((project) => project.status === "Done").length}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg">
            <FaRegCheckCircle className="text-green-600 text-2xl" />
          </div>
        </div>
      </div>
      <hr className="border-gray-300 mb-6" />

      {/* View Options Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Select View</h2>
        <p className="text-sm text-gray-500">
          Choose how you want to display your projects:
        </p>
      </div>

      {/* View Options */}
      <div className="flex flex-col sm:flex-row justify-center mb-8 space-y-4 sm:space-y-0 sm:space-x-4">
        {["Board", "List", "Milestones"].map((view) => (
          <button
            key={view}
            onClick={() =>
              setActiveView(view as "Board" | "List" | "Milestones")
            }
            className={`flex items-center justify-center py-3 px-6 font-semibold rounded-lg shadow-md transition duration-300 ${
              activeView === view
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {view === "Board" ? (
              <FaTh className="mr-2" />
            ) : view === "List" ? (
              <FaList className="mr-2" />
            ) : (
              <FaRegClock className="mr-2" />
            )}
            {view}
          </button>
        ))}
      </div>

      <hr className="border-gray-300 mb-6" />

      {/* Board View */}
      {activeView === "Board" && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              "To Do",
              "In Progress",
              "Artist Completed the Project",
              "Artist Unable to Complete",
            ].map((status) => (
              <div key={status} className="bg-white p-4 rounded-md shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {status === "Artist Unable to Complete"
                    ? "Failed"
                    : status === "Artist Completed the Project"
                    ? "Done"
                    : status}{" "}
                  {/* Change label here */}
                </h3>
                <div className="space-y-4">
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
                        <h4 className="font-semibold text-gray-800">
                          {project.project_name}
                        </h4>
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
                            onChange={(e) =>
                              updateProjectStatus(project, e.target.value)
                            }
                            value={project.status || "To Do"}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Artist Completed the Project">
                              Done
                            </option>
                            <option value="Artist Unable to Complete">
                              Failed
                            </option>
                          </select>
                          {/* Priority Dropdown */}
                          <select
                            onChange={(e) =>
                              updateProjectPriority(project, e.target.value)
                            }
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
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-gray-200">
                  <tr className="text-gray-700">
                    <th className="py-3 px-4 text-sm font-semibold">Name</th>
                    <th className="py-3 px-4 text-sm font-semibold">
                      Due Date
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold">
                      Priority
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold">Status</th>
                    <th className="py-3 px-4 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProjects.map((project) => (
                    <tr
                      key={project.project_id}
                      className="border-b hover:bg-gray-100 transition duration-200"
                    >
                      <td className="py-3 px-4 text-sm">
                        {project.project_name}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {project.due_date || "No due date"}
                      </td>
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
              <div className="flex justify-center mt-4 space-x-2">
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-3 py-1 rounded ${
                      currentPage === index + 1
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestone View */}
      {activeView === "Milestones" && (
        <div className="container mx-auto px-4 py-8">
          {projects.filter((p) => p.status?.toLowerCase() === "in progress")
            .length > 0 ? (
            <>
              {projects
                .filter((p) => p.status?.toLowerCase() === "in progress")
                .slice(
                  (currentMilestonePage - 1) * milestonesPerPage,
                  currentMilestonePage * milestonesPerPage
                )
                .map((project) => (
                  <div
                    key={project.project_id}
                    className="mb-8 bg-white rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300"
                  >
                    {/* Project Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                          {project.project_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {project.description ||
                            "No project description available."}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 uppercase">
                          In Progress
                        </span>
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                            project.priority === "High"
                              ? "bg-red-100 text-red-700"
                              : project.priority === "Normal"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {project.priority} Priority
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                      <div className="flex-1 mr-0 sm:mr-4">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                          Overall Progress
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              project.completion_percentage || 0
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }`}
                            style={{
                              width: `${project.completion_percentage || 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 mt-2 sm:mt-0">
                        {`${project.completion_percentage || 0}%`} Complete
                      </span>
                    </div>

                    {/* View Milestone Button */}
                    <div className="text-right">
                      <button
                        onClick={async () => {
                          setSelectedProject(project);
                          try {
                            const response = await axios.get(
                              `${API_BASE_URL}/api/projects/${project.project_id}/milestones`
                            );
                            setMilestones(response.data);
                            setShowMilestoneSidebar(true);
                          } catch (err) {
                            console.error("Error fetching milestones:", err);
                          }
                        }}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300"
                      >
                        View Milestone Stages
                      </button>
                    </div>
                  </div>
                ))}
              {/* Pagination Controls */}
              <div className="flex justify-center mt-6 space-x-2">
                {Array.from({
                  length: Math.ceil(
                    projects.filter(
                      (p) => p.status?.toLowerCase() === "in progress"
                    ).length / milestonesPerPage
                  ),
                }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMilestonePage(index + 1)}
                    className={`px-3 py-1 rounded ${
                      currentMilestonePage === index + 1
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-600 text-lg mt-12">
              <p className="text-xl sm:text-2xl font-semibold mb-2">
                No Projects In Progress
              </p>
              <p className="text-sm text-gray-500">
                Once a project moves to "In Progress," you'll see it here.
              </p>
            </div>
          )}

          {/* Milestone Modal */}
          {showMilestoneSidebar && selectedProject && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 ease-out">
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-2xl w-11/12 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 relative transform scale-95 animate-fadeIn max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white pb-4 border-b mb-4 z-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-center text-gray-800">
                    Milestone Stages -{" "}
                    <span className="text-[#5C0601]">
                      {selectedProject.project_name}
                    </span>
                  </h3>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto">
                  <table className="w-full text-sm table-fixed border-collapse">
                    <thead className="bg-gray-100">
                      <tr className="text-left text-gray-600 text-xs sm:text-sm">
                        <th className="py-2 px-3 sm:px-4 w-1/3">Stage</th>
                        <th className="py-2 px-3 sm:px-4 w-1/4">Due Date</th>
                        <th className="py-2 px-3 sm:px-4 w-1/4">Status</th>
                        <th className="py-2 px-3 sm:px-4 w-1/6">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {milestones.map((milestone) => (
                        <tr
                          key={milestone.milestone_id}
                          className="border-t hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-3 sm:px-4">
                            {editMode === milestone.milestone_id ? (
                              <input
                                type="text"
                                className="border px-2 py-1 rounded w-full text-xs sm:text-sm"
                                value={milestone.milestone_name}
                                onChange={(e) =>
                                  handleEditChange(
                                    e,
                                    "milestone_name",
                                    milestone.milestone_id
                                  )
                                }
                              />
                            ) : (
                              <span className="text-gray-800 text-xs sm:text-sm">
                                {milestone.milestone_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            {editMode === milestone.milestone_id ? (
                              <input
                                type="date"
                                className="border px-2 py-1 rounded w-full text-xs sm:text-sm"
                                value={milestone.due_date}
                                onChange={(e) =>
                                  handleEditChange(
                                    e,
                                    "due_date",
                                    milestone.milestone_id
                                  )
                                }
                              />
                            ) : (
                              <span className="text-gray-600 text-xs sm:text-sm">
                                {milestone.due_date}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            {editMode === milestone.milestone_id ? (
                              <select
                                className="border px-2 py-1 rounded w-full text-xs sm:text-sm"
                                value={milestone.status}
                                onChange={(e) =>
                                  handleEditChange(
                                    e,
                                    "status",
                                    milestone.milestone_id
                                  )
                                }
                              >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            ) : (
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  milestone.status === "Completed"
                                    ? "bg-green-100 text-green-700"
                                    : milestone.status === "In Progress"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {milestone.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 sm:px-4 flex space-x-2">
                            {editMode === milestone.milestone_id ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleSaveEdit(milestone.milestone_id)
                                  }
                                  className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded-md text-xs sm:text-sm"
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded-md text-xs sm:text-sm"
                                >
                                  <FaTimes />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  handleEditMilestone(milestone.milestone_id)
                                }
                                className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded-md text-xs sm:text-sm"
                              >
                                <FaRegEdit />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Close Button (bottom) */}
                  <div className="text-center mt-8">
                    <button
                      onClick={closeProjectModal}
                      className="px-8 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project Details Modal */}
      {showProjectDetails && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 ease-out">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full relative transform scale-95 animate-fadeIn">
            {/* Close Button */}
            <button
              onClick={closeProjectModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl transition-transform transform hover:scale-110"
            >
              &times;
            </button>

            {/* Modal Header */}
            <h3 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
              Project Details
            </h3>

            {/* Project Info */}
            <div className="space-y-5">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Project Name
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedProject.project_name}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Description
                </p>
                <p className="text-base text-gray-700">
                  {selectedProject.description || "No description available"}
                </p>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Budget
                  </p>
                  <p className="text-base text-gray-700">
                    {selectedProject.budget
                      ? `₱ ${selectedProject.budget.toLocaleString()}`
                      : "No budget available"}
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Due Date
                  </p>
                  <p className="text-base text-gray-700">
                    {selectedProject.due_date
                      ? new Intl.DateTimeFormat("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(selectedProject.due_date))
                      : "No due date"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Status
                </p>
                <span
                  className={`inline-block px-3 py-1 text-sm rounded-full ${
                    selectedProject.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : selectedProject.status === "In Progress"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {selectedProject.status}
                </span>
              </div>

              {/* Sender Information */}
              {selectedProject.clientProfile && (
                <div className="border rounded-xl p-4 bg-gray-50">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    Client Information
                  </h4>
                  <div className="flex items-center">
                    {selectedProject.clientProfile.profile_image ? (
                      <img
                        src={selectedProject.clientProfile.profile_image}
                        alt="Sender Profile"
                        className="w-16 h-16 rounded-full object-cover border border-gray-300 mr-4 shadow-sm"
                      />
                    ) : (
                      <FaUserCircle className="w-16 h-16 text-gray-400 mr-4" />
                    )}
                    <div>
                      <p className="text-base font-medium text-gray-900">
                        {selectedProject.clientProfile.firstname}{" "}
                        {selectedProject.clientProfile.lastname}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Address:</strong>{" "}
                        {selectedProject.clientProfile.address ||
                          "No address available"}
                      </p>
                      <Link
                        to={`/profile/${selectedProject.clientProfile.profileType}/${selectedProject.clientProfile.user_id}`}
                        className="text-blue-500 hover:underline text-sm mt-1 inline-block"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button (bottom) */}
            <div className="text-center mt-8">
              <button
                onClick={closeProjectModal}
                className="px-8 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposals Section */}
      <div className="mt-10">
        <hr className="border-gray-300 mb-6" />
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          Proposal List
        </h2>
        {proposals.length === 0 ? (
          <div className="text-center text-gray-600 text-lg">
            No proposals yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
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
                      {proposal.senderProfile?.firstname}{" "}
                      {proposal.senderProfile?.lastname}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {proposal.senderProfile?.address}
                    </p>
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
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 relative animate-fadeIn">
            {/* Close Button (X) */}
            <button
              onClick={() => setSelectedProposal(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>

            {/* Modal Header */}
            <h3 className="text-2xl font-extrabold text-gray-900 text-center mb-4 border-b pb-2">
              Proposal Details
            </h3>

            {/* Project Info */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 uppercase font-semibold">
                  Project Name
                </p>
                <p className="text-base font-bold text-gray-900">
                  {selectedProposal.project_name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 uppercase font-semibold">
                  Description
                </p>
                <p className="text-base text-gray-800">
                  {selectedProposal.project_description ||
                    "No description available"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 uppercase font-semibold">
                  Budget
                </p>
                <p className="text-base text-gray-800">
                  {selectedProposal.budget
                    ? `₱ ${selectedProposal.budget.toLocaleString()}`
                    : "No budget available"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 uppercase font-semibold">
                  Due Date
                </p>
                <p className="text-base text-gray-800">
                  {selectedProposal.due_date
                    ? new Intl.DateTimeFormat("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(selectedProposal.due_date))
                    : "No due date"}
                </p>
              </div>
            </div>

            {/* Sender Details Section */}
            {selectedProposal.senderProfile && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Sender Information
                </h4>
                <div className="flex items-center mb-2">
                  {selectedProposal.senderProfile.profile_image ? (
                    <img
                      src={selectedProposal.senderProfile.profile_image}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border border-gray-200 mr-4"
                    />
                  ) : (
                    <FaUserCircle className="w-16 h-16 text-gray-400 mr-4" />
                  )}
                  <div>
                    <p className="text-base font-medium text-gray-900">
                      {selectedProposal.senderProfile.firstname}{" "}
                      {selectedProposal.senderProfile.lastname}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Address:</strong>{" "}
                      {selectedProposal.senderProfile.address ||
                        "No address available"}
                    </p>
                    <Link
                      to={`/profile/${selectedProposal.senderProfile.profileType}/${selectedProposal.sender_id}`}
                      className="text-blue-500 hover:underline text-sm mt-2"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between space-x-4 mt-6">
              <button
                onClick={() => onRejectProposal(selectedProposal)} // Call the reject function
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition duration-300 transform hover:scale-105"
              >
                Reject
              </button>
              <button
                onClick={() => onAcceptProposal(selectedProposal)} // Call the accept function
                className="flex-1 px-4 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition duration-300 transform hover:scale-105"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistProject;
