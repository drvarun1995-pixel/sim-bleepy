'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, Clock, MapPin, Users, AlertCircle, User, Mail, X } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  availability: {
    status: string;
    confirmedCount: number;
    availableSlots: number | null;
  };
  event: {
    booking_capacity?: number | null;
    confirmation_checkbox_1_text?: string;
    confirmation_checkbox_1_required?: boolean;
    confirmation_checkbox_2_text?: string | null;
    confirmation_checkbox_2_required?: boolean;
    allow_waitlist?: boolean;
  };
}

export function BookingModal({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  eventTitle,
  eventDate,
  eventTime,
  location,
  availability,
  event
}: BookingModalProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkbox1Checked, setCheckbox1Checked] = useState(false);
  const [checkbox2Checked, setCheckbox2Checked] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [userDetails, setUserDetails] = useState<{name: string, email: string} | null>(null);

  // Fetch user details
  useEffect(() => {
    if (session?.user) {
      setUserDetails({
        name: session.user.name || 'User',
        email: session.user.email || ''
      });
    }
  }, [session]);

  const isWaitlist = availability.status === 'waitlist';
  const spotsRemaining = availability.availableSlots;

  const handleSubmit = async () => {
    // Validate cancellation policy acceptance
    if (!acceptedPolicy) {
      toast.error('Please read and accept the cancellation policy to continue');
      return;
    }

    // Validate required checkboxes
    if (event.confirmation_checkbox_1_required && !checkbox1Checked) {
      toast.error('Please confirm the first checkbox to continue');
      return;
    }

    if (event.confirmation_checkbox_2_text && event.confirmation_checkbox_2_required && !checkbox2Checked) {
      toast.error('Please confirm the second checkbox to continue');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          confirmationCheckbox1Checked: checkbox1Checked,
          confirmationCheckbox2Checked: checkbox2Checked
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      toast.success(data.message || 'Successfully registered for the event!');
      onSuccess();
      
      // Reset checkboxes
      setAcceptedPolicy(false);
      setCheckbox1Checked(false);
      setCheckbox2Checked(false);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Failed to register for the event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAcceptedPolicy(false);
      setCheckbox1Checked(false);
      setCheckbox2Checked(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            {isWaitlist ? 'Join Waitlist' : 'Confirm Registration'}
          </DialogTitle>
          <DialogDescription className="text-purple-100">
            Review event details and confirm your registration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Details Card */}
          {userDetails && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                Your Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-700">
                  <User className="h-4 w-4 mr-2 text-green-600" />
                  <span className="font-medium">{userDetails.name}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail className="h-4 w-4 mr-2 text-green-600" />
                  <span>{userDetails.email}</span>
                </div>
              </div>
            </div>
          )}

          {/* Event Details Card */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-gray-900 mb-3">{eventTitle}</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-700">
                <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                <span>{new Date(eventDate).toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <Clock className="h-4 w-4 mr-2 text-purple-600" />
                <span>{eventTime}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <MapPin className="h-4 w-4 mr-2 text-purple-600" />
                <span>{location}</span>
              </div>
            </div>
          </div>

          {/* Capacity Status */}
          {event.booking_capacity && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2 text-gray-600" />
                <span className="text-gray-700">Capacity Status</span>
              </div>
              <span className={`font-semibold text-sm ${
                spotsRemaining === 0 ? 'text-red-600' :
                (spotsRemaining || 0) < 5 ? 'text-orange-600' :
                'text-green-600'
              }`}>
                {isWaitlist 
                  ? `${availability.confirmedCount} / ${event.booking_capacity} (Waitlist)`
                  : `${spotsRemaining} / ${event.booking_capacity} spots remaining`
                }
              </span>
            </div>
          )}

          {/* Waitlist Warning */}
          {isWaitlist && event.allow_waitlist && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-800">
                This event is currently full. You will be added to the waitlist. 
                The organizer has been notified and will contact you if a spot becomes available.
              </AlertDescription>
            </Alert>
          )}

          {/* Cancellation Policy Acceptance */}
          <div className="p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="acceptPolicy" 
                checked={acceptedPolicy}
                onCheckedChange={(checked) => setAcceptedPolicy(checked as boolean)}
                disabled={isSubmitting}
              />
              <Label 
                htmlFor="acceptPolicy" 
                className="text-sm font-medium leading-tight cursor-pointer text-gray-900"
              >
                I have read the{' '}
                <Link 
                  href="/cancellation-policy" 
                  target="_blank" 
                  className="text-blue-600 underline hover:text-blue-700 font-semibold"
                >
                  cancellation policy
                </Link>
                {' '}and agree with it
                <span className="text-red-500 ml-1">*</span>
              </Label>
            </div>
          </div>

          {/* Confirmation Checkboxes */}
          <div className="space-y-3 pt-2">
            {/* Checkbox 1 (always present with default text) */}
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="checkbox1" 
                checked={checkbox1Checked}
                onCheckedChange={(checked) => setCheckbox1Checked(checked as boolean)}
                disabled={isSubmitting}
              />
              <Label 
                htmlFor="checkbox1" 
                className="text-sm font-medium leading-tight cursor-pointer"
              >
                {event.confirmation_checkbox_1_text || 'I confirm my attendance at this event'}
                {event.confirmation_checkbox_1_required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
            </div>

            {/* Checkbox 2 (optional - only if text is set) */}
            {event.confirmation_checkbox_2_text && (
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="checkbox2" 
                  checked={checkbox2Checked}
                  onCheckedChange={(checked) => setCheckbox2Checked(checked as boolean)}
                  disabled={isSubmitting}
                />
                <Label 
                  htmlFor="checkbox2" 
                  className="text-sm font-medium leading-tight cursor-pointer"
                >
                  {event.confirmation_checkbox_2_text}
                  {event.confirmation_checkbox_2_required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-3 bg-gray-50 p-4 -m-6 mt-4 rounded-b-lg">
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-2 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-500 font-semibold px-6 py-3 text-base transition-all duration-200"
          >
            <X className="h-5 w-5 mr-2" />
            Close
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`font-semibold text-lg px-8 py-2 transform transition-all duration-200 hover:scale-105 ${
              isWaitlist 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-2 border-yellow-400 text-white' 
                : 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 border-2 border-blue-400 text-white'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isWaitlist ? 'Joining...' : 'Registering...'}
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-5 w-5" />
                {isWaitlist ? 'Join Waitlist' : 'Confirm Registration'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


