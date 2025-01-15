import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa"; // Import the user icon
import logo from "../assets/logo.png"; // Import your logo
import { useAuth } from "../context/AuthProvider"; // Import the AuthProvider context
import axios from "axios";

const NavBar: React.FC = () => {
  const { user, signOut } = useAuth(); // Use `signOut` from AuthProvider
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

    // Check and log the API URL environment variable
    const API_BASE_URL = import.meta.env.VITE_API_URL; // This is the correct approach for Vite // Correct for Vite
    console.log("API URL:", API_BASE_URL);  // This should print the URL from environment variables

  // Function to check if the current route is active
  const isActive = (path: string) => location.pathname === path;

  // Toggle dropdown state
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Fetch the role of the logged-in user
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

  useEffect(() => {
    fetchUserRole();
  }, [user]); // Re-run when `user` changes

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/logout`);
      await signOut(); // Update the state in AuthProvider
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="fixed w-full z-50 bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo on the Left */}
          <div className="flex-shrink-0">
            <Link to="/">
              <img src={logo} alt="Logo" className="h-10" />
            </Link>
          </div>

          {/* Guest Links Centered */}
          {!user && (
            <div className="absolute inset-x-0 flex justify-center">
              <div className="hidden sm:block">
                <div className="flex space-x-4">
                  <Link
                    to="/"
                    className={`${
                      isActive("/")
                        ? "text-orange-400 border-b-2 border-orange-400"
                        : "text-black hover:text-gray-700"
                    } px-3 py-2 rounded-md text-m font-medium transition-all duration-300`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/explore"
                    className={`${
                      isActive("/explore")
                        ? "text-orange-400 border-b-2 border-orange-400"
                        : "text-black hover:text-gray-700"
                    } px-3 py-2 rounded-md text-m font-medium transition-all duration-300`}
                  >
                    Explore
                  </Link>
                  <Link
                    to="/about-us"
                    className={`${
                      isActive("/about-us")
                        ? "text-orange-400 border-b-2 border-orange-400"
                        : "text-black hover:text-gray-700"
                    } px-3 py-2 rounded-md text-m font-medium transition-all duration-300`}
                  >
                    About Us
                  </Link>
                  <Link
                    to="/how-it-works"
                    className={`${
                      isActive("/how-it-works")
                        ? "text-orange-400 border-b-2 border-orange-400"
                        : "text-black hover:text-gray-700"
                    } px-3 py-2 rounded-md text-m font-medium transition-all duration-300`}
                  >
                    How It Works
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Authenticated User Links */}
          {user ? (
            <div className="relative flex items-center">
              <div ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="text-black hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <FaUser size={20} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                    {role && (
                      <Link
                        to={`/${role.toLowerCase()}-dashboard`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}
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
            <div className="relative flex items-center">
              <div ref={dropdownRef}>
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
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;