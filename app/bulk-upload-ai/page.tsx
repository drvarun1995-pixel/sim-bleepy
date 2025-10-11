"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAdmin } from "@/lib/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  FileText, 
  FileSpreadsheet,
  ArrowLeft,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Check,
  Info,
  Sparkles,
  X,
  Folder,
  MapPin,
  UserCircle,
  Mic
} from "lucide-react";
import BulkEventReview from "@/components/BulkEventReview";

export default function SmartBulkUploadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAdmin, loading: adminLoading } = useAdmin();
  
  // ALL STATE AND HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL LOGIC
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<{
    found: boolean;
    count: number;
    emails: string[];
  } | null>(null);
  const [showEmailWarning, setShowEmailWarning] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState<any[] | null>(null);
  const [step, setStep] = useState<'upload' | 'review' | 'confirm'>('upload');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoProcessEnabled, setAutoProcessEnabled] = useState(true);
  
  // Bulk selection states for upload step
  const [useBulkCategories, setUseBulkCategories] = useState(false);
  const [selectedBulkCategories, setSelectedBulkCategories] = useState<string[]>([]);
  const [useBulkFormat, setUseBulkFormat] = useState(false);
  const [selectedBulkFormat, setSelectedBulkFormat] = useState<string>('none');
  const [useBulkLocation, setUseBulkLocation] = useState(false);
  const [selectedBulkMainLocation, setSelectedBulkMainLocation] = useState<string>('none');
  const [selectedBulkOtherLocations, setSelectedBulkOtherLocations] = useState<string[]>([]);
  const [useBulkOrganizer, setUseBulkOrganizer] = useState(false);
  const [selectedBulkMainOrganizer, setSelectedBulkMainOrganizer] = useState<string>('none');
  const [selectedBulkOtherOrganizers, setSelectedBulkOtherOrganizers] = useState<string[]>([]);
  const [useBulkSpeaker, setUseBulkSpeaker] = useState(false);
  const [selectedBulkSpeakers, setSelectedBulkSpeakers] = useState<string[]>([]);
  
  // Available options for bulk selection
  const [availableLocations, setAvailableLocations] = useState<any[]>([]);
  const [availableSpeakers, setAvailableSpeakers] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableFormats, setAvailableFormats] = useState<any[]>([]);
  const [availableOrganizers, setAvailableOrganizers] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch available options for bulk selection
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        
        const [locationsRes, speakersRes, categoriesRes, formatsRes, organizersRes] = await Promise.all([
          fetch('/api/events/bulk-upload-options?type=locations'),
          fetch('/api/events/bulk-upload-options?type=speakers'),
          fetch('/api/events/bulk-upload-options?type=categories'),
          fetch('/api/events/bulk-upload-options?type=formats'),
          fetch('/api/events/bulk-upload-options?type=organizers')
        ]);

        const [locations, speakers, categories, formats, organizers] = await Promise.all([
          locationsRes.json(),
          speakersRes.json(),
          categoriesRes.json(),
          formatsRes.json(),
          organizersRes.json()
        ]);

        setAvailableLocations(locations.data || []);
        setAvailableSpeakers(speakers.data || []);
        setAvailableCategories(categories.data || []);
        setAvailableFormats(formats.data || []);
        setAvailableOrganizers(organizers.data || []);

      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  // Helper functions for bulk selection
  const getCategoryHierarchy = () => {
    const parentCategories = availableCategories.filter(c => !c.parent_id);
    const childCategories = availableCategories.filter(c => c.parent_id);
    
    return parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(c => c.parent_id === parent.id)
    }));
  };

  const handleProcessFile = useCallback(async (autoDeleteEmails: boolean = false) => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setShowEmailWarning(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('autoDeleteEmails', autoDeleteEmails.toString());
      
      // Add bulk selections
      if (useBulkCategories && selectedBulkCategories.length > 0) {
        formData.append('bulkCategories', JSON.stringify(selectedBulkCategories));
      }
      if (useBulkFormat && selectedBulkFormat !== 'none') {
        formData.append('bulkFormatId', selectedBulkFormat);
      }
      if (useBulkLocation) {
        if (selectedBulkMainLocation !== 'none') {
          formData.append('bulkMainLocationId', selectedBulkMainLocation);
        }
        if (selectedBulkOtherLocations.length > 0) {
          formData.append('bulkOtherLocationIds', JSON.stringify(selectedBulkOtherLocations));
        }
      }
      if (useBulkOrganizer) {
        if (selectedBulkMainOrganizer !== 'none') {
          formData.append('bulkMainOrganizerId', selectedBulkMainOrganizer);
        }
        if (selectedBulkOtherOrganizers.length > 0) {
          formData.append('bulkOtherOrganizerIds', JSON.stringify(selectedBulkOtherOrganizers));
        }
      }
      if (useBulkSpeaker && selectedBulkSpeakers.length > 0) {
        formData.append('bulkSpeakerIds', JSON.stringify(selectedBulkSpeakers));
      }

      const response = await fetch('/api/events/bulk-upload-parse', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process file');
      }

      // Check if emails were found
      if (data.emailsFound && data.emailsFound.length > 0 && !autoDeleteEmails) {
        setEmailWarning({
          found: true,
          count: data.emailsFound.length,
          emails: data.emailsFound
        });
        setShowEmailWarning(true);
        setCountdown(30); // Start 30-second countdown
        setAutoProcessEnabled(true);
        setIsProcessing(false);
        return;
      }

      // Success - move to review step
      console.log('Received events data:', data.events);
      
      // Check if we have valid events
      if (!data.events || data.events.length === 0) {
        setError('No events were extracted from the file. Please check the file content and try again.');
        return;
      }
      
      // Debug: Show events in UI temporarily
      console.log('Events being passed to component:', data.events);
      console.log('First event details:', data.events[0]);
      
      setExtractedEvents(data.events);
      setStep('review');

    } catch (err: any) {
      console.error('File processing error:', err);
      setError(err.message || 'Failed to process file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, useBulkCategories, selectedBulkCategories, useBulkFormat, selectedBulkFormat, useBulkLocation, selectedBulkMainLocation, selectedBulkOtherLocations, useBulkOrganizer, selectedBulkMainOrganizer, selectedBulkOtherOrganizers, useBulkSpeaker, selectedBulkSpeakers]);

  const handleEmailWarningAction = useCallback((action: 'skip' | 'auto-delete') => {
    // Reset countdown when user takes action
    setCountdown(null);
    setAutoProcessEnabled(false);
    
    if (action === 'skip') {
      setShowEmailWarning(false);
      setEmailWarning(null);
    } else if (action === 'auto-delete') {
      handleProcessFile(true);
    }
  }, [handleProcessFile]);

  // Auto-countdown timer for email warning
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (showEmailWarning && emailWarning && autoProcessEnabled && countdown !== null) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
      } else {
        // Auto-process when countdown reaches 0
        handleEmailWarningAction('auto-delete');
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showEmailWarning, emailWarning, countdown, autoProcessEnabled, handleEmailWarningAction]);

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/bulk-upload-ai');
    return null;
  }

  // Show loading while checking auth
  if (status === 'loading' || adminLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!isAdmin) {
    router.push('/events-list');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ];

    const allowedExtensions = ['.xlsx', '.xls', '.pdf', '.docx', '.doc'];
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));

    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload an Excel (.xlsx, .xls), PDF (.pdf), or Word document (.docx, .doc)');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setEmailWarning(null);
    setShowEmailWarning(false);
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
      validateAndSetFile(files[0]);
    }
  };


  const handleEventsReviewed = (events: any[]) => {
    setExtractedEvents(events);
    setStep('confirm');
  };

  const handleFinalConfirmation = async () => {
    if (!extractedEvents || extractedEvents.length === 0) {
      setError('No events to upload');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/events/bulk-upload-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: extractedEvents })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create events');
      }

      // Success! Redirect to events page
      router.push('/events?bulkUpload=success&count=' + data.created);

    } catch (err: any) {
      console.error('Event creation error:', err);
      setError(err.message || 'Failed to create events. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    if (ext === '.xlsx' || ext === '.xls') {
      return <FileSpreadsheet className="h-12 w-12 text-green-500" />;
    } else if (ext === '.pdf') {
      return <FileText className="h-12 w-12 text-red-500" />;
    } else {
      return <FileText className="h-12 w-12 text-blue-500" />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => step === 'upload' ? router.push('/event-data') : setStep(step === 'confirm' ? 'review' : 'upload')}
            className="mb-4 border-purple-300 text-purple-700 hover:bg-purple-100"
            disabled={isProcessing}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 'upload' ? 'Back to Event Data' : 'Back'}
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Smart Bulk Upload</h1>
          </div>
          <p className="text-gray-600 text-base sm:text-lg">
            Upload Excel, PDF, or Word documents and let AI extract event information automatically
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'upload' ? 'bg-purple-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="font-medium hidden sm:inline">Upload File</span>
            </div>
            <div className="w-16 h-1 bg-gray-200"></div>
            <div className={`flex items-center gap-2 ${step === 'review' ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'review' ? 'bg-purple-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="font-medium hidden sm:inline">Review & Edit</span>
            </div>
            <div className="w-16 h-1 bg-gray-200"></div>
            <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'confirm' ? 'bg-purple-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="font-medium hidden sm:inline">Confirm</span>
            </div>
          </div>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <>
            {/* Info Banner */}
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Upload your file containing event information (Excel, PDF, or Word)</li>
                      <li>• AI will automatically extract event titles, dates, and times</li>
                      <li>• The system will match existing locations and speakers from your database</li>
                      <li>• You can review and edit all extracted information before saving</li>
                      <li>• Email addresses will be detected and you'll be warned about personal information</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Selection Options */}
            {!loadingOptions && (
              <Card className="mb-6">
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-4">
                    <div className="pb-4 border-b border-gray-200">
                      <label className="text-sm text-gray-700 font-medium mb-2 block">Bulk Apply to All Events:</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setUseBulkCategories(!useBulkCategories)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            useBulkCategories
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                              : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-400'
                          }`}
                        >
                          <Folder className="h-4 w-4 mr-2 inline" />
                          Categories
                        </button>
                        <button
                          onClick={() => setUseBulkLocation(!useBulkLocation)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            useBulkLocation
                              ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md'
                              : 'bg-white border border-gray-300 text-gray-700 hover:border-red-400'
                          }`}
                        >
                          <MapPin className="h-4 w-4 mr-2 inline" />
                          Location
                        </button>
                        <button
                          onClick={() => setUseBulkOrganizer(!useBulkOrganizer)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            useBulkOrganizer
                              ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md'
                              : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400'
                          }`}
                        >
                          <UserCircle className="h-4 w-4 mr-2 inline" />
                          Organizer
                        </button>
                        <button
                          onClick={() => setUseBulkSpeaker(!useBulkSpeaker)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            useBulkSpeaker
                              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                              : 'bg-white border border-gray-300 text-gray-700 hover:border-orange-400'
                          }`}
                        >
                          <Mic className="h-4 w-4 mr-2 inline" />
                          Speaker
                        </button>
                        <button
                          onClick={() => setUseBulkFormat(!useBulkFormat)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            useBulkFormat
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                              : 'bg-white border border-gray-300 text-gray-700 hover:border-green-400'
                          }`}
                        >
                          <Sparkles className="h-4 w-4 mr-2 inline" />
                          Format
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Selection Sections */}
                    <div className="space-y-4">
                      {/* Categories Section */}
                      {useBulkCategories && (
                        <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                            <h3 className="text-blue-900 font-medium">Categories</h3>
                          </div>
                          <div className="max-h-60 overflow-y-auto bg-white rounded-lg border">
                            {getCategoryHierarchy().map((parent) => (
                              <div key={parent.id} className="p-2">
                                {/* Parent Category */}
                                <div 
                                  className="flex items-center gap-3 py-2 px-3 cursor-pointer hover:bg-gray-50 rounded"
                                  onClick={() => {
                                    const isSelected = selectedBulkCategories.includes(parent.id);
                                    if (isSelected) {
                                      setSelectedBulkCategories(prev => prev.filter(id => id !== parent.id));
                                    } else {
                                      setSelectedBulkCategories(prev => [...prev, parent.id]);
                                    }
                                  }}
                                >
                                  <Checkbox
                                    checked={selectedBulkCategories.includes(parent.id)}
                                    disabled
                                  />
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: parent.color || '#gray' }}
                                  />
                                  <span className="font-medium text-gray-900">{parent.name}</span>
                                </div>
                                
                                {/* Child Categories */}
                                {parent.children?.map((child: any) => (
                                  <div 
                                    key={child.id} 
                                    className="flex items-center gap-3 py-1 px-3 ml-8 cursor-pointer hover:bg-gray-50 rounded"
                                    onClick={() => {
                                      const isSelected = selectedBulkCategories.includes(child.id);
                                      if (isSelected) {
                                        setSelectedBulkCategories(prev => prev.filter(id => id !== child.id));
                                      } else {
                                        setSelectedBulkCategories(prev => [...prev, child.id]);
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      checked={selectedBulkCategories.includes(child.id)}
                                      disabled
                                    />
                                    <div
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{ backgroundColor: child.color || parent.color || '#gray' }}
                                    />
                                    <span className="text-sm text-gray-700">{child.name}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Location Section */}
                      {useBulkLocation && (
                        <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                            <h3 className="text-red-900 font-medium">Location</h3>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-gray-700 mb-2 block">Main Location:</label>
                              <Select 
                                value={selectedBulkMainLocation} 
                                onValueChange={setSelectedBulkMainLocation}
                              >
                                <SelectTrigger className="w-full">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-red-500" />
                                    <SelectValue placeholder="Select main location" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No main location</SelectItem>
                                  {availableLocations.map((location) => (
                                    <SelectItem key={location.id} value={location.id}>
                                      {location.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm text-gray-700 mb-2 block">Other Locations:</label>
                              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-white">
                                {availableLocations.map((location) => (
                                  <div 
                                    key={location.id} 
                                    className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 rounded"
                                    onClick={() => {
                                      const isSelected = selectedBulkOtherLocations.includes(location.id);
                                      if (isSelected) {
                                        setSelectedBulkOtherLocations(prev => prev.filter(id => id !== location.id));
                                      } else {
                                        setSelectedBulkOtherLocations(prev => [...prev, location.id]);
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      checked={selectedBulkOtherLocations.includes(location.id)}
                                      disabled
                                    />
                                    <span className="text-sm text-gray-700">{location.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Organizer Section */}
                      {useBulkOrganizer && (
                        <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                            <h3 className="text-purple-900 font-medium">Organizer</h3>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-gray-700 mb-2 block">Main Organizer:</label>
                              <Select 
                                value={selectedBulkMainOrganizer} 
                                onValueChange={setSelectedBulkMainOrganizer}
                              >
                                <SelectTrigger className="w-full">
                                  <div className="flex items-center gap-2">
                                    <UserCircle className="h-4 w-4 text-purple-500" />
                                    <SelectValue placeholder="Select main organizer" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No main organizer</SelectItem>
                                  {availableOrganizers.map((organizer) => (
                                    <SelectItem key={organizer.id} value={organizer.id}>
                                      {organizer.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm text-gray-700 mb-2 block">Other Organizers:</label>
                              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-white">
                                {availableOrganizers.map((organizer) => (
                                  <div 
                                    key={organizer.id} 
                                    className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 rounded"
                                    onClick={() => {
                                      const isSelected = selectedBulkOtherOrganizers.includes(organizer.id);
                                      if (isSelected) {
                                        setSelectedBulkOtherOrganizers(prev => prev.filter(id => id !== organizer.id));
                                      } else {
                                        setSelectedBulkOtherOrganizers(prev => [...prev, organizer.id]);
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      checked={selectedBulkOtherOrganizers.includes(organizer.id)}
                                      disabled
                                    />
                                    <span className="text-sm text-gray-700">{organizer.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Speaker Section */}
                      {useBulkSpeaker && (
                        <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                            <h3 className="text-orange-900 font-medium">Speakers</h3>
                          </div>
                          <div className="max-h-60 overflow-y-auto border rounded-lg p-3 bg-white">
                            {availableSpeakers.map((speaker) => (
                              <div 
                                key={speaker.id} 
                                className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 rounded"
                                onClick={() => {
                                  const isSelected = selectedBulkSpeakers.includes(speaker.id);
                                  if (isSelected) {
                                    setSelectedBulkSpeakers(prev => prev.filter(id => id !== speaker.id));
                                  } else {
                                    setSelectedBulkSpeakers(prev => [...prev, speaker.id]);
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={selectedBulkSpeakers.includes(speaker.id)}
                                  disabled
                                />
                                <Mic className="h-3 w-3 text-orange-500" />
                                <span className="text-sm text-gray-700">
                                  {speaker.name} {speaker.role && `(${speaker.role})`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Format Section */}
                      {useBulkFormat && (
                        <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                            <h3 className="text-green-900 font-medium">Format</h3>
                          </div>
                          <Select 
                            value={selectedBulkFormat} 
                            onValueChange={setSelectedBulkFormat}
                          >
                            <SelectTrigger className="w-full">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-green-500" />
                                <SelectValue placeholder="Select format" />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No format</SelectItem>
                              {availableFormats.map((format) => (
                                <SelectItem key={format.id} value={format.id}>
                                  {format.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Card */}
            <Card className="mx-2 sm:mx-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Document
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {/* File Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center transition-all ${
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
                    accept=".xlsx,.xls,.pdf,.docx,.doc"
                  />
                  <label htmlFor="file" className="cursor-pointer block">
                    {file ? (
                      <div>
                        {getFileIcon(file.name)}
                        <p className="text-lg font-medium text-gray-900 mt-4 mb-1">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          {formatFileSize(file.size)}
                        </p>
                        <p className="text-sm text-purple-600">
                          Click to change file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className={`h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 ${
                          isDragging ? 'text-purple-500' : 'text-gray-400'
                        }`} />
                        <p className={`text-base sm:text-lg font-medium mb-2 px-2 ${
                          isDragging ? 'text-purple-700' : 'text-gray-900'
                        }`}>
                          {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 px-2">
                          Excel (.xlsx, .xls), PDF (.pdf), or Word (.docx, .doc)
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Maximum file size: 10MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Email Warning Dialog - Inline on Page */}
                {showEmailWarning && emailWarning && (
                  <div className="mt-4 mx-2 sm:mx-0">
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 sm:p-6 max-w-full overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
                        <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 self-start" />
                        <div className="flex-1 min-w-0 space-y-3">
                          <h3 className="font-bold text-amber-900 text-lg sm:text-xl leading-tight">
                            Personal Information Detected
                          </h3>
                          <p className="text-sm sm:text-base text-amber-800 leading-relaxed">
                            We found {emailWarning.count} email address{emailWarning.count > 1 ? 'es' : ''} in your file. 
                            This may contain personal information.
                          </p>
                          
                          {/* Email List - Better Mobile Layout */}
                          <div className="bg-white border border-amber-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                            <div className="space-y-2">
                              {emailWarning.emails.map((email, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-xs text-gray-500 mt-0.5 flex-shrink-0">•</span>
                                  <span className="text-xs sm:text-sm text-gray-700 break-all leading-relaxed">
                                    {email}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <p className="text-sm sm:text-base text-amber-800 font-medium">
                            What would you like to do?
                          </p>
                          
                          {/* Auto-countdown Timer - Mobile Optimized */}
                          {countdown !== null && autoProcessEnabled && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4 mb-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                                  <span className="text-sm text-purple-800 font-medium break-words">
                                    Auto-processing in {countdown} seconds
                                  </span>
                                </div>
                                <Button
                                  onClick={() => setAutoProcessEnabled(false)}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs border-purple-300 text-purple-700 hover:bg-purple-100 w-full sm:w-auto flex-shrink-0"
                                >
                                  Cancel Auto
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Action Buttons - Fixed Desktop Layout */}
                          <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-3">
                            <Button
                              onClick={() => handleEmailWarningAction('auto-delete')}
                              className="w-full sm:flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base py-3 sm:py-2 px-4 sm:px-6 min-h-[60px] sm:min-h-auto"
                            >
                              <div className="flex items-center justify-center gap-2 w-full">
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                <span className="text-center leading-tight font-medium">
                                  <span className="block sm:hidden">Remove & Continue</span>
                                  <span className="hidden sm:block">Automatically Remove Emails & Continue</span>
                                </span>
                              </div>
                            </Button>
                            <Button
                              onClick={() => handleEmailWarningAction('skip')}
                              variant="outline"
                              className="w-full sm:flex-1 border-amber-300 text-amber-900 hover:bg-amber-100 text-sm sm:text-base py-3 sm:py-2 px-4 sm:px-6 min-h-[60px] sm:min-h-auto"
                            >
                              <div className="flex items-center justify-center gap-2 w-full">
                                <X className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                <span className="text-center leading-tight font-medium">
                                  <span className="block sm:hidden">Cancel & Upload New</span>
                                  <span className="hidden sm:block">Cancel & Upload Different File</span>
                                </span>
                              </div>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Process Button */}
                {file && !showEmailWarning && (
                  <div className="mt-6">
                    <Button
                      onClick={() => handleProcessFile(false)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Process with AI
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guidelines Card */}
            <Card className="mt-6 bg-gray-50 border-gray-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Upload Guidelines</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>The AI will only extract event titles, dates, and times</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Existing locations and speakers from your database will be matched automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>The system will NOT create or modify formats, categories, locations, or speakers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>You can review and edit all information before finalizing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>Email addresses will be detected and flagged for your review</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}

        {/* Review Step */}
        {step === 'review' && extractedEvents && (
          <BulkEventReview
            events={extractedEvents}
            onConfirm={handleEventsReviewed}
            onCancel={() => {
              setStep('upload');
              setFile(null);
              setExtractedEvents(null);
            }}
          />
        )}

        {/* Confirm Step */}
        {step === 'confirm' && extractedEvents && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Final Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-bold text-green-900 text-lg mb-2">
                    Ready to Create {extractedEvents.length} Event{extractedEvents.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-green-800">
                    You're about to add {extractedEvents.length} new event{extractedEvents.length > 1 ? 's' : ''} to your calendar. 
                    Please review the summary below before confirming.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {extractedEvents.map((event, idx) => (
                    <div key={idx} className="py-3 border-b border-gray-100 last:border-0">
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(event.date).toLocaleDateString()} • {event.startTime}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleFinalConfirmation}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg py-6"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating Events...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Confirm & Create All Events
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setStep('review')}
                    variant="outline"
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    Go Back to Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}