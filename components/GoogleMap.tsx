"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { loadGoogleMapsAPI } from '@/lib/google-maps-api';

interface GoogleMapProps {
  location: string;
  eventTitle?: string;
  className?: string;
  latitude?: number;
  longitude?: number;
}

declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

export default function GoogleMap({ location, eventTitle = "Event Location", className = "", latitude, longitude }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Use provided coordinates or fallback to Basildon Hospital coordinates
  const eventCoords = latitude && longitude ? {
    lat: latitude,
    lng: longitude
  } : {
    lat: 51.5740,
    lng: 0.4600
  };

  useEffect(() => {
    const initMap = async () => {
      try {
        // Load Google Maps API using centralized loader
        await loadGoogleMapsAPI();
        
        if (!mapRef.current || !window.google) return;

        const map = new window.google.maps.Map(mapRef.current, {
          center: eventCoords,
          zoom: 17,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        // Add marker for the event location
        new window.google.maps.Marker({
          position: eventCoords,
          map: map,
          title: location,
          label: {
            text: "1",
            color: "white",
            fontSize: "14px",
            fontWeight: "bold"
          }
        });

        setMapLoaded(true);
      } catch (error) {
        console.error('Failed to initialize Google Map:', error);
      }
    };

    initMap();
  }, [location]);

  const handleGetDirections = () => {
    // Use coordinates for precise directions
    const destination = latitude && longitude 
      ? `${latitude},${longitude}`
      : encodeURIComponent(location);
    
    // Always use Google Maps with auto-detect current location
    // This opens Google Maps which will automatically request and use the user's current location
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(directionsUrl, '_blank');
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Map Container */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div 
          ref={mapRef} 
          className="w-full h-96"
          style={{ minHeight: '384px' }}
        />
      </div>

      {/* Get Directions Button */}
      <div className="mt-4">
        <Button 
          onClick={handleGetDirections}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 font-semibold shadow-md hover:shadow-lg transition-all !no-underline [&_*]:!no-underline [&]:!no-underline"
          style={{ textDecoration: 'none !important', textDecorationLine: 'none', textDecorationStyle: 'none' }}
        >
          <span className="!no-underline" style={{ textDecoration: 'none !important', textDecorationLine: 'none' }}>Get Directions from Current Location</span>
        </Button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Opens in Google Maps with your current location as the starting point
        </p>
      </div>
    </div>
  );
}
