import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";
import { FaHeart, FaShoppingCart } from "react-icons/fa";
import Swal from "sweetalert2";

interface Artist {
  user_id: string;
  firstname: string;
  lastname: string;
  bio: string;
  profile_image: string | null;
  address: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Art {
  art_id: string;
  title: string;
  description: string | null;
  price: string;
  image_url: string | null;
  artist: Artist | null;
  tags: Tag[];
  medium: string | null;
  art_style: string | null;
  subject: string | null;
  quantity: number;
  created_at: string;
}

const ArtDetail: React.FC = () => {
  const { artId } = useParams<{ artId: string }>();
  const { user } = useAuth();
  const [art, setArt] = useState<Art | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<boolean>(false);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  useEffect(() => {
    const fetchArtDetails = async () => {
      try {
        const response = await axios.get<Art>(
          `${import.meta.env.VITE_API_URL}/art/${artId}`
        );
        setArt(response.data);

        // Set the document title after fetching the art details
        if (response.data && response.data.artist) {
          document.title = `${response.data.title} | ${response.data.artist.firstname} ${response.data.artist.lastname}`;
        }

        if (user) {
          const wishlistResponse = await axios.get<string[]>(
            `${import.meta.env.VITE_API_URL}/wishlist/${user.id}`
          );
          setWishlist(wishlistResponse.data.includes(artId || ""));
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("Art not found.");
        } else {
          setError("Failed to fetch art details.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (artId) {
      fetchArtDetails();
    } else {
      setError("Invalid art ID.");
      setLoading(false);
    }
  }, [artId, user]);

  const handleWishlistToggle = async () => {
    if (!user) {
      alert("Please log in to manage your wishlist.");
      return;
    }

    try {
      const action = wishlist ? "remove" : "add";
      await axios.post(`${import.meta.env.VITE_API_URL}/wishlist`, {
        userId: user.id,
        artId,
        action,
      });
      setWishlist(!wishlist);

      // Show toast notification
      Swal.fire({
        icon: "success",
        title: wishlist ? "Removed from Wishlist" : "Added to Wishlist",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Failed to update wishlist:", err);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert("Please log in to add items to your cart.");
      return;
    }

    if (!art) {
      alert("Invalid art item.");
      return;
    }

    try {
      // Check if the item is already in the cart
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/cart/${user.id}`
      );
      const cartItems = response.data;

      const itemExists = cartItems.some(
        (item: any) => item.art_id === art.art_id
      );

      if (itemExists) {
        alert("This item is already in your cart.");
        return;
      }

      // Proceed to add the item to the cart
      await axios.post(`${import.meta.env.VITE_API_URL}/cart`, {
        userId: user.id,
        artId: art.art_id,
        quantity: selectedQuantity,
      });

      // Show toast notification
      Swal.fire({
        icon: "success",
        title: "Item added to cart!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Error adding item to cart:", err);
      alert("Failed to add item to cart.");
    }
  };

  const handleQuantityChange = (value: string) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity) && quantity > 0) {
      setSelectedQuantity(Math.min(quantity, art?.quantity || 1));
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-16 text-red-500">{error}</div>;
  }

  if (!art) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="container mx-auto max-w-full bg-white shadow-lg rounded-lg p-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Art Image */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden shadow-md flex items-center justify-center">
            {art.image_url ? (
              <img
                src={art.image_url}
                alt={art.title}
                className="w-full h-[800px] object-contain rounded-lg"
              />
            ) : (
              <div className="w-full h-[800px] bg-gray-300 flex items-center justify-center text-gray-500">
                Image Not Available
              </div>
            )}

            <button
              onClick={handleWishlistToggle}
              className={`absolute top-3 right-3 bg-white p-3 rounded-full shadow-md transition ${
                wishlist ? "text-red-500" : "text-gray-400 hover:text-red-500"
              }`}
            >
              <FaHeart size={24} />
            </button>
          </div>

          {/* Art Details */}
          <div className="flex flex-col justify-start space-y-6">
            <h1 className="text-6xl font-bold text-gray-900">{art.title}</h1>
            <p className="text-lg text-gray-600">
              {art.description || "No description available."}
            </p>

            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                About the Craft
              </h2>
              <div className="grid grid-cols-2 gap-4 text-lg">
                <p className="text-gray-700">
                  <strong>Subject:</strong> {art.subject || "Unknown"}
                </p>
                <p className="text-gray-700">
                  <strong>Medium:</strong> {art.medium || "Unknown"}
                </p>
                <p className="text-gray-700">
                  <strong>Art Style:</strong> {art.art_style || "Unknown"}
                </p>
                <p className="text-gray-700">
                  <strong>Year Created:</strong>{" "}
                  {new Date(art.created_at).getFullYear()}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-lg font-bold text-gray-800">Tags:</h3>
              {art.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {art.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="bg-orange-100 text-orange-700 text-sm font-medium px-3 py-1 rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 mt-2">No tags specified.</p>
              )}
            </div>

            {/* Price, Quantity, and Add to Cart */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-orange-500">
                  ₱{parseFloat(art.price).toLocaleString()}
                </p>
                <div className="flex items-center">
                  <label
                    htmlFor="quantity"
                    className="text-lg font-medium text-gray-700 mr-2"
                  >
                    Quantity:
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    value={selectedQuantity}
                    min="1"
                    max={art.quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-20 px-3 py-2 border rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                className="bg-blue-600 text-white text-lg font-medium py-3 px-8 rounded-lg shadow hover:bg-blue-700 w-full mt-4 flex justify-center items-center"
              >
                <FaShoppingCart className="mr-2" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Artist Details */}
        {art.artist && (
          <div className="mt-12 bg-gray-100 p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Artist of the Craft
            </h2>
            <div className="flex items-center gap-6">
              {art.artist.profile_image ? (
                <img
                  src={art.artist.profile_image}
                  alt={`${art.artist.firstname} ${art.artist.lastname}`}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {art.artist.firstname} {art.artist.lastname}
                </h3>
                <p className="text-lg text-gray-700">
                  {art.artist.address || "No address provided"}
                </p>
                <p className="text-md font-medium text-gray-700">
                  {art.artist.bio || "No bio available."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtDetail;
