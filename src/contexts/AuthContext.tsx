import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { User as ProfileUser } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  profile: ProfileUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    isAdmin?: boolean,
  ) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Immediate loading timeout - never block UI more than 2 seconds
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log("Auth loading timeout - proceeding without session");
        setLoading(false);
      }
    }, 2000);

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Session fetch timeout")), 3000),
        );

        const {
          data: { session },
        } = (await Promise.race([sessionPromise, timeoutPromise])) as any;

        console.log(
          "Initial session loaded:",
          session?.user?.email || "No session",
        );
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Create instant fallback profile
          const fallbackProfile = createFallbackProfile(session.user);
          setProfile(fallbackProfile);

          // Try to fetch/create real profile in background
          fetchOrCreateProfile(session.user).catch((error) => {
            console.log("Background profile fetch failed:", error);
          });
        }
      } catch (error) {
        console.log("Session fetch failed:", error);
      } finally {
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "Auth state changed:",
        event,
        session?.user?.email || "signed out",
      );
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Instant fallback profile
        const fallbackProfile = createFallbackProfile(session.user);
        setProfile(fallbackProfile);

        // Background profile fetch
        fetchOrCreateProfile(session.user).catch((error) => {
          console.log("Background profile creation failed:", error);
        });
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const createFallbackProfile = (user: User): ProfileUser => {
    return {
      id: user.id,
      email: user.email || "",
      full_name:
        user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      phone: user.user_metadata?.phone || null,
      role: user.user_metadata?.role || "user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const fetchOrCreateProfile = async (user: User) => {
    try {
      console.log("Fetching profile for user:", user.id);

      // Quick timeout for profile fetch
      const fetchPromise = supabase
        .from("profiles")
        .select("*")
        .eq("email", user.email)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Profile fetch timeout")), 5000),
      );

      const { data: profile, error } = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as any;

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist, create it quickly
        console.log("Creating profile for:", user.email);

        const newProfile = {
          id: user.id,
          email: user.email || "",
          full_name:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User",
          phone: user.user_metadata?.phone || null,
          role: user.user_metadata?.role || "user",
        };

        const createPromise = supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .single();

        const createTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Profile create timeout")), 5000),
        );

        const { data: createdProfile } = (await Promise.race([
          createPromise,
          createTimeoutPromise,
        ])) as any;

        if (createdProfile) {
          setProfile(createdProfile);
          console.log("Profile created successfully");
        }
      } else if (!error && profile) {
        setProfile(profile);
        console.log("Profile loaded successfully");
      }
    } catch (error) {
      console.log("Profile operation failed, using fallback:", error);
      // Keep the fallback profile we already set
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    isAdmin?: boolean,
  ) => {
    try {
      console.log("Starting signup for:", email);
      setLoading(true);

      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
            role: isAdmin ? "admin" : "user",
          },
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Signup timeout")), 10000),
      );

      const { data, error } = (await Promise.race([
        signUpPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.error("Signup error:", error);
        throw error;
      }

      console.log("Signup successful for:", data.user?.email);

      // Background profile creation - don't wait
      if (data.user) {
        setTimeout(async () => {
          try {
            await supabase.from("profiles").upsert(
              {
                id: data.user.id,
                email: email,
                full_name: fullName,
                phone: phone || null,
                role: isAdmin ? "admin" : "user",
              },
              {
                onConflict: "id",
                ignoreDuplicates: false,
              },
            );
            console.log("Background profile created");
          } catch (error) {
            console.log("Background profile creation failed:", error);
          }
        }, 100);
      }

      return data;
    } catch (error: any) {
      console.error("SignUp error:", error);

      // User-friendly error messages
      if (error.message?.includes("already registered")) {
        throw new Error(
          "An account with this email already exists. Please sign in instead.",
        );
      } else if (error.message?.includes("Invalid email")) {
        throw new Error("Please enter a valid email address.");
      } else if (error.message?.includes("Password should be")) {
        throw new Error("Password must be at least 6 characters long.");
      } else if (error.message?.includes("timeout")) {
        throw new Error("Network is slow. Please try again.");
      } else {
        throw new Error(
          error.message || "Failed to create account. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Starting signin for:", email);
      setLoading(true);

      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Signin timeout")), 8000),
      );

      const { data, error } = (await Promise.race([
        signInPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.error("SignIn error:", error.message || error);

        if (error.message?.includes("Invalid login credentials")) {
          throw new Error(
            "The email or password you entered is incorrect. Please check your credentials and try again.",
          );
        } else if (error.message?.includes("Email not confirmed")) {
          throw new Error(
            "Please check your email and click the confirmation link before signing in.",
          );
        } else if (error.message?.includes("timeout")) {
          throw new Error("Network is slow. Please try again.");
        } else if (error.message?.includes("Failed to fetch")) {
          throw new Error(
            "Unable to connect to the server. Please check your internet connection and try again.",
          );
        } else if (error.name === "AuthRetryableFetchError") {
          throw new Error(
            "Connection error. Please check your internet connection and try again.",
          );
        } else {
          throw new Error(
            error.message || "Failed to sign in. Please try again.",
          );
        }
      }

      console.log("SignIn successful for:", data.user?.email);
      return data;
    } catch (error: any) {
      console.error("SignIn error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out user");

      // Clear state immediately for better UX
      setUser(null);
      setProfile(null);
      setSession(null);

      // Sign out in background
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("SignOut error:", error);
        // Don't throw - user state is already cleared
      }
    } catch (error: any) {
      console.error("SignOut error:", error);
      // Don't throw - user is effectively signed out
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log("Starting Google signin");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Google SignIn error:", error);
      throw error;
    }
  };

  const isAdmin = profile?.role === "admin";

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
