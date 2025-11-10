"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FolderOpen, Upload, Edit, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export default function ResourcesManagementTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Resource Management</h1>
            <p className="text-xl text-gray-600">Upload, organize, and manage teaching resources and materials</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-purple-600" />
                  Uploading Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Go to <strong>"Downloads"</strong> and click "Upload Resource" to add new materials. Include title, description, category, and link to events if applicable.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LinkIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Linking to Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Link resources to specific events so students can easily access materials related to each teaching session.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

