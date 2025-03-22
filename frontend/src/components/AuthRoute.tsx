import React from "react";
import { useAuth } from "../context/AuthProvider";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const AuthRoute: React.FC = () => {
  const { auth } = useAuth();
  const location = useLocation();

  // Allow access to specific routes without authentication
  const publicRoutes = [
    "/login",
    "/register",
    "/password-reset",
    "/update-password",
  ];

  return publicRoutes.includes(location.pathname) || auth ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

export default AuthRoute;
