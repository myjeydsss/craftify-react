import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: string;
  artworkName: string;
  artistName: string;
}

const statusColors: Record<string, string> = {
  Completed: "bg-green-200 text-green-700",
  Pending: "bg-yellow-200 text-yellow-700",
  Canceled: "bg-red-200 text-red-700",
};

const TransactionHistory: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL;

      try {
        const response = await axios.get(`${API_BASE_URL}/transactions/${user.id}`);
        setTransactions(response.data);
      } catch (err: any) {
        console.error("Error fetching transactions:", err);
        setError(err.response?.data?.error || "Failed to fetch transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500 text-lg">Loading transaction history...</div>
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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>

      {transactions.length > 0 ? (
        <div className="overflow-y-auto h-96 border border-gray-300 rounded-md">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600">
                <th className="p-3">Date</th>
                <th className="p-3">Artwork</th>
                <th className="p-3">Artist</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{new Date(transaction.date).toLocaleDateString()}</td>
                  <td className="p-3">{transaction.artworkName}</td>
                  <td className="p-3">{transaction.artistName}</td>
                  <td className="p-3">₱{transaction.amount.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-sm ${statusColors[transaction.status] || "bg-gray-200 text-gray-700"}`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-700">No transactions found.</p>
      )}
    </div>
  );
};

export default TransactionHistory;