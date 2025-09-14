"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function VerifyEmailForm() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`/api/auth/verify?token=${verificationToken}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Your email has been verified successfully! You can now sign in to your account.');
        toast.success('Email Verified!', {
          description: 'Your account is now active. You can sign in.'
        });
      } else {
        if (data.error?.includes('expired')) {
          setStatus('expired');
          setMessage('This verification link has expired. Please request a new one.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. Please try again.');
        }
        toast.error('Verification Failed', {
          description: data.error || 'Please try again.'
        });
      }
    } catch (error) {
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
      toast.error('Error', {
        description: 'An unexpected error occurred. Please try again.'
      });
    }
  };

  const resendVerification = async () => {
    setResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Verification Email Sent!', {
          description: 'Please check your inbox for a new verification email.'
        });
      } else {
        toast.error('Failed to Resend', {
          description: data.error || 'Please try again later.'
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setResending(false);
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
          <p className="text-gray-600 text-sm sm:text-base">Email Verification</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Verifying Your Email</h1>
                <p className="text-gray-600 text-sm sm:text-base">Please wait while we verify your email address...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
                <p className="text-gray-600 text-sm sm:text-base mb-6">{message}</p>
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 text-sm sm:text-base"
                >
                  Sign In to Your Account
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
                <p className="text-gray-600 text-sm sm:text-base mb-6">{message}</p>
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/auth/signin')}
                    variant="outline"
                    className="w-full py-2 text-sm sm:text-base"
                  >
                    Back to Sign In
                  </Button>
                  <Button
                    onClick={() => router.push('/')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 text-sm sm:text-base"
                  >
                    Go to Homepage
                  </Button>
                </div>
              </>
            )}

            {status === 'expired' && (
              <>
                <Mail className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
                <p className="text-gray-600 text-sm sm:text-base mb-6">{message}</p>
                <div className="space-y-3">
                  <Button
                    onClick={resendVerification}
                    disabled={resending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 text-sm sm:text-base"
                  >
                    {resending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </Button>
                  <Button
                    onClick={() => router.push('/auth/signin')}
                    variant="outline"
                    className="w-full py-2 text-sm sm:text-base"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs sm:text-sm">
            Need help? Contact our support team or check your spam folder for the verification email.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
