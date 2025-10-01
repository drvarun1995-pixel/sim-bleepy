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
  const [directionsFrom, setDirectionsFrom] = useState('');

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
    if (!directionsFrom.trim()) {
      alert('Please enter an address to get directions.');
      return;
    }

    const directionsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(directionsFrom)}/${encodeURIComponent(location)}`;
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

      {/* Directions Input */}
      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter your starting address..."
            value={directionsFrom}
            onChange={(e) => setDirectionsFrom(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button 
            onClick={handleGetDirections}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            Get Directions
          </Button>
        </div>
      </div>
    </div>
  );
}
