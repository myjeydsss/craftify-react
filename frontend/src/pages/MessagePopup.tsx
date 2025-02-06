import React, { useState } from 'react';
import { FiSend } from 'react-icons/fi';

interface MessagePopupProps {
  onClose: () => void;
  onSendMessage: (message: string) => void;
}

const MessagePopup: React.FC<MessagePopupProps> = ({ onClose, onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim() === '') return;
    onSendMessage(message);
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <h2 className="text-xl font-bold mb-4">Send Message</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className="w-full border border-gray-300 rounded-lg p-2 mb-4"
          rows={4}
        ></textarea>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FiSend className="mr-2" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagePopup;