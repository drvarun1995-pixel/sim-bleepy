'use client';

import { AlertTriangle, Users, XCircle } from 'lucide-react';

interface CapacityDisplayProps {
  confirmedCount: number;
  capacity: number | null;
  waitlistCount?: number;
}

export function CapacityDisplay({ confirmedCount, capacity, waitlistCount }: CapacityDisplayProps) {
  // Don't show anything if unlimited capacity
  if (!capacity) return null;
  
  const availableSlots = capacity - confirmedCount;
  const capacityPercent = (confirmedCount / capacity) * 100;
  const isLowCapacity = capacityPercent >= 90; // 10% or less remaining
  
  return (
    <div className="mt-4">
      {/* If there are waitlist users, always show "Event is full" */}
      {(waitlistCount && waitlistCount > 0) ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 font-semibold flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            <span>Event is full</span>
            <span className="ml-2">({waitlistCount} on waitlist)</span>
          </p>
        </div>
      ) : availableSlots === 0 ? (
        /* Event is truly full with no waitlist */
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 font-semibold flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            <span>Event is full</span>
          </p>
        </div>
      ) : isLowCapacity && availableSlots > 0 ? (
        /* Low capacity warning */
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-orange-800 font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Hurry: Only {Math.floor(availableSlots)} {Math.floor(availableSlots) === 1 ? 'slot' : 'slots'} left!
          </p>
        </div>
      ) : (
        /* Normal available spots */
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 font-medium flex items-center">
            <Users className="h-5 w-5 mr-2" />
            {Math.floor(availableSlots)} of {capacity} spots available
          </p>
        </div>
      )}
    </div>
  );
}



