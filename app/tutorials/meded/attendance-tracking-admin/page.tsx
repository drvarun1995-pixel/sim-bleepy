"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, CheckCircle, Download, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function AttendanceTrackingAdminTutorial() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/tutorials">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tutorials
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Attendance Tracking</h1>
            <p className="text-xl text-gray-600">Monitor and track student attendance across all events</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Attendance Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Access <strong>"Attendance Tracking"</strong> to view attendance records for all events, filter by date, event, or student, and export attendance reports.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

