// User Role Constants and Utilities

export const USER_ROLES = {
  STUDENT: 'student',
  EDUCATOR: 'educator',
  ADMIN: 'admin',
  MEDED_TEAM: 'meded_team',
  CTF: 'ctf',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Role hierarchy and permissions
 * 
 * STUDENT: Basic access to learning resources
 * EDUCATOR: Student permissions + resource management
 * MEDED_TEAM: Educator permissions + event management + contact messages
 * CTF: Educator permissions + event management + contact messages  
 * ADMIN: Full access to everything
 */

/**
 * Check if user has unlimited practice attempts
 * Educators, MedEd Team, CTF, and Admins get unlimited attempts
 */
export function hasUnlimitedAttempts(role: string): boolean {
  const rolesWithUnlimitedAttempts: string[] = [
    USER_ROLES.EDUCATOR,
    USER_ROLES.ADMIN,
    USER_ROLES.MEDED_TEAM,
    USER_ROLES.CTF,
  ];
  return rolesWithUnlimitedAttempts.includes(role);
}

/**
 * Check if user can access event management pages
 * MedEd Team, CTF, and Admins can manage events
 */
export function canManageEvents(role: string): boolean {
  const eventManagementRoles: string[] = [
    USER_ROLES.ADMIN,
    USER_ROLES.MEDED_TEAM,
    USER_ROLES.CTF,
  ];
  return eventManagementRoles.includes(role);
}

/**
 * Check if user can access contact messages
 * MedEd Team, CTF, and Admins can view contact messages
 */
export function canViewContactMessages(role: string): boolean {
  const contactMessageRoles: string[] = [
    USER_ROLES.ADMIN,
    USER_ROLES.MEDED_TEAM,
    USER_ROLES.CTF,
  ];
  return contactMessageRoles.includes(role);
}

/**
 * Check if user can manage resources
 * Educators, MedEd Team, CTF, and Admins can manage resources
 */
export function canManageResources(role: string): boolean {
  const resourceManagementRoles: string[] = [
    USER_ROLES.EDUCATOR,
    USER_ROLES.ADMIN,
    USER_ROLES.MEDED_TEAM,
    USER_ROLES.CTF,
  ];
  return resourceManagementRoles.includes(role);
}

/**
 * Check if user is an admin
 */
export function isAdmin(role: string): boolean {
  return role === USER_ROLES.ADMIN;
}

/**
 * Check if user is a student
 */
export function isStudent(role: string): boolean {
  return role === USER_ROLES.STUDENT;
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    [USER_ROLES.STUDENT]: 'Student',
    [USER_ROLES.EDUCATOR]: 'Educator',
    [USER_ROLES.ADMIN]: 'Admin',
    [USER_ROLES.MEDED_TEAM]: 'MedEd Team',
    [USER_ROLES.CTF]: 'CTF',
  };
  
  return roleNames[role] || 'Unknown';
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    [USER_ROLES.STUDENT]: 'bg-green-100 text-green-800 border-green-300',
    [USER_ROLES.EDUCATOR]: 'bg-blue-100 text-blue-800 border-blue-300',
    [USER_ROLES.ADMIN]: 'bg-red-100 text-red-800 border-red-300',
    [USER_ROLES.MEDED_TEAM]: 'bg-purple-100 text-purple-800 border-purple-300',
    [USER_ROLES.CTF]: 'bg-orange-100 text-orange-800 border-orange-300',
  };
  
  return colors[role] || 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Get all available roles for role selection
 */
export function getAllRoles(): Array<{ value: UserRole; label: string }> {
  return [
    { value: USER_ROLES.STUDENT, label: 'Student' },
    { value: USER_ROLES.EDUCATOR, label: 'Educator' },
    { value: USER_ROLES.MEDED_TEAM, label: 'MedEd Team' },
    { value: USER_ROLES.CTF, label: 'CTF' },
    { value: USER_ROLES.ADMIN, label: 'Admin' },
  ];
}


