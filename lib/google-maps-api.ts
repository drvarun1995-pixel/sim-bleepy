// Google Maps API loader utility
declare global {
  interface Window {
    google: any;
    googleMapsApiLoaded: boolean;
    googleMapsApiLoading: boolean;
  }
}

let apiLoadPromise: Promise<void> | null = null;

export const loadGoogleMapsAPI = (): Promise<void> => {
  // Return existing promise if already loading
  if (apiLoadPromise) {
    return apiLoadPromise;
  }

  // Return resolved promise if already loaded
  if (window.google && window.google.maps && window.google.maps.places) {
    return Promise.resolve();
  }

  // Create new loading promise
  apiLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded (race condition protection)
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    // Check if already loading
    if (window.googleMapsApiLoading) {
      // Wait for existing load to complete
      const checkLoaded = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          resolve();
        } else if (!window.googleMapsApiLoading) {
          reject(new Error('Google Maps API failed to load'));
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    // Start loading
    window.googleMapsApiLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      window.googleMapsApiLoaded = true;
      window.googleMapsApiLoading = false;
      console.log('Google Maps API loaded successfully');
      resolve();
    };
    
    script.onerror = () => {
      window.googleMapsApiLoading = false;
      console.error('Failed to load Google Maps API');
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return apiLoadPromise;
};

export const isGoogleMapsAPILoaded = (): boolean => {
  return !!(window.google && window.google.maps && window.google.maps.places);
};


