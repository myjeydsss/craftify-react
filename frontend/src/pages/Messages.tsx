import React, { useEffect, useState } from "react";
import { FiSearch, FiSend, FiChevronLeft } from "react-icons/fi";
import { supabase } from '../../client';
import { useAuth } from "../context/AuthProvider"; // Import the useAuth hook

interface Conversation {
    conversation_id: string;
    other_user_id: string;
    other_user_firstname: string;
    other_user_lastname: string;
    profile_image: string;
    created_at: string;
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

// Custom hook to track window size
function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
    
}



//******* DONT TOUCH IF IT WORKS IT WORKS ******/
const Messages: React.FC = () => {
      useEffect(() => {
          document.title = "CraftiChat";
        }, []);
      
    const { user } = useAuth(); // Get the current user from the useAuth hook
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState("");
    const [sidebarVisible, setSidebarVisible] = useState(true); // State to control sidebar visibility
    const { width } = useWindowSize();
    const isMobile = width <= 768; // Adjust breakpoint as needed
    const [searchTerm, setSearchTerm] = useState(""); // State for search term

    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.conversation_id);
        }
    }, [selectedConversation]);

    useEffect(() => {
        if (selectedConversation) {
            const channel = supabase
                .channel("messages")
                .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
                    if (!payload.new) return; // Ensure there's data

                    const newMessage: Message = {
                        id: payload.new.id,
                        conversation_id: payload.new.conversation_id,
                        sender_id: payload.new.sender_id,
                        content: payload.new.content,
                        created_at: payload.new.created_at,
                    };

                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                })
                .subscribe();
            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedConversation]);

    const fetchConversations = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.error('Session expired. Please login again.');
            return;
        }
        if (!user) {
            return;
        }

        try {
            const { data: conversations, error } = await supabase
                .from("conversations")
                .select("*")
                .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`);

            if (error) {
                console.error("Error fetching conversations:", error);
                return;
            }

            const formattedConversations = await Promise.all(
                conversations.map(async (conversation) => {
                    const otherUserId = conversation.user1_id === user?.id ? conversation.user2_id : conversation.user1_id;

                    const CDNURL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/";

                    const { data: otherUser  , error: userError } = await supabase
                        .from("user_profiles")
                        .select("user_id, firstname, lastname, profile_image")
                        .eq("user_id", otherUserId)
                        .single();

                    if (userError || !otherUser  ) {
                        console.error("User  not found:", otherUserId);
                        return null;
                    }
                    const profileImageUrl = otherUser .profile_image
                        ? `${CDNURL}${otherUser .profile_image}`
                        : "/default-profile.png"; // Fallback if no image

                    return {
                        conversation_id: conversation.id,
                        other_user_id: otherUser .user_id,
                        other_user_firstname: otherUser .firstname,
                        other_user_lastname: otherUser .lastname,
                        profile_image: profileImageUrl,
                        created_at: conversation.created_at,
                    };
                })
            );

            setConversations(formattedConversations.filter((c) => c !== null) as Conversation[]);
            setFilteredConversations(formattedConversations.filter((c) => c !== null) as Conversation[]); // Initialize filtered conversations
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.error('Session expired. Please login again.');
            return;
        }
        if (!user) {
            return;
        }
        try {
            const { data: messages, error } = await supabase
                .from("messages")
                .select("*")
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error fetching messages:", error);
                return;
            }

            setMessages(messages);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const handleConversationClick = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        if (isMobile) {
            setSidebarVisible(false);
        }
    };

    const sendMessage = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.error('Session expired. Please login again.');
            return;
        }
        if (!user) {
            return;
        }
        if (message.trim() === "" || !selectedConversation) return;

        try {
            const { data, error } = await supabase
                .from("messages")
                .insert([
                    {
                        conversation_id: selectedConversation.conversation_id,
                        sender_id: user?.id,
                        content: message,
                    },
                ])
                .single();

            if (error) {
                console.error("Failed to send message:", error);
                return;
            }
            setMessages([...messages, data]);
            setMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const toggleSidebar = () => {
        if (isMobile) {
            setSidebarVisible(!sidebarVisible);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase();
        setSearchTerm(value);
        const filtered = conversations.filter(conversation => 
            conversation.other_user_firstname.toLowerCase().includes(value) || 
            conversation.other_user_lastname.toLowerCase().includes(value)
        );
        setFilteredConversations(filtered);
    };

    return (
                <div className ="container mx-auto py-16 px-4">
            <h1 className="text-4xl font-bold text-center text-[#5C0601] mb-4">CraftiChat</h1>
            <hr className="border-gray-300 mb-6" />
            <div className="flex flex-col h-screen md:flex-row">

            {/* Sidebar */}
            {(!isMobile || sidebarVisible) && (
                <div className="w-full md:w-1/3 border-r border-gray-300 p-4">
                    <div className="relative mb-4">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {/* Conversations list */}
                    <div className="space-y-4">
                        {filteredConversations.map((conversation) => (
                            <div
                                key={conversation.conversation_id}
                                className="flex items-center p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200"
                                onClick={() => handleConversationClick(conversation)}
                            >
                                <img
                                    src={conversation.profile_image}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover border border-gray-300"
                                />
                                <div className="ml-3">
                                    <h3 className="font-semibold">{`${conversation.other_user_firstname} ${conversation.other_user_lastname}`}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat Window - Initially hidden */}
            {selectedConversation && (
                <div className={`w-full md:w-2/3 flex flex-col ${isMobile && sidebarVisible ? 'hidden' : 'flex'}`}>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-300 flex items-center">
                        <img
                            src={selectedConversation.profile_image}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover border border-gray-300"
                        />
                        <h2 className="ml-3 text-lg font-semibold">{selectedConversation.other_user_firstname}</h2>
                        <button onClick={toggleSidebar} className={`ml-auto p-2 rounded-full bg-gray-200 hover:bg-gray-300 ${!isMobile ? 'hidden' : 'block'}`}>
                            <FiChevronLeft className="text-gray-600" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {messages.length === 0 ? (
                            <p className="text-center text-gray-500">No messages yet.</p>
                        ) : (
                            messages
                                .filter((msg) => msg !== null && msg !== undefined)
                                .map((msg, index) => (
                                    <div key={msg.id || `msg-${index}`} className={`mb-3 flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                                        <div className={`px-4 py-2 max-w-xs rounded-lg ${msg.sender_id === user?.id ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>
                                            {msg.content}
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
                        <button className="ml-2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600" onClick={sendMessage}>
                            <FiSend />
                        </button>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
};

export default Messages;