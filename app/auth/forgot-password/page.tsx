"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast.success('Email Sent!', {
          description: 'If an account with that email exists, a password reset link has been sent.'
        });
      } else {
        toast.error('Error', {
          description: data.error || 'Please try again later.'
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
              <p className="text-gray-600 text-sm sm:text-base mb-6">
                If an account with <strong>{email}</strong> exists, we've sent you a password reset link.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 text-sm sm:text-base"
                >
                  Back to Sign In
                </Button>
                <Button
                  onClick={() => setEmailSent(false)}
                  variant="outline"
                  className="w-full py-2 text-sm sm:text-base"
                >
                  Try Different Email
                </Button>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-center mt-6">
            <p className="text-gray-500 text-xs sm:text-sm">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="text-gray-600 text-sm sm:text-base">Reset your password</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-8 sm:pl-10 text-sm sm:text-base"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 text-sm sm:text-base"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          {/* Back to Sign In */}
          <div className="mt-6 text-center">
            <Link 
              href="/auth/signin" 
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
