"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, Play, Target, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function AISimulatorTutorial() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Patient Simulator</h1>
            <p className="text-xl text-gray-600">Complete guide to using the AI simulator for clinical practice</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-600" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Access the AI Simulator from <strong>"Stations"</strong> in the sidebar. Browse available clinical scenarios and select one to practice.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="h-5 w-5 mr-2 text-purple-600" />
                  Running a Scenario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Start a consultation, interact with the AI patient, and receive instant feedback on your clinical skills.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

