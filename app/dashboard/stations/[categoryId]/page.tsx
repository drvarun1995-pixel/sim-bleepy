"use client";

import { getStationConfig, stationConfigs } from '@/utils/stationConfigs'
import { medicalCategories, getCategoryById } from '@/utils/medicalCategories'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, Users, Target, Play, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { HumePreloader } from '@/components/HumePreloader'

export default function CategoryPage() {
  const params = useParams()
  const categoryId = params.categoryId as string

  // Get the category information
  const category = getCategoryById(categoryId)
  
  if (!category) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Category Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The requested medical category does not exist.
          </p>
          <Button asChild>
            <Link href="/dashboard/stations">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Categories
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Get stations for this category
  const stations = category?.stationIds
    ?.map(stationId => getStationConfig(stationId))
    ?.filter(Boolean) || []

  return (
    <div className="space-y-6">
      {/* Preload Hume components for faster station loading */}
      <HumePreloader />
      
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/stations">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Link>
        </Button>
      </div>

      {/* Category Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border">
        <div className="flex items-center space-x-4">
          <div className={`w-16 h-16 bg-gradient-to-r ${category.gradient} rounded-lg flex items-center justify-center ${category.iconColor}`}>
            <category.icon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {category.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {category.description}
            </p>
            <div className="mt-3">
              <Badge variant="default" className="text-sm">
                {stations.length} {stations.length === 1 ? 'Station' : 'Stations'} Available
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stations Grid */}
      {stations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station) => station && (
            <Card key={station.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{station.name}</CardTitle>
                  <Badge variant={station.available ? "default" : "secondary"}>
                    {station.available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                <CardDescription>{station.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Patient Profile */}
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Patient Profile</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p><strong>Age:</strong> {station.patientProfile.age} years</p>
                    <p><strong>Gender:</strong> {station.patientProfile.gender}</p>
                    <p><strong>Presenting Complaint:</strong> {station.patientProfile.presentingComplaint}</p>
                  </div>
                </div>

                {/* Station Details */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-1" />
                    {station.duration} min
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Target className="w-4 h-4 mr-1" />
                    {station.difficulty}
                  </div>
                </div>

                {/* Key Areas */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Key Areas</h4>
                  <div className="flex flex-wrap gap-1">
                    {station.keyAreas.slice(0, 3).map((area, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                    {station.keyAreas.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{station.keyAreas.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Start Button */}
                <Button 
                  asChild 
                  className="w-full" 
                  disabled={!station.available}
                >
                  <Link href={`/station/${station.id}`}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Stations Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            There are currently no stations available in the {category.name} category.
          </p>
          <Badge variant="outline" className="text-sm">
            Coming Soon
          </Badge>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Stethoscope className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                <p className="text-2xl font-bold">{category.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available Stations</p>
                <p className="text-2xl font-bold">{stations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</p>
                <p className="text-2xl font-bold">
                  {stations.length > 0 
                    ? Math.round(stations.reduce((acc, s) => acc + s.duration, 0) / stations.length)
                    : 0
                  } min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
