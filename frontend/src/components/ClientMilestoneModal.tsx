import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";

interface Milestone {
  milestone_id: number;
  milestone_name: string;
  due_date: string;
  status: string;
  milestone_fee?: number;
  is_paid?: boolean;
}

interface Project {
  project_id: string;
  project_name: string;
}

interface Props {
  show: boolean;
  project: Project;
  milestones: Milestone[];
  onClose: () => void;
}

const ClientMilestoneModal: React.FC<Props> = ({
  show,
  project,
  milestones,
  onClose,
}) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/user/${user.id}`
        );
        if (response.status === 200) {
          const { firstname, lastname, email } = response.data;
          setFullName(`${firstname} ${lastname}`);
          setEmail(email || user.email);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [user]);

  if (!show || !project || !user) return null;

  const handlePayMilestone = async (milestone: Milestone) => {
    if (!email || !fullName) {
      alert("Missing user information for payment.");
      return;
    }

    try {
      const payload = {
        milestone_id: milestone.milestone_id,
        project_id: project.project_id,
        user_email: email,
        user_name: fullName,
        amount: Math.round((milestone.milestone_fee || 0) * 100),
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/milestone-payment/checkout`,
        payload
      );

      if (response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        alert("Failed to start payment session.");
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      alert("Payment initiation failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-center text-xl md:text-2xl font-bold text-gray-800">
            Milestone Stages –{" "}
            <span className="text-[#5C0601]">{project.project_name}</span>
          </h2>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden overflow-y-auto p-4 space-y-4">
          {milestones.map((milestone) => (
            <div
              key={milestone.milestone_id}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                {milestone.milestone_name}
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                Due: {milestone.due_date}
              </p>
              <p className="text-sm mb-1">
                Status:{" "}
                <span
                  className={`font-semibold ${
                    milestone.status === "Completed"
                      ? "text-green-600"
                      : milestone.status === "In Progress"
                      ? "text-yellow-600"
                      : "text-gray-500"
                  }`}
                >
                  {milestone.status}
                </span>
              </p>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Fee: ₱{milestone.milestone_fee?.toLocaleString() || "0"}
              </p>
              {milestone.is_paid ? (
                <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                  Paid
                </span>
              ) : (
                <button
                  onClick={() => handlePayMilestone(milestone)}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-blue-600 text-blue-700 text-sm font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-sm"
                >
                  Pay Now
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-y-auto p-4">
          <table className="w-full table-fixed text-sm border-separate border-spacing-y-2">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Stage</th>
                <th className="text-left px-4 py-2">Due Date</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Fee</th>
                <th className="text-center px-4 py-2">Payment</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone) => (
                <tr
                  key={milestone.milestone_id}
                  className="bg-white shadow-sm rounded-lg hover:shadow-md transition"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {milestone.milestone_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {milestone.due_date}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        milestone.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : milestone.status === "In Progress"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {milestone.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-700">
                    ₱{milestone.milestone_fee?.toLocaleString() || "0"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {milestone.is_paid ? (
                      <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                        Paid
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePayMilestone(milestone)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-blue-600 text-blue-700 font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-sm"
                      >
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-2.5 rounded-full border border-gray-500 text-gray-700 font-semibold hover:bg-gray-600 hover:text-white transition-all duration-200 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientMilestoneModal;
