"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function EventsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Redirect to calendar
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/calendar');
    } else if (status === 'authenticated') {
      router.push('/calendar');
    }
  }, [status, router]);

  // Show loading state while redirecting
    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to calendar...</p>
        </div>
    </div>
  );
}