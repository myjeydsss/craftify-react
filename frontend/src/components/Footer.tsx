import React from "react";
import logo from "../assets/logo.png"; // Adjust the path as necessary

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#FAE3D9] py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* Logo and Description */}
          <div className="text-center md:text-left">
            <img src={logo} alt="Logo" className="h-12 mb-2 mx-auto md:mx-0" />
            <p className="text-gray-600 max-w-xs mx-auto md:mx-0">
              Discover and connect with the finest local artists. Personalized recommendations and secure transactions for every art lover.
            </p>
          </div>

          {/* Footer Links */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-10 text-center md:text-left">
            <div>
              <h3 className="font-bold text-[#CA5310] mb-2">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#CA5310]">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#CA5310]">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#CA5310]">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#CA5310]">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[#CA5310] mb-2">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#CA5310]">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#CA5310]">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#CA5310]">
                    Feedback
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[#CA5310] mb-2">Follow Us</h3>
              <div className="flex space-x-4 justify-center md:justify-start">
                <a href="#" className="text-gray-600 hover:text-[#CA5310]">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-gray-600 hover:text-[#CA5310]">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-600 hover:text-[#CA5310]">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="text-gray-600 hover:text-[#CA5310]">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Craftify. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;