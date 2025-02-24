import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEye, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  address: string | null;
  role: string;
  isVerified?: boolean;
}

const UserTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchUsers = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const [artistResponse, clientResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/admin/artists`),
          axios.get(`${API_BASE_URL}/admin/clients`),
        ]);

        const combinedUsers = [
          ...artistResponse.data,
          ...clientResponse.data,
        ];

        setUsers(combinedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate]);

  const filteredUsers = users.filter((user) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      (user.username || "").toLowerCase().includes(lowerCaseSearchTerm) ||
      (user.email || "").toLowerCase().includes(lowerCaseSearchTerm) ||
      (user.address || "").toLowerCase().includes(lowerCaseSearchTerm) ||
      user.role.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  const handlePagination = (direction: string) => {
    if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">

    {/* Header Section */}
    <div className="text-center mb-8">
             <h1 className="text-4xl font-bold text-[#5C0601] mb-4">User Management</h1>
             <hr className="border-gray-300 mb-6" />
           </div>

      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search for users by name, username, email, address, or role"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full px-4 py-2 text-gray-900 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
            <tr>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Username</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Address</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Verified</th>
              <th scope="col" className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <th
                  scope="row"
                  className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap"
                >
                  <img
                    className="w-10 h-10 rounded-full"
                    src={`https://ui-avatars.com/api/?name=${user.name}`}
                    alt={`${user.name} avatar`}
                  />
                  <div className="pl-3">
                    <div className="text-base font-semibold">{user.name}</div>
                  </div>
                </th>
                <td className="px-6 py-4">
                  {user.username || "Username not provided"}
                </td>
                <td className="px-6 py-4">
                  {user.email || "Email not provided"}
                </td>
                <td className="px-6 py-4">
                  {user.address || "Address not provided"}
                </td>
                <td className="px-6 py-4">{user.role}</td>
                <td className="px-6 py-4">
                  {user.role === "Artist" ? (
                    user.isVerified ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaTimesCircle className="text-red-500" />
                    )
                  ) : (
                    <FaTimesCircle className="text-gray-400" />
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewDetails(user)}
                    className="text-black hover:text-gray-800"
                  >
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4">
          <span className="text-sm">
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredUsers.length)} of{" "}
            {filteredUsers.length} entries
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePagination("prev")}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              &lt;
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePagination("next")}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg w-full max-w-lg shadow-lg relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
              {selectedUser.name}
            </h2>
            <div className="space-y-4">
              <p>
                <strong>Email:</strong> {selectedUser.email || "Not provided"}
              </p>
              <p>
                <strong>Username:</strong>{" "}
                {selectedUser.username || "Not provided"}
              </p>
              <p>
                <strong>Address:</strong>{" "}
                {selectedUser.address || "Not provided"}
              </p>
              <p>
                <strong>Role:</strong> {selectedUser.role}
              </p>
              {selectedUser.role === "Artist" && (
                <p>
                  <strong>Verification:</strong>{" "}
                  {selectedUser.isVerified ? "Verified" : "Not Verified"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;