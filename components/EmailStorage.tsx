'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function EmailStorage() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.email) {
      // Store user email in localStorage and sessionStorage for Google Analytics exclusion
      localStorage.setItem('userEmail', session.user.email);
      sessionStorage.setItem('userEmail', session.user.email);
    } else {
      // Clear email storage when user signs out
      localStorage.removeItem('userEmail');
      sessionStorage.removeItem('userEmail');
    }
  }, [session]);

  return null; // This component doesn't render anything
}






















