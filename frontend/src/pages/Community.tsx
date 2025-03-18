import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthProvider';
import moment from 'moment';
import { FaUserCircle, FaComment, FaHeart, FaSpinner, FaTimes } from 'react-icons/fa';
import { HiDotsHorizontal } from 'react-icons/hi';
import Swal from 'sweetalert2';
import ModalCommunity from '../components/ModalCommunity';

interface User {
  user_id: string;
  firstname: string;
  lastname: string;
  role: string;
  profile_image: string | null;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: User;
}

interface Post {
  id: string;
  content: string;
  images: string[];
  created_at: string;
  user_id: string;
  likes: string[];
  user: User;
  comments: Comment[];
}

const Community: React.FC = () => {
    useEffect(() => {
        document.title = "Community";
      }, []);
    
  const { user } = useAuth();
  const [loggedInUser , setLoggedInUser ] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [newPostImages, setNewPostImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [commentContent, setCommentContent] = useState<{ [key: string]: string }>({});
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [postsPerPage] = useState<number>(10); // Number of posts per page
  const [totalPosts, setTotalPosts] = useState<number>(0); // Total number of posts
  const [editPostId, setEditPostId] = useState<string | null>(null); // ID of the post being edited
  const [editPostContent, setEditPostContent] = useState<string>(''); // Content of the post being edited
  const [actionMenus, setActionMenus] = useState<{ [key: string]: boolean }>({}); // State for action menus

  const [selectedImage, setSelectedImage] = useState<string | null>(null); // State for the selected image
  const [showImageModal, setShowImageModal] = useState<boolean>(false); // State to control the image modal


  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch logged-in user details
  useEffect(() => {
    if (!user) return;

    const fetchUserDetails = async () => {
      try {
        const response = await axios.get<User>(`${API_BASE_URL}/user/${user.id}`);
        setLoggedInUser (response.data);
      } catch (err) {
        console.error('Error fetching logged-in user details:', err);
        setError('Failed to fetch user details.');
      }
    };

    fetchUserDetails();
  }, [API_BASE_URL, user]);

  // Fetch posts with pagination
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<{ posts: Post[]; total: number }>(`${API_BASE_URL}/community-posts`, {
        params: {
          page: currentPage,
          limit: postsPerPage, // Load the number of posts specified by postsPerPage
        },
      });

      // Set posts and total count
      setPosts(response.data.posts);
      setTotalPosts(response.data.total); // Set total posts for pagination
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load community posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [API_BASE_URL, currentPage, postsPerPage]); // Fetch posts whenever currentPage or postsPerPage changes

  const handleNewPost = async () => {
    if (!user || !loggedInUser  || (!newPostContent.trim() && newPostImages.length === 0)) {
      setError('Please write something or upload an image to post.');
      return;
    }

    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('content', newPostContent);
      newPostImages.forEach((file) => formData.append('images', file));

      const response = await axios.post(`${API_BASE_URL}/community-posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newPost = response.data.post;

      // Add the logged-in user's details to the new post
      const postWithUser:  Post = {
        ...newPost,
        user: loggedInUser ,
        likes: [],
        comments: [],
      };

      setPosts((prevPosts) => [postWithUser , ...prevPosts]);
      setNewPostContent('');
      setNewPostImages([]);
      setPreviewImages([]);
      setError(null);
      
      // Toast notification for success
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Your post has been created!',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
      
      // Toast notification for error
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to create post. Please try again.',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    try {
      const response = await axios.post(`${API_BASE_URL}/community-posts/like`, {
        post_id: postId,
        user_id: user.id,
      });
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, likes: response.data.likes } : post
        )
      );
    } catch (err) {
      console.error('Error toggling like:', err);
      setError('Failed to like the post. Please try again.');
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to like the post. Please try again.',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!user || !(commentContent[postId] && commentContent[postId].trim())) {
      setError('Please write a comment before submitting.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/community-comments`, {
        post_id: postId,
        user_id: user.id,
        content: commentContent[postId],
      });

      if (response.data) {
        const newComment = response.data.comment;

        const newCommentWithUser  = {
          ...newComment,
          user: loggedInUser  || {
            firstname: 'Unknown',
            lastname: 'User  ',
            profile_image: null,
          },
        };

        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, comments: [...post.comments, newCommentWithUser ] }
              : post
          )
        );
        setCommentContent((prev) => ({ ...prev, [postId]: '' }));
        setError(null);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
    }
  };

  const toggleComments = useCallback((postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + newPostImages.length > 4) {
      setError('You can upload a maximum of 4 images.');
      Swal.fire('Warning!', 'You can upload a maximum of 4 images.', 'warning');
      return;
    }

    setNewPostImages((prev) => [...prev, ...files]);

    const previews = files.map((file) => {
      const reader = new FileReader();
      return new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previews).then((urls) => setPreviewImages((prev) => [...prev, ...urls]));
  };

  const removeImagePreview = (index: number) => {
    const updatedImages = newPostImages.filter((_, i) => i !== index);
    const updatedPreviews = previewImages.filter((_, i) => i !== index);
    setNewPostImages(updatedImages);
    setPreviewImages(updatedPreviews);
  };

  const handleEditPost = async (postId: string) => {
    if (!editPostContent.trim()) return;

    try {
      const response = await axios.patch(`${API_BASE_URL}/community-posts/${postId}`, {
        content: editPostContent,
      });

      if (response.status === 200) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, content: editPostContent } : post
          )
        );
        setEditPostId(null);
        setEditPostContent('');
        
        // Toast notification for edit success
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Your post has been updated!',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      }
    } catch (err) {
      console.error('Unexpected error while editing post:', err);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to edit the post. Please try again.',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action will delete the post and its associated images, and it cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });
  
    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/community-posts/${postId}`);
  
        if (response.status === 204) {
          // Remove the post from the local state
          setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  
          // Toast notification for delete success
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Your post and its images have been deleted!',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
        }
      } catch (err) {
        console.error('Unexpected error while deleting post:', err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to delete post. Please try again.',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      }
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setShowImageModal(false);
  };


  return (
    <div className="container mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold text-center text-[#5C0601] mb-4">Community</h1>
        <hr className="border-gray-300 mb-6" />

      {error && <div className="text-center text-red-600 font-semibold mb-6">{error}</div>}

      {/* Create a Post Section */}
      <div className="bg-white p-8 rounded-lg shadow-md mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create a Post</h2>
        <textarea
          placeholder="Share your thoughts..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C0601] mb-6 resize-none"
          rows={4}
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          disabled={isPosting}
        />

        {/* Image Upload */}
        <div className="mb-6">
          <label htmlFor="upload-images" className="block text-sm font-medium text-gray-600 mb-2">
            Add Photos (Optional, max 4 images)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            id="upload-images"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isPosting}
          />
          <label
            htmlFor="upload-images"
            className="cursor-pointer bg-[#5C0601] text-white py-2 px-6 rounded-lg hover:bg-[#7b0802] transition duration-200"
          >
            Choose Files
          </label>
          <span className="ml-4 text-sm text-gray-600">
            {newPostImages.length} {newPostImages.length === 1 ? "file" : "files"} selected
          </span>

          {/* Image Preview */}
          {previewImages.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-4">
              {previewImages.map((src, index) => (
                <div key={index} className="relative w-20 h-20 rounded-md overflow-hidden">
                  <img src={src} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImagePreview(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Button with Loading Animation */}
        <div className="flex justify-center mt-4">
          <button
            className={`py-2 px-8 w-1/3 rounded-full text-white font-semibold text-lg shadow-md ${
              isPosting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#5C0601] hover:bg-[#7b0802] transition-transform duration-200 transform hover:scale-105"
            }`}
            onClick={handleNewPost}
            disabled={isPosting}
          >
            {isPosting ? (
              <div className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" /> Posting...
              </div>
            ) : (
              "Post"
            )}
          </button>
        </div>
      </div>

     {/* Posts List */}
     <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <FaSpinner className="animate-spin text-4xl text-[#5C0601]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center">No posts available.</div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  {post.user?.profile_image ? (
                    <img
                      src={post.user.profile_image}
                      alt={`${post.user.firstname} ${post.user.lastname}`}
                      className="w-10 h-10 rounded-full mr-4"
                    />
                  ) : (
                    <FaUserCircle className="w-10 h-10 text-gray-500 mr-4" />
                  )}

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">
                      {post.user?.firstname || "Unknown"} {post.user?.lastname || "User  "}
                    </h3>
                    <p className="text-sm text-gray-500">{moment(post.created_at).fromNow()}</p>
                  </div>
                </div>

                {/* Kebab Menu for Edit and Delete */}
                {(post.user_id === user?.id || loggedInUser ?.role === 'Admin') && (
                  <div className="relative">
                    <button
                      onClick={() => setActionMenus((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="focus:outline-none"
                    >
                      <HiDotsHorizontal className="text-gray-600" />
                    </button>
                    {actionMenus[post.id] && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                        <button
                          onClick={() => {
                            setEditPostId(post.id);
                            setEditPostContent(post.content);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-2">
                {editPostId === post.id ? (
                  <div>
                    <textarea
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C0601] mb-6 resize-none"
                    />
                    <button
                      className="bg-[#5C0601] text-white py-2 px-6 rounded-md"
                      onClick={() => handleEditPost(post.id)}
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-700 mt-2">{post.content}</p>
                )}
              </div>

              {/* Post Images */}
              {post.images && post.images.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-2">
                  {post.images.map((image, index) => (
                    <img
                      key={`${post.id}-image-${index}`} // Ensure unique key for images
                      src={image}
                      alt={`Post ${index + 1}`}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300 cursor-pointer"
                      onClick={() => handleImageClick(image)} // Handle image click to open modal
                    />
                  ))}
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <div
                  className={`flex items-center cursor-pointer ${
                    post.likes.includes(user?.id || "") ? "text-red-500" : ""
                  }`}
                  onClick={() => handleLike(post.id)}
                >
                  <FaHeart className="mr-2" /> {post.likes.length} Likes
                </div>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => toggleComments(post.id)}
                >
                  <FaComment className="mr-2" /> {post.comments.length} Comments
                </div>
              </div>
    

   {/* Image Modal */}
   <ModalCommunity show={showImageModal} onClose={closeImageModal} imageSrc={selectedImage} />


              {/* Comments Section */}
              {expandedComments[post.id] && (
                <div className="mt-4 pl-8 space-y-4">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start">
                      {comment.user?.profile_image ? (
                        <img
                          src={comment.user.profile_image}
                          alt="User   "
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      ) : (
                        <FaUserCircle className="w-8 h-8 text-gray-500 mr-3" />
                      )}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">
                          {comment.user?.firstname || "Unknown"} {comment.user?.lastname || "User   "}
                        </h4>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                        <p className="text-xs text-gray-500">{moment(comment.created_at).fromNow()}</p>
                      </div>
                    </div>
                  ))}
                  <textarea
                    placeholder="Write a comment..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-[#5C0601] resize-none"
                    value={commentContent[post.id] || ""}
                    onChange={(e) =>
                      setCommentContent((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    className="bg-[#5C0601] text-white py-2 px-4 rounded-md mt-2"
                    onClick={() => handleCommentSubmit(post.id)}
                  >
                    Comment
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="bg-[#5C0601] text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        <span className="self-center text-lg">
          Page {currentPage} of {Math.ceil(totalPosts / postsPerPage)}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={posts.length < postsPerPage} // Disable if fewer posts than postsPerPage
          className="bg-[#5C0601] text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Community;