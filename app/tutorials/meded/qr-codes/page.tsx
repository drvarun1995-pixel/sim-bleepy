"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, QrCode, Download, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function QRCodesTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">QR Code Generation</h1>
            <p className="text-xl text-gray-600">Create and manage QR codes for event attendance tracking</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2 text-purple-600" />
                  Generating QR Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Navigate to <strong>"QR Codes"</strong> to generate unique QR codes for each event. Each event gets its own scannable code for attendance tracking.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Downloading QR Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Download QR codes as images to display at events. Students can scan these codes to mark their attendance automatically.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

