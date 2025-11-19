"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FolderOpen, Upload, Edit, Link as LinkIcon, Trash2, Download, FileText, Calendar, User, Search, Filter } from "lucide-react";
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
            <p className="text-xl text-gray-600">Upload, organize, and manage teaching resources and materials for students</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Downloads</strong> from the dashboard sidebar. This page shows all available resources that students can download. Click <strong>"Upload Resource"</strong> to add new materials.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> Resources are teaching materials, presentations, documents, and files that students can access and download. Resources can be linked to specific events for easy access.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Upload a Resource
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To upload a new resource:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Click "Upload Resource" button on the Downloads page</li>
                  <li>Fill in the resource title (required)</li>
                  <li>Add a description (optional) to help students understand the resource</li>
                  <li>Select a category from the dropdown (e.g., Lecture Notes, Presentations, Handouts, Others)</li>
                  <li>If "Others" is selected, specify the custom category name</li>
                  <li>Optionally set a teaching date and "Taught By" information</li>
                  <li>Select the file to upload (drag and drop or click to browse)</li>
                  <li>Link the resource to specific events if applicable (see Step 3)</li>
                  <li>Click "Upload Resource" to save</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>File Requirements:</strong> Maximum file size is typically 50MB. Supported file types include PDFs, Word documents, PowerPoint presentations, images, and other common file formats.
                  </p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Upload Process:</strong> Files are uploaded to Supabase Storage in the "resources" bucket, organized by category. The system uses direct upload with signed URLs for secure file handling.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LinkIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Link Resources to Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">When uploading or editing a resource, you can link it to specific events:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Set a teaching date for the resource (optional but recommended for event linking)</li>
                  <li>The system will automatically show events that match the teaching date</li>
                  <li>Check the boxes next to events you want to link the resource to</li>
                  <li>You can link one resource to multiple events</li>
                  <li>Linked resources appear on event pages for easy student access</li>
                </ol>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Event Linking Benefits:</strong> When resources are linked to events, students can easily find and download materials related to specific teaching sessions directly from the event page.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Edit Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To modify an existing resource:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the resource in the Downloads page</li>
                  <li>Click the edit button (pencil icon) on the resource card</li>
                  <li>Update the title, description, category, teaching date, or "Taught By" information</li>
                  <li>Modify event links by changing the teaching date and selecting different events</li>
                  <li>Note: You cannot replace the file itself - you'll need to delete and re-upload for a new file</li>
                  <li>Click "Save" to apply changes</li>
                </ol>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Only admins and educators can edit resources. Students can only view and download resources.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Delete Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To remove a resource:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the resource in the Downloads page</li>
                  <li>Click the delete button (trash icon)</li>
                  <li>Confirm the deletion</li>
                  <li>The resource file and metadata will be permanently removed</li>
                </ol>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Warning:</strong> Deletion is permanent. The file will be removed from storage and all event links will be broken. Consider archiving instead of deleting if you may need the resource later.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Search and Filter Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Students and admins can find resources easily:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Search className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Search by Title</p>
                      <p className="text-sm text-gray-600">Use the search box to find resources by title or description keywords.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Filter by Category</p>
                      <p className="text-sm text-gray-600">Filter resources by category (Lecture Notes, Presentations, Handouts, Others, etc.) to find specific types of materials.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>View Tracking:</strong> The system tracks how many times each resource has been viewed/downloaded, helping you understand which materials are most useful to students.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Step 7: Resource Access and Downloads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">How students access resources:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <FolderOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Downloads Page</p>
                      <p className="text-sm text-gray-600">All students can browse and download resources from the Downloads page, organized by category.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <LinkIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Event Pages</p>
                      <p className="text-sm text-gray-600">Resources linked to events appear on the event detail pages, making it easy for students to find materials for specific sessions.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Download className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Download Tracking</p>
                      <p className="text-sm text-gray-600">All downloads are tracked for analytics, showing which resources are most popular and useful.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Resource Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Resources are organized by category:</p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Lecture Notes:</strong> Written notes, summaries, and study guides from lectures</p>
                  <p><strong>Presentations:</strong> PowerPoint slides, PDF presentations, and visual materials</p>
                  <p><strong>Handouts:</strong> Printed materials, worksheets, and supplementary documents</p>
                  <p><strong>Others:</strong> Custom categories you specify (e.g., Videos, Audio, Software, etc.)</p>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Category Organization:</strong> Categories help students find resources quickly. Use consistent categories across your resources for better organization.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Best Practices</CardTitle>
                <CardDescription>Tips for effective resource management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Use clear, descriptive titles that help students identify the resource content</li>
                  <li>Add detailed descriptions to explain what the resource contains and how to use it</li>
                  <li>Link resources to events whenever possible for better organization</li>
                  <li>Use consistent category naming to make resources easy to find</li>
                  <li>Set teaching dates to enable automatic event linking</li>
                  <li>Keep file sizes reasonable (under 50MB) for faster downloads</li>
                  <li>Use appropriate file formats (PDF for documents, PowerPoint for presentations)</li>
                  <li>Regularly review and update resource descriptions and links</li>
                  <li>Monitor download statistics to identify popular and useful resources</li>
                  <li>Archive old resources instead of deleting them if they may be needed later</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
