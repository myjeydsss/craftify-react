import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";
import { FaTrashAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface NotificationItem {  
    id: number;
    user_id: string;
    type: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = Math.floor(seconds / 31536000);

    if (interval >= 1) return interval === 1 ? "1 year ago" : `${interval} years ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval === 1 ? "1 month ago" : `${interval} months ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval === 1 ? "1 day ago" : `${interval} days ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval === 1 ? "1 hour ago" : `${interval} hours ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;
    return seconds < 5 ? "Just now" : `${seconds} seconds ago`;
};

const Notification: React.FC = () => {
    const { user } = useAuth();
    const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 10;

    const fetchNotificationItems = async () => {
        if (!user) return;

        try {
            const response = await axios.get<{ notifications: NotificationItem[] }>(
                `${import.meta.env.VITE_API_URL}/notifications/${user.id}`
            );

            if (Array.isArray(response.data.notifications)) {
                setNotificationItems(response.data.notifications);
            } else {
                setNotificationItems([]);
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 404) {
                    setNotificationItems([]);
                } else {
                    setError("Failed to fetch notification items.");
                }
            } else {
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
                `${import.meta.env.VITE_API_URL}/notifications/${user.id}/mark-all-as-read`
            );
            setNotificationItems((prevItems) =>
                prevItems.map((item) => ({ ...item, is_read: true }))
            );
        } catch (err) {
            alert("Failed to mark all notifications as read.");
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/notifications/${id}`);
            setNotificationItems((prevItems) => prevItems.filter((item) => item.id !== id));
        } catch (err) {
            alert("Failed to delete notification.");
        }
    };

    const deleteAllNotifications = async () => {
        try {
            await Promise.all(notificationItems.map(item => 
                axios.delete(`${import.meta.env.VITE_API_URL}/notifications/${item.id}`)
            ));
            setNotificationItems([]);
        } catch (err) {
            alert("Failed to delete all notifications.");
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

    // Pagination calculations
    const totalPages = Math.ceil(notificationItems.length / itemsPerPage);
    const paginatedItems = notificationItems.slice(
        (currentPage - 1) * itemsPerPage, 
        currentPage * itemsPerPage
    );

    return (
        <div className ="container mx-auto py-16 px-4">
            <h1 className="text-4xl font-bold text-center text-[#5C0601] mb-4">Notifications</h1>
            <hr className="border-gray-300 mb-6" />

            {notificationItems.length === 0 ? (
                <div className="text-center py-16 text-gray-600">
                    <p className="text-lg">You have no notifications at the moment.</p>
                    <p className="text-sm text-gray-500">Stay tuned for updates!</p>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <span>Total Notifications: {notificationItems.length}</span>
                        <div className="flex space-x-4">
                            <button 
                                onClick={markAllAsRead} 
                                disabled={notificationItems.length === 0}
                                className="bg-blue-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition duration-200"
                                aria-label="Mark all notifications as read"
                            >
                                Mark all as read
                            </button>
                            <button 
                                onClick={deleteAllNotifications} 
                                disabled={notificationItems.length === 0}
                                className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition duration-200"
                                aria-label="Delete all notifications"
                            >
                                Delete all
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {paginatedItems.map((notif: NotificationItem) => (
                            <div key={notif.id} className={`p-4 border rounded-lg shadow ${!notif.is_read ? 'bg-gray-100' : 'bg-white'}`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <span className={`h-2 w-2 rounded-full ${!notif.is_read ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                        <p className={`ml-2 ${!notif.is_read ? 'font-bold' : ''}`}>{notif.message}</p>
                                    </div>
                                    <button
                                        onClick={() => deleteNotification(notif.id)}
                                        className="text-red-500 hover:text-red-700"
                                        title="Delete Notification"
                                        aria-label={`Delete notification ${notif.id}`}
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {formatTimeAgo(notif.created_at)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Always show pagination controls */}
                    <div className="flex justify-center items-center mt-4 space-x-4">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="bg-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition duration-200"
                            aria-label="Previous page"
                        >
                            <FaChevronLeft />
                        </button>
                        <span className="text-sm font-medium">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="bg-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition duration-200"
                            aria-label="Next page"
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Notification;