'use client';

import { Badge } from '@/components/ui/badge';

interface BookingStatusBadgeProps {
  status: 'pending' | 'confirmed' | 'waitlist' | 'cancelled' | 'attended' | 'no-show' | 'available' | 'almost_full' | 'full' | 'unlimited';
  size?: 'sm' | 'md' | 'lg';
}

export function BookingStatusBadge({ status, size = 'md' }: BookingStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending Approval',
          className: 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200'
        };
      case 'confirmed':
        return {
          label: 'Confirmed',
          className: 'bg-green-100 text-green-700 hover:bg-green-100'
        };
      case 'waitlist':
        return {
          label: 'Waitlist',
          className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          className: 'bg-red-100 text-red-700 hover:bg-red-100'
        };
      case 'attended':
        return {
          label: 'Attended',
          className: 'bg-blue-100 text-blue-700 hover:bg-blue-100'
        };
      case 'no-show':
        return {
          label: 'No Show',
          className: 'bg-gray-100 text-gray-700 hover:bg-gray-100'
        };
      case 'available':
        return {
          label: 'Available',
          className: 'bg-green-100 text-green-700 hover:bg-green-100'
        };
      case 'almost_full':
        return {
          label: 'Almost Full',
          className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
        };
      case 'full':
        return {
          label: 'Full',
          className: 'bg-red-100 text-red-700 hover:bg-red-100'
        };
      case 'unlimited':
        return {
          label: 'UNLIMITED',
          className: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 border-0'
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-700 hover:bg-gray-100'
        };
    }
  };

  const config = getStatusConfig();
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-4 py-2' : 'text-sm px-3 py-1';

  return (
    <Badge className={`${config.className} ${sizeClass} font-semibold`}>
      {config.label}
    </Badge>
  );
}


