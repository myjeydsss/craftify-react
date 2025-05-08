import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import ClipLoader from "react-spinners/ClipLoader";

interface Order {
  id: string;
  date: string;
  amount: number;
  status: string;
  description: string;
  user_name: string; // Added user_name field
}

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-200 text-yellow-700",
  Completed: "bg-green-200 text-green-700",
  Canceled: "bg-red-200 text-red-700",
};

const ITEMS_PER_PAGE = 5; // Number of items to display per page

const ArtistTransactionHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // State to track the status and saving state for each order
  const [editStatuses, setEditStatuses] = useState<Record<string, string>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  const fetchOrders = async () => {
    if (!user) {
      setError("User not logged in.");
      setLoading(false);
      return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    try {
      const artistResponse = await axios.get(
        `${API_BASE_URL}/artist/${user.id}`
      );
      const artistId = artistResponse.data.artist_id;

      if (!artistId) {
        setError("Artist ID not found for this user.");
        setLoading(false);
        return;
      }

      const ordersResponse = await axios.get(
        `${API_BASE_URL}/artist-orders/${artistId}`
      );
      setOrders(ordersResponse.data);

      // Initialize editStatuses and savingStates
      const initialStatuses = ordersResponse.data.reduce(
        (acc: Record<string, string>, order: Order) => {
          acc[order.id] = order.status;
          return acc;
        },
        {}
      );
      setEditStatuses(initialStatuses);

      const initialSavingStates = ordersResponse.data.reduce(
        (acc: Record<string, boolean>, order: Order) => {
          acc[order.id] = false;
          return acc;
        },
        {}
      );
      setSavingStates(initialSavingStates);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.error || "Failed to fetch orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setEditStatuses((prev) => ({ ...prev, [orderId]: newStatus }));
  };

  const saveStatus = async (orderId: string) => {
    setSavingStates((prev) => ({ ...prev, [orderId]: true }));
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      await axios.put(`${API_BASE_URL}/order/${orderId}`, {
        status: editStatuses[orderId],
      });
      console.log(
        `Order ${orderId} status updated to ${editStatuses[orderId]}`
      );
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: editStatuses[orderId] }
            : order
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setSavingStates((prev) => ({ ...prev, [orderId]: false }));
    }
  };

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
        <h1 className="text-3xl md:text-4xl font-bold text-[#5C0601] mb-6">
          Transaction History
        </h1>
        <hr className="border-gray-300 mb-6" />

        {currentOrders.length > 0 ? (
          <div className="space-y-4">
            {currentOrders.map((order) => (
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
                <p className="mt-2 text-gray-700">
                  Your art has been purchased by{" "}
                  <span className="font-bold">{order.user_name}</span> on{" "}
                  {new Date(order.date).toLocaleDateString()}.
                </p>
                <p className="mt-2 font-bold">
                  ₱{(order.amount / 100).toFixed(2)}
                </p>

                {/* Dropdown for status */}
                <div className="mt-4">
                  <label
                    htmlFor={`status-${order.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Update Status:
                  </label>
                  <select
                    id={`status-${order.id}`}
                    value={editStatuses[order.id]}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#5C0601] focus:border-[#5C0601] sm:text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                  <button
                    onClick={() => saveStatus(order.id)}
                    disabled={savingStates[order.id]}
                    className="mt-2 px-4 py-2 bg-[#5C0601] text-white rounded-md hover:bg-[#7A0A0A] disabled:opacity-50"
                  >
                    {savingStates[order.id] ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ))}
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
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
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

export default ArtistTransactionHistory;
