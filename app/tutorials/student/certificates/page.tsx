"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Award, Download, CheckCircle, Bell } from "lucide-react";
import Link from "next/link";

export default function CertificatesTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Accessing Certificates</h1>
            <p className="text-xl text-gray-600">How to view and download your event completion certificates</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-purple-600" />
                  My Certificates Page
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Navigate to <strong>"My Certificates"</strong> to see all certificates you've earned for completing events.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Downloading Certificates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Click the download button on any certificate to save it as a PDF file for your records.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-purple-600" />
                  Push Notifications for Certificates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  When a certificate is generated for you, you'll automatically receive a push notification (if you have push notifications enabled).
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Tip:</strong> Enable push notifications in your profile settings to get instant alerts when certificates are available for download!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

