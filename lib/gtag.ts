// Google Analytics configuration and helper functions

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Check if GA is enabled
export const isGAEnabled = !!GA_MEASUREMENT_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (!isGAEnabled) return;
  
  window.gtag('config', GA_MEASUREMENT_ID as string, {
    page_path: url,
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
  if (!isGAEnabled) return;
  
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
