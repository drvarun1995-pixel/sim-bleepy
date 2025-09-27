"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useEffect } from "react";
import { toast } from "sonner";

function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Allowed email domains for sign-up
  const allowedDomains = ['@ucl.ac.uk', '@student.aru.ac.uk', '@aru.ac.uk', '@nhs.net'];

  // Function to validate email domain
  const isValidEmailDomain = (email: string): boolean => {
    return allowedDomains.some(domain => email.toLowerCase().endsWith(domain));
  };

  // Check if user is already signed in
  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  // Check if we should start in sign-up mode
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Validate email domain for sign-up
        if (!isValidEmailDomain(email)) {
          setError('Only UCL, ARU, and NHS email addresses are allowed for registration');
          toast.error('Invalid Email Domain', {
            description: 'Please use a UCL (@ucl.ac.uk), ARU (@aru.ac.uk, @student.aru.ac.uk), or NHS (@nhs.net) email address.',
            duration: 3000
          });
          return;
        }

        // Get consent data from checkboxes
        const consent = document.getElementById('consent')?.checked || false;
        const marketing = document.getElementById('marketing')?.checked || false;
        const analytics = document.getElementById('analytics')?.checked || false;

        // Handle registration
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email, 
            password, 
            name,
            consent,
            marketing,
            analytics,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Account created successfully!', {
            description: 'Please check your email and click the verification link before you can sign in.',
            duration: 3000
          });
          setIsSignUp(false);
          setPassword('');
        } else {
          setError(data.error || 'Registration failed');
          toast.error('Registration Failed', {
            description: data.error || 'Please try again.',
            duration: 3000
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
          toast.success('Welcome back!', { duration: 3000 });
          router.push('/dashboard');
        } else {
          // Check if it's an email verification error
          if (result?.error?.includes('verify your email')) {
            setError('Please verify your email address before signing in. Check your inbox for a verification email.');
            toast.error('Email Verification Required', {
              description: 'Please check your inbox and click the verification link before signing in.',
              duration: 3000
            });
          } else {
            setError('Invalid email or password');
            toast.error('Sign In Failed', {
              description: 'Please check your credentials and try again.',
              duration: 3000
            });
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An unexpected error occurred. Please try again.');
      toast.error('Error', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 3000
      });
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
            <img src="/Bleepy-Logo-1-1.webp" alt="Bleepy Simulator" className="w-10 h-10 sm:w-12 sm:h-12" />
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
              {isSignUp && (
                <p className="text-xs text-gray-500 mt-1">
                  Only UCL (@ucl.ac.uk), ARU (@aru.ac.uk, @student.aru.ac.uk), and NHS (@nhs.net) email addresses are allowed
                </p>
              )}
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

            {/* GDPR Consent Checkboxes - Only show during sign up */}
            {isSignUp && (
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="consent"
                    required
                    className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="consent" className="text-xs sm:text-sm text-gray-700">
                    I agree to the <Link href="/terms" className="text-purple-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link> *
                  </label>
                </div>
                
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="marketing"
                    className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="marketing" className="text-xs sm:text-sm text-gray-700">
                    I would like to receive educational content and platform updates via email (optional)
                  </label>
                </div>
                
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="analytics"
                    className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    defaultChecked
                  />
                  <label htmlFor="analytics" className="text-xs sm:text-sm text-gray-700">
                    I consent to analytics cookies to help improve the platform (recommended)
                  </label>
                </div>
              </div>
            )}

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


        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
