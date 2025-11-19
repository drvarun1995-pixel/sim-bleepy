"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PenSquare, Image, Save, Trash2, Mail, FileText } from "lucide-react";
import Link from "next/link";

export default function EmailSignaturesTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Email Signatures</h1>
            <p className="text-xl text-gray-600">Create and manage personalized email signatures with rich text and images</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PenSquare className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Signatures Page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Signatures</strong> from the dashboard sidebar under the Email section. This is where you create and manage your email signature.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Each user can have one signature. You can update it anytime.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PenSquare className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Create Your Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Use the rich text editor to create your signature:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Rich Text Formatting</p>
                      <p className="text-sm text-gray-600">Include your name, title, contact information, and any other details. Use formatting options like bold, italic, and colors.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Image className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Add Images</p>
                      <p className="text-sm text-gray-600">Upload images such as your photo, logo, or contact QR code. Images are automatically optimized.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Links and Tables</p>
                      <p className="text-sm text-gray-600">Add clickable links to your website, social media, or contact information. Use tables for structured information.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Save className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Save Your Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Once you've created your signature, click the <strong>"Save Signature"</strong> button. Your signature will be stored and available for use in all your emails.
                </p>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Auto-save:</strong> The signature is saved immediately and will be available the next time you compose an email.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Use Signature in Emails
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">When composing an email:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Navigate to the Send Email page</li>
                  <li>Compose your email content</li>
                  <li>Click the signature button (pen icon) next to the "Add Image" button in the editor toolbar</li>
                  <li>A dialog will show your signature preview</li>
                  <li>Click "Insert Signature" to add it to your email at the cursor position</li>
                </ol>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Tip:</strong> You can insert your signature anywhere in the email body, not just at the end. Position your cursor where you want it.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Update or Delete Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Manage your signature:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Save className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Update Signature</p>
                      <p className="text-sm text-gray-600">Edit your signature anytime. Changes are saved when you click "Save Signature".</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Trash2 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Delete Signature</p>
                      <p className="text-sm text-gray-600">Remove your signature permanently. You can create a new one anytime.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Signature Best Practices</CardTitle>
                <CardDescription>Tips for professional email signatures</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Keep signatures concise and professional</li>
                  <li>Include essential contact information</li>
                  <li>Use appropriate image sizes to avoid large email file sizes</li>
                  <li>Test your signature in different email clients</li>
                  <li>Update your signature when your contact information changes</li>
                  <li>Consider including a professional photo or logo for branding</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

