import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUser, FaSignInAlt, FaUserPlus, FaShoppingCart, FaBell, FaEnvelope, FaHistory } from "react-icons/fa";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthProvider";
import axios from "axios";

const NavBar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState<number>(0); // Cart count state
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const isActive = (path: string) => location.pathname === path;

  // Fetch user role
  const fetchUserRole = async () => {
    if (user) {
      try {
        const response = await axios.get(`${API_BASE_URL}/user-role/${user.id}`);
        setRole(response.data.role);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    }
  };

  // Fetch cart count
  const fetchCartCount = async () => {
    if (user) {
      try {
        const response = await axios.get(`${API_BASE_URL}/cart/count/${user.id}`);
        setCartCount(response.data.count);
      } catch (error) {
        console.error("Error fetching cart count:", error);
        setCartCount(0);
      }
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Fetch user role and cart count when user changes
  useEffect(() => {
    fetchUserRole();
    fetchCartCount();
  }, [user]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/logout`);
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Render navigation links based on user role
  const renderNavLinks = () => {
    if (!user) {
      return (
        <div className="absolute inset-x-0 flex justify-center">
          <div className="flex space-x-6">
            <Link to="/" className={`${isActive("/") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>Home</Link>
            <Link to="/explore" className={`${isActive("/explore") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>Explore</Link>
            <Link to="/about-us" className={`${isActive("/about-us") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>About Us</Link>
            <Link to="/how-it-works" className={`${isActive("/how-it-works") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>How It Works</Link>
          </div>
        </div>
      );
    }

    if (role === "Artist") {
      return (
        <div className="flex space-x-4">
          <Link to="/artist-dashboard" className={`${isActive("/artist-dashboard") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>Home</Link>
          <Link to="/artist-track-project" className={`${isActive("/artist-track-project") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>My Projects</Link>
          <Link to="/community" className={`${isActive("/community") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>Community</Link>
          <Link to="/artist-arts" className={`${isActive("/artist-arts") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>My Arts</Link>
        </div>
      );
    }

    if (role === "Client") {
      return (
        <div className="flex space-x-4">
          <Link to="/client-dashboard" className={`${isActive("/client-dashboard") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>Home</Link>
          <Link to="/client-project-page" className={`${isActive("/client-project-page") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>My Projects</Link>
          <Link to="/community" className={`${isActive("/community") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>Community</Link>
        </div>
      );
    }

    if (role === "Admin") {
      return (
        <div className="flex space-x-4">
          <Link to="/admin-dashboard" className={`${isActive("/admin-dashboard") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>Dashboard</Link>
          <Link to="/users-table" className={`${isActive("/users-table") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>Users Table</Link>
          <Link to="/tags-table" className={`${isActive("/tags-table") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>Tags Table</Link>
          <Link to="/arts-table" className={`${isActive("/arts-table") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>Arts Table</Link>
          <Link to="/verification" className={`${isActive("/verification") ? "text-orange-400 border-b-2 border-orange-400" : "text-black hover:text-gray-700"} px-3 py-2 rounded-md text-m font-medium`}>Verification</Link>
        </div>
      );
    }
  };

  return (
    <nav className="fixed w-full z-50 bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <img src={logo} alt="Logo" className="h-10" />
            </Link>
          </div>

          {/* Navigation Links */}
          {renderNavLinks()}

          {/* Right Icons */}
          {user ? (
            <div className="flex items-center space-x-6">
              {(role === "Artist" || role === "Client") && (
                <Link to="/cart" className="relative text-black px-3 hover:text-gray-700">
                  <FaShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
              <Link to="/transaction-history" className="relative text-black px-3 hover:text-gray-700">
                <FaHistory size={20} />
              </Link>
              <Link to="/messages" className="text-black hover:text-gray-700">
                <FaEnvelope size={20} />
                {/* Add notification badge if needed */}
              </Link>
              <Link to="/notifications" className="text-black hover:text-gray-700">
                <FaBell size={20} />
              </Link>
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={toggleDropdown}
                  className="text-black hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <FaUser size={20} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                    <Link
                      to={`/${role?.toLowerCase()}-profile`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Account
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={toggleDropdown}
                className="text-black hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                <FaUser size={20} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <FaSignInAlt className="mr-2" /> Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <FaUserPlus className="mr-2" /> Register
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;