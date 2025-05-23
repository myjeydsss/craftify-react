import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import Swal from "sweetalert2";

interface CartItem {
  id: string;
  art_id: string;
  quantity: number;
  arts: {
    user_id: string;
    title: string;
    image_url: string;
    price: string;
    artist?: {
      username: string;
    };
  };
}

const Cart: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCartItems = async () => {
    if (!user) return;

    try {
      const response = await axios.get<CartItem[]>(
        `${import.meta.env.VITE_API_URL}/cart/${user.id}`
      );
      setCartItems(response.data);
    } catch (err) {
      console.error("Error fetching cart items:", err);
      setError("Failed to fetch cart items.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (artId: string) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/cart/${user?.id}/${artId}`
      );
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.art_id !== artId)
      );
      setSelectedItems((prev) => prev.filter((item) => item.art_id !== artId));

      Toast.fire({
        icon: "success",
        title: "Item removed from cart.",
      });
    } catch (err) {
      console.error("Error removing item from cart:", err);
      Toast.fire({
        icon: "error",
        title: "Failed to remove item from cart.",
      });
    }
  };

  const handleSelectItem = (item: CartItem) => {
    if (selectedItems.some((selected) => selected.art_id === item.art_id)) {
      setSelectedItems((prev) =>
        prev.filter((selected) => selected.art_id !== item.art_id)
      );
    } else {
      setSelectedItems((prev) => [...prev, item]);
    }
  };

  const calculateTotalPrice = () => {
    return selectedItems.reduce((total, item) => {
      const price = parseFloat(item.arts.price) || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const proceedToCheckout = () => {
    if (selectedItems.length === 0) {
      Toast.fire({
        icon: "warning",
        title: "Please select items to proceed.",
      });
      return;
    }

    navigate("/checkout", { state: { selectedItems } });
  };

  const handleViewArtDetails = (artId: string) => {
    navigate(`/art/${artId}`);
  };

  useEffect(() => {
    fetchCartItems();
  }, [user]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <ClipLoader color="#3498db" loading={loading} size={80} />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );

  if (error) {
    return <div className="text-center py-16 text-red-500">{error}</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">Your cart is empty.</div>
    );
  }

  const groupedItems = cartItems.reduce((acc, item) => {
    const artistName = item.arts.artist?.username || "Unknown Artist";
    if (!acc[artistName]) {
      acc[artistName] = [];
    }
    acc[artistName].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  return (
    <div className="min-h-screen px-4 py-16">
      <div className="container mx-auto max-w-5xl bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-4xl font-bold text-[#5C0601] mb-8">
          Your Art Collection
        </h1>
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([artistName, items]) => (
            <div
              key={artistName}
              className="border rounded-lg p-6 bg-gray-50 shadow-md"
            >
              {/* Artist's Username */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {artistName}
              </h2>

              {/* List of Art Items */}
              <div className="space-y-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row items-center justify-between border-b pb-4"
                  >
                    {/* Checkbox and Art Details */}
                    <div className="flex items-center space-x-4 w-full">
                      <input
                        type="checkbox"
                        checked={selectedItems.some(
                          (selected) => selected.art_id === item.art_id
                        )}
                        onChange={() => handleSelectItem(item)}
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <img
                        src={item.arts.image_url}
                        alt={item.arts.title}
                        className="w-24 h-24 object-cover rounded-lg shadow-md cursor-pointer"
                        onClick={() => handleViewArtDetails(item.art_id)}
                      />
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900">
                          {item.arts.title}
                        </h2>
                        <p className="text-gray-600">
                          ₱{parseFloat(item.arts.price).toLocaleString()} x{" "}
                          {item.quantity}
                        </p>
                      </div>
                    </div>

                    {/* Price and Remove Button */}
                    <div className="flex items-center space-x-6 mt-4 md:mt-0">
                      <p className="text-lg font-medium text-gray-900">
                        ₱
                        {(
                          parseFloat(item.arts.price) * item.quantity
                        ).toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.art_id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <FaTrashAlt size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 border-t pt-6">
          <p className="text-lg font-bold text-gray-900">
            Total Price: ₱{calculateTotalPrice().toLocaleString()}
          </p>
        </div>
        <button
          onClick={proceedToCheckout}
          className="mt-6 bg-blue-600 text-white text-lg font-medium py-3 px-8 rounded-lg shadow hover:bg-blue-700 w-full"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;
