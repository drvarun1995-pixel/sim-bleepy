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
    const checkPermissions = async () => {
      try {
        const response = await fetch('/api/admin/check');
        
        if (!response.ok) {
          // If response is not ok, set default permissions
          setPermissionStatus({ 
            isAdmin: false, 
            isEducator: false, 
            canUpload: false, 
            loading: false 
          });
          return;
        }
        
        const data = await response.json();
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
      } catch (error) {
        // Silently handle network errors during development (hot reload, server restart, etc.)
        // Only log if it's not a network error
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // Network error during hot reload - ignore
          console.debug('Network error checking permissions (likely hot reload)');
        } else {
          console.error('Error checking permissions:', error);
        }
        
        setPermissionStatus({ 
          isAdmin: false, 
          isEducator: false, 
          canUpload: false, 
          loading: false 
        });
      }
    };
    
    checkPermissions();
  }, [session, status]);

  return permissionStatus;
}
