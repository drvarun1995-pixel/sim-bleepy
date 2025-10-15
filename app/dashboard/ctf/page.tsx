"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { 
  Users, 
  Calendar, 
  BookOpen, 
  Settings, 
  BarChart3, 
  FileText,
  Plus,
  Edit,
  Eye,
  Download,
  Stethoscope,
  GraduationCap
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  role_type?: string;
  university?: string;
  hospital_trust?: string;
  specialty?: string;
  profile_completed?: boolean;
}

export default function CTFDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalUsers: 0,
    activeUsers: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchUserProfile();
      fetchStats();
    }
  }, [status, router]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (response.ok && data.user) {
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch dashboard statistics
      const [eventsResponse, usersResponse] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/admin/users')
      ]);

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        const now = new Date();
        const upcomingEvents = eventsData.filter((event: any) => 
          new Date(event.date) > now
        ).length;

        setStats(prev => ({
          ...prev,
          totalEvents: eventsData.length,
          upcomingEvents
        }));
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setStats(prev => ({
          ...prev,
          totalUsers: usersData.users?.length || 0,
          activeUsers: usersData.users?.filter((user: any) => 
            user.totalAttempts > 0
          ).length || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading CTF Dashboard..." />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CTF Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {userProfile?.name || session.user?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Stethoscope className="h-3 w-3 mr-1" />
                Clinical Teaching Fellow
              </Badge>
              <Button
                onClick={() => router.push('/dashboard/ctf/profile')}
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Teaching Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => router.push('/event-data')}
                className="w-full justify-start"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Teaching Event
              </Button>
              <Button 
                onClick={() => router.push('/events')}
                className="w-full justify-start"
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                View All Events
              </Button>
              <Button 
                onClick={() => router.push('/bulk-upload-ai')}
                className="w-full justify-start"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Bulk Upload Events
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Student Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => router.push('/dashboard/admin/users')}
                className="w-full justify-start"
                variant="outline"
              >
                <Users className="h-4 w-4 mr-2" />
                View Students
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/analytics')}
                className="w-full justify-start"
                variant="outline"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/announcements')}
                className="w-full justify-start"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Manage Announcements
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Teaching Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent teaching activity to display</p>
              <p className="text-sm">Activity will appear here as you conduct teaching sessions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
