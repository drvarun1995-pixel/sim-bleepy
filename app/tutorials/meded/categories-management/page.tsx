"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Tag, Plus, Edit, Trash2, Filter, Palette } from "lucide-react";
import Link from "next/link";

export default function CategoriesManagementTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Categories Management</h1>
            <p className="text-xl text-gray-600">Organize events by categories and manage category settings</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Categories Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Categories are managed from the <strong>Event Data</strong> page. Navigate to Event Data from the dashboard sidebar, then click on <strong>Categories</strong> in the sidebar menu.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> Categories help organize events by topic or specialty (e.g., Cardiology, Emergency Medicine, Surgery). Categories support hierarchical organization with parent and child categories.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Creating New Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To create a new category:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Go to the Event Data page and select "Categories" from the sidebar</li>
                  <li>Fill in the category name (required)</li>
                  <li>The slug is automatically generated from the name, but you can customize it</li>
                  <li>Optionally select a parent category to create a hierarchy</li>
                  <li>Add a description (optional)</li>
                  <li>Select a color for visual identification (optional)</li>
                  <li>Click "Add New Category"</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Category Hierarchy:</strong> You can create parent and child categories. For example, "Cardiology" could be a parent with "Cardiac Surgery" and "Cardiac Imaging" as children. Only root categories (those without a parent) can be selected as parents for other categories.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: Editing Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To edit an existing category:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Find the category in the categories list</li>
                  <li>Click the edit button (pencil icon)</li>
                  <li>Update the name, slug, parent, description, or color</li>
                  <li>Click "Save" to apply changes</li>
                </ol>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Impact:</strong> Category changes will be reflected in all events using that category. Be careful when changing parent categories as this affects the hierarchy.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: Deleting Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">To delete categories:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-1">Individual Deletion</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Find the category in the list</li>
                      <li>Click the delete button (trash icon)</li>
                      <li>Confirm the deletion</li>
                    </ol>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-1">Bulk Deletion</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                      <li>Select multiple categories using checkboxes</li>
                      <li>Click "Delete Selected" button</li>
                      <li>Confirm the bulk deletion</li>
                    </ol>
                  </div>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Warning:</strong> Check the usage count before deleting. Categories in use by events should not be deleted. You may need to reassign events to other categories first.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Category Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Categories can have colors for visual identification:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Colors are displayed in category badges throughout the platform</li>
                  <li>Use the color picker or enter a hex color code (e.g., #FF6B6B)</li>
                  <li>Colors help users quickly identify event categories</li>
                  <li>Choose distinct colors for better visual differentiation</li>
                  <li>Colors appear in event lists, calendars, and filter dropdowns</li>
                </ul>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Color Picker:</strong> The category form includes a color picker with preset colors and the ability to enter custom hex codes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-purple-600" />
                  Step 6: Using Categories in Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">When creating or editing events:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Select one or more categories from the multi-select dropdown</li>
                  <li>Categories are displayed with their colors in the dropdown</li>
                  <li>Parent categories appear first, followed by their child categories (indented)</li>
                  <li>Events can have multiple categories assigned</li>
                  <li>Categories help organize events by medical specialty or topic</li>
                  <li>Events can be filtered by category in event lists and attendance tracking</li>
                  <li>Categories appear in event details and search results</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-purple-600" />
                  Step 7: Category Hierarchy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Categories support hierarchical organization:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900 mb-1">Parent Categories</p>
                    <p className="text-sm text-gray-700">Root categories that don't have a parent. These appear first in lists and can be selected as parents for other categories.</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900 mb-1">Child Categories</p>
                    <p className="text-sm text-gray-700">Categories that have a parent. These appear indented under their parent in lists, making the hierarchy clear.</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Visual Display:</strong> In the categories list, child categories are displayed with an indentation (└─) and a different background color to show they belong to a parent category.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Category Best Practices</CardTitle>
                <CardDescription>Tips for effective category organization</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Use clear, standardized category names that align with medical specialties or teaching topics</li>
                  <li>Keep the number of categories manageable (15-30 is ideal)</li>
                  <li>Use consistent naming conventions across all categories</li>
                  <li>Leverage hierarchy to organize related categories (e.g., "Cardiology" as parent, "Cardiac Surgery" as child)</li>
                  <li>Regularly review and consolidate similar categories</li>
                  <li>Check usage counts before deleting to ensure categories aren't in use</li>
                  <li>Use distinct colors for better visual identification</li>
                  <li>Consider your institution's teaching structure when creating categories</li>
                  <li>Use descriptions to clarify category purposes for other team members</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
