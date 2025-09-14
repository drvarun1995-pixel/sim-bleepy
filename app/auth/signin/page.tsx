"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is already signed in
  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Handle registration
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Account created successfully!', {
            description: 'You can now sign in with your credentials.'
          });
          setIsSignUp(false);
          setPassword('');
        } else {
          setError(data.error || 'Registration failed');
          toast.error('Registration Failed', {
            description: data.error || 'Please try again.'
          });
        }
      } else {
        // Handle sign in
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.ok) {
          toast.success('Welcome back!');
          router.push('/dashboard');
        } else {
          setError('Invalid email or password');
          toast.error('Sign In Failed', {
            description: 'Please check your credentials and try again.'
          });
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An unexpected error occurred. Please try again.');
      toast.error('Error', {
        description: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: string) => {
    setLoading(true);
    try {
      const result = await signIn(provider, { 
        callbackUrl: "/dashboard",
        redirect: false 
      });
      
      if (result?.ok) {
        router.push("/dashboard");
      } else {
        console.error(`${provider} sign-in failed:`, result?.error);
      }
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mb-6 sm:mb-8 text-sm sm:text-base">
          <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Back to Home</span>
          <span className="sm:hidden">Back</span>
        </Link>

        {/* Logo and Branding */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <img src="/bleepy-logo.svg" alt="Bleepy Simulator" className="w-10 h-10 sm:w-12 sm:h-12" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900 ml-2 sm:ml-3">Bleepy Simulator</span>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">Practice clinical scenarios anytime with AI patients</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Welcome</h1>
            <p className="text-gray-600 text-sm sm:text-base">Sign in to your account or create a new one</p>
          </div>

          {/* Tabs */}
          <div className="flex mb-4 sm:mb-6">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-3 sm:px-4 text-center font-medium rounded-lg transition-colors text-sm sm:text-base ${
                !isSignUp
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-3 sm:px-4 text-center font-medium rounded-lg transition-colors text-sm sm:text-base ${
                isSignUp
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="name" className="text-xs sm:text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-8 sm:pl-10 text-sm sm:text-base"
                    placeholder="Enter your full name"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-8 sm:pl-10 text-sm sm:text-base"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-8 sm:pl-10 pr-8 sm:pr-10 text-sm sm:text-base"
                  placeholder={isSignUp ? "Create a password (min 8 characters)" : "Enter your password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                </button>
              </div>
              {isSignUp && password && (
                <div className="mt-1">
                  <div className="flex items-center space-x-1">
                    <div className={`h-1 w-1/3 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-1 w-1/3 rounded-full ${password.length >= 12 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-1 w-1/3 rounded-full ${password.length >= 16 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {password.length < 8 ? 'Password too short' : password.length < 12 ? 'Good' : 'Strong'}
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || (isSignUp && password.length < 8)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 text-sm sm:text-base disabled:opacity-50"
            >
              {loading ? (isSignUp ? "Creating Account..." : "Signing in...") : (isSignUp ? "Create Account" : "Sign In")}
            </Button>
          </form>

          {/* Forgot Password Link */}
          {!isSignUp && (
            <div className="mt-4 text-center">
              <Link 
                href="/auth/forgot-password" 
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Forgot your password?
              </Link>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-4 sm:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-2 bg-white text-gray-500">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            onClick={() => handleSocialSignIn("google")}
            disabled={loading}
            variant="outline"
            className="w-full flex items-center justify-center space-x-2 py-2 text-sm sm:text-base hover:bg-gray-50"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-sm sm:text-base">{loading ? "Signing in..." : "Continue with Google"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
