import React from 'react';
import { Badge } from '@/components/ui/badge';

interface EventStatusBadgeProps {
  status: 'scheduled' | 'rescheduled' | 'postponed' | 'cancelled' | 'moved-online';
  className?: string;
}

export function EventStatusBadge({ status, className = "" }: EventStatusBadgeProps) {
  // Don't show anything for scheduled events
  if (status === 'scheduled') {
    return null;
  }

  const statusConfig = {
    'rescheduled': {
      label: 'Rescheduled',
      variant: 'default' as const,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
    },
    'postponed': {
      label: 'Postponed',
      variant: 'default' as const,
      className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
    },
    'cancelled': {
      label: 'Cancelled',
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
    },
    'moved-online': {
      label: 'Moved Online',
      variant: 'default' as const,
      className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
    }
  };

  const config = statusConfig[status];
  
  if (!config) {
    return null;
  }

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
}

