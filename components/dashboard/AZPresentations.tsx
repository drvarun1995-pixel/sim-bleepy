"use client";

import { stationConfigs } from '@/utils/stationConfigs'
import { getCategoryByStationId } from '@/utils/medicalCategories'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export function AZPresentations() {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  
  // Get all available stations and sort them alphabetically
  const sortedStations = Object.values(stationConfigs)
    .filter(station => station.available)
    .sort((a, b) => a.name.localeCompare(b.name))

  // Filter stations by selected letter
  const filteredStations = selectedLetter 
    ? sortedStations.filter(station => station.name.charAt(0).toUpperCase() === selectedLetter)
    : sortedStations

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              A-Z Presentations
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Browse all clinical stations alphabetically
            </p>
          </div>
        </div>
      </div>

      {/* Alphabetical Navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {/* Show All Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setSelectedLetter(null)
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            selectedLetter === null
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Show All
        </button>
        
        {/* Letter Buttons */}
        {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => {
          const hasStationsWithLetter = sortedStations.some(station => 
            station.name.charAt(0).toUpperCase() === letter
          )
          
          return (
            <button
              key={letter}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (hasStationsWithLetter) {
                  setSelectedLetter(letter)
                }
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedLetter === letter
                  ? 'bg-blue-600 text-white shadow-md'
                  : hasStationsWithLetter
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
              }`}
              disabled={!hasStationsWithLetter}
            >
              {letter}
            </button>
          )
        })}
      </div>

      {/* Filter Status */}
      {selectedLetter && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg">
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              Showing stations starting with "{selectedLetter}"
            </span>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setSelectedLetter(null)
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm underline cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>
      )}

      {/* Stations Grid */}
      <div className={selectedLetter ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" : "flex flex-col gap-4 sm:gap-6"}>
        {filteredStations.length > 0 ? (
          filteredStations.map((station, index) => {
            const category = getCategoryByStationId(station.id)
            const firstLetter = station.name.charAt(0).toUpperCase()
            const isFirstOfLetter = !selectedLetter && (index === 0 || 
              filteredStations[index - 1].name.charAt(0).toUpperCase() !== firstLetter)

            return (
              <div key={station.id}>
                {/* Letter Header - Only show when showing all stations */}
                {isFirstOfLetter && (
                  <div id={`letter-${firstLetter}`} className="mb-4 mt-6 first:mt-0">
                    <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg sm:text-2xl">{firstLetter}</span>
                      </div>
                      <div className="text-center">
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                          {firstLetter}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {filteredStations.filter(station => station.name.charAt(0).toUpperCase() === firstLetter).length} station{filteredStations.filter(station => station.name.charAt(0).toUpperCase() === firstLetter).length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Station Card */}
                <Link href={`/station/${station.id}`} className="block">
                  <Card className={`transition-all duration-200 hover:shadow-lg cursor-pointer hover:shadow-xl ${selectedLetter ? 'w-full' : 'w-full max-w-4xl mx-auto'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start space-x-3 mb-3">
                        {category && (
                          <div className={`w-12 h-12 bg-gradient-to-r ${category.gradient} rounded-lg flex items-center justify-center ${category.iconColor} flex-shrink-0`}>
                            <category.icon className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg mb-2">{station.name}</CardTitle>
                          <div className="flex flex-wrap gap-2">
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
                      <CardDescription className="text-sm mb-4" style={{ height: '6rem', overflow: 'hidden' }}>
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
              </div>
            )
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No stations found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No stations start with "{selectedLetter}"
            </p>
          </div>
        )}
      </div>

      {/* Back to Top Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 font-medium"
        >
          Back to Top
        </button>
      </div>
    </div>
  )
}
