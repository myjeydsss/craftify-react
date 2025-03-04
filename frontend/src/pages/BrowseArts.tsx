import React, { useEffect, useState } from "react";
import Masonry from "react-masonry-css";
import axios from "axios";
import {
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaHeart,
  FaFilter,
} from "react-icons/fa";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom"; 
import Swal from "sweetalert2";
import ClipLoader from "react-spinners/ClipLoader";

interface Artist {
  firstname: string;
  lastname: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Art {
  art_id: string;
  title: string;
  description: string | null;
  price: string;
  quantity: number;
  image_url: string | null;
  artist: Artist | null;
  tags: Tag[];
  medium: string | null;
  art_style: string | null;
  subject: string | null;
  created_at: string | null;
  
}

const priceRanges = [
  { label: "₱20,000 and above", value: "20000-above" },
  { label: "₱10,000 - ₱20,000", value: "10000-20000" },
  { label: "₱5,000 - ₱10,000", value: "5000-10000" },
  { label: "₱1,000 - ₱5,000", value: "1000-5000" },
  { label: "Under ₱1,000", value: "under-1000" },
];



const artStyles = ["Abstract", "Realism", "Impressionism", "Pop Art", "Cubism", "Others..."];
const mediums = ["Oil", "Canvas", "Acrylic", "Watercolor", "Wood", "Paper", "Digital", "Charcoal", "Others..."];
const subjects = ["Nature", "Landscape", "Portrait", "Still Life", "Animals", "Fantasy", "Others..."];


const BrowseArts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [arts, setArts] = useState<Art[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedMediums, setSelectedMediums] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const totalPages = Math.ceil(arts.length / itemsPerPage);
  const [sortOption, setSortOption] = useState<string>("");
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [openFilters, setOpenFilters] = useState<{ [key: string]: boolean }>({
    price: false,
    style: false,
    medium: false,
    tags: false,
  });

  const fetchOrders = async () => {
    if (!user) {
      setError("User  not logged in.");
      setLoading(false);
      return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    try {
      const [artsResponse, tagsResponse] = await Promise.all([
        axios.get<Art[]>(`${API_BASE_URL}/arts`),
        axios.get<Tag[]>(`${API_BASE_URL}/tags`),
      ]);

      setArts(artsResponse.data);
      setTags(tagsResponse.data);
    } catch (err: any) {
      console.error("Error fetching arts or tags:", err.message);
      setError("Failed to load arts or tags. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleArtClick = (artId: string) => {
    navigate(`/art/${artId}`); // Redirect to ArtDetail page with artId as a parameter
  };
  

  const fetchWishlist = async () => {
    if (!user) return;

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/wishlist/${user.id}`);
      setWishlist(response.data);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchWishlist();
  }, [user]);

  const handleWishlistToggle = async (artId: string) => {
    if (!user) {
      alert("Please log in to manage your wishlist.");
      return;
    }

    try {
      const action = wishlist.includes(artId) ? "remove " : "add";

      await axios.post(`${import.meta.env.VITE_API_URL}/wishlist`, {
        userId: user.id,
        artId,
        action,
      });

      setWishlist((prev) =>
        action === "add" ? [...prev, artId] : prev.filter((id) => id !== artId)
      );

      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: action === "add" ? 'Added to Wishlist!' : 'Removed from Wishlist!',
        showConfirmButton: false,
        timer: 1500,
        toast: true,
        background: '#fff',
        color: '#000',
        iconColor: '#CA5310',
        customClass: {
          popup: 'swal-popup',
        },
      });
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
  };

  const filteredArts = arts.filter((art) => {
    const searchLower = search.toLowerCase();

    const matchesSearch =
      art.title.toLowerCase().includes(searchLower) ||
      (art.artist &&
        `${art.artist.firstname} ${art.artist.lastname}`.toLowerCase().includes(searchLower)) ||
      art.tags.some((tag) => tag.name.toLowerCase().includes(searchLower));

    const matchesPriceRange = !selectedPriceRange || (() => {
      const price = parseFloat(art.price);
      if (selectedPriceRange === "20000-above") return price >= 20000;
      if (selectedPriceRange === "10000-20000") return price >= 10000 && price < 20000;
      if (selectedPriceRange === "5000-10000") return price >= 5000 && price < 10000;
      if (selectedPriceRange === "1000-5000") return price >= 1000 && price < 5000;
      if (selectedPriceRange === "under-1000") return price < 1000;
      return false;
    })();

    const matchesStyle = selectedStyles.length === 0 || selectedStyles.includes(art.art_style || "");
    const matchesMedium = selectedMediums.length === 0 || selectedMediums.includes(art.medium || "");
    const matchesSubject = selectedSubjects.length === 0 || selectedSubjects.includes(art.subject || "");
    const matchesTags =
      selectedTags.length === 0 || art.tags.some((tag) => selectedTags.includes(tag.name));

    return matchesSearch && matchesPriceRange && matchesStyle && matchesMedium && matchesSubject  && matchesTags;
  });

  const paginatedArts = filteredArts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

if (sortOption === "latest") {
  paginatedArts.sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });
} else if (sortOption === "cheapest") {
  paginatedArts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
}

  const handleFilterToggle = (filter: "price" | "style" | "medium" | "subject" |"tags") => {
    setOpenFilters((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <ClipLoader color="#3498db" loading={loading} size={80} />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  );

  if (error) {
    return <div className="text-center text-red-500 py-16">{error}</div>;
  }

  return (
     <div className="min-h-screen bg-white px-6 py-16">
      <div className="container mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#5C0601] mb-2">Browse Arts</h1>
          <p className="text-gray-600 text-lg">
            Explore stunning artwork and find the perfect piece for your space.
          </p>
        </header>
        <hr className="border-gray-300 mb-6" />

       {/* Search and Sort */}
<div className="flex flex-col md:flex-row justify-between items-center mb-6">
  {/* Filter Toggle Button */}
  <button
    onClick={() => setFilterVisible(!filterVisible)}
    className="mb-4 md:mb-0 px-4 py-2 flex items-center space-x-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 w-full md:w-auto"
  >
    <FaFilter />
    <span>{filterVisible ? "Hide Filters" : "Show Filters"}</span>
  </button>

  {/* Search Bar */}
  <div className="relative w-full max-w-lg mx-4 md:mx-0 mb-4 md:mb-0"> 
    <input
      type="text"
      placeholder="Search arts by title, artist, or tag..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full p-3 pl-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
    />
    <FaSearch className="absolute left-3 top-3 text-gray-500" />
  </div>

  {/* Sort Options */}
  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
    <button
      className={`px-4 py-2 rounded-lg w-full md:w-auto ${
        sortOption === "latest" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
      }`}
      onClick={() => setSortOption(sortOption === "latest" ? "" : "latest")}
    >
      Latest
    </button>
    <button
      className={`px-4 py-2 rounded-lg w-full md:w-auto ${
        sortOption === "cheapest" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
      }`}
      onClick={() => setSortOption(sortOption === "cheapest" ? "" : "cheapest")}
    >
      Cheapest
    </button>
  </div>
</div>
<div className="flex flex-col md:flex-row">
  {/* Filter Sidebar (Visible only when filterVisible is true) */}
  {filterVisible && (
    <aside className="w-full md:w-64 p-4 bg-white border-r shadow-md rounded-lg transition-all duration-300 mb-4 md:mb-0">
      <h2 className="text-lg font-bold mb-4">Filters</h2>
      
      {/* Clear Filters Button */}
      <button
        onClick={() => {
          setSelectedPriceRange("");
          setSelectedStyles([]);
          setSelectedMediums([]);
          setSelectedSubjects([]);
          setSelectedTags([]);
        }}
        className="text-blue-600 underline mb-4 hover:text-blue-800"
      >
        Clear All Filters
      </button>

      {/* Price Filter */}
      <div className="mb-6">
        <h3
          className="flex justify-between items-center cursor-pointer text-gray-700"
          onClick={() => handleFilterToggle("price")}
        >
          Price Range {openFilters.price ? <FaChevronUp /> : <FaChevronDown />}
        </h3>
        {openFilters.price && (
          <div className="mt-2">
            {priceRanges.map((range) => (
              <label key={range.value} className="block mb-2">
                <input
                  type="radio"
                  name="priceRange"
                  checked={selectedPriceRange === range.value}
                  onChange={() => setSelectedPriceRange(range.value)}
                  className="mr-2"
                />
                {range.label}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Style Filter */}
      <div className="mb-6">
        <h3
          className="flex justify-between items-center cursor-pointer text-gray-700"
          onClick={() => handleFilterToggle("style")}
        >
          Art Style {openFilters.style ? <FaChevronUp /> : <FaChevronDown />}
        </h3>
        {openFilters.style && (
          <div className="mt-2">
            {artStyles.map((style) => (
              <label key={style} className="block mb-2">
                <input
                  type="checkbox"
                  checked={selectedStyles.includes(style)}
                  onChange={() => handleCheckboxChange(setSelectedStyles, style)}
                  className="mr-2"
                />
                {style}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Medium Filter */}
      <div className="mb-6">
        <h3
          className="flex justify-between items-center cursor-pointer text-gray-700"
          onClick={() => handleFilterToggle("medium")}
        >
          Medium {openFilters.medium ? <FaChevronUp /> : <FaChevronDown />}
        </h3>
        {openFilters.medium && (
          <div className="mt-2">
            {mediums.map((medium) => (
              <label key={medium} className="block mb-2">
                <input
                  type="checkbox"
                  checked={selectedMediums.includes(medium)}
                  onChange={() => handleCheckboxChange(setSelectedMediums, medium)}
                  className="mr-2"
                />
                {medium}
              </label>
            ))}
          </div>
        )}
      </div>

       {/* Subjects Filter */}
       <div className="mb-6">
        <h3
          className="flex justify-between items-center cursor-pointer text-gray-700"
          onClick={() => handleFilterToggle("subject")}
        >
          Subject {openFilters.subject ? <FaChevronUp /> : <FaChevronDown />}
        </h3>
        {openFilters.subject && (
          <div className="mt-2">
            {subjects.map((subject) => (
              <label key={subject} className="block mb-2">
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(subject)}
                  onChange={() => handleCheckboxChange(setSelectedSubjects, subject)}
                  className="mr-2"
                />
                {subject}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Tags Filter */}
      <div className="mb-6">
        <h3
          className="flex justify-between items-center cursor-pointer text-gray-700"
          onClick={() => handleFilterToggle("tags")}
        >
          Tags {openFilters.tags ? <FaChevronUp /> : <FaChevronDown />}
        </h3>
        {openFilters.tags && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.name)}
                  onChange={() => handleCheckboxChange(setSelectedTags, tag.name)}
                  className="mr-2"
                />
                {tag.name}
              </label>
            ))}
          </div>
        )}
      </div>
    </aside>
  )}

 {/* Arts Display */}
<div className={`flex-1 transition-all duration-300 ${filterVisible ? "md:ml-6" : "w-full"}`}>
  {paginatedArts.length === 0 ? (
    <div className="text-center py-16">
      <h2 className="text-2xl font-semibold text-gray-800">No Results Found</h2>
      <p className="text-gray-600 mt-2">
        We couldn't find any artworks matching your search or filter criteria. Please try adjusting your filters or search terms.
      </p>
    </div>
  ) : (
    <Masonry
      breakpointCols={{
        default: 3,
        1100: 2,
        700: 1,
      }}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column"
    >
      {paginatedArts.map((art) => (
        <div
          key={art.art_id}
          className="relative bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
          onClick={() => handleArtClick(art.art_id)}
        >
          {/* Image Section */}
          <div className="relative flex items-center justify-center bg-gray-100">
            {art.image_url ? (
              <img
                src={art.image_url}
                alt={art.title}
                className="w-full"
                style={{
                  objectFit: "contain",
                  maxHeight: art.image_url.includes('portrait') ? "500px" : "300px",
                }}
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500">Image Not Available</p>
              </div>
            )}

            {/* Wishlist Button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering parent click
                handleWishlistToggle(art.art_id);
              }}
              className={`absolute top-3 right-3 bg-white p-2 rounded-full shadow-md transition ${
                wishlist.includes(art.art_id) ? "text-red-500" : "text-gray-400 hover:text-red-500"
              }`}
            >
              <FaHeart size={20} />
            </button>
          </div>

          {/* Art Details */}
          <div className="p-4">
            <h3 className="text-xl font-semibold text-gray-900">{art.title}</h3>
            <p className="text-gray-600 text-sm mb-2">{art.description || "No description available"}</p>
            <p className="text-sm font-medium text-gray-800">
              {art.artist
                ? `${art.artist.firstname} ${art.artist.lastname}`
                : "Unknown Artist"}
            </p>
            <p className="mt-2 text-lg font-bold text-orange-500">
              ₱{parseFloat(art.price).toLocaleString()}
            </p>

            {/* Tags */}
            {art.tags && art.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {art.tags.map((tag) => (
                  <span
                    key={`${art.art_id}-tag-${tag.id}`}
                    className="bg-orange-100 text-orange-700 text-sm font-medium px-3 py-1 rounded-full"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </Masonry>
  )}
{/* Pagination */}
<div className="flex flex-col md:flex-row justify-between items-center py-4 mt-4">
  <p className="text-gray-600 mb-2 md:mb-0">
    Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
    {Math.min(currentPage * itemsPerPage, filteredArts.length)} of {filteredArts.length}{" "}
    items
  </p>
  <div className="flex items-center space-x-2 mb-2 md:mb-0">
    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i + 1}
        onClick={() => handlePageChange(i + 1)}
        className={`px-3 py-1 border ${
          currentPage === i + 1 ? "bg-gray-300" : "bg-white"
        } rounded-md w-full md:w-auto`}
      >
        {i + 1}
      </button>
    ))}
  </div>
  <select
    value={itemsPerPage}
    onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
    className="border rounded-md p-2 w-full md:w-auto"
  >
    {[10, 25, 50, 100].map((number) => (
      <option key={number} value={number}>
        {number} Results Per Page
      </option>
    ))}
  </select>
</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseArts;