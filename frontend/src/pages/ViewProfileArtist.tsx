import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
    FaMapMarkerAlt,
    FaEnvelope,
    FaPhoneAlt,
    FaCheckCircle,
    FaChevronDown,
    FaChevronUp,
} from "react-icons/fa";
import MessagePopup from './MessagePopup.tsx'; // Import the MessagePopup component
import { useAuth } from "../context/AuthProvider"; // Import the useAuth hook

interface Artist {
    user_id: string;
    firstname: string;
    lastname: string;
    bio: string | null;
    address: string | null;
    email: string;
    phone: string | null;
    profile_image: string | null;
    status: string | null;
}

interface Preferences {
    art_style_specialization?: string[];
    crafting_techniques?: string[];
    preferred_medium?: string[];
    preferred_communication?: string[];
    collaboration_type?: string | null;
    location_preference?: string | null;
    budget_range?: string | null;
    project_type?: string | null;
    project_type_experience?: string | null;
    availability?: string | null;
    client_type_preference?: string | null;
    portfolio_link?: string | null;
}

interface Artwork {
    art_id: string;
    title: string;
    image_url: string;
    price: number;
}

const ViewProfileArtist: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user } = useAuth(); // Get the current user from the useAuth hook
    const [artist, setArtist] = useState<Artist | null>(null);
    const [artistArts, setArtistArts] = useState<Artwork[]>([]);
    const [preferences, setPreferences] = useState<Preferences | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [showAllPreferences, setShowAllPreferences] = useState<boolean>(false);
    const [artworksDisplayed, setArtworksDisplayed] = useState<number>(6);
    const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);
    const [messages] = useState<{ text: string; sender: string }[]>([]);

    useEffect(() => {
        const fetchArtistDetails = async () => {
            setLoading(true);
            try {
                const artistResponse = await axios.get<Artist>(
                    `${import.meta.env.VITE_API_URL}/artist-profile/${userId}`
                );
                setArtist(artistResponse.data);
                const preferencesResponse = await axios.get<Preferences | null>(
                    `${import.meta.env.VITE_API_URL}/view-artist-preferences/${userId}`
                );
                setPreferences(preferencesResponse.data);

                const artsResponse = await axios.get<Artwork[]>(
                    `${import.meta.env.VITE_API_URL}/api/arts/${userId}`
                );
                setArtistArts(artsResponse.data);
            } catch (err) {
                console.error("Error fetching artist details:", err);
                setError("Failed to load artist details.");
            } finally {
                setLoading(false);
            }
        };

        fetchArtistDetails();
    }, [userId]);

    const togglePreferences = () => setShowAllPreferences(!showAllPreferences);

    const loadMoreArtworks = () => {
        setArtworksDisplayed((prev) => {
            const remainingArtworks = artistArts.length - prev;
            return remainingArtworks > 6 ? prev + 6 : prev + remainingArtworks;
        });
    };

    const hasValidPreferences = preferences && Object.values(preferences).some((value) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined;
    });

    const handleSendMessageClick = () => {
        setIsMessagePopupOpen(true);
    };

    const handleCloseMessagePopup = () => {
        setIsMessagePopupOpen(false);
    };

    if (loading) return <div className="text-center mt-10">Loading...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-16 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Profile Section */}
                <div className="bg-white shadow-lg rounded-lg p-8 mb-12 relative">
                    <div className="flex flex-col items-center text-center">
                        <img
                            src={artist?.profile_image || "/default-profile.png"}
                            alt={`${artist?.firstname} ${artist?.lastname}`}
                            className="w-60 h-60 object-cover rounded-full border-4 border-gray-300"
                        />
                        <div className="flex items-center mt-4 space-x-3">
                            <h1 className="text-4xl font-bold text-gray-900">
                                {artist?.firstname} {artist?.lastname}
                            </h1>
                            {artist?.status === "approved" && (
                                <FaCheckCircle className="text-green-500 text-3xl" />
                            )}
                        </div>
                        <p className="text-gray-600 mt-2">{artist?.bio || "No bio available"}</p>
                        <div className="flex flex-wrap justify-center gap-6 mt-4 text-gray-600">
                            <div className="flex items-center gap-2">
                                <FaMapMarkerAlt />
                                <span>{artist?.address || "Location not available"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaEnvelope />
                                <span>{artist?.email || "Email not available"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaPhoneAlt />
                                <span>{artist?.phone || "Phone not available"}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleSendMessageClick}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                                >
                                    Send Message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Preferences Section */}
                {hasValidPreferences && (
                    <div className="bg-white shadow-md rounded-lg p-8 mb-12">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Preferences</h2>
                        <div
                            className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${showAllPreferences ? "" : "max-h-48 overflow-hidden"
                                }`}
                        >
                            {Object.entries(preferences!).map(([key, value]) =>
                                value ? (
                                    <div key={key}>
                                        <strong className="block text-gray-800 capitalize">
                                            {key.replace(/_/g, " ")}:
                                        </strong>
                                        {Array.isArray(value) && value.length > 0 ? (
                                            value.map((v) => (
                                                <span
                                                    key={v}
                                                    className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-2"
                                                >
                                                    {v}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                                                {value}
                                            </span>
                                        )}
                                    </div>
                                ) : null
                            )}
                        </div>
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={togglePreferences}
                                className="text-orange-500 hover:text-orange-700 flex items-center"
                            >
                                {showAllPreferences ? (
                                    <>
                                        <FaChevronUp className="mr-2" /> View Less
                                    </>
                                ) : (
                                    <>
                                        <FaChevronDown className="mr-2" /> View All Preferences
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Artworks Section */}
                <div className="bg-white shadow-md rounded-lg p-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                        Artworks by {artist?.firstname}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {artistArts.slice(0, artworksDisplayed).map((art) => (
                            <div
                                key={art.art_id}
                                className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
                            >
                                <img
                                    src={art.image_url}
                                    alt={art.title}
                                    className="w-full h-40 sm:h-60 object-cover"
                                />
                                <div className="p-4">
                                    <h3 className="text-lg font-bold text-gray-800">{art.title}</h3>
                                    <p className="text-gray-600">₱{art.price.toLocaleString()}</p>
                                    <Link
                                        to={`/art/${art.art_id}`}
                                        className="block mt-4 text-center bg-orange-100 text-orange-800 px-4 py-2 rounded-md hover:bg-orange-200 transition"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                    {artworksDisplayed < artistArts.length && (
                        <div className="text-center mt-6">
                            <button
                                onClick={loadMoreArtworks}
                                className="bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 transition"
                            >
                                Load More Artworks
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {isMessagePopupOpen && user && artist && (
                <MessagePopup
                    onClose={handleCloseMessagePopup}
                    sender_id={user.id} // Pass the sender_id
                    receiver_id={artist.user_id} // Pass the receiver_id
                />
            )}

            {/* Display messages */}
            <div className="mt-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`mb-3 flex ${msg.sender === 'You' ? 'justify-end' : ''}`}>
                        <div className={`px-4 py-2 rounded-lg ${msg.sender === 'You' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ViewProfileArtist;
