import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useAuth } from "../../context/AuthProvider";

interface MilestonePayment {
  milestone_id: string;
  project_id: string | number;
  amount: number;
  status: string;
  paid_at: string | null;
  milestone_name: string;
}

const MilestoneTransactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<MilestonePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (!user) return;

    const fetchMilestoneTransactions = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const response = await axios.get(
          `${API_BASE_URL}/admin/milestone-transactions`
        );
        setTransactions(response.data || []);
      } catch (error) {
        console.error("Error fetching milestone transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestoneTransactions();
  }, [user]);

  const filtered = transactions.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      (t.milestone_name?.toLowerCase() || "").includes(term) ||
      String(t.project_id).toLowerCase().includes(term) ||
      (t.status?.toLowerCase() || "").includes(term)
    );
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handlePagination = (direction: string) => {
    if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-lg text-gray-600">
        Loading milestone transactions...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center text-[#5C0601] mb-8">
        Milestone Payment Transactions
      </h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by milestone, project or status..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => {
            setCurrentPage(1); // reset to page 1 when searching
            setSearchTerm(e.target.value);
          }}
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Milestone ID</th>
              <th className="px-6 py-4">Project ID</th>
              <th className="px-6 py-4">Milestone Name</th>
              <th className="px-6 py-4">Amount (₱)</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Paid At</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((t, index) => (
              <tr
                key={`${t.milestone_id}-${t.project_id}-${index}`}
                className={`${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } border-b hover:bg-gray-100`}
              >
                <td className="px-6 py-4">{t.milestone_id}</td>
                <td className="px-6 py-4">{t.project_id}</td>
                <td className="px-6 py-4">{t.milestone_name}</td>
                <td className="px-6 py-4">₱{t.amount.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      t.status
                    )}`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {t.paid_at
                    ? moment(t.paid_at).format("MMM D, YYYY h:mm A")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-center px-6 py-4 bg-[#f9f9f9] text-sm">
          <span>
            Showing {indexOfFirst + 1} to{" "}
            {Math.min(indexOfLast, filtered.length)} of {filtered.length}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePagination("prev")}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              &lt;
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePagination("next")}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneTransactions;
