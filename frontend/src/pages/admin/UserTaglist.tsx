import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import { FaTrashAlt, FaCheckCircle } from "react-icons/fa";
import Swal from "sweetalert2";

const UserTagList: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [loadingTags, setLoadingTags] = useState<boolean>(true);
  const [searchUserTerm, setSearchUserTerm] = useState<string>("");
  const [searchTagTerm, setSearchTagTerm] = useState<string>("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/users");
        setUsers(Array.isArray(response.data) ? response.data : []); // Ensure users is an array
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]); // Set to empty array on error
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchTags = async () => {
      try {
        const response = await axios.get("/tags");
        setTags(Array.isArray(response.data) ? response.data : []); // Ensure tags is an array
      } catch (error) {
        console.error("Error fetching tags:", error);
        setTags([]); // Set to empty array on error
      } finally {
        setLoadingTags(false);
      }
    };

    fetchUsers();
    fetchTags();
  }, []);

  const handleDeleteTag = async (id: number) => {
    const confirmation = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmation.isConfirmed) return;

    try {
      await axios.delete(`/tags/${id}`);
      setTags(tags.filter((tag) => tag.id !== id));
      Swal.fire("Deleted!", "Your tag has been deleted.", "success");
    } catch (error) {
      Swal.fire("Error", "Failed to delete tag.", "error");
    }
  };

  const filteredUsers = Array.isArray(users)
    ? users.filter((user) =>
        user.name.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchUserTerm.toLowerCase())
      )
    : [];

  const filteredTags = Array.isArray(tags)
    ? tags.filter((tag) =>
        tag.name.toLowerCase().includes(searchTagTerm.toLowerCase())
      )
    : [];

  if (!user) {
    return <div>Loading authentication...</div>;
  }

  if (loadingUsers || loadingTags) {
    return <div>Loading data...</div>;
  }

  return (
    <div className="p-6">
      <header className="bg-white shadow-md p-6 rounded-md mb-6 flex justify-between">
        <h1 className="text-3xl font-bold">User and Tag List</h1>
       
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl mb-4">Users</h2>
          <input
            type="text"
            placeholder="Search users"
            value={searchUserTerm}
            onChange={(e) => setSearchUserTerm(e.target.value)}
            className="w-full mb-4 p-2 border rounded-md"
          />
          <ul>
            {filteredUsers.map((user) => (
              <li
                key={user.id}
                className="p-2 border-b flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p>{user.email}</p>
                </div>
                <div>
                  {user.role}
                  {user.isVerified && (
                    <FaCheckCircle className="text-green-500 ml-2 inline-block" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Tags Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl mb-4">Tags</h2>
          <input
            type="text"
            placeholder="Search tags"
            value={searchTagTerm}
            onChange={(e) => setSearchTagTerm(e.target.value)}
            className="w-full mb-4 p-2 border rounded-md"
          />
          <ul>
            {filteredTags.map((tag) => (
              <li
                key={tag.id}
                className="p-2 border-b flex justify-between items-center"
              >
                <span>{tag.name}</span>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="text-red-500"
                >
                  <FaTrashAlt />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserTagList;