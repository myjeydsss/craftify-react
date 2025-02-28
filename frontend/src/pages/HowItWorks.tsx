import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import step1Image from "../assets/step1.png";
import step2Image from "../assets/step2.png";
import step3Image from "../assets/step3.png";
import step4Image from "../assets/step4.png";
import step5Image from "../assets/step5.png";
import step6Image from "../assets/step6.png";
import Footer from "../components/Footer"; 

const HowItWorks: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  const steps = [
    {
      title: "Sign Up and Create a Profile",
      description:
        "Create an account to get started. Set up your profile, showcase your skills, and start connecting with potential clients.",
      image: step1Image,
      reverse: false,
    },
    {
      title: "Find Services and Projects",
      description:
        "Browse through a wide range of services and available projects. Find opportunities that match your skills and interests.",
      image: step2Image,
      reverse: true,
    },
    {
      title: "Match",
      description:
        "Get matched with artists or clients based on your preferences and requirements. Start collaborating!",
      image: step3Image,
      reverse: false,
    },
    {
      title: "Manage Project",
      description:
        "Manage your project from start to finish with Craftify’s tools. Keep track of deadlines, milestones, and feedback.",
      image: step4Image,
      reverse: true,
    },
    {
      title: "Grow and Network",
      description:
        "Expand your professional network. Connect with other artists and clients to grow your presence in the industry.",
      image: step5Image,
      reverse: false,
    },
    {
      title: "Showcase and Sell",
      description:
        "Showcase your work to potential clients. Sell your art directly or via commissions through the Craftify platform.",
      image: step6Image,
      reverse: true,
    },
  ];

  // Function to handle redirection to the login page
  const handleJoinCraftify = () => {
    navigate("/login"); // Redirect to the login page
  };

  return (
    <>
      <div className="py-20 min-h-screen font-poppins">
        {/* Header Title */}
        <section className="bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500 py-16 text-center">
          <h1 className="text-5xl font-extrabold text-white mb-6 drop-shadow-lg">
            HOW IT WORKS
          </h1>
          <p className="text-lg text-white mb-8">
            Step-by-step guide to using Craftify and connecting with local artists.
          </p>
        </section>

        {/* Step-by-Step Process */}
        <div className="space-y-10 w-full max-w-6xl mx-auto py-16">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`w-full p-6 flex flex-col ${
                step.reverse ? "md:flex-row-reverse" : "md:flex-row"
              } items-center`}
            >
              <div className="mb-4 md:mb-0 md:mr-4">
                <img
                  src={step.image}
                  alt={step.title}
                  className="mx-auto h-64 w-64 object-cover rounded-lg shadow-lg transition-transform transform hover:scale-105"
                />
              </div>
              <div className="text-center md:text-left md:flex-1">
                <h2 className="text-3xl font-bold text-[#CA5310] mb-4">
                  {step.title}
                </h2>
                <p className="text-gray-600 mb-6">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center py-8">
          <button
            onClick={handleJoinCraftify} // Corrected onClick handler
            className="bg-[#5C0601] text-white py-3 px-6 rounded-full shadow-lg hover:bg-red-700 transition-all duration-300"
          >
            Join Craftify Now
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default HowItWorks;