// src/pages/DynamicDashboard.tsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../client";
import ArtistDashboard from "../pages/artist/ArtistDashboard";
import ClientDashboard from "../pages/client/ClientDashboard";

const DynamicDashboard: React.FC = () => {
  const [role, setRole] = useState<"artist" | "client" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const userId = user.id;

        // Check if user is an artist
        const { data: artistData } = await supabase
          .from("artist")
          .select("role")
          .eq("user_id", userId)
          .single();

        if (artistData?.role) {
          setRole("artist");
          setLoading(false);
          return;
        }

        // Check if user is a client
        const { data: clientData } = await supabase
          .from("client")
          .select("role")
          .eq("user_id", userId)
          .single();

        if (clientData?.role) {
          setRole("client");
          setLoading(false);
          return;
        }

        setRole(null);
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (role === "artist") {
    return <ArtistDashboard />;
  }

  if (role === "client") {
    return <ClientDashboard />;
  }

  return <Navigate to="/" replace />;
};

export default DynamicDashboard;
