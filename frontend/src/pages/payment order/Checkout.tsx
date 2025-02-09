import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

interface CartItem {
  id: string;
  art_id: string;
  quantity: number;
    arts: {
    user_id: string;
    title: string;
    image_url: string;
    price: string;
  };
}

const Checkout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shippingInfo, setShippingInfo] = useState({
    fullname: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Get selected items from cart state
    const selectedItems: CartItem[] = location.state?.selectedItems || [];
    if (selectedItems.length === 0) {
      navigate("/cart");
      return;
    }

    setCartItems(selectedItems);
    setLoading(false);

    // Fetch user details for pre-filling shipping info
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/${user.id}`);

        if (response.status === 200) {
          setShippingInfo({
            fullname: `${response.data.firstname} ${response.data.lastname}`,
            phone: response.data.phone || "",
            address: response.data.address || "",
          });
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError("Could not fetch user details. Please check your profile.");
      }
    };

    fetchUserDetails();
  }, [user, navigate, location]);

  const calculateSubtotal = () =>
    cartItems.reduce(
      (total, item) => total + parseFloat(item.arts.price) * item.quantity,
      0
    );

  const calculateTax = (subtotal: number) => subtotal * 0.05;

  const calculateTotalPrice = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
    };

  const clearCart = async (artIds: string[]) => {
    try {
      console.log('Clearing cart for user:', user?.id, 'with artIds:', artIds); // Debug log
      
      await axios.delete(`${import.meta.env.VITE_API_URL}/cart/${user?.id}`, {
        data: { artIds },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Cart cleared successfully'); // Debug log
    } catch (err) {
      console.error("Error clearing cart:",err);
    }
  };

  
  const handlePayment = async () => {
    try {
      const totalAmount = calculateTotalPrice() * 100; // Convert to cents
      
      // First verify we have items to process
      if (!cartItems.length) {
        setError('No items in cart');
        return;
      }
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/create-checkout-session`, {
        amount: totalAmount,
        currency: 'PHP',
        description: 'Purchase from Craftify',
        email: user?.email,
        name: user?.email
      });
  
      const checkoutUrl = response.data;

        //Notify user and artist
      await handleNotification();
      // Clear cart before opening payment window
      const artIds = cartItems.map(item => item.art_id);
      await clearCart(artIds);
      
      window.location.href = checkoutUrl; 
  
    } catch (error) {
      console.error('Error during checkout:',error);
      setError('Failed to process checkout. Please try again.');
    }
  };

    const handleArtistNotification = async (artistId: string) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/notifications`, {
                user_id: artistId,
                message: "Your art has been sold successfully.",
                type: "success"
            });
        } catch (err) {
            console.error("Error creating artist notification:", err);
        }
    };

    const handleNotification = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/notifications`, {
                user_id: user?.id,
                message: "Your order has been placed successfully.",
                type: "success"
            });

            // Notify each artist
            const artistIds = [...new Set(cartItems.map(item => item.arts.user_id))];
            for (const artistId of artistIds) {
                await handleArtistNotification(artistId);
                console.log(`artist user id = ${artistId}`); // Debug log

            }
        } catch (err) {
            console.error("Error creating notification:", err);
        }
    };
  if (loading) {
    return <div className="text-center py-16 text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-16 text-red-500">{error}</div>;
  }

  if (!cartItems.length) {
    return (
      <div className="text-center py-16 text-gray-600">
        Your cart is empty.
        <button
          onClick={() => navigate("/cart")}
          className="ml-2 text-blue-600 underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="container mx-auto max-w-5xl bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Shipping Information */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Shipping Information
          </h2>
          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={shippingInfo.fullname}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, fullname: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={shippingInfo.phone}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, phone: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                value={shippingInfo.address}
                onChange={(e) =>
                  setShippingInfo({ ...shippingInfo, address: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your shipping address"
                rows={4}
              ></textarea>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Order Summary
          </h2>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.arts.image_url}
                    alt={item.arts.title}
                    className="w-16 h-16 object-cover rounded-lg shadow-md"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {item.arts.title}
                    </h3>
                    <p className="text-gray-600">
                      ₱{parseFloat(item.arts.price).toLocaleString()} x{" "}
                      {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  ₱{(parseFloat(item.arts.price) * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Subtotal:</h3>
              <p className="text-xl font-bold text-gray-900">
                ₱{calculateSubtotal().toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Tax (5%):</h3>
              <p className="text-xl font-bold text-gray-900">
                ₱{calculateTax(calculateSubtotal()).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Total:</h3>
              <p className="text-xl font-bold text-orange-500">
                ₱{calculateTotalPrice().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Proceed Button */}
        <button
          onClick={handlePayment}
          className="mt-8 w-full bg-blue-600 text-white text-lg font-medium py-3 px-8 rounded-lg shadow hover:bg-blue-700"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default Checkout;