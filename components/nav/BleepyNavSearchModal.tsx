'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Download,
  FileText,
  Heart,
  History,
  Search,
  Stethoscope,
  Target,
  Users,
  X,
} from 'lucide-react'

type SearchFilter = 'all' | 'station' | 'resource' | 'event'

type BleepyNavSearchModalProps = {
  isAdmin: boolean
  onClose: () => void
}

export function BleepyNavSearchModal({ isAdmin, onClose }: BleepyNavSearchModalProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all')
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout)
    }
  }, [searchTimeout])

  const performSearch = async (query: string, filter: SearchFilter) => {
    setIsLoadingSearch(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`)
      const data = await response.json()

      if (data.data) {
        let filtered = data.data.filter((item: any) => !item.adminOnly || isAdmin)
        if (filter !== 'all') {
          filtered = filtered.filter((item: any) => item.type === filter)
        }
        setSearchResults(filtered)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching:', error)
      setSearchResults([])
    } finally {
      setIsLoadingSearch(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (searchTimeout) clearTimeout(searchTimeout)

    if (query.length > 0) {
      const timeout = setTimeout(() => {
        performSearch(query, searchFilter)
      }, 300)
      setSearchTimeout(timeout)
    } else {
      setSearchResults([])
    }
  }

  const handleFilterChange = (filter: SearchFilter) => {
    setSearchFilter(filter)
    if (searchQuery.length > 0) {
      performSearch(searchQuery, filter)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="flex items-start justify-center pt-8 sm:pt-20 px-2 sm:px-4">
        <div
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 mx-2 sm:mx-0 animate-in slide-in-from-top-4 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50/30 to-blue-50/30">
            <div className="flex items-center flex-1 bg-white rounded-2xl border-2 border-gray-200 shadow-lg focus-within:border-purple-400 focus-within:ring-4 focus-within:ring-purple-100 focus-within:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 ml-2 mr-2">
                <Search className="h-6 w-6 text-purple-500" />
              </div>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search stations, resources..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 text-sm sm:text-base lg:text-lg border-none outline-none placeholder-gray-500 placeholder:text-xs sm:placeholder:text-sm lg:placeholder:text-base py-3 sm:py-4 bg-transparent font-medium"
                autoFocus
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-4 text-gray-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0 h-12 w-12 rounded-2xl transition-all duration-200 border-2 border-gray-200 hover:border-red-300 hover:shadow-md"
              aria-label="Close search"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {searchQuery.length > 0 && (
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Filter by type:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    searchFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleFilterChange('station')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                    searchFilter === 'station'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <Stethoscope className="h-3 w-3" />
                  Stations
                </button>
                <button
                  onClick={() => handleFilterChange('resource')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                    searchFilter === 'resource'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-green-50 hover:border-green-300'
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  Resources
                </button>
                <button
                  onClick={() => handleFilterChange('event')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                    searchFilter === 'event'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-purple-50 hover:border-purple-300'
                  }`}
                >
                  <Calendar className="h-3 w-3" />
                  Events
                </button>
              </div>
            </div>
          )}

          <div className="max-h-80 sm:max-h-96 overflow-y-auto overflow-x-hidden search-results-container">
            {searchQuery.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Search Everything</h3>
                <p className="text-gray-500">Find stations, resources, and events instantly</p>
              </div>
            ) : isLoadingSearch ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-200 border-t-purple-500"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Searching...</h3>
                <p className="text-gray-500">Finding the best results for you</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-gray-600">
                    Found {searchResults.length} {searchFilter !== 'all' ? searchFilter : 'results'}
                    {searchFilter !== 'all' && <span className="text-gray-400"> ({searchFilter})</span>}
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                {searchResults.map((item, index) => {
                  const IconComponent =
                    item.icon === 'Stethoscope' ? Stethoscope :
                    item.icon === 'BarChart3' ? BarChart3 :
                    item.icon === 'History' ? History :
                    item.icon === 'Target' ? Target :
                    item.icon === 'Heart' ? Heart :
                    item.icon === 'Users' ? Users :
                    item.icon === 'FileText' ? FileText :
                    item.icon === 'Calendar' ? Calendar :
                    Stethoscope

                  if (item.type === 'resource') {
                    return (
                      <div
                        key={index}
                        onClick={(e) => {
                          e.preventDefault()
                          toast.info('Preparing download...', {
                            description: item.title,
                            duration: 2000,
                          })
                          setTimeout(() => {
                            window.open(item.href, '_blank')
                            toast.success('Download started!', {
                              description: `${item.title} is now downloading`,
                              duration: 3000,
                            })
                          }, 500)
                          onClose()
                        }}
                        className="group flex items-center p-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-green-50 transition-all duration-200 border border-transparent hover:border-green-100 hover:shadow-sm cursor-pointer"
                      >
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center mr-4 group-hover:from-green-100 group-hover:to-green-100 transition-all duration-200">
                          <IconComponent className="h-6 w-6 text-gray-600 group-hover:text-green-600 transition-colors duration-200" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 group-hover:text-green-900 transition-colors duration-200">{item.title}</h3>
                          <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200 mt-1">{item.description}</p>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              <FileText className="h-3 w-3 mr-1" />
                              Study Resource
                            </span>
                          </div>
                        </div>
                        <Download className="h-5 w-5 text-gray-400 group-hover:text-green-500 group-hover:scale-110 transition-all duration-200 flex-shrink-0" />
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={onClose}
                      className="group flex items-center p-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 border border-transparent hover:border-purple-100 hover:shadow-sm"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center mr-4 group-hover:from-purple-100 group-hover:to-blue-100 transition-all duration-200">
                        <IconComponent className="h-6 w-6 text-gray-600 group-hover:text-purple-600 transition-colors duration-200" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-900 transition-colors duration-200">{item.title}</h3>
                        <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200 mt-1">{item.description}</p>
                        <div className="mt-2">
                          {item.type === 'station' && (
                            <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              <Stethoscope className="h-3 w-3 mr-1" />
                              Clinical Station
                            </span>
                          )}
                          {item.type === 'event' && (
                            <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                              <Calendar className="h-3 w-3 mr-1" />
                              Teaching Event
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No results found</h3>
                <p className="text-gray-500 mb-4">
                  We couldn&apos;t find any {searchFilter !== 'all' ? searchFilter : 'items'} for &quot;{searchQuery}&quot;
                </p>
                <div className="text-sm text-gray-400">
                  {searchFilter === 'all' ? (
                    <>Try searching for: <span className="font-medium text-blue-600">stations</span>, <span className="font-medium text-green-600">resources</span>, or <span className="font-medium text-purple-600">events</span></>
                  ) : (
                    <>Try a different search term or switch to &quot;All&quot; to see all results</>
                  )}
                </div>
              </div>
            )}
          </div>

          {searchQuery.length === 0 && (
            <div className="p-6 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white">
              <div className="flex items-center mb-4">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                <p className="text-sm font-semibold text-gray-800">Quick Actions</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Link href="/stations" onClick={onClose} className="block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-14 sm:h-20 text-gray-700 hover:text-blue-700 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 hover:border-blue-200 hover:shadow-lg border border-gray-200 rounded-xl sm:rounded-2xl transition-all duration-300 group p-3 sm:p-4 bg-white shadow-sm"
                  >
                    <div className="flex flex-row sm:flex-col items-center justify-center space-x-3 sm:space-x-0 sm:space-y-2 w-full h-full">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="text-center sm:text-center">
                        <div className="font-semibold text-sm text-gray-800 group-hover:text-blue-800">Clinical Stations</div>
                        <div className="text-xs text-gray-500 group-hover:text-blue-600 hidden sm:block">Practice scenarios</div>
                      </div>
                    </div>
                  </Button>
                </Link>
                <Link href="/calendar" onClick={onClose} className="block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-14 sm:h-20 text-gray-700 hover:text-purple-700 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 hover:border-purple-200 hover:shadow-lg border border-gray-200 rounded-xl sm:rounded-2xl transition-all duration-300 group p-3 sm:p-4 bg-white shadow-sm"
                  >
                    <div className="flex flex-row sm:flex-col items-center justify-center space-x-3 sm:space-x-0 sm:space-y-2 w-full h-full">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                      <div className="text-center sm:text-center">
                        <div className="font-semibold text-sm text-gray-800 group-hover:text-purple-800">Teaching Events</div>
                        <div className="text-xs text-gray-500 group-hover:text-purple-600 hidden sm:block">Live sessions</div>
                      </div>
                    </div>
                  </Button>
                </Link>
                <Link href="/downloads" onClick={onClose} className="block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-14 sm:h-20 text-gray-700 hover:text-green-700 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 hover:border-green-200 hover:shadow-lg border border-gray-200 rounded-xl sm:rounded-2xl transition-all duration-300 group p-3 sm:p-4 bg-white shadow-sm"
                  >
                    <div className="flex flex-row sm:flex-col items-center justify-center space-x-3 sm:space-x-0 sm:space-y-2 w-full h-full">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:from-green-200 group-hover:to-green-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div className="text-center sm:text-center">
                        <div className="font-semibold text-sm text-gray-800 group-hover:text-green-800">Study Resources</div>
                        <div className="text-xs text-gray-500 group-hover:text-green-600 hidden sm:block">Download materials</div>
                      </div>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
