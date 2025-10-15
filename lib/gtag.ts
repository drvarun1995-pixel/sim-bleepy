// Google Analytics configuration and helper functions

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Check if GA is enabled
export const isGAEnabled = !!GA_MEASUREMENT_ID;

// Emails to exclude from Google Analytics tracking
const EXCLUDED_EMAILS = [
  'drvarun1995@gmail.com',
  'varun.tyagi@nhs.net',
  // Add any additional emails from environment variables
  ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [])
];

// Check if current user should be excluded from tracking
export const shouldExcludeFromTracking = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage for user email (set during login)
  const userEmail = localStorage.getItem('userEmail');
  if (userEmail && EXCLUDED_EMAILS.includes(userEmail)) {
    return true;
  }
  
  // Check sessionStorage for user email
  const sessionEmail = sessionStorage.getItem('userEmail');
  if (sessionEmail && EXCLUDED_EMAILS.includes(sessionEmail)) {
    return true;
  }
  
  // Check if any excluded email appears in the current URL
  const currentUrl = window.location.href;
  return EXCLUDED_EMAILS.some(email => currentUrl.includes(email));
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string, title?: string) => {
  if (!isGAEnabled || shouldExcludeFromTracking()) return;
  
  // Get specific page title based on pathname
  function getPageTitle(pathname: string): string {
    const pageTitles: Record<string, string> = {
      '/': 'Home',
      '/dashboard': 'Dashboard',
      '/analytics': 'Analytics Dashboard',
      '/admin-dashboard': 'Admin Dashboard',
      '/admin-file-requests': 'File Requests',
      '/admin-teaching-requests': 'Teaching Requests',
      '/auth/signin': 'Sign In',
      '/auth/signup': 'Sign Up',
      '/profile': 'User Profile',
      '/events': 'Events',
      '/resources': 'Resources',
      '/tutorials': 'Tutorials',
      '/getting-started': 'Getting Started',
      '/simulator-analytics': 'Simulator Analytics',
      '/data-retention': 'Data Retention',
      '/cookies': 'Cookie Policy',
      '/terms': 'Terms of Service'
    };
    
    return pageTitles[pathname] || title || document.title;
  }
  
  const specificPageTitle = getPageTitle(url);
  
  window.gtag('config', GA_MEASUREMENT_ID as string, {
    page_path: url,
    page_title: specificPageTitle,
    page_location: window.location.href,
  });
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
type GTagEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

export const event = ({ action, category, label, value }: GTagEvent) => {
  if (!isGAEnabled || shouldExcludeFromTracking()) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Custom events for your application
export const trackEvent = {
  // User actions
  signUp: () => event({ action: 'sign_up', category: 'User' }),
  signIn: () => event({ action: 'login', category: 'User' }),
  signOut: () => event({ action: 'logout', category: 'User' }),
  
  // Station interactions
  startStation: (stationName: string) => 
    event({ action: 'start_station', category: 'Station', label: stationName }),
  completeStation: (stationName: string, score?: number) => 
    event({ action: 'complete_station', category: 'Station', label: stationName, value: score }),
  
  // Resource downloads
  downloadResource: (resourceName: string) => 
    event({ action: 'download', category: 'Resources', label: resourceName }),
  
  // Event registrations
  registerEvent: (eventName: string) => 
    event({ action: 'register_event', category: 'Events', label: eventName }),
  
  // Newsletter
  subscribeNewsletter: (source: string) => 
    event({ action: 'subscribe', category: 'Newsletter', label: source }),
  
  // Search
  search: (searchTerm: string) => 
    event({ action: 'search', category: 'Search', label: searchTerm }),
  
  // Profile
  completeProfile: () => 
    event({ action: 'complete_profile', category: 'User' }),
  
  // Dashboard
  viewDashboard: (section: string) => 
    event({ action: 'view_dashboard', category: 'Dashboard', label: section }),
};

// Type declaration for gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}
