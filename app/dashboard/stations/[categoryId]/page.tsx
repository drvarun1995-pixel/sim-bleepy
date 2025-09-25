"use client";

import { getStationConfig } from '@/utils/stationConfigs'
import { getCategoryById } from '@/utils/medicalCategories'
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
  const stations = category.stationIds
    .map(stationId => getStationConfig(stationId))
    .filter(Boolean)

  return (
    <div className="space-y-6">
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
      <div className="text-center py-8">
        <div className="flex items-center justify-center mb-4">
          <div className={`p-3 rounded-full bg-gradient-to-r ${category.gradient}`}>
            <category.icon className={`w-8 h-8 ${category.iconColor}`} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {category.name}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          {category.description}
        </p>
        <Badge variant="outline" className="text-sm">
          {stations.length} Station{stations.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Stations Grid */}
      {stations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {stations.map((station) => station && (
            <Card key={station.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{station.name}</CardTitle>
                  <Badge variant={station.available ? "default" : "secondary"}>
                    {station.available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                <CardDescription>
                  {station.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex flex-col flex-grow">
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
                    {station.keyAreas.map((area, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <div className="mt-auto">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Stations Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This category doesn't have any stations configured yet.
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Stations</p>
                <p className="text-2xl font-bold">{stations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                <p className="text-2xl font-bold">
                  {stations.filter(s => s && s.available).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</p>
                <p className="text-2xl font-bold">
                  {stations.length > 0 
                    ? Math.round(stations.filter(s => s).reduce((acc, s) => acc + (s ? s.duration : 0), 0) / stations.filter(s => s).length)
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