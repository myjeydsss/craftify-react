import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import "./index.css";
import HomePage from "./pages/HomePage";
import NavBar from "./components/NavBar";
import Explore from "./pages/Explore";
import AboutUs from "./pages/AboutUs";
import HowItWorks from "./pages/HowItWorks";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AuthRoute from "./components/AuthRoute";
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
import Notification from "./pages/Notification";
import Cart from "./pages/payment order/Cart";
import Checkout from "./pages/payment order/Checkout";
import ViewProfileArtist from "./pages/ViewProfileArtist";
import ClientProfile from "./pages/client/ClientProfile";
import BrowseClient from "./pages/BrowseClient";
import ViewProfileClient from "./pages/ViewProfileClient";
import Community from "./pages/Community";
import ArtistProject from "./pages/artist/ArtistProject";
import ClientProject from "./pages/client/ClientProject";
import Messages from "./pages/Messages";
import MessagePopup from "./pages/MessagePopup";
import TransactionHistory from "./pages/TransactionHistory";
import Verification from "./pages/admin/Verification";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import FAQ from "./pages/FAQ";
import PasswordReset from "./pages/PasswordReset";
import UpdatePassword from "./pages/UpdatePassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import EditAdminProfile from "./pages/admin/EditAdminProfile";
import DynamicDashboard from "./components/DynamicDashboard";
import ClientPostJob from "./pages/client/ClientPostJob";
import BrowseJobs from "./pages/BrowseJobs";
import PaymentSuccess from "./pages/client/PaymentSuccess";
import PaymentCancel from "./pages/client/PaymentCancel";
import PaymentArtSuccess from "./pages/artist/PaymentArtSuccess";
import PaymentArtCancel from "./pages/artist/PaymentArtCancel";
import ClientVerification from "./pages/client/ClientVerification";
import OrdersTable from "./pages/admin/OrdersTable";
import MilestoneTransactions from "./pages/admin/MilestoneTransactions";

const App = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname !== "/update-password" &&
        location.pathname !== "/password-reset" && <NavBar />}
      <div className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route
            path="/terms-and-conditions"
            element={<TermsAndConditions />}
          />
          <Route path="/faq" element={<FAQ />} />

          {/* ✅ Protected routes */}
          <Route element={<AuthRoute />}>
            <Route path="/dashboard" element={<DynamicDashboard />} />{" "}
            {/* ✅ Dynamic route */}
            <Route path="/artist-profile" element={<ArtistProfile />} />
            <Route
              path="/edit-artist-profile"
              element={<EditArtistProfile />}
            />
            <Route
              path="/artist-verification"
              element={<ArtistVerification />}
            />
            <Route path="/artist-arts" element={<MyArts />} />
            <Route path="/artist-post-arts" element={<PostArts />} />
            <Route path="/edit-art/:artId" element={<EditArtPage />} />
            <Route path="/artist-track-project" element={<ArtistProject />} />
            {/* Admin routes */}
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-profile" element={<AdminProfile />} />
            <Route path="/edit-admin-profile" element={<EditAdminProfile />} />
            <Route path="/users-table" element={<UserTable />} />
            <Route path="/tags-table" element={<TagTable />} />
            <Route path="/arts-table" element={<ArtsTable />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/orders-table" element={<OrdersTable />} />
            <Route
              path="/milestone-table"
              element={<MilestoneTransactions />}
            />
            {/* Client routes */}
            <Route path="/client-profile" element={<ClientProfile />} />
            <Route
              path="/edit-client-profile"
              element={<EditClientProfile />}
            />
            <Route path="/client-project-page" element={<ClientProject />} />
            <Route
              path="/client-verification"
              element={<ClientVerification />}
            />
            {/* Other routes */}
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
            <Route
              path="/payment-art-success"
              element={<PaymentArtSuccess />}
            />
            <Route path="/payment-art-cancel" element={<PaymentArtCancel />} />
            <Route path="/browse-artists" element={<BrowseArtist />} />
            <Route
              path="/profile/artist/:userId"
              element={<ViewProfileArtist />}
            />
            <Route path="/browse-arts" element={<BrowseArts />} />
            <Route path="/art/:artId" element={<ArtDetail />} />
            <Route path="/browse-clients" element={<BrowseClient />} />
            <Route path="/browse-jobs" element={<BrowseJobs />} />
            <Route
              path="/profile/client/:userId"
              element={<ViewProfileClient />}
            />
            <Route path="/community" element={<Community />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/notifications" element={<Notification />} />
            <Route path="/messages" element={<Messages />} />
            <Route
              path="/message-popup"
              element={
                <MessagePopup
                  onClose={() => {}}
                  sender_id={""}
                  receiver_id={""}
                />
              }
            />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route
              path="/transaction-history"
              element={<TransactionHistory />}
            />
            <Route path="/post-job" element={<ClientPostJob />} />
          </Route>
        </Routes>
      </div>
    </>
  );
};

export default App;
