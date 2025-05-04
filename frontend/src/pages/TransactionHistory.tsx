import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";
import ClipLoader from "react-spinners/ClipLoader";

interface Order {
  id: string;
  date: string;
  amount: number;
  status: string;
  description: string;
}

const statusColors: Record<string, string> = {
  Completed: "bg-green-200 text-green-700",
  Pending: "bg-yellow-200 text-yellow-700",
  Canceled: "bg-red-200 text-red-700",
};

const ITEMS_PER_PAGE = 5; // Number of items to display per page

const TransactionHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchOrders = async () => {
    if (!user) {
      setError("User not logged in.");
      setLoading(false);
      return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    try {
      const response = await axios.get(`${API_BASE_URL}/orders/${user.id}`);
      setOrders(response.data);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.error || "Failed to fetch orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [user]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <ClipLoader color="#3498db" loading={loading} size={80} />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  // Calculate the current orders to display
  const indexOfLastOrder = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstOrder = indexOfLastOrder - ITEMS_PER_PAGE;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen px-4 py-20">
      <div className="container mx-auto max-w-5xl bg-white shadow-lg rounded-lg p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#5C0601] mb-6">Orders History</h1>
        <hr className="border-gray-300 mb-6" />

        {currentOrders.length > 0 ? (
          <div className="space-y-4">
            {currentOrders.map((order) => {
              console.log("Order:", order); // Debug log
              return (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 bg-white shadow hover:shadow-md transition"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold">
                      {new Date(order.date).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        statusColors[order.status] || "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-2">{order.description}</p>
                  <p className="mt-2 font-bold">₱{(order.amount / 100).toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-700">No orders found.</p>
        )}

        {/* Pagination Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-[#5C0601] text-white rounded-md hover:bg-[#7A0A0A] disabled:opacity-50 mb-2 md:mb-0"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-[#5C0601] text-white rounded-md hover:bg-[#7A0A0A] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;