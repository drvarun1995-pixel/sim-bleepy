"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        toast.success('Password Reset!', {
          description: 'Your password has been updated successfully.'
        });
      } else {
        setError(data.error || 'Failed to reset password');
        toast.error('Reset Failed', {
          description: data.error || 'Please try again.'
        });
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Error', {
        description: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
              <p className="text-gray-600 text-sm sm:text-base mb-6">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 text-sm sm:text-base"
              >
                Sign In to Your Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
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

          {/* Error Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Reset Failed</h1>
              <p className="text-gray-600 text-sm sm:text-base mb-6">{error}</p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth/forgot-password')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 text-sm sm:text-base"
                >
                  Request New Reset Link
                </Button>
                <Button
                  onClick={() => router.push('/auth/signin')}
                  variant="outline"
                  className="w-full py-2 text-sm sm:text-base"
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
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
          <p className="text-gray-600 text-sm sm:text-base">Set your new password</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Enter your new password below.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-700">
                New Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-8 sm:pl-10 pr-8 sm:pr-10 text-sm sm:text-base"
                  placeholder="Enter your new password"
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
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium text-gray-700">
                Confirm New Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-8 sm:pl-10 pr-8 sm:pr-10 text-sm sm:text-base"
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 text-sm sm:text-base disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
