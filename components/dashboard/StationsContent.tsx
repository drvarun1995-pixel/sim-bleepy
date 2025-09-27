"use client";

import { stationConfigs } from '@/utils/stationConfigs'
import { medicalCategories, getCategoriesWithStations, getCategoryByStationId } from '@/utils/medicalCategories'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Target, Stethoscope } from 'lucide-react'
import { HumePreloader } from '@/components/HumePreloader'
import { AttemptsInfo } from '@/components/dashboard/AttemptsInfo'
import { useState } from 'react'
import Link from 'next/link'

export function StationsContent() {
  const [searchTerm, setSearchTerm] = useState('')

  // Get categories that have stations for stats
  const categoriesWithStations = getCategoriesWithStations()
  
  // Get all stations for stats
  const allStations = Object.values(stationConfigs).filter(station => station.available)
  
  // Filter stations based on search term
  const filteredStations = searchTerm
    ? allStations.filter(station => 
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.keyAreas.some(area => area.toLowerCase().includes(searchTerm.toLowerCase())) ||
        station.difficulty.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allStations
  
  // Get categories for display (sorted by station count)
  const sortedCategories = medicalCategories.sort((a, b) => {
    const stationCountDiff = b.stationIds.length - a.stationIds.length
    if (stationCountDiff !== 0) {
      return stationCountDiff
    }
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="space-y-6">
      {/* Preload Hume components for faster station loading */}
      <HumePreloader />
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Clinical Stations
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Practice OSCE skills with AI-powered patient interactions across medical specialties
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <input
            type="text"
            placeholder="Search clinical stations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Attempts and Subscription Info */}
      <AttemptsInfo />

      {/* Display Logic: Show filtered stations when searching, categories when not */}
      {searchTerm ? (
        /* Filtered Stations Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map((station) => {
            const category = getCategoryByStationId(station.id)
            
            return (
              <Link key={station.id} href={`/station/${station.id}`} className="block">
                <Card className="transition-all duration-200 hover:shadow-lg cursor-pointer hover:shadow-xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-start space-x-3">
                      {category && (
                        <div className={`w-12 h-12 bg-gradient-to-r ${category.gradient} rounded-lg flex items-center justify-center ${category.iconColor} flex-shrink-0`}>
                          <category.icon className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-2">{station.name}</CardTitle>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="default" className="text-xs">
                            {station.difficulty}
                          </Badge>
                          {category && (
                            <Badge variant="outline" className="text-xs">
                              {category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-sm mb-3">
                      {station.description}
                    </CardDescription>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Key Areas:</h4>
                      <div className="flex flex-wrap gap-1">
                        {station.keyAreas.slice(0, 3).map((area, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                        {station.keyAreas.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{station.keyAreas.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        /* Categories Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedCategories.map((category) => {
            const stationCount = category.stationIds.length
            const hasStations = stationCount > 0
            
            return (
              <Link key={category.id} href={hasStations ? `/dashboard/stations/${category.id}` : '#'} className="block">
                <Card className={`transition-all duration-200 hover:shadow-lg ${
                  !hasStations ? 'opacity-60' : 'cursor-pointer hover:shadow-xl'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-r ${category.gradient} rounded-lg flex items-center justify-center ${category.iconColor}`}>
                        <category.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
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
                    <CardDescription className="text-sm">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* No Results Message */}
      {searchTerm && filteredStations.length === 0 && (
        <div className="text-center py-12">
          <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No stations found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No clinical stations match "{searchTerm}"
          </p>
          <Button
            variant="outline"
            onClick={() => setSearchTerm('')}
            className="mt-4"
          >
            Clear Search
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Stethoscope className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Categories</p>
                <p className="text-2xl font-bold">{medicalCategories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Categories</p>
                <p className="text-2xl font-bold">{categoriesWithStations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Stations</p>
                <p className="text-2xl font-bold">{allStations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
