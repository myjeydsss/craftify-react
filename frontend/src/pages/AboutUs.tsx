import React from "react";
import Footer from "../components/Footer"; // Adjust the path if necessary

const AboutUs: React.FC = () => {
  return (
    <>
      <div className="py-20 min-h-screen font-poppins">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500 text-white py-20">
          <div className="container mx-auto text-center py-2">
            <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">About Craftify</h1>
            <p className="text-lg mb-8">
              Bringing Artists and Art Lovers Together through a Personalized Commissioning Platform.
            </p>
          </div>
        </section>

        {/* Our Mission */}
        <section className="py-20 bg-white">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-[#CA5310]">Our Mission</h2>
            <p className="text-lg text-gray-600 leading-relaxed px-6 md:px-20">
              At Craftify, we are passionate about making art accessible and personal. We aim to connect artists with clients who want to commission unique, personalized pieces of art. Whether it's a painting, sculpture, or digital design, Craftify enables artists and clients to collaborate and bring their visions to life.
            </p>
          </div>
        </section>

        {/* Our Vision */}
        <section className="py-20 bg-gradient-to-r from-yellow-200 via-red-200 to-pink-200">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-[#CA5310]">Our Vision</h2>
            <p className="text-lg text-gray-600 leading-relaxed px-6 md:px-20">
              At Craftify, we envision a world where every local artist has a platform to showcase their unique talents and connect with a global audience. We aim to foster creativity, build a supportive community for artisans, and inspire appreciation for handmade craftsmanship. Our goal is to empower artists and elevate the value of locally-made, sustainable products.
            </p>
          </div>
        </section>

        {/* What We Do */}
        <section className="py-20 bg-white">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-[#CA5310]">What We Do</h2>
            <p className="text-lg text-gray-600 leading-relaxed px-6 md:px-20">
              Craftify connects art enthusiasts with talented local artisans, providing a space for artists to showcase and sell their handcrafted creations. We offer a diverse range of artistic works, from paintings to textiles, making it easy for customers to discover and collaborate with creators. By simplifying the process of finding and purchasing local art, we help support small businesses and promote the arts.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-gradient-to-r from-yellow-100 via-red-100 to-pink-100">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-[#CA5310]">How Craftify Works</h2>
            <div className="flex flex-wrap justify-center">
              {[
                {
                  title: "Discover Art",
                  description:
                    "Browse a wide range of artists and their portfolios. Explore their previous work and find the style that fits your vision.",
                },
                {
                  title: "Collaborate",
                  description:
                    "Connect with your chosen artist. Share your ideas, preferences, and specific needs to personalize the artwork.",
                },
                {
                  title: "Commission",
                  description:
                    "Finalize the details and commission your personalized piece of art. Enjoy a seamless and secure process from start to finish.",
                },
              ].map((item, index) => (
                <div key={index} className="w-full md:w-1/3 p-6">
                  <div className="bg-white shadow-md p-8 rounded-lg border hover:bg-[#FBD3A7] transition-all duration-300 hover:scale-105">
                    <h3 className="text-xl font-bold mb-4 text-[#CA5310]">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Team */}
        <section className="py-20 bg-white">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-[#CA5310]">Meet Our Team</h2>
            <div className="flex flex-wrap justify-center">
              {[
                { name: "Jhonna Mae Awayan", role: "Project Manager & Project Leader" },
                { name: "Phoebe Kaye Lerog", role: "Frontend Developer" },
                { name: "Jaydie Ranes", role: "Backend Developer" },
              ].map((member, index) => (
                <div key={index} className="w-full md:w-1/3 p-6">
                  <div className="bg-white shadow-md p-8 rounded-lg border hover:bg-[#FBD3A7] transition-all duration-300 hover:scale-105">
                    <h3 className="text-xl font-bold mb-4 text-[#CA5310]">{member.name}</h3>
                    <p className="text-gray-600">{member.role}</p>
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

export default AboutUs;