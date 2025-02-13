import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";
import { FaTrashAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface NotificationItem {  
    id: string;
    user_id: string;
    type: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

const Notification: React.FC = () => {
    const { user } = useAuth();
    //const navigate = useNavigate();
    const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 10;

    const fetchNotificationItems = async () => {
        if (!user) return;

        try {
            const response = await axios.get<NotificationItem[]>(
                `${import.meta.env.VITE_API_URL}/notifications/${user.id}`
            );
            setNotificationItems(response.data);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 404) {
                    // Specifically handle case of no notifications for this user
                    setNotificationItems([]);
                } else {
                    console.error("Error fetching notification items:", err);
                    setError("Failed to fetch notification items.");
                }
            } else {
                console.error("Unexpected error:", err);
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }       
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/notification/${user.id}/mark-all-as-read`
            );
            setNotificationItems((prevItems) =>
                prevItems.map((item) => ({ ...item, is_read: true }))
            );
        } catch (err) {
            console.error("Error marking all notifications as read:", err);
            alert("Failed to mark all notifications as read.");
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/notifications/${id}`
            );
            setNotificationItems((prevItems) => 
                prevItems.filter((item) => item.id !== id)
            );
        } catch (err) {
            console.error("Error deleting notification:", err);
            alert("Failed to delete notification.");
        }
    };
    
    useEffect(() => {
        fetchNotificationItems();
    }, [user]);

    if (loading) {
        return <div className="text-center py-16 text-gray-600">Loading...</div>;
    }
    
    if (error) {
        return <div className="text-center py-16 text-red-500">{error}</div>;
    }
    
    if (notificationItems.length === 0) {
        return (
            <div className="text-center py-16 text-gray-600">
                No notifications available.
            </div>
        );
    }

    // Pagination calculations
    const totalPages = Math.ceil(notificationItems.length / itemsPerPage);
    const paginatedItems = notificationItems.slice(
        (currentPage - 1) * itemsPerPage, 
        currentPage * itemsPerPage
    );

    return (
        <div className="container mx-auto px-4 py-20">
          <h1 className="text-2xl font-bold mb-4">All Notifications</h1>
          <div className="flex justify-between items-center mb-4">
            <span>Total Notifications: {notificationItems.length}</span>
            <div>
              <button 
                onClick={markAllAsRead} 
                disabled={notificationItems.length === 0}
                className="text-blue-500 text-sm mr-4 disabled:opacity-50"
              >
                Mark all as read
              </button>
              <button 
                onClick={() => setNotificationItems([])} 
                disabled={notificationItems.length === 0}
                className="text-red-500 text-sm disabled:opacity-50"
              >
                Delete all
              </button>
            </div>
          </div>
    
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Message</th>
                  <th className="py-2 px-4 border-b text-center">Date Created</th>
                  <th className="py-2 px-4 border-b text-center">Status</th>
                  <th className="py-2 px-4 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((notif: NotificationItem) => (
                  <tr key={notif.id} className="border-b">
                    <td className="py-2 px-4 text-left">{notif.message}</td>
                    <td className="py-2 px-4 text-center">{new Date(notif.created_at).toLocaleDateString()}</td>
                    <td className="py-2 px-4 text-center">{notif.is_read ? "Read" : "Unread"}</td>
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete Notification"
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
    
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-4 space-x-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                <FaChevronLeft />
              </button>
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                <FaChevronRight />
              </button>
            </div>
          )}
        </div>
    );
};
    
export default Notification;