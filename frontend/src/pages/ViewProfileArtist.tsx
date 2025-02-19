import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthProvider"; // Import your AuthProvider
import {
    FaMapMarkerAlt,
    FaEnvelope,
    FaPhoneAlt,
    FaCheckCircle,
    FaChevronDown,
    FaChevronUp,
} from "react-icons/fa";
import MessagePopup from './MessagePopup'; // Import the MessagePopup component

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
    const { user } = useAuth(); // Get the authenticated user from AuthProvider
    const [artist, setArtist] = useState<Artist | null>(null);
    const [artistArts, setArtistArts] = useState<Artwork[]>([]);
    const [preferences, setPreferences] = useState<Preferences | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [showAllPreferences, setShowAllPreferences] = useState<boolean>(false);
    const [artworksDisplayed, setArtworksDisplayed] = useState<number>(6);

    const [showModal, setShowModal] = useState<boolean>(false);
    const [projectName, setProjectName] = useState<string>("");
    const [projectDescription, setProjectDescription] = useState<string>("");
    const [budget, setBudget] = useState<string>("");
    const [dueDate, setDueDate] = useState<string>("");

    const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);

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

    const handleProposalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert("You must be logged in to send a proposal.");
            return;
        }

        if (!artist || !artist.user_id) {
            alert("Artist ID is missing! Please refresh the page.");
            return;
        }

        if (!projectName.trim() || !projectDescription.trim() || !budget.trim() || !dueDate.trim()) {
            alert("All fields are required.");
            return;
        }

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/send-proposal`, {
                sender_id: user.id,
                recipient_id: artist.user_id,
                project_name: projectName.trim(),
                project_description: projectDescription.trim(),
                budget: parseFloat(budget),
                due_date: new Date(dueDate).toISOString().split("T")[0],
                status: "Pending",
            });

            if (response.status === 201) {
                alert("Proposal sent successfully!");
                setShowModal(false);
                setProjectName("");
                setProjectDescription("");
                setBudget("");
                setDueDate("");
            } else {
                alert("Failed to send proposal. Please try again.");
            }
        } catch (err) {
            alert("Failed to send proposal. Please check the server.");
        }
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
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-6 bg-orange-500 text-white px-6 py-2 rounded-lg shadow hover:bg-orange-600"
                        >
                            Send Proposal
                        </button>
                        <button
                            onClick={() => setIsMessagePopupOpen(true)}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-600"
                        >
                            Send Message
                        </button>
                    </div>
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Send Proposal</h2>
                            <form onSubmit={handleProposalSubmit}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">Project Name</label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">Project Description</label>
                                    <textarea
                                        value={projectDescription}
                                        onChange={(e) => setProjectDescription(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:border-blue-500"
                                        rows={4}
                                        required
                                    ></textarea>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">Budget</label>
                                    <input
                                        type="text"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="py-2 px-4 bg-gray-300 rounded-md shadow hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="py-2 px-4 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600"
                                    >
                                        Send
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

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
            {isMessagePopupOpen && (
                <MessagePopup
                    onClose={() => setIsMessagePopupOpen(false)}
                    sender_id={user?.id || ""}
                    receiver_id={artist?.user_id || ""}
                />
            )}
        </div>
    );
};

export default ViewProfileArtist;