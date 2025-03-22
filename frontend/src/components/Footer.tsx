import React from "react";
import logo from "../assets/logo.webp"; // Adjust the path as necessary
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa"; // Import social media icons
import { Link } from "react-router-dom"; // Corrected import from "react-router-dom"

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#5C0601] py-10">
      {" "}
      {/* Changed background color to a darker shade */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* Logo and Description */}
          <div className="text-center md:text-left">
            <img
              src={logo}
              alt="Craftify Logo"
              className="h-12 mb-2 mx-auto md:mx-0"
              loading="lazy"
            />
            <p className="text-gray-300 max-w-xs mx-auto md:mx-0">
              {" "}
              {/* Changed text color to a lighter shade */}
              Discover and connect with the finest local artists. Personalized
              recommendations and secure transactions for every art lover.
            </p>
          </div>

          {/* Footer Links */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-10 text-center md:text-left">
            <div>
              <h3 className="font-bold text-[#CA5310] mb-2">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/"
                    aria-label="Go to Home"
                    className="text-gray-300 hover:text-[#CA5310] transition duration-300"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about-us"
                    aria-label="Learn more about us"
                    className="text-gray-300 hover:text-[#CA5310] transition duration-300"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    aria-label="Contact us"
                    className="text-gray-300 hover:text-[#CA5310] transition duration-300"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy-policy"
                    aria-label="Read our privacy policy"
                    className="text-gray-300 hover:text-[#CA5310] transition duration-300"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms-and-conditions"
                    aria-label="Read our terms and conditions"
                    className="text-gray-300 hover:text-[#CA5310] transition duration-300"
                  >
                    Terms and Conditions
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[#CA5310] mb-2">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/faq"
                    aria-label="Frequently asked questions"
                    className="text-gray-300 hover:text-[#CA5310] transition duration-300"
                  >
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link
                    to="/help-center"
                    aria-label="Visit our help center"
                    className="text-gray-300 hover:text-[#CA5310] transition duration-300"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    to="/feedback"
                    aria-label="Provide feedback"
                    className="text-gray-300 hover:text-[#CA5310] transition duration-300"
                  >
                    Feedback
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[#CA5310] mb-2">Follow Us</h3>
              <div className="flex space-x-4 justify-center md:justify-start">
                <a
                  href="https://facebook.com"
                  aria-label="Follow us on Facebook"
                  className="text-gray-300 hover:text-[#CA5310] transition duration-300"
                >
                  <FaFacebookF size={20} />
                </a>
                <a
                  href="https://twitter.com"
                  aria-label="Follow us on Twitter"
                  className="text-gray-300 hover:text-[#CA5310] transition duration-300"
                >
                  <FaTwitter size={20} />
                </a>
                <a
                  href="https://instagram.com"
                  aria-label="Follow us on Instagram"
                  className="text-gray-300 hover:text-[#CA5310] transition duration-300"
                >
                  <FaInstagram size={20} />
                </a>
                <a
                  href="https://linkedin.com"
                  aria-label="Follow us on LinkedIn"
                  className="text-gray-300 hover:text-[#CA5310] transition duration-300"
                >
                  <FaLinkedinIn size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          {" "}
          {/* Changed text color for copyright */}
          &copy; {new Date().getFullYear()} Craftify. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
