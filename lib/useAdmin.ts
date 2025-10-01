import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface AdminStatus {
  isAdmin: boolean;
  loading: boolean;
  email?: string;
}

export function useAdmin(): AdminStatus {
  const { data: session, status } = useSession();
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    isAdmin: false,
    loading: true
  });

  useEffect(() => {
    if (status === 'loading') {
      setAdminStatus({ isAdmin: false, loading: true });
      return;
    }

    if (!session?.user?.email) {
      setAdminStatus({ isAdmin: false, loading: false });
      return;
    }

    // Check admin status via API
    fetch('/api/admin/check')
      .then(response => response.json())
      .then(data => {
        setAdminStatus({
          isAdmin: data.isAdmin || false,
          loading: false,
          email: data.email
        });
      })
      .catch(error => {
        console.error('Error checking admin status:', error);
        setAdminStatus({ isAdmin: false, loading: false });
      });
  }, [session, status]);

  return adminStatus;
}





