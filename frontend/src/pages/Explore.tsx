import React from "react";
import hireArtist from "../assets/hire-artist.png";
import findClient from "../assets/find-client.png";
import collab from "../assets/collab.png";
import artistNetwork from "../assets/artist-network.png";
import marketplace from "../assets/marketplace.png";
import art1 from "../assets/artwork-1.png";
import art2 from "../assets/artwork-2.png";
import art3 from "../assets/artwork-3.png";
import Footer from "../components/Footer"; // Adjust the path if necessary

const Explore: React.FC = () => {
  return (
    <>
      <div className="min-h-screen py-20 font-poppins">
        {/* Hero Section */}
        <section className="text-center py-16 bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500">
          <h1 className="text-5xl font-extrabold text-white mb-6 drop-shadow-lg">
            EXPLORE CRAFTIFY COMMUNITY
          </h1>
          <p className="text-xl text-white mb-6">
            Join a growing community of artists and discover numerous opportunities.
          </p>
          <button className="py-3 px-6 bg-white text-red-600 font-semibold rounded-full shadow-md hover:bg-gray-100 transition-all duration-300">
            Join Now
          </button>
        </section>

        {/* Hire Artist Section */}
        <section className="py-16 bg-white">
          <div className="w-full p-6">
            <div className="flex flex-col md:flex-row-reverse items-center">
              <div className="mb-4 md:mb-0 md:ml-4">
                <img
                  src={hireArtist}
                  alt="Hire Artist"
                  className="mx-auto h-64 w-64 object-cover rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                />
                <div className="flex justify-center md:justify-start mt-4">
                  <span className="h-2 w-2 bg-orange-600 rounded-full mx-1"></span>
                  <span className="h-2 w-2 bg-gray-300 rounded-full mx-1"></span>
                  <span className="h-2 w-2 bg-gray-300 rounded-full mx-1"></span>
                </div>
              </div>
              <div className="text-center md:text-left md:flex-1">
                <h2 className="text-3xl font-bold text-orange-600 mb-4">
                  HIRE ARTIST
                </h2>
                <p className="text-gray-600 mb-6">
                  Connect with talented artists and bring your creative vision to life.
                </p>
                <button className="bg-[#5C0601] text-white py-2 px-4 rounded-md hover:bg-[#5c0601ed]">
                  HIRE ARTIST NOW
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Find Client Section */}
        <section className="py-16 bg-white">
          <div className="w-full p-6">
            <div className="flex flex-col md:flex-row items-center">
              <div className="mb-4 md:mb-0 md:mr-4">
                <img
                  src={findClient}
                  alt="Find Client"
                  className="mx-auto h-64 w-64 object-cover rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                />
                <div className="flex justify-center md:justify-start mt-4">
                  <span className="h-2 w-2 bg-orange-600 rounded-full mx-1"></span>
                  <span className="h-2 w-2 bg-gray-300 rounded-full mx-1"></span>
                  <span className="h-2 w-2 bg-gray-300 rounded-full mx-1"></span>
                </div>
              </div>
              <div className="text-center md:text-right md:flex-1">
                <h2 className="text-3xl font-bold text-orange-600 mb-4">
                  FIND CLIENT
                </h2>
                <p className="text-gray-600 mb-6">
                  Find the perfect clients for your creative projects and grow your portfolio.
                </p>
                <button className="bg-[#5C0601] text-white py-2 px-4 rounded-md hover:bg-[#5c0601ed]">
                  FIND CLIENT NOW
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Craftify Opportunities Section */}
        <section className="text-center py-16 bg-gradient-to-r from-yellow-200 via-red-200 to-pink-200">
          <h1 className="text-4xl font-bold mb-10 text-[#5C0601]">
            DISCOVER NEW OPPORTUNITIES
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { src: collab, title: "Craftify Collaboration" },
              { src: artistNetwork, title: "Exclusive Artist Network" },
              { src: marketplace, title: "Creative Marketplace" },
            ].map((item, index) => (
              <div
          key={index}
          className="transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"
              >
          <img
            src={item.src}
            alt={item.title}
            className="h-64 w-full object-cover rounded-md"
          />
          <p className="mt-2 font-semibold">{item.title}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Shop Section */}
        <section className="py-16 bg-white">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-700">
            SHOP OUR EXCLUSIVE ARTWORK
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            {[art1, art2, art3].map((art, index) => (
              <div
          key={index}
          className="bg-white shadow-md p-6 rounded-md hover:shadow-lg transition-all duration-300 border border-orange-600"
              >
          <img
            src={art}
            alt={`Artwork ${index + 1}`}
            className="mx-auto h-64 w-full object-cover rounded-md hover:scale-105 transition-transform duration-300"
          />
          <p className="text-orange-600 mt-2 font-semibold">₱1,000.00</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <div className="w-full text-center py-6">
          <button className="py-3 px-6 bg-[#5C0601] text-white font-semibold rounded-full shadow-md hover:bg-[#5c0601ed] transition-all duration-300">
            JOIN CRAFTIFY NOW
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Explore;