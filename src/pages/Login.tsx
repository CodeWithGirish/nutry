import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Chrome, Loader2, AlertCircle, Mail, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forget password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
      toast({
        title: "Welcome back!",
        description: "You have been successfully signed in.",
      });
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Google login error:", error);
      setError(error.message || "Failed to sign in with Google");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      setResetError("Please enter your email address");
      return;
    }

    setResetLoading(true);
    setResetError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setResetSuccess(true);
      toast({
        title: "Reset email sent!",
        description: "Please check your email for password reset instructions.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      setResetError(
        error.message || "Failed to send reset email. Please try again.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  const resetForgotPasswordForm = () => {
    setResetEmail("");
    setResetError("");
    setResetSuccess(false);
    setShowForgotPassword(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome Back
              </CardTitle>
              <p className="text-gray-600">
                Sign in to your account to continue shopping
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email/Password Login */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    required
                    className="mt-1"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Dialog
                      open={showForgotPassword}
                      onOpenChange={setShowForgotPassword}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-brand-600 hover:text-brand-700"
                          type="button"
                        >
                          Forgot password?
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Reset Password
                          </DialogTitle>
                        </DialogHeader>

                        {resetSuccess ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-center">
                              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                              </div>
                            </div>
                            <div className="text-center space-y-2">
                              <p className="text-sm text-gray-600">
                                We've sent a password reset link to:
                              </p>
                              <p className="font-medium">{resetEmail}</p>
                              <p className="text-sm text-gray-600">
                                Check your email and follow the instructions to
                                reset your password.
                              </p>
                            </div>
                            <Button
                              onClick={resetForgotPasswordForm}
                              className="w-full"
                            >
                              Done
                            </Button>
                          </div>
                        ) : (
                          <form
                            onSubmit={handleForgotPassword}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">
                                Enter your email address and we'll send you a
                                link to reset your password.
                              </p>
                            </div>

                            {resetError && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  {resetError}
                                </AlertDescription>
                              </Alert>
                            )}

                            <div>
                              <Label htmlFor="resetEmail">Email Address</Label>
                              <Input
                                id="resetEmail"
                                type="email"
                                placeholder="Enter your email"
                                value={resetEmail}
                                onChange={(e) => {
                                  setResetEmail(e.target.value);
                                  if (resetError) setResetError("");
                                }}
                                required
                                className="mt-1"
                              />
                            </div>

                            <div className="flex gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={resetForgotPasswordForm}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={resetLoading}
                                className="flex-1 bg-brand-600 hover:bg-brand-700"
                              >
                                {resetLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Reset Link
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    required
                    className="mt-1"
                    autoComplete="current-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="relative">
                <Separator />
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                  Or continue with
                </span>
              </div>

              {/* Social Login */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <Link
                  to="/signup"
                  className="text-brand-600 hover:underline font-medium"
                >
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
