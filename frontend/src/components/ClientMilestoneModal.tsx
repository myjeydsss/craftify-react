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
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl p-6 relative animate-fadeIn max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b pb-4 mb-4">
          <h2 className="text-center text-xl md:text-2xl font-extrabold text-gray-800">
            Milestone Stages –{" "}
            <span className="text-[#5C0601]">{project.project_name}</span>
          </h2>
        </div>

        {/* Table */}
        <div className="overflow-auto">
          <table className="w-full table-fixed text-sm border-separate border-spacing-y-1">
            <thead className="bg-gray-100 rounded">
              <tr className="text-gray-600 text-xs uppercase">
                <th className="text-left py-2 px-4">Stage</th>
                <th className="text-left py-2 px-4">Due Date</th>
                <th className="text-left py-2 px-4">Status</th>
                <th className="text-left py-2 px-4">Fee</th>
                <th className="text-center py-2 px-4">Payment</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone) => (
                <tr
                  key={milestone.milestone_id}
                  className="bg-white shadow-sm hover:shadow-md transition duration-200"
                >
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {milestone.milestone_name}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {milestone.due_date}
                  </td>
                  <td className="py-3 px-4">
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
                  <td className="py-3 px-4 font-semibold text-gray-700">
                    ₱{milestone.milestone_fee?.toLocaleString() || "0"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {milestone.is_paid ? (
                      <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                        Paid
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePayMilestone(milestone)}
                        className="inline-flex items-center px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full shadow-sm transition"
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
        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-8 py-2.5 rounded-full border border-gray-600 text-gray-700 font-semibold hover:bg-gray-600 hover:text-white transition-all duration-200 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientMilestoneModal;
