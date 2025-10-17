'use client';

import { Card } from '@/components/ui/card';
import { Users, CheckCircle, Clock, XCircle, UserCheck, UserX } from 'lucide-react';

interface BookingStatsProps {
  summary: {
    total: number;
    confirmed: number;
    waitlist: number;
    cancelled: number;
    attended: number;
    noShow: number;
    checkedIn?: number;
    capacity?: number | null;
    availableSlots?: number | null;
  };
}

export function BookingStats({ summary }: BookingStatsProps) {
  const stats = [
    {
      label: 'Total Bookings',
      value: summary.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Confirmed',
      value: summary.confirmed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Waitlist',
      value: summary.waitlist,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Cancelled',
      value: summary.cancelled,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      label: 'Attended',
      value: summary.attended,
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'No Show',
      value: summary.noShow,
      icon: UserX,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Capacity Information */}
      {summary.capacity !== null && summary.capacity !== undefined && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Event Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.confirmed} / {summary.capacity}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Available Slots</p>
              <p className={`text-2xl font-bold ${
                (summary.availableSlots || 0) === 0 ? 'text-red-600' : 
                (summary.availableSlots || 0) < 5 ? 'text-orange-600' : 
                'text-green-600'
              }`}>
                {summary.availableSlots}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                summary.confirmed >= summary.capacity ? 'bg-red-500' :
                summary.confirmed >= summary.capacity * 0.8 ? 'bg-orange-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min((summary.confirmed / summary.capacity) * 100, 100)}%` }}
            />
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} ${stat.color} p-2 rounded-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


