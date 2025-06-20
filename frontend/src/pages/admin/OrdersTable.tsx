import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import { FaEye } from "react-icons/fa";
import moment from "moment";

interface Order {
  id: string;
  date: string;
  amount: number | null;
  status: string;
  description: string;
  artist_id: string;
  art_id: string;
}

const OrdersTable: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${API_BASE_URL}/admin/orders`);
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    const status = order.status?.toLowerCase() || "";
    const description = order.description?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();

    const matchText = status.includes(term) || description.includes(term);
    const orderDate = moment(order.date);
    const afterStart = startDate
      ? orderDate.isSameOrAfter(moment(startDate), "day")
      : true;
    const beforeEnd = endDate
      ? orderDate.isSameOrBefore(moment(endDate), "day")
      : true;

    return matchText && afterStart && beforeEnd;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const openModal = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handlePagination = (direction: string) => {
    if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-lg text-gray-600">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center text-[#5C0601] mb-10">
        Orders & Transactions
      </h1>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by status or description..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <button
              onClick={resetFilters}
              className="mt-1 md:mt-6 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-[#f8f8f8] text-xs uppercase text-gray-700">
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order, index) => (
              <tr
                key={order.id}
                className={`${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } border-b hover:bg-gray-100 transition duration-150`}
              >
                <td className="px-6 py-4">
                  {moment(order.date).format("MMM D, YYYY")}
                </td>
                <td className="px-6 py-4">
                  {order.amount !== null
                    ? `$${order.amount.toFixed(2)}`
                    : "N/A"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openModal(order)}
                    className="text-blue-600 hover:text-blue-800 transition"
                  >
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#f9f9f9] text-sm">
          <span>
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredOrders.length)} of{" "}
            {filteredOrders.length}
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

      {/* Order Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xl relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-4 text-gray-500 hover:text-black text-2xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-[#3B82F6]">
              Order Details
            </h2>
            <div className="space-y-3 text-sm">
              <p>
                <strong>ID:</strong> {selectedOrder.id}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {moment(selectedOrder.date).format("LLL")}
              </p>
              <p>
                <strong>Amount:</strong>{" "}
                {selectedOrder.amount !== null
                  ? `$${selectedOrder.amount.toFixed(2)}`
                  : "N/A"}
              </p>
              <p>
                <strong>Status:</strong> {selectedOrder.status}
              </p>
              <p>
                <strong>Description:</strong> {selectedOrder.description}
              </p>
              <p>
                <strong>Artist ID:</strong> {selectedOrder.artist_id}
              </p>
              <p>
                <strong>Art ID:</strong> {selectedOrder.art_id}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
