import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaSignInAlt,
  FaUserPlus,
  FaShoppingCart,
  FaBell,
  FaEnvelope,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import logo from "../assets/logo.webp";
import { useAuth } from "../context/AuthProvider";
import axios from "axios";

const NavBar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] =
    useState<number>(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const isActive = (path: string) => location.pathname === path;

  // Fetch user role
  const fetchUserRole = async () => {
    if (user) {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/user-role/${user.id}`
        );
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
        const response = await axios.get(
          `${API_BASE_URL}/cart/count/${user.id}`
        );
        setCartCount(response.data.count);
      } catch (error) {
        console.error("Error fetching cart count:", error);
        setCartCount(0);
      }
    }
  };

  // Fetch unread notifications count
  const fetchUnreadNotificationsCount = async () => {
    if (user) {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/notifications/count/${user.id}`
        );
        setUnreadNotificationsCount(response.data.count);
      } catch (error) {
        console.error("Error fetching unread notifications count:", error);
        setUnreadNotificationsCount(0);
      }
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  // Toggle mobile menu
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
        setMobileMenuOpen(false); // Close sidebar when clicking outside
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Fetch user role, cart count, and unread notifications count when user changes
  useEffect(() => {
    fetchUserRole();
    fetchCartCount();
    fetchUnreadNotificationsCount();
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

  // Handle scroll event to set isScrolled state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Render desktop navigation links based on user role
  const renderDesktopNavLinks = () => {
    if (!user) {
      return (
        <div className="hidden md:flex md:space-x-6">
          <Link
            to="/"
            className={`${
              isActive("/")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            Home
          </Link>
          <Link
            to="/explore"
            className={`${
              isActive("/explore")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            Explore
          </Link>
          <Link
            to="/about-us"
            className={`${
              isActive("/about-us")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            About Us
          </Link>
          <Link
            to="/how-it-works"
            className={`${
              isActive("/how-it-works")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            How It Works
          </Link>
        </div>
      );
    }

    const commonLinks = [{ to: "/community", label: "Community" }];

    if (role === "Artist") {
      return (
        <div className="hidden md:flex md:space-x-4">
          <Link
            to="/dashboard"
            className={`${
              isActive("/dashboard")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            Dashboard
          </Link>
          <Link
            to="/artist-track-project"
            className={`${
              isActive("/artist-track-project")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            My Projects
          </Link>
          <Link
            to="/artist-arts"
            className={`${
              isActive("/artist-arts")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            My Arts
          </Link>
          {commonLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`${
                isActive(link.to)
                  ? "text-orange-400 border-b-2 border-orange-400"
                  : "text-black hover:text-gray-700"
              } px-3 py-2 rounded-md text-m font-medium`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      );
    }

    if (role === "Client") {
      return (
        <div className="hidden md:flex md:space-x-4">
          <Link
            to="/dashboard"
            className={`${
              isActive("/dashboard")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            Dashboard
          </Link>
          <Link
            to="/client-project-page"
            className={`${
              isActive("/client-project-page")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            My Projects
          </Link>
          {commonLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`${
                isActive(link.to)
                  ? "text-orange-400 border-b-2 border-orange-400"
                  : "text-black hover:text-gray-700"
              } px-3 py-2 rounded-md text-m font-medium`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      );
    }

    if (role === "Admin") {
      return (
        <div className="hidden md:flex md:space-x-4">
          <Link
            to="/admin-dashboard"
            className={`${
              isActive("/admin-dashboard")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            Dashboard
          </Link>
          <Link
            to="/users-table"
            className={`${
              isActive("/users-table")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            Users Table
          </Link>
          <Link
            to="/tags-table"
            className={`${
              isActive("/tags-table")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            Tags Table
          </Link>
          <Link
            to="/arts-table"
            className={`${
              isActive("/arts-table")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            Arts Table
          </Link>
          <Link
            to="/verification"
            className={`${
              isActive("/verification")
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-black hover:text-gray-700"
            } px-3 py-2 rounded-md text-m font-medium`}
          >
            Verification
          </Link>
          {commonLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`${
                isActive(link.to)
                  ? "text-orange-400 border-b-2 border-orange-400"
                  : "text-black hover:text-gray-700"
              } px-3 py-2 rounded-md text-m font-medium`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      );
    }
  };

  // Render mobile navigation links based on user role
  const renderMobileNavLinks = () => {
    if (!user) {
      return (
        <div className="flex flex-col space-y-4 p-4">
          <Link
            to="/"
            onClick={handleLinkClick}
            className={`${
              isActive("/")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            Home
          </Link>
          <Link
            to="/explore"
            onClick={handleLinkClick}
            className={`${
              isActive("/explore")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            Explore
          </Link>
          <Link
            to="/about-us"
            onClick={handleLinkClick}
            className={`${
              isActive("/about-us")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            About Us
          </Link>
          <Link
            to="/how-it-works"
            onClick={handleLinkClick}
            className={`${
              isActive("/how-it-works")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            How It Works
          </Link>
        </div>
      );
    }

    const commonLinks = [{ to: "/community", label: "Community" }];

    if (role === "Artist") {
      return (
        <div className="flex flex-col space-y-4 p-4">
          <Link
            to="/dashboard"
            onClick={handleLinkClick}
            className={`${
              isActive("/dashboard")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            Dashboard
          </Link>
          <Link
            to="/artist-track-project"
            onClick={handleLinkClick}
            className={`${
              isActive("/artist-track-project")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            My Projects
          </Link>
          <Link
            to="/artist-arts"
            onClick={handleLinkClick}
            className={`${
              isActive("/artist-arts")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            My Arts
          </Link>
          {commonLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={handleLinkClick}
              className={`${
                isActive(link.to)
                  ? "text-orange-400"
                  : "text-black hover:text-gray-700"
              } text-base font-medium`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      );
    }

    if (role === "Client") {
      return (
        <div className="flex flex-col space-y-4 p-4">
          <Link
            to="/dashboard"
            onClick={handleLinkClick}
            className={`${
              isActive("/dashboard")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            Dashboard
          </Link>
          <Link
            to="/client-project-page"
            onClick={handleLinkClick}
            className={`${
              isActive("/client-project-page")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            My Projects
          </Link>
          {commonLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={handleLinkClick}
              className={`${
                isActive(link.to)
                  ? "text-orange-400"
                  : "text-black hover:text-gray-700"
              } text-base font-medium`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      );
    }

    if (role === "Admin") {
      return (
        <div className="flex flex-col space-y-4 p-4">
          <Link
            to="/admin-dashboard"
            onClick={handleLinkClick}
            className={`${
              isActive("/admin-dashboard")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            Dashboard
          </Link>
          <Link
            to="/users-table"
            onClick={handleLinkClick}
            className={`${
              isActive("/users-table")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            Users Table
          </Link>
          <Link
            to="/tags-table"
            onClick={handleLinkClick}
            className={`${
              isActive("/tags-table")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            Tags Table
          </Link>
          <Link
            to="/arts-table"
            onClick={handleLinkClick}
            className={`${
              isActive("/arts-table")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            Arts Table
          </Link>
          <Link
            to="/verification"
            onClick={handleLinkClick}
            className={`${
              isActive("/verification")
                ? "text-orange-400"
                : "text-black hover:text-gray-700"
            } text-base font-medium`}
          >
            Verification
          </Link>
          {commonLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={handleLinkClick}
              className={`${
                isActive(link.to)
                  ? "text-orange-400"
                  : "text-black hover:text-gray-700"
              } text-base font-medium`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      );
    }
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false); // Close sidebar when a link is clicked
  };

  return (
    <>
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/70 backdrop-blur-md shadow-lg"
            : "bg-white shadow-lg"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 hidden md:block">
              <img src={logo} alt="Logo" className="h-10" />
            </div>

            {/* Hamburger Icon for Mobile */}
            <div className="flex-shrink-0 md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-black focus:outline-none"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:space-x-6">
              {renderDesktopNavLinks()}
            </div>

            {/* Right Icons */}
            {user ? (
              <div className="flex items-center space-x-6">
                {/* Visible on desktop */}
                <div className="hidden md:flex items-center space-x-6">
                  {(role === "Artist" || role === "Client") && (
                    <Link
                      to="/cart"
                      className="relative text-black px-3 hover:text-gray-700"
                    >
                      <FaShoppingCart size={20} />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md text-[10px]">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  )}
                  <Link
                    to="/messages"
                    className="text-black hover:text-gray-700"
                  >
                    <FaEnvelope size={20} />
                  </Link>
                  <Link
                    to="/notifications"
                    className="relative text-black px-2 hover:text-gray-700"
                  >
                    <FaBell size={20} />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </Link>
                </div>
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={toggleDropdown}
                    className="text-black hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                    aria-label="User  menu"
                  >
                    <FaUser size={20} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                      <Link
                        to={`/${role?.toLowerCase()}-profile`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleLinkClick}
                      >
                        Account
                      </Link>
                      <Link
                        to="/cart"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 md:hidden"
                        onClick={handleLinkClick}
                      >
                        Cart
                      </Link>
                      <Link
                        to="/messages"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 md:hidden"
                        onClick={handleLinkClick}
                      >
                        Messages
                      </Link>
                      <Link
                        to="/notifications"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 md:hidden"
                        onClick={handleLinkClick}
                      >
                        Notifications
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setDropdownOpen(false); // Close dropdown after logout
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        aria-label="Logout"
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
                  aria-label="User  menu"
                >
                  <FaUser size={20} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                    <Link
                      to="/login"
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={handleLinkClick}
                    >
                      <FaSignInAlt className="mr-2" /> Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={handleLinkClick}
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

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={toggleMobileMenu}
        />
      )}
      <div
        className={`fixed top-0 left-0 z-50 w-64 h-full bg-white shadow-lg transform transition-transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4">{renderMobileNavLinks()}</div>
      </div>
    </>
  );
};

export default NavBar;
