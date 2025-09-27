"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Stethoscope, Users, Target, Lock, Play } from "lucide-react";
import Link from "next/link";

import { useState } from "react";
import { medicalCategories, getCategoriesWithStations } from "@/utils/medicalCategories";
import { stationConfigs } from "@/utils/stationConfigs";

export default function ScenariosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Get categories that have stations for stats
  const categoriesWithStations = getCategoriesWithStations();
  
  // Get all stations for stats
  const allStations = Object.values(stationConfigs).filter(station => station.available);
  
  // Filter categories based on search
  const filteredCategories = searchTerm
    ? medicalCategories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : medicalCategories;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">

      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Stethoscope className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Clinical Scenarios
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              Explore our comprehensive library of realistic clinical scenarios across medical specialties. 
              Sign in to access interactive AI-powered patient simulations.
            </p>
            
            {/* Sign In CTA */}
            <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-6 border border-purple-200 mb-8">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Lock className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Sign In Required for Interactive Sessions
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                Access AI-powered patient interactions, receive real-time feedback, and track your progress.
              </p>
              <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold">
                <Link href="/auth/signin">
                  Sign In to Start Practicing
                </Link>
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-md">
              <input
                type="text"
                placeholder="Search medical specialties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {filteredCategories.map((category) => {
              const stationCount = category.stationIds.length;
              const hasStations = stationCount > 0;
              
              return (
                <div key={category.id}>
                  <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-300 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${category.gradient} rounded-lg flex items-center justify-center ${category.iconColor}`}>
                          <category.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg text-gray-900">{category.name}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant={hasStations ? "default" : "secondary"} className="text-xs">
                              {stationCount} {stationCount === 1 ? 'Station' : 'Stations'}
                            </Badge>
                            {!hasStations && (
                              <Badge variant="outline" className="text-xs">
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <CardDescription className="text-sm text-gray-600">
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {hasStations ? (
                        <div className="space-y-3">
                          <div className="text-sm">
                            <h4 className="font-semibold text-gray-800 mb-2">Available Scenarios:</h4>
                            <ul className="space-y-1">
                              {category.stationIds.slice(0, 3).map((stationId, idx) => {
                                const station = stationConfigs[stationId];
                                return station ? (
                                  <li key={idx} className="text-sm text-gray-600 flex items-center">
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
                                    {station.name}
                                  </li>
                                ) : null;
                              })}
                              {category.stationIds.length > 3 && (
                                <li className="text-sm text-gray-500 flex items-center">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                                  +{category.stationIds.length - 3} more scenarios
                                </li>
                              )}
                            </ul>
                          </div>
                          <Button 
                            asChild 
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                          >
                            <Link href="/auth/signin">
                              <Lock className="w-4 h-4 mr-2" />
                              Sign In to Access
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-sm">
                            <h4 className="font-semibold text-gray-800 mb-2">Planned Scenarios:</h4>
                            <ul className="space-y-1">
                              <li className="text-sm text-gray-600 flex items-center">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                                Multiple scenarios in development
                              </li>
                              <li className="text-sm text-gray-600 flex items-center">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                                Realistic patient interactions
                              </li>
                              <li className="text-sm text-gray-600 flex items-center">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                                AI-powered feedback
                              </li>
                            </ul>
                          </div>
                          <Button className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200" disabled>
                            Coming Soon
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* No Results Message */}
          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No specialties found
              </h3>
              <p className="text-gray-600 mb-6">
                No medical specialties match "{searchTerm}"
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </Button>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Stethoscope className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">Total Specialties</p>
                <p className="text-3xl font-bold text-gray-900">{medicalCategories.length}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Target className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">Active Specialties</p>
                <p className="text-3xl font-bold text-gray-900">{categoriesWithStations.length}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">Available Scenarios</p>
                <p className="text-3xl font-bold text-gray-900">{allStations.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Start Practicing?
            </h2>
            <p className="text-gray-600 mb-6">
              Sign in to access our AI-powered clinical scenarios and improve your medical skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold">
                <Link href="/auth/signin">
                  <Play className="w-4 h-4 mr-2" />
                  Sign In & Start Practicing
                </Link>
              </Button>
              <Button asChild variant="outline" className="px-8 py-3 rounded-lg">
                <Link href="/dashboard/stations">
                  View All Stations
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
