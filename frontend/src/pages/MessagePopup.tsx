import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../../client';
import Swal from 'sweetalert2'; // Import SweetAlert2

interface MessagePopupProps {
    onClose: () => void;
    sender_id: string;
    receiver_id: string;
}

const MessagePopup: React.FC<MessagePopupProps> = ({ onClose, sender_id, receiver_id }) => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const { auth } = useAuth();

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!auth) {
            setError('You must be logged in to send messages');
            return;
        }

        if (!message.trim()) {
            setError('Message cannot be empty');
            return;
        }

        try {
            setSending(true);
            setError(null);

            // Get current session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Session expired. Please login again.');
                return;
            }

            // First, check or create conversation
            const { data: existingConversation, error: conversationError } = await supabase
                .from('conversations')
                .select('*')
                .or(`user1_id.eq.${sender_id},user1_id.eq.${receiver_id}`)
                .or(`user2_id.eq.${sender_id},user2_id.eq.${receiver_id}`)
                .single();

            let conversation_id;

            if (conversationError || !existingConversation) {
                // Create new conversation
                const { data: newConversation, error: newConversationError } = await supabase
                    .from('conversations')
                    .insert([
                        {
                            user1_id: sender_id < receiver_id ? sender_id : receiver_id,
                            user2_id: sender_id < receiver_id ? receiver_id : sender_id
                        },
                    ])
                    .select()
                    .single();

                if (newConversationError) {
                    throw new Error('Failed to create conversation');
                }
                conversation_id = newConversation.id;
            } else {
                conversation_id = existingConversation.id;
            }

            // Send message
            const { error: messageError } = await supabase
                .from('messages')
                .insert([
                    {
                        conversation_id,
                        sender_id,
                        content: message,
                    },
                ]);

            if (messageError) {
                throw new Error('Failed to send message');
            }

            // Show success toast
            Swal.fire({
                icon: 'success',
                title: 'Message Sent!',
                text: 'Your message has been sent successfully.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });

            setMessage('');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message');

            // Show error toast
            Swal.fire({
                icon: 'error',
                title: 'Error Sending Message',
                text: 'Failed to send message. Please try again.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Send Message</h2>

                <form onSubmit={handleSendMessage}>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-2 border rounded-md mb-4 min-h-[100px]"
                        placeholder="Type your message here..."
                    />

                    {error && (
                        <div className="text-red-500 mb-4">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            disabled={sending}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={sending}
                        >
                            {sending ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MessagePopup;