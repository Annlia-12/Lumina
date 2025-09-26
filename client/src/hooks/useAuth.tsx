import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { STORAGE_KEYS } from "@/lib/constants";
import { supabase } from "../../supabase";

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  );
  const queryClient = useQueryClient();

  // Fetch current user from Supabase
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Login with Supabase
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) throw error;
    setUser(data.user);
    setToken(data.session?.access_token ?? null);
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.session?.access_token ?? "");
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
  };

  // Register with Supabase
  const register = async (userData: any) => {
    setIsLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          userType: userData.userType,
          phone: userData.phone,
          bio: userData.bio,
          location: userData.location,
        },
      },
    });
    setIsLoading(false);
    if (error) throw error;
    setUser(data.user);
    setToken(null); // User must verify email before session
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
  };

  // Update axios default headers when token changes
  useEffect(() => {
    if (token) {
      // Set default authorization header for all requests
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [token]);

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    queryClient.clear();
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
