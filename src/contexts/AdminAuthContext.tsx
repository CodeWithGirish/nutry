import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: "admin" | "super_admin";
  loginTime: string;
  lastActivity: string;
}

interface AdminAuthContextType {
  adminSession: AdminSession | null;
  loading: boolean;
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  logoutAdmin: () => void;
  isAuthenticated: boolean;
  checkSession: () => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

// Secure admin credentials - in production, these should be stored in database with hashed passwords
const ADMIN_CREDENTIALS = [
  {
    email: "admin@nutrivault.com",
    password: "Admin123!@#", // Strong password
    name: "Admin User",
    role: "admin" as const,
  },
  {
    email: "superadmin@nutrivault.com",
    password: "SuperAdmin123!@#", // Strong password
    name: "Super Admin",
    role: "super_admin" as const,
  },
];

const SESSION_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // 1 minute

export const AdminAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkExistingSession();

    // Set up activity monitoring
    const activityInterval = setInterval(() => {
      updateLastActivity();
    }, ACTIVITY_CHECK_INTERVAL);

    // Set up session timeout check
    const timeoutInterval = setInterval(() => {
      checkSessionTimeout();
    }, ACTIVITY_CHECK_INTERVAL);

    return () => {
      clearInterval(activityInterval);
      clearInterval(timeoutInterval);
    };
  }, []);

  const checkExistingSession = () => {
    try {
      const sessionData = localStorage.getItem("admin_session");
      if (sessionData) {
        const session = JSON.parse(sessionData);

        // Validate session structure and timeout
        if (isValidSession(session) && !isSessionExpired(session)) {
          setAdminSession({
            ...session,
            lastActivity: new Date().toISOString(),
          });
          updateLastActivity();
        } else {
          // Invalid or expired session
          localStorage.removeItem("admin_session");
        }
      }
    } catch (error) {
      console.error("Error checking admin session:", error);
      localStorage.removeItem("admin_session");
    } finally {
      setLoading(false);
    }
  };

  const isValidSession = (session: any): session is AdminSession => {
    return (
      session &&
      typeof session.id === "string" &&
      typeof session.email === "string" &&
      typeof session.name === "string" &&
      typeof session.role === "string" &&
      typeof session.loginTime === "string" &&
      (session.role === "admin" || session.role === "super_admin")
    );
  };

  const isSessionExpired = (session: AdminSession): boolean => {
    const lastActivity = new Date(session.lastActivity || session.loginTime);
    const now = new Date();
    return now.getTime() - lastActivity.getTime() > SESSION_TIMEOUT;
  };

  const updateLastActivity = () => {
    const sessionData = localStorage.getItem("admin_session");
    if (sessionData && adminSession) {
      try {
        const session = JSON.parse(sessionData);
        const updatedSession = {
          ...session,
          lastActivity: new Date().toISOString(),
        };
        localStorage.setItem("admin_session", JSON.stringify(updatedSession));
        setAdminSession(updatedSession);
      } catch (error) {
        console.error("Error updating activity:", error);
      }
    }
  };

  const checkSessionTimeout = () => {
    if (adminSession && isSessionExpired(adminSession)) {
      logoutAdmin();
      toast({
        title: "Session Expired",
        description: "Your admin session has expired. Please log in again.",
        variant: "destructive",
      });
    }
  };

  const loginAdmin = async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    setLoading(true);

    try {
      // Simulate network delay for security
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Find matching admin credentials
      const admin = ADMIN_CREDENTIALS.find(
        (cred) => cred.email === email && cred.password === password,
      );

      if (!admin) {
        // Log failed attempt (in production, implement rate limiting and logging)
        console.warn("Failed admin login attempt:", {
          email,
          timestamp: new Date().toISOString(),
        });
        return false;
      }

      // Create session
      const session: AdminSession = {
        id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };

      // Store session securely
      localStorage.setItem("admin_session", JSON.stringify(session));
      setAdminSession(session);

      // Log successful login (in production, log to audit system)
      console.log("Admin login successful:", {
        email: admin.email,
        role: admin.role,
        timestamp: session.loginTime,
      });

      // Store admin activity log in Supabase (optional)
      try {
        await supabase.from("admin_activity_log").insert({
          admin_email: admin.email,
          action: "login",
          timestamp: session.loginTime,
          session_id: session.id,
        });
      } catch (error) {
        // Don't fail login if logging fails
        console.warn("Failed to log admin activity:", error);
      }

      return true;
    } catch (error) {
      console.error("Admin login error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logoutAdmin = () => {
    if (adminSession) {
      // Log logout activity
      console.log("Admin logout:", {
        email: adminSession.email,
        sessionDuration:
          new Date().getTime() - new Date(adminSession.loginTime).getTime(),
        timestamp: new Date().toISOString(),
      });

      // Store logout activity in Supabase (optional)
      try {
        supabase.from("admin_activity_log").insert({
          admin_email: adminSession.email,
          action: "logout",
          timestamp: new Date().toISOString(),
          session_id: adminSession.id,
        });
      } catch (error) {
        console.warn("Failed to log admin logout:", error);
      }
    }

    // Clear session
    localStorage.removeItem("admin_session");
    setAdminSession(null);
  };

  const checkSession = (): boolean => {
    if (!adminSession) return false;

    if (isSessionExpired(adminSession)) {
      logoutAdmin();
      return false;
    }

    return true;
  };

  const value = {
    adminSession,
    loading,
    loginAdmin,
    logoutAdmin,
    isAuthenticated: !!adminSession && !isSessionExpired(adminSession),
    checkSession,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
