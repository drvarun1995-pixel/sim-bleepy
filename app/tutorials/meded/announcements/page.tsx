"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, Plus, Users, Calendar, Save, Eye, EyeOff, AlertCircle, Edit, Trash2, Shield, GraduationCap, Clock } from "lucide-react";
import Link from "next/link";

export default function AnnouncementsTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Creating Announcements</h1>
            <p className="text-xl text-gray-600">Create and manage platform announcements for students</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Announcements Page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Announcements</strong> from the dashboard sidebar. This page allows you to create, edit, and manage announcements that appear on student dashboards.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Access:</strong> Available to Admin, MedEd Team, CTF, and Educators. Educators can only edit/delete their own announcements, while Admin, MedEd Team, and CTF can manage all announcements.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Creating a New Announcement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Click "Create Announcement" to open the creation form:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-2">Basic Information</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li><strong>Title:</strong> Enter a clear, descriptive title (required, max 255 characters)</li>
                      <li><strong>Content:</strong> Use the TipTap rich text editor to create formatted content with images, links, tables, etc. (required)</li>
                      <li><strong>Priority:</strong> Select from Low, Normal, High, or Urgent. Priority affects visual display and sorting.</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-2">Target Audience</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li><strong>Target All Users:</strong> Toggle to show announcement to everyone</li>
                      <li><strong>Specific Audience:</strong> When toggled off, you can select:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li><strong>Roles:</strong> Select specific user roles (Admin, Educator, Student, MedEd Team, CTF)</li>
                          <li><strong>Years:</strong> Select specific year levels (Foundation Year 1, Foundation Year 2, Year 3, Year 4, Year 5, Year 6, etc.)</li>
                          <li><strong>Universities:</strong> Select specific universities</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="font-semibold text-gray-900 mb-2">Settings</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li><strong>Active Immediately:</strong> Toggle to make the announcement visible right away</li>
                      <li><strong>Expires At:</strong> Optionally set an expiration date. The announcement will automatically stop showing after this date.</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Image Uploads:</strong> When creating a new announcement, images uploaded in the content editor are stored as drafts. They are automatically promoted to permanent storage when you save the announcement.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Save className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Saving Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">After filling in the announcement details:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Review your title and content</li>
                  <li>Verify target audience settings</li>
                  <li>Check priority and expiration settings</li>
                  <li>Click "Save Announcement"</li>
                  <li>Images in the content are automatically promoted from draft to permanent storage</li>
                  <li>The announcement will appear on student dashboards based on target audience settings</li>
                </ol>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Success:</strong> After saving, the announcement form will close and the announcement will appear in the announcements list.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Editing Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To edit an existing announcement:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the announcement in the announcements list</li>
                  <li>Click the edit button (pencil icon)</li>
                  <li>The creation form will open with the announcement's current values</li>
                  <li>Make your changes</li>
                  <li>Click "Save Announcement" to update</li>
                </ol>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Permissions:</strong> Educators can only edit their own announcements. Admin, MedEd Team, and CTF can edit any announcement.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Managing Announcement Visibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">You can control announcement visibility:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-1">Active Announcements</p>
                    <p className="text-sm text-gray-700">Announcements with "Active immediately" enabled are visible to the target audience on their dashboards.</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-gray-900 mb-1">Inactive Announcements</p>
                    <p className="text-sm text-gray-700">Announcements with "Active immediately" disabled are saved but not shown to users. You can activate them later by editing.</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-semibold text-gray-900 mb-1">Expired Announcements</p>
                    <p className="text-sm text-gray-700">Announcements with an expiration date will automatically stop showing after that date, even if they were active.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Deleting Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To delete an announcement:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the announcement in the announcements list</li>
                  <li>Click the delete button (trash icon)</li>
                  <li>Confirm the deletion in the dialog</li>
                  <li>The announcement will be permanently removed</li>
                </ol>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Warning:</strong> Deletion is permanent and cannot be undone. Educators can only delete their own announcements. Admin, MedEd Team, and CTF can delete any announcement.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 7: Understanding Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Target audience determines who sees the announcement:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-1">All Users</p>
                    <p className="text-sm text-gray-700">When "Target all users" is enabled, the announcement appears on every user's dashboard, regardless of role, year, or university.</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-1">Specific Audience</p>
                    <p className="text-sm text-gray-700 mb-2">When targeting specific users, you can combine filters:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
                      <li>Select multiple roles (e.g., Student + Educator)</li>
                      <li>Select multiple years (e.g., Foundation Year 1 + Foundation Year 2)</li>
                      <li>Select multiple universities</li>
                      <li>Users matching ANY selected criteria will see the announcement</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-purple-600" />
                  Step 8: Priority Levels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Priority levels help students identify important announcements:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <div>
                      <p className="font-semibold text-gray-900">Low</p>
                      <p className="text-xs text-gray-600">General information</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-semibold text-gray-900">Normal</p>
                      <p className="text-xs text-gray-600">Standard priority (default)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-orange-50 rounded">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <div>
                      <p className="font-semibold text-gray-900">High</p>
                      <p className="text-xs text-gray-600">Important information</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-red-50 rounded">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    <div>
                      <p className="font-semibold text-gray-900">Urgent</p>
                      <p className="text-xs text-gray-600">Immediate action required</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Announcement Best Practices</CardTitle>
                <CardDescription>Tips for effective announcement management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Use clear, concise titles that immediately communicate the announcement's purpose</li>
                  <li>Set appropriate priority levels - use "Urgent" sparingly for truly time-sensitive information</li>
                  <li>Set expiration dates for time-sensitive announcements to keep dashboards clean</li>
                  <li>Use specific target audiences to avoid overwhelming users with irrelevant announcements</li>
                  <li>Use the rich text editor to format content clearly with headings, lists, and images</li>
                  <li>Review and update or delete old announcements regularly</li>
                  <li>Test target audience settings by viewing announcements as different user types</li>
                  <li>Use images and formatting to make announcements more engaging and easier to read</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
