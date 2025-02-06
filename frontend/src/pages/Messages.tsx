import React, { useState } from "react";
import { FiSearch, FiPaperclip, FiSend } from "react-icons/fi";

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    if (message.trim() === "") return;
    setMessages([...messages, { text: message, sender: "You" }]);
    setMessage("");
  };

  return (
    <div className="flex h-screen py-16">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-300 p-4">
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Sample chat list */}
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-100 rounded-lg cursor-pointer">
            <div className="w-10 h-10 bg-blue-500 rounded-full"></div>
            <div className="ml-3">
              <h3 className="font-semibold">Jasmin</h3>
              <p className="text-gray-500 text-sm">Hey!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="w-2/3 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-300 flex items-center">
          <div className="w-10 h-10 bg-blue-500 rounded-full"></div>
          <h2 className="ml-3 text-lg font-semibold">Jasmin</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500">No messages yet.</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`mb-3 flex ${msg.sender === "You" ? "justify-end" : ""}`}>
                <div className={`px-4 py-2 rounded-lg ${msg.sender === "You" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Box */}
        <div className="p-4 border-t border-gray-300 flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message here..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="ml-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300">
            <FiPaperclip className="text-gray-600" />
          </button>
          <button className="ml-2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600" onClick={sendMessage}>
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Messages;
