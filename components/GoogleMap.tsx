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
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Use provided coordinates or fallback to Basildon Hospital coordinates
  const eventCoords = latitude && longitude ? {
    lat: latitude,
    lng: longitude
  } : {
    lat: 51.5740,
    lng: 0.4600
  };

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation permission denied or unavailable:', error);
        }
      );
    }
  }, []);

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
    
    // If user entered a custom starting point, use that
    if (directionsFrom.trim()) {
      const directionsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(directionsFrom)}/${destination}`;
      window.open(directionsUrl, '_blank');
      return;
    }
    
    // Otherwise, use current location (Google Maps will auto-detect)
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(directionsUrl, '_blank');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude},${position.coords.longitude}`;
        setDirectionsFrom(coords);
        setGettingLocation(false);
      },
      (error) => {
        alert('Unable to get your location. Please enter your address manually.');
        setGettingLocation(false);
      }
    );
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
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Enter starting address (or use current location)..."
              value={directionsFrom}
              onChange={(e) => setDirectionsFrom(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button 
              onClick={handleUseCurrentLocation}
              disabled={gettingLocation}
              variant="outline"
              className="whitespace-nowrap"
            >
              {gettingLocation ? 'Getting...' : 'My Location'}
            </Button>
          </div>
          <Button 
            onClick={handleGetDirections}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Get Directions
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          {directionsFrom.trim() 
            ? 'Click "Get Directions" to open in Google Maps' 
            : 'Leave empty to use your current location, or enter a custom starting point'}
        </p>
      </div>
    </div>
  );
}
