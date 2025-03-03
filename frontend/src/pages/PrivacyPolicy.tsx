import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold mb-8 text-center text-[#5C0601]">Privacy Policy</h1>
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Introduction</h2>
        <p className="text-gray-700 mb-6">
          This Privacy Policy outlines the types of personal information that is received and collected and how it is used. Your privacy is important to us, and we ensure that your information is protected.
        </p>

        <h2 className="text-xl font-semibold mb-4">Information Collection</h2>
        <p className="text-gray-700 mb-6">
          We collect information to provide better services to our users. This includes your name, contact details, and uploaded verification documents.
        </p>

        <h2 className="text-xl font-semibold mb-4">Use of Information</h2>
        <p className="text-gray-700 mb-6">
          The information we collect is used to provide, maintain, and improve our services. This includes using your information to:
        </p>
        <ul className="list-disc list-inside mb-6">
          <li>Verify your identity</li>
          <li>Process transactions</li>
          <li>Provide customer support</li>
          <li>Send updates and promotional materials</li>
          <li>Improve our services and develop new features</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4">Information Sharing</h2>
        <p className="text-gray-700 mb-6">
          We do not share your personal information with companies, organizations, or individuals outside of our organization except in the following cases:
        </p>
        <ul className="list-disc list-inside mb-6">
          <li>With your consent</li>
          <li>For external processing (e.g., payment processors)</li>
          <li>For legal reasons (e.g., to comply with laws or respond to legal requests)</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4">Data Security</h2>
        <p className="text-gray-700 mb-6">
          We implement a variety of security measures to maintain the safety of your personal information. These measures include encryption, access controls, and secure servers.
        </p>

        <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
        <p className="text-gray-700 mb-6">
          You have the right to access, update, and delete your personal information. If you wish to exercise these rights, please contact us at [contact email].
        </p>

        <h2 className="text-xl font-semibold mb-4">Changes to This Policy</h2>
        <p className="text-gray-700 mb-6">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on our website. You are advised to review this Privacy Policy periodically for any changes.
        </p>

        <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
        <p className="text-gray-700 mb-6">
          If you have any questions about this Privacy Policy, please contact us at [contact email].
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;