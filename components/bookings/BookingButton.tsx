'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Clock, Users } from 'lucide-react';
import { BookingModal } from './BookingModal';
import { toast } from 'sonner';

interface BookingButtonProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location?: string;
}

export function BookingButton({ 
  eventId, 
  eventTitle, 
  eventDate, 
  eventTime, 
  location 
}: BookingButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingStatus();
  }, [eventId]);

  const fetchBookingStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bookings/check/${eventId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch booking status');
      }

      const data = await response.json();
      console.log('Booking status data:', data);
      setBookingData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching booking status:', err);
      setError('Failed to load booking information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingSuccess = () => {
    fetchBookingStatus(); // Refresh booking status
    setIsModalOpen(false);
  };

  const handleCancelBooking = async () => {
    if (!bookingData?.booking?.id) return;

    if (!confirm('Are you sure you want to cancel your booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingData.booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellation_reason: 'Cancelled by user'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      toast.success('Booking cancelled successfully');
      fetchBookingStatus(); // Refresh
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast.error('Failed to cancel booking');
    }
  };

  if (isLoading) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  // Booking not enabled for this event
  if (!bookingData?.event?.booking_enabled) {
    return null;
  }

  const { hasBooking, booking, availability } = bookingData;

  // User already has a booking
  if (hasBooking && booking?.status !== 'cancelled') {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-green-900">
                {booking.status === 'confirmed' ? '✓ You are registered for this event' : 
                 booking.status === 'waitlist' ? '⏳ You are on the waitlist' :
                 booking.status === 'attended' ? '✓ You attended this event' :
                 'Booking Status: ' + booking.status}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Booked on {new Date(booking.booked_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        {booking.status === 'confirmed' || booking.status === 'waitlist' ? (
          <Button 
            onClick={handleCancelBooking}
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50"
          >
            Cancel Booking
          </Button>
        ) : null}
      </div>
    );
  }

  // Booking is closed
  if (availability.status === 'closed') {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="font-medium text-gray-900">Booking Closed</p>
        <p className="text-sm text-gray-600 mt-1">
          Registration deadline has passed
        </p>
      </div>
    );
  }

  // Event is full and no waitlist
  if (availability.status === 'full') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <Users className="h-8 w-8 text-red-400 mx-auto mb-2" />
        <p className="font-medium text-red-900">Event Full</p>
        <p className="text-sm text-red-700 mt-1">
          No more bookings available
        </p>
      </div>
    );
  }

  // Show booking button
  const buttonLabel = bookingData?.event?.booking_button_label || 'Register';
  const isWaitlist = availability.status === 'waitlist';
  const spotsLeft = availability.availableSlots;

  return (
    <div className="space-y-3">
      {/* Capacity information */}
      {availability.status !== 'disabled' && spotsLeft !== null && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {availability.confirmedCount} / {bookingData.event.booking_capacity} registered
          </span>
          <span className={`font-semibold ${
            spotsLeft === 0 ? 'text-red-600' :
            spotsLeft < 5 ? 'text-orange-600' :
            'text-green-600'
          }`}>
            {isWaitlist ? 'Waitlist Available' : `${spotsLeft} spots left`}
          </span>
        </div>
      )}

      {/* Booking button */}
      <Button 
        onClick={() => setIsModalOpen(true)}
        className={`w-full text-white font-semibold text-lg py-4 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl ${
          isWaitlist 
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-2 border-yellow-400' 
            : 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 border-2 border-blue-400'
        }`}
      >
        <Calendar className="mr-3 h-5 w-5" />
        {isWaitlist ? 'Join Waitlist' : buttonLabel}
      </Button>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleBookingSuccess}
        eventId={eventId}
        eventTitle={eventTitle}
        eventDate={eventDate}
        eventTime={eventTime}
        location={location || 'TBD'}
        availability={availability}
        event={bookingData?.event}
      />
    </div>
  );
}


