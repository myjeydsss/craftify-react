import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NavBar from "./components/NavBar";
import Explore from "./pages/Explore";
import AboutUs from "./pages/AboutUs";
import HowItWorks from "./pages/HowItWorks";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ArtistDashboard from "./pages/artist/ArtistDashboard";
import AuthRoute from "./components/AuthRoute"; // Ensure AuthRoute is imported
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientDashboard from "./pages/client/ClientDashboard";

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
                        <Route path="/artist-dashboard" element={<ArtistDashboard />} />
                        <Route path="/admin-dashboard" element={<AdminDashboard />} />
                        <Route path="/client-dashboard" element={<ClientDashboard />} />
                    </Route>
                </Routes>
            </div>
        </>
    );
};

export default App;