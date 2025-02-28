import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";

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

const TransactionHistory: React.FC = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        if (!user) {
            setError("User  not logged in.");
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
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-gray-500 text-lg">Loading order history...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-lg">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-16">
            <div className="container mx-auto max-w-5xl bg-white shadow-lg rounded-lg p-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Transaction History</h1>

                {orders.length > 0 ? (
                    <div className="overflow-y-auto h-96 border border-gray-300 rounded-md">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-left text-gray-600">
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="border-t hover:bg-gray-50 transition duration-200">
                                        <td className="p-4">{new Date(order.date).toLocaleDateString()}</td>
                                        <td className="p-4">{order.description}</td>
                                        <td className="p-4">₱{order.amount.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-sm ${statusColors[order.status] || "bg-gray-200 text-gray-700"}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-700">No orders found.</p>
                )}
            </div>
        </div>
    );
};

export default TransactionHistory;