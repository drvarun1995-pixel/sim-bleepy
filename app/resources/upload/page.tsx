"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAdmin } from "@/lib/useAdmin";
import { getEvents } from "@/lib/events-api";
import { uploadFile } from "@/utils/apiHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  FileText, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Check
} from "lucide-react";

export default function UploadResourcePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'others',
    customCategory: '',
    teachingDate: '',
    taughtBy: '',
    file: null as File | null
  });

  // State for event selection
  const [eventsForDate, setEventsForDate] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());

  // Prevent default browser behavior for drag and drop on the entire page
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevent file from being opened in browser
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);

    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  // Fetch events when teaching date changes
  useEffect(() => {
    if (formData.teachingDate) {
      fetchEventsForDate(formData.teachingDate);
    } else {
      setEventsForDate([]);
      setSelectedEventIds(new Set());
    }
  }, [formData.teachingDate]);

  const fetchEventsForDate = async (date: string) => {
    setLoadingEvents(true);
    try {
      const allEvents = await getEvents();
      // Filter events for the selected date
      const filteredEvents = allEvents.filter((event: any) => event.date === date);
      setEventsForDate(filteredEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEventsForDate([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEventIds);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEventIds(newSelected);
  };

  // Show loading while checking auth and admin status
  if (status === 'loading' || adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Redirect if not admin
  if (!isAdmin) {
    router.push('/resources');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
      setUploadError(null);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setFormData({ ...formData, file: files[0] });
      setUploadError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      setUploadError('Please select a file to upload');
      return;
    }

    if (!formData.title.trim()) {
      setUploadError('Please enter a title');
      return;
    }

    if (formData.category === 'others' && !formData.customCategory.trim()) {
      setUploadError('Please specify the format for this resource');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Step 1: Get signed upload URL from our API
      const urlResponse = await fetch('/api/resources/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: formData.file.name,
          fileType: formData.file.type,
          fileSize: formData.file.size,
          category: formData.category
        })
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { signedUrl, filePath } = await urlResponse.json();

      // Step 2: Upload file directly to Supabase Storage
      // Using XMLHttpRequest for better progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed due to network error'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was cancelled'));
        });

        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', formData.file!.type || 'application/octet-stream');
        xhr.send(formData.file);
      });

      // Step 3: Save metadata to our database
      const metadataResponse = await fetch('/api/resources/save-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          customCategory: formData.customCategory,
          fileName: formData.file.name,
          filePath: filePath,
          fileSize: formData.file.size,
          teachingDate: formData.teachingDate,
          taughtBy: formData.taughtBy,
          eventIds: Array.from(selectedEventIds)
        })
      });

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        throw new Error(errorData.error || 'Failed to save resource metadata');
      }

      // Success!
      setUploadSuccess(true);
      
      // Reset form and redirect after success
      setTimeout(() => {
        router.push('/resources');
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/resources')}
            className="mb-4 border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-500 hover:text-purple-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Button>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Upload Resource</h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Add a new resource file to the library
          </p>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Resource Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadSuccess ? (
              <div className="py-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h3>
                <p className="text-gray-600">Redirecting to resources...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="file">File *</Label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                      isDragging 
                        ? 'border-purple-500 bg-purple-50 scale-[1.02]' 
                        : 'border-gray-300 hover:border-purple-400'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.jpg,.jpeg,.png"
                    />
                    <label htmlFor="file" className="cursor-pointer block">
                      <FileText className={`h-12 w-12 mx-auto mb-4 transition-colors ${
                        isDragging ? 'text-purple-500' : 'text-gray-400'
                      }`} />
                      {formData.file ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {formData.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(formData.file.size)}
                          </p>
                          <p className="text-xs text-purple-600 mt-2">
                            Click to change file
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className={`text-sm font-medium mb-1 ${
                            isDragging ? 'text-purple-700' : 'text-gray-900'
                          }`}>
                            {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF, DOC, PPT, Video, or Image files
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., ECG Interpretation"
                    required
                    className="text-sm sm:text-base"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description..."
                    rows={4}
                    className="text-sm sm:text-base"
                  />
                </div>

                {/* Format */}
                <div className="space-y-2">
                  <Label htmlFor="category">Format *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value, customCategory: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="others">Others</option>
                    <option value="a-e-practice-sessions">A-E Practice Sessions</option>
                    <option value="bedside-teaching">Bedside Teaching</option>
                    <option value="clinical-skills">Clinical Skills</option>
                    <option value="core-teachings">Core Teachings</option>
                    <option value="exams-mocks">Exams & Mocks</option>
                    <option value="grand-round">Grand Round</option>
                    <option value="hub-days">Hub days</option>
                    <option value="inductions">Inductions</option>
                    <option value="obs-gynae-practice-sessions">Obs & Gynae Practice Sessions</option>
                    <option value="osce-revision">OSCE Revision</option>
                    <option value="paeds-practice-sessions">Paeds Practice Sessions</option>
                    <option value="pharmacy-teaching">Pharmacy Teaching</option>
                    <option value="portfolio-drop-ins">Portfolio Drop-ins</option>
                    <option value="twilight-teaching">Twilight Teaching</option>
                    <option value="virtual-reality-sessions">Virtual Reality Sessions</option>
                  </select>
                </div>

                {/* Custom Format - Only shown when "Others" is selected */}
                {formData.category === 'others' && (
                  <div className="space-y-2 bg-purple-50 border border-purple-200 rounded-lg p-4 -mt-2">
                    <Label htmlFor="customCategory" className="text-purple-900">
                      Specify Format *
                    </Label>
                    <Input
                      id="customCategory"
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      placeholder="e.g., Research Papers"
                      required
                      className="border-purple-300 focus:ring-purple-500 text-sm sm:text-base"
                    />
                    <p className="text-xs text-purple-700">
                      This will be stored under "Others" format. Please specify what type of resource this is.
                    </p>
                  </div>
                )}

                {/* Teaching Date */}
                <div className="space-y-2">
                  <Label htmlFor="teachingDate">Teaching Date (Optional)</Label>
                  <Input
                    id="teachingDate"
                    type="date"
                    value={formData.teachingDate}
                    onChange={(e) => setFormData({ ...formData, teachingDate: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    The date when this topic was taught/presented
                  </p>
                </div>

                {/* Events for Selected Date */}
                {formData.teachingDate && (
                  <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <Label className="text-blue-900 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Link to Events (Optional)
                    </Label>
                    
                    {loadingEvents ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-blue-700">Loading events...</span>
                      </div>
                    ) : eventsForDate.length === 0 ? (
                      <p className="text-sm text-blue-700 py-2">
                        No events found for this date
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {eventsForDate.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => toggleEventSelection(event.id)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedEventIds.has(event.id)
                                ? 'border-blue-500 bg-blue-100'
                                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900">{event.title}</p>
                                {event.location_name && (
                                  <p className="text-xs text-gray-600 mt-1">📍 {event.location_name}</p>
                                )}
                                {event.start_time && (
                                  <p className="text-xs text-gray-600">🕐 {event.start_time}</p>
                                )}
                              </div>
                              {selectedEventIds.has(event.id) && (
                                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedEventIds.size > 0 && (
                      <p className="text-xs text-blue-700 font-medium mt-2">
                        ✓ {selectedEventIds.size} event{selectedEventIds.size > 1 ? 's' : ''} selected
                      </p>
                    )}
                    
                    <p className="text-xs text-blue-700 mt-2">
                      Select one or more events to link this resource to. The resource will appear on the event detail pages.
                    </p>
                  </div>
                )}

                {/* Taught By */}
                <div className="space-y-2">
                  <Label htmlFor="taughtBy">Taught By (Optional)</Label>
                  <Input
                    id="taughtBy"
                    value={formData.taughtBy}
                    onChange={(e) => setFormData({ ...formData, taughtBy: e.target.value })}
                    placeholder="e.g., Dr. Smith"
                    className="text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500">
                    Name of the person who taught this topic
                  </p>
                </div>

                {/* Error Message */}
                {uploadError && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{uploadError}</p>
                  </div>
                )}

                {/* Upload Progress */}
                {isUploading && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Uploading...</span>
                      <span className="text-sm font-medium text-purple-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm sm:text-base"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="hidden xs:inline">Uploading...</span>
                        <span className="xs:hidden">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        <span className="hidden xs:inline">Upload Resource</span>
                        <span className="xs:hidden">Upload</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/resources')}
                    className="flex-1 text-sm sm:text-base"
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Upload Guidelines</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Maximum file size: 50 MB</li>
              <li>• Supported formats: PDF, DOC, DOCX, PPT, PPTX, MP4, AVI, MOV, JPG, PNG</li>
              <li>• Use descriptive titles for easy searching</li>
              <li>• Add teaching dates to help students find session materials</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

