import React, { useEffect } from 'react';
import Footer from '../components/Footer';

const FAQ: React.FC = () => {
    useEffect(() => {
            document.title = "Frequently Asked Questions | Craftify";
          }, []);
        
  const faqs = [
    {
      question: "What is Craftify?",
      answer: "Craftify is a platform that connects art lovers with local artists, offering personalized recommendations and secure transactions."
    },
    {
      question: "How do I create an account?",
      answer: "To create an account, click on the 'Sign Up' button on the homepage and fill in the required details."
    },
    {
      question: "How can I contact an artist?",
      answer: "You can contact an artist by visiting their profile and clicking on the 'Contact' button."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept various payment methods including credit/debit cards and PayPal."
    },
    {
      question: "How do I reset my password?",
      answer: "To reset your password, click on the 'Forgot Password' link on the login page and follow the instructions."
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we implement a variety of security measures to ensure your personal information is protected."
    }
  ];

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-semibold mb-8 text-center text-gray-800">Frequently Asked Questions</h1>
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8 max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-[#CA5310]">{faq.question}</h2>
              <p className="text-gray-700">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FAQ;