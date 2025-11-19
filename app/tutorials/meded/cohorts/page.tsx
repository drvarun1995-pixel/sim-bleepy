"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, GraduationCap, Filter, BarChart3, Users, Download } from "lucide-react";
import Link from "next/link";

export default function CohortsTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Student Cohorts Management</h1>
            <p className="text-xl text-gray-600">View and analyze student cohorts by university, year, and foundation year</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-purple-600" />
                  Step 1: Access Cohorts Page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Navigate to <strong>Cohorts</strong> from the dashboard sidebar. This page provides an overview of all student cohorts.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> Cohorts help you understand the student population, organize by university and year, and analyze engagement patterns.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-purple-600" />
                  Step 2: Filter Cohorts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">Use filters to view specific cohorts:</p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">By University</p>
                      <p className="text-sm text-gray-600">Filter by ARU (Anglia Ruskin University) or UCL (University College London).</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">By Study Year</p>
                      <p className="text-sm text-gray-600">View students by their current study year (Year 1, Year 2, etc.).</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">By Foundation Year</p>
                      <p className="text-sm text-gray-600">Filter by foundation year for medical students.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Step 3: View Cohort Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">The cohorts page provides various analytics:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Total Students:</strong> See the total number of students in each cohort</li>
                  <li><strong>Distribution Charts:</strong> Visual breakdowns by university, year, and foundation year</li>
                  <li><strong>Student Lists:</strong> Detailed lists of students in each cohort with their information</li>
                  <li><strong>Engagement Metrics:</strong> Track student activity and participation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Step 4: View Student Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 mb-4">For each cohort, you can view:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Student names and email addresses</li>
                  <li>University affiliation</li>
                  <li>Study year and foundation year</li>
                  <li>Account creation date</li>
                  <li>Email verification status</li>
                  <li>Role type and permissions</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-600" />
                  Step 5: Export Cohort Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Export cohort information for reporting and analysis:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Download student lists as CSV files</li>
                  <li>Export analytics data for external analysis</li>
                  <li>Generate reports for specific cohorts</li>
                </ul>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Use Cases:</strong> Export data for university reporting, track student enrollment, analyze engagement patterns, and plan teaching resources.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle>Cohort Organization</CardTitle>
                <CardDescription>How cohorts are structured</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900">By University</p>
                    <p className="text-sm text-blue-700">Students are grouped by their university (ARU or UCL).</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="font-semibold text-purple-900">By Study Year</p>
                    <p className="text-sm text-purple-700">Cohorts are organized by academic year (Year 1, Year 2, etc.).</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900">By Foundation Year</p>
                    <p className="text-sm text-green-700">Medical students are further categorized by foundation year.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

