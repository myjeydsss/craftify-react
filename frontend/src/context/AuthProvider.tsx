import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../../client";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  auth: boolean;
  user: User | null;
  login: (
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; userId?: string }>;
  signOut: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data?.session?.user || null;
      setUser(currentUser);
      setAuth(!!currentUser);
      setLoading(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        setUser(session?.user || null);
        setAuth(true);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setAuth(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string; userId?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || "Login failed." };
      }

      return { success: true, userId: data.user.id };
    } catch (err: any) {
      return { success: false, error: "Unexpected error during login." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuth(false);
  };

  return (
    <AuthContext.Provider value={{ auth, user, login, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;