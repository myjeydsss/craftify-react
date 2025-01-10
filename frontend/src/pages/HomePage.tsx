import React from "react";

import heroImage1 from "../assets/hero1.png";
import heroImage2 from "../assets/hero2.png";
import heroImage3 from "../assets/hero3.png";
import portrait from "../assets/MATCH.png";
import heroImage4 from "../assets/hero4.png";
import heroImage5 from "../assets/hero5.png";
import heroImage6 from "../assets/hero6.png";
import heroImage7 from "../assets/hero7.png";
import heroImage8 from "../assets/hero8.png";
import heroImage9 from "../assets/hero9.png";
import heroImage10 from "../assets/hero10.png";
import Footer from "../components/Footer";

const HomePage: React.FC = () => {
  const categories: string[] = [
    "Paintings",
    "Sculptures",
    "Pottery",
    "Graphic Design",
    "Animation",
    "Textile",
    "Woodworking",
  ];

  const features = [
    {
      image: heroImage7,
      title: "Verified User Profiles",
      description: "Ensuring trustworthiness with verified profiles.",
    },
    {
      image: heroImage8,
      title: "Personal Recommendation",
      description: "Receive personalized recommendations based on reviews.",
    },
    {
      image: heroImage9,
      title: "Easy Matching",
      description: "Seamlessly connect with others on the platform.",
    },
    {
      image: heroImage10,
      title: "Secure Payment Processing",
      description: "Enjoy secure and encrypted payment transactions.",
    },
  ];

  return (
    <>
      <div className="min-h-screen py-20 font-poppins">
        {/* Hero Section */}
        <section className="text-center py-16 bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500">
          <div className="flex justify-center space-x-4 mb-8">
            {[heroImage1, heroImage2, heroImage3].map((image, index) => (
              <img
                key={index}
                src={image}
                alt="Person painting on canvas"
                className="h-64 w-64 object-cover rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
              />
            ))}
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-6 drop-shadow-lg">
            DISCOVER THE PERFECT LOCAL ARTIST
          </h1>
          <button className="py-3 px-6 bg-white text-red-600 font-semibold rounded-full shadow-md hover:bg-gray-100 transition-all duration-300">
            Get Started
          </button>
        </section>

        {/* Category Section */}
        <section className="py-16 bg-white">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-700">
            Explore Art Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4">
            {categories.map((category) => (
              <div
                key={category}
                className="p-6 bg-[#FAE3D9] rounded-md shadow-lg text-center hover:bg-[#FBD3A7] transition-all duration-300 border border-[#CA5310]"
              >
                <h3 className="text-2xl font-semibold text-[#CA5310]">
                  {category}
                </h3>
              </div>
            ))}
          </div>
        </section>

        {/* Artist Collaboration Section */}
        <section className="flex flex-col md:flex-row items-center justify-between p-8 bg-white">
          <div className="relative w-full md:w-1/2">
            <img
              src={portrait}
              alt="Luis 'Junyee' Yee, Jr."
              className="w-full h-auto object-cover rounded-lg shadow-md"
            />
            <div className="absolute top-0 left-0 w-full h-full mix-blend-multiply"></div>
          </div>
          <div className="w-full md:w-1/2 p-4 text-center md:text-left">
            <h1 className="text-4xl font-bold mb-4 text-[#CA5310]">
              UNLOCK CREATIVE COLLABORATIONS WITH ARTISTIC TALENTS
            </h1>
          </div>
        </section>

        {/* Personalized Art Section */}
        <section className="text-center py-16 bg-gradient-to-r from-yellow-200 via-red-200 to-pink-200">
          <h1 className="text-4xl font-bold mb-10 text-[#5C0601]">
            SELECT AND PERSONALIZE THE{" "}
            <span className="text-orange-600">ART OF YOUR CHOICE</span>
          </h1>
          <div className="flex justify-center space-x-6">
            {[heroImage4, heroImage5, heroImage6].map((image, index) => (
              <img
                key={index}
                src={image}
                alt="Artist working on painting"
                className="h-64 w-64 object-cover rounded-md shadow-lg transition-transform transform hover:scale-105"
              />
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto text-center">
            <div className="flex flex-wrap justify-center">
              {features.map((feature, index) => (
                <div key={index} className="w-full md:w-1/4 p-6">
                  <div className="bg-[#FAE3D9] shadow-lg p-8 rounded-lg hover:shadow-xl transition-all duration-300">
                    <div className="mb-4">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="mx-auto h-16 w-16"
                      />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[#CA5310]">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default HomePage;