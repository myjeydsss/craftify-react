import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../../client"; // Adjust the import based on your setup
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  auth: boolean;
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string; userId?: string }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>; // Add this line
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser ] = useState<User | null>(null);
  const [auth, setAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data?.session;
      setUser (currentSession?.user || null);
      setToken(currentSession?.access_token || null);
      setAuth(!!currentSession?.user);
      setLoading(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        setUser (session?.user || null);
        setToken(session?.access_token || null);
        setAuth(true);
      } else if (event === "SIGNED_OUT") {
        setUser (null);
        setToken(null);
        setAuth(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string; userId?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });

      if (error || !data.user) {
        return { success: false, error: "Invalid email or password." };
      }

      setToken(data.session?.access_token || null);
      return { success: true, userId: data.user.id };
    } catch (err: any) {
      return { success: false, error: "Unexpected error during login." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser (null);
    setToken(null);
    setAuth(false);
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser ({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: "Unexpected error occurred." };
    }
  };

  return (
    <AuthContext.Provider value={{ auth, user, token, login, signOut, updatePassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;