import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NavBar from "./components/NavBar";
import Explore from "./pages/Explore";
import AboutUs from "./pages/AboutUs";
import HowItWorks from "./pages/HowItWorks";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ArtistDashboard from "./pages/artist/ArtistDashboard";
import AuthRoute from "./components/AuthRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientDashboard from "./pages/client/ClientDashboard";
import ArtistProfile from "./pages/artist/ArtistProfile";
import EditArtistProfile from "./pages/artist/EditArtistProfile";
import EditClientProfile from "./pages/client/EditClientProfile";
import ArtistVerification from "./pages/artist/ArtistVerification";
import MyArts from "./pages/artist/MyArts";
import UserTable from "./pages/admin/UserTable";
import TagTable from "./pages/admin/TagTable";
import PostArts from "./pages/artist/PostArts";
import EditArtPage from "./pages/artist/EditArtPage";
import ArtsTable from "./pages/admin/ArtsTable";
import BrowseArtist from "./pages/BrowseArtist";
import BrowseArts from "./pages/BrowseArts";
import ArtDetail from "./pages/ArtDetail";
import Cart from "./pages/payment order/Cart";
import Checkout from "./pages/payment order/Checkout";
import ViewProfileArtist from "./pages/ViewProfileArtist";
import ClientProfile from "./pages/client/ClientProfile";
import BrowseClient from "./pages/BrowseClient";
import ViewProfileClient from "./pages/ViewProfileClient";

const App = () => {
  
    return (
        <>
            <NavBar />
            <div className="container mx-auto px-4 py-6">
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/about-us" element={<AboutUs />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />

                    {/* Protected routes */}
                    <Route element={<AuthRoute />}>
                    
                    {/* Artist routes */}
                        <Route path="/artist-dashboard" element={<ArtistDashboard />} />
                        <Route path="/artist-profile" element={<ArtistProfile />} />
                        <Route path="/edit-artist-profile" element={<EditArtistProfile />} />
                        <Route path="/artist-verification" element={<ArtistVerification />} />
                        <Route path="/artist-arts" element={<MyArts />} />
                        <Route path="/artist-post-arts" element={<PostArts />} />
                        <Route path="/edit-art/:artId" element={<EditArtPage />} />


                    {/* Admin routes */}
                        <Route path="/admin-dashboard" element={<AdminDashboard />} />
                        <Route path="/users-table" element={<UserTable />} />
                        <Route path="/tags-table" element={<TagTable />} />
                        <Route path="/arts-table" element={<ArtsTable />} />


                    {/* Client routes */}
                        <Route path="/client-dashboard" element={<ClientDashboard />} />
                        <Route path="/client-profile" element={<ClientProfile />} />
                        <Route path="/edit-client-profile" element={<EditClientProfile />} />


                    {/* Other routes */}
                    <Route path="/browse-artists" element={<BrowseArtist />} />
                    <Route path="/profile/artist/:userId" element={<ViewProfileArtist />} />
                    <Route path="/browse-arts" element={<BrowseArts />} />
                    <Route path="/art/:artId" element={<ArtDetail />} />

                    <Route path="/browse-clients" element={<BrowseClient />} />
                    <Route path="/profile/client/:userId" element={<ViewProfileClient />} />


 

                    {/* Payment routes */}
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    







                    </Route>
                </Routes>
            </div>
        </>
    );
};

export default App;