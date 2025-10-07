import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface PermissionStatus {
  isAdmin: boolean;
  isEducator: boolean;
  canUpload: boolean;
  loading: boolean;
  email?: string;
  role?: string;
}

export function usePermissions(): PermissionStatus {
  const { data: session, status } = useSession();
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    isAdmin: false,
    isEducator: false,
    canUpload: false,
    loading: true
  });

  useEffect(() => {
    if (status === 'loading') {
      setPermissionStatus({ 
        isAdmin: false, 
        isEducator: false, 
        canUpload: false, 
        loading: true 
      });
      return;
    }

    if (!session?.user?.email) {
      setPermissionStatus({ 
        isAdmin: false, 
        isEducator: false, 
        canUpload: false, 
        loading: false 
      });
      return;
    }

    // Check permissions via API
    fetch('/api/admin/check')
      .then(response => response.json())
      .then(data => {
        const isAdmin = data.isAdmin || false;
        const isEducator = data.isEducator || false;
        const canUpload = isAdmin || isEducator;
        
        setPermissionStatus({
          isAdmin,
          isEducator,
          canUpload,
          loading: false,
          email: data.email,
          role: data.role
        });
      })
      .catch(error => {
        console.error('Error checking permissions:', error);
        setPermissionStatus({ 
          isAdmin: false, 
          isEducator: false, 
          canUpload: false, 
          loading: false 
        });
      });
  }, [session, status]);

  return permissionStatus;
}
