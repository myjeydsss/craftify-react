import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaPen, FaTrashAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate } from "react-router-dom";

interface Tag {
  id: number;
  name: string | null;
}

const TagTable: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchTags = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/tags`);
        setTags(response.data || []); // Ensure data is always an array
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [user, navigate]);

  const filteredTags = tags.filter(
    (tag) =>
      tag &&
      tag.name &&
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTags = filteredTags.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTags.length / itemsPerPage);

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      Swal.fire("Error", "Tag name cannot be empty", "error");
      return;
    }

    try {
      // Remove `response` if it is not used
      await axios.post(`${API_BASE_URL}/tags`, { name: newTagName });

      // Refetch the tags list after adding a new tag to ensure table refresh
      const updatedTagsResponse = await axios.get(`${API_BASE_URL}/tags`);
      setTags(updatedTagsResponse.data || []);
      setNewTagName(""); // Clear the input field

      Swal.fire("Success", "Tag added successfully!", "success");
    } catch (error: any) {
      if (error.response?.data?.error === "Tag already exists") {
        Swal.fire("Error", "This tag already exists", "error");
      } else {
        Swal.fire("Error", "Failed to add tag", "error");
      }
    }
  };

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
      await axios.delete(`${API_BASE_URL}/tags/${id}`);
      const updatedTagsResponse = await axios.get(`${API_BASE_URL}/tags`);
      setTags(updatedTagsResponse.data || []); // Refetch tags after deletion

      Swal.fire("Deleted!", "The tag has been deleted.", "success");
    } catch (error) {
      Swal.fire("Error", "Failed to delete tag", "error");
    }
  };

  const handleEditTag = async () => {
    if (!editingTag || !editingTag.name?.trim()) {
      Swal.fire("Error", "Tag name cannot be empty", "error");
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/tags/${editingTag.id}`, {
        name: editingTag.name,
      });

      const updatedTagsResponse = await axios.get(`${API_BASE_URL}/tags`);
      setTags(updatedTagsResponse.data || []); // Refetch tags after editing

      setEditingTag(null);
      Swal.fire("Success", "Tag updated successfully!", "success");
    } catch (error: any) {
      if (error.response?.data?.error === "Tag already exists") {
        Swal.fire("Error", "This tag already exists", "error");
      } else {
        Swal.fire("Error", "Failed to update tag", "error");
      }
    }
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
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#5C0601] mb-4">
          Tag Management
        </h1>
        <hr className="border-gray-300 mb-6" />
      </div>

      {/* Search and Add Tag Row */}
      <div className="flex items-center space-x-4 mb-6">
        <input
          type="text"
          placeholder="Search for tags"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-2/3 px-4 py-2 text-gray-900 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="text"
          placeholder="Add a new tag"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          className="block w-1/3 px-4 py-2 text-gray-900 border rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
        />
        <button
          onClick={handleAddTag}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
        >
          Add
        </button>
      </div>

      {/* Tags Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
            <tr>
              <th scope="col" className="px-6 py-3">
                ID
              </th>
              <th scope="col" className="px-6 py-3">
                Tag Name
              </th>
              <th scope="col" className="px-6 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {currentTags.map((tag) => (
              <tr key={tag.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{tag.id}</td>
                <td className="px-6 py-4">{tag.name || "Unnamed Tag"}</td>
                <td className="px-6 py-4 flex space-x-2">
                  <button
                    onClick={() => setEditingTag(tag)}
                    className="text-black hover:text-gray-800"
                  >
                    <FaPen />
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-black hover:text-gray-800"
                  >
                    <FaTrashAlt />
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
            {Math.min(indexOfLastItem, filteredTags.length)} of{" "}
            {filteredTags.length} entries
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

      {/* Edit Modal */}
      {editingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg w-full max-w-lg shadow-lg relative">
            <button
              onClick={() => setEditingTag(null)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
              Edit Tag
            </h2>
            <input
              type="text"
              value={editingTag.name || ""}
              onChange={(e) =>
                setEditingTag({ ...editingTag, name: e.target.value })
              }
              className="block w-full px-4 py-2 text-gray-900 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleEditTag}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagTable;
