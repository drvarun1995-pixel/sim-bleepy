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

// Declare grecaptcha for TypeScript
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailVerificationError, setIsEmailVerificationError] = useState(false);
  const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false);
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
        console.log('[Sign In] User already signed in, checking onboarding flag')
        // Check if user needs to go to onboarding
        const shouldGoToOnboarding = sessionStorage.getItem('redirectToOnboarding') === 'true';
        console.log('[Sign In] Should go to onboarding:', shouldGoToOnboarding)
        if (shouldGoToOnboarding) {
          sessionStorage.removeItem('redirectToOnboarding');
          console.log('[Sign In] Redirecting to onboarding')
          router.push("/onboarding/profile");
        } else {
          console.log('[Sign In] Redirecting to dashboard')
          router.push("/dashboard");
        }
      }
    });
  }, [router]);

  // Check if we should start in sign-up mode and pre-fill email
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    }
    
    // Pre-fill email if provided (e.g., from password reset)
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    
    // Check if onboarding is required from URL parameter
    const onboardingParam = searchParams.get('onboarding');
    if (onboardingParam === 'required') {
      console.log('[Sign In] Onboarding required from URL parameter')
      sessionStorage.setItem('redirectToOnboarding', 'true')
    }
  }, [searchParams]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setIsSignUp(prev => !prev);
        setError(null);
        setIsEmailVerificationError(false);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Load reCAPTCHA v3 (only in production and for sign-up)
  useEffect(() => {
    const loadRecaptcha = () => {
      // Only load reCAPTCHA in production (sim.bleepy.co.uk) and when sign-up is enabled
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Skipping reCAPTCHA in development mode')
        return
      }

      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          setIsRecaptchaLoaded(true)
        })
      } else {
        // Load the reCAPTCHA script if not already loaded
        const script = document.createElement('script')
        script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`
        script.async = true
        script.defer = true
        script.onload = () => {
          window.grecaptcha.ready(() => {
            setIsRecaptchaLoaded(true)
          })
        }
        script.onerror = () => {
          console.warn('Failed to load reCAPTCHA script')
        }
        document.head.appendChild(script)
      }
    }

    loadRecaptcha()
  }, []);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address first', { duration: 3000 });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Verification email sent!', {
          description: 'Please check your inbox and spam folder.',
          duration: 5000
        });
      } else {
        toast.error('Failed to resend verification email', {
          description: data.error || 'Please try again or contact support.',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('An error occurred', {
        description: 'Please try again or contact support.',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsEmailVerificationError(false);

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
        const consent = (document.getElementById('consent') as HTMLInputElement)?.checked || false;
        const marketing = (document.getElementById('marketing') as HTMLInputElement)?.checked || false;
        const analytics = (document.getElementById('analytics') as HTMLInputElement)?.checked || false;

        // Get reCAPTCHA token for sign-up (skip in development)
        let recaptchaToken = '';
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && 
            isRecaptchaLoaded && window.grecaptcha && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
          try {
            recaptchaToken = await window.grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, {
              action: 'signup'
            })
          } catch (recaptchaError) {
            console.warn('reCAPTCHA token generation failed:', recaptchaError)
            // Continue without token
          }
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log('Skipping reCAPTCHA in development mode for sign-up')
        }

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
            recaptchaToken
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
        console.log('Attempting sign in for:', email);
        
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        console.log('Sign in result:', result);

        if (result?.ok) {
          console.log('[Sign In] Sign in successful, redirecting...');
          
          // Store user email in localStorage for Google Analytics exclusion
          localStorage.setItem('userEmail', email);
          sessionStorage.setItem('userEmail', email);
          
          // Check if user needs to go to onboarding (set by password reset flow)
          const shouldGoToOnboarding = sessionStorage.getItem('redirectToOnboarding') === 'true';
          console.log('[Sign In] Checking onboarding flag:', shouldGoToOnboarding)
          console.log('[Sign In] SessionStorage value:', sessionStorage.getItem('redirectToOnboarding'))
          
          if (shouldGoToOnboarding) {
            // Clear the flag
            sessionStorage.removeItem('redirectToOnboarding');
            console.log('[Sign In] Redirecting to onboarding/profile')
            toast.success('Welcome!', { 
              description: 'Let\'s complete your profile to get started.',
              duration: 3000 
            });
            // Add a small delay to ensure session is established
            setTimeout(() => {
              window.location.href = '/onboarding/profile';
            }, 500);
          } else {
            console.log('[Sign In] Redirecting to dashboard')
            toast.success('Welcome back!', { duration: 3000 });
            // Add a small delay to ensure session is established
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 500);
          }
        } else {
          console.log('Sign in failed:', result?.error);
          // Check if it's an email verification error
          if (result?.error?.includes('EMAIL_NOT_VERIFIED') || result?.error?.includes('verify your email')) {
            setError('Please verify your email address before signing in. Check your inbox for a verification email.');
            setIsEmailVerificationError(true);
            toast.error('Email Verification Required', {
              description: 'Please check your inbox and click the verification link before signing in. If you didn\'t receive the email, try checking your spam folder or contact support.',
              duration: 7000
            });
          } else {
            setError('Invalid email or password');
            setIsEmailVerificationError(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center p-3 sm:p-4">
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
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-2 rounded-xl">
              <img src="/Bleepy-Logo-1-1.webp" alt="Bleepy" className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent ml-2 sm:ml-3">Bleepy</span>
          </div>
          <p className="text-gray-600 text-sm sm:text-base font-medium">AI-powered clinical training for medical professionals</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-8">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Welcome</h1>
            <p className="text-gray-600 text-sm sm:text-base">Sign in to your account or create a new one</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 sm:mb-6 p-1 bg-gray-50 rounded-xl">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError(null);
                setIsEmailVerificationError(false);
              }}
              className={`flex-1 py-2.5 px-3 sm:px-4 text-center font-semibold rounded-lg transition-all duration-200 text-sm sm:text-base ${
                !isSignUp
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError(null);
                setIsEmailVerificationError(false);
              }}
              className={`flex-1 py-2.5 px-3 sm:px-4 text-center font-semibold rounded-lg transition-all duration-200 text-sm sm:text-base ${
                isSignUp
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                  {isEmailVerificationError && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="mt-2 text-sm font-semibold text-red-700 hover:text-red-900 underline"
                    >
                      Resend verification email →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {isSignUp && (
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-1 block">
                Full Name
              </Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-8 sm:pl-10 text-sm sm:text-base focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="Enter your full name"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-1 block">
                Email
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-8 sm:pl-10 text-sm sm:text-base focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Enter your email"
                  autoFocus
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
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700 mb-1 block">
                Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-8 sm:pl-10 pr-8 sm:pr-10 text-sm sm:text-base focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder={isSignUp ? "Create a password (min 8 characters)" : "Enter your password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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

            {/* Remember Me and Forgot Password - Only show during sign in */}
            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* GDPR Consent Checkboxes - Only show during sign up */}
            {isSignUp && (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="consent"
                    required
                    defaultChecked
                    className="mt-0.5 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
                  />
                  <label htmlFor="consent" className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    I agree to the <Link href="/terms" className="text-purple-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link> *
                  </label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="marketing"
                    defaultChecked
                    className="mt-0.5 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
                  />
                  <label htmlFor="marketing" className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    I would like to receive educational content and platform updates via email (optional)
                  </label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="analytics"
                    className="mt-0.5 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
                    defaultChecked
                  />
                  <label htmlFor="analytics" className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    I consent to analytics cookies to help improve the platform (recommended)
                  </label>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || (isSignUp && password.length < 8)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSignUp ? "Creating Account..." : "Signing in..."}
                </span>
              ) : (
                isSignUp ? "Create Account" : "Sign In"
              )}
            </Button>
          </form>



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
