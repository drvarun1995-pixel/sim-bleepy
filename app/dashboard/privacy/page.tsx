"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataExport } from '@/components/DataExport';
import { DataDeletion } from '@/components/DataDeletion';
import { ConsentManagement } from '@/components/ConsentManagement';
import { Shield, Settings, Download, Trash2, Eye, Mail } from 'lucide-react';

export default function PrivacySettingsPage() {
  return (
    <div className="space-y-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Privacy & Data Management</h1>
              <p className="text-gray-600">Manage your personal data and privacy settings</p>
            </div>
          </div>
        </div>

        {/* GDPR Rights Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Your Data Rights (GDPR)</span>
            </CardTitle>
            <CardDescription>
              Under GDPR, you have the following rights regarding your personal data:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Right to Access</h4>
                    <p className="text-sm text-gray-600">View and download all your personal data</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Download className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Right to Portability</h4>
                    <p className="text-sm text-gray-600">Export your data in a machine-readable format</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Settings className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Right to Rectification</h4>
                    <p className="text-sm text-gray-600">Correct or update your personal information</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Right to Erasure</h4>
                    <p className="text-sm text-gray-600">Delete your account and all associated data</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Right to Object</h4>
                    <p className="text-sm text-gray-600">Opt out of certain data processing activities</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Right to Restrict</h4>
                    <p className="text-sm text-gray-600">Limit how we process your personal data</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consent Management */}
        <ConsentManagement />

        {/* Data Management Actions */}
        <div className="space-y-6">
          {/* Data Export */}
          <DataExport />

          {/* Data Deletion */}
          <DataDeletion />
        </div>

        {/* Privacy Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Privacy Information</CardTitle>
            <CardDescription>
              Learn more about how we handle your personal data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Data Retention</h4>
                <p className="text-sm text-blue-800">
                  We retain your personal data for 2 years from your last activity, or until you request deletion. 
                  Training session data is retained for 1 year for educational analysis purposes.
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Data Security</h4>
                <p className="text-sm text-green-800">
                  All your personal data is encrypted in transit and at rest. We implement industry-standard 
                  security measures to protect your information from unauthorized access.
                </p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">Contact Us</h4>
                <p className="text-sm text-purple-800">
                  If you have questions about your privacy rights or want to exercise any of these rights, 
                  please contact us at <a href="mailto:support@bleepy.co.uk" className="underline">support@bleepy.co.uk</a> 
                  with the subject line "GDPR Data Request".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
