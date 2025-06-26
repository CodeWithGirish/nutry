import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  AlertCircle,
  Shield,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const DEMO_CREDENTIALS = [
  {
    email: "admin@nutrivault.com",
    password: "Admin123!@#",
    name: "Admin User",
    role: "admin",
  },
  {
    email: "superadmin@nutrivault.com",
    password: "SuperAdmin123!@#",
    name: "Super Admin",
    role: "super_admin",
  },
  {
    email: "demo@nutrivault.com",
    password: "Demo123!@#",
    name: "Demo Admin",
    role: "admin",
  },
];

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);

  const navigate = useNavigate();
  const { loginAdmin, loading, isAuthenticated } = useAdminAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    // Rate limiting - prevent brute force
    if (loginAttempts >= 5) {
      setError("Too many login attempts. Please wait before trying again.");
      return;
    }

    setError("");

    try {
      const success = await loginAdmin(email.trim(), password);

      if (success) {
        toast({
          title: "Admin Access Granted",
          description: "Welcome to the admin dashboard!",
        });

        navigate("/admin-dashboard", { replace: true });
      } else {
        setLoginAttempts((prev) => prev + 1);
        setError(
          "Invalid admin credentials. Please check your email and password.",
        );

        // Reset password field for security
        setPassword("");

        // Show stronger warning after multiple attempts
        if (loginAttempts >= 3) {
          setError(
            "Multiple failed attempts detected. Account may be temporarily locked.",
          );
        }
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      setError("Login failed. Please try again.");
    }
  };

  const handleMockLogin = (credentials: AdminCredentials) => {
    setEmail(credentials.email);
    setPassword(credentials.password);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Main Site */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to NutriVault
          </Button>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Admin Portal
              </CardTitle>
              <p className="text-slate-300 mt-2">
                Secure access to NutriVault administration
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className="border-red-500/50 bg-red-500/10"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Mock Login Options */}
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-slate-300 text-sm mb-3">
                  Quick Login (Demo)
                </p>
              </div>
              {MOCK_ADMIN_CREDENTIALS.map((cred) => (
                <Button
                  key={cred.email}
                  variant="outline"
                  className="w-full justify-start bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-600"
                  onClick={() => handleMockLogin(cred)}
                  disabled={loading}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{cred.name}</div>
                    <div className="text-xs text-slate-400">{cred.email}</div>
                  </div>
                </Button>
              ))}
            </div>

            <div className="relative">
              <Separator className="bg-slate-600" />
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 px-2 text-sm text-slate-400">
                Or enter manually
              </span>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Label htmlFor="admin-email" className="text-slate-200">
                  Admin Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="Enter admin email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-orange-500"
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="admin-password" className="text-slate-200">
                  Admin Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 pr-10"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Access Admin Portal
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-slate-400 space-y-1">
              <p>⚠️ Demo Credentials Available Above</p>
              <p className="text-xs">
                All access attempts are logged and monitored
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
