import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { canManageEvents, canViewContactMessages, canManageResources, hasUnlimitedAttempts, isAdmin, USER_ROLES, UserRole } from './roles';

interface RoleStatus {
  role: string | null;
  loading: boolean;
  isAdmin: boolean;
  canManageEvents: boolean;
  canViewContactMessages: boolean;
  canManageResources: boolean;
  hasUnlimitedAttempts: boolean;
}

/**
 * Hook to fetch and check user's role and permissions
 * 
 * @returns RoleStatus object with user's role and permission checks
 * 
 * @example
 * ```tsx
 * const { role, canManageEvents, loading } = useRole();
 * 
 * if (loading) return <LoadingSpinner />;
 * if (canManageEvents) return <EventManagementLink />;
 * ```
 */
export function useRole(): RoleStatus {
  const { data: session, status } = useSession();
  const [roleStatus, setRoleStatus] = useState<RoleStatus>({
    role: null,
    loading: true,
    isAdmin: false,
    canManageEvents: false,
    canViewContactMessages: false,
    canManageResources: false,
    hasUnlimitedAttempts: false,
  });

  useEffect(() => {
    if (status === 'loading') {
      setRoleStatus(prev => ({ ...prev, loading: true }));
      return;
    }

    if (!session?.user?.email) {
      setRoleStatus({
        role: USER_ROLES.STUDENT, // Default to student for non-logged in users
        loading: false,
        isAdmin: false,
        canManageEvents: false,
        canViewContactMessages: false,
        canManageResources: false,
        hasUnlimitedAttempts: false,
      });
      return;
    }

    // Fetch user role from API
    fetch('/api/user/role')
      .then(response => response.json())
      .then(data => {
        const userRole = data.role || USER_ROLES.STUDENT;
        
        setRoleStatus({
          role: userRole,
          loading: false,
          isAdmin: isAdmin(userRole),
          canManageEvents: canManageEvents(userRole),
          canViewContactMessages: canViewContactMessages(userRole),
          canManageResources: canManageResources(userRole),
          hasUnlimitedAttempts: hasUnlimitedAttempts(userRole),
        });
      })
      .catch(error => {
        console.error('Error fetching user role:', error);
        // Default to student role on error
        setRoleStatus({
          role: USER_ROLES.STUDENT,
          loading: false,
          isAdmin: false,
          canManageEvents: false,
          canViewContactMessages: false,
          canManageResources: false,
          hasUnlimitedAttempts: false,
        });
      });
  }, [session, status]);

  return roleStatus;
}










