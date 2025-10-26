"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRole } from "@/lib/useRole";
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
import { DebugMultiSelect } from "@/components/ui/debug-multi-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Mic,
  MessageSquare
} from "lucide-react";
import BulkEventReview from "@/components/BulkEventReview";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function SmartBulkUploadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { canManageEvents, loading: roleLoading } = useRole();
  
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
  const [useBulkCategories, setUseBulkCategories] = useState(false); // Categories are optional
  const [selectedBulkCategories, setSelectedBulkCategories] = useState<string[]>([]);
  const [useBulkFormat, setUseBulkFormat] = useState(false); // Format is optional
  const [selectedBulkFormat, setSelectedBulkFormat] = useState<string>('none');
  const [useBulkLocation, setUseBulkLocation] = useState(false);
  const [selectedBulkMainLocation, setSelectedBulkMainLocation] = useState<string>('none');
  const [selectedBulkOtherLocations, setSelectedBulkOtherLocations] = useState<string[]>([]);
  const [useBulkOrganizer, setUseBulkOrganizer] = useState(false);
  const [selectedBulkMainOrganizer, setSelectedBulkMainOrganizer] = useState<string>('none');
  const [selectedBulkOtherOrganizers, setSelectedBulkOtherOrganizers] = useState<string[]>([]);
  const [useBulkSpeaker, setUseBulkSpeaker] = useState(false);
  const [selectedBulkSpeakers, setSelectedBulkSpeakers] = useState<string[]>([]);
  const [useBulkDescription, setUseBulkDescription] = useState(false);
  const [bulkDescription, setBulkDescription] = useState('');
  
  // Additional AI prompt state
  const [additionalAiPrompt, setAdditionalAiPrompt] = useState<string>('');
  
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

  // Auto-remove selected main location from other locations
  useEffect(() => {
    if (selectedBulkMainLocation !== 'none') {
      setSelectedBulkOtherLocations(prev => 
        prev.filter(id => id !== selectedBulkMainLocation)
      );
    }
  }, [selectedBulkMainLocation]);

  // Auto-remove selected main organizer from other organizers
  useEffect(() => {
    if (selectedBulkMainOrganizer !== 'none') {
      setSelectedBulkOtherOrganizers(prev => 
        prev.filter(id => id !== selectedBulkMainOrganizer)
      );
    }
  }, [selectedBulkMainOrganizer]);

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
    console.log('🎬 handleProcessFile called with autoDeleteEmails:', autoDeleteEmails);
    if (!file) return;

    // Format and categories are optional now

    setIsProcessing(true);
    setError(null);
    setShowEmailWarning(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('autoDeleteEmails', autoDeleteEmails.toString());
      console.log('📤 Sending API request with autoDeleteEmails:', autoDeleteEmails);
      
      // Add bulk selections (format and categories are optional)
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
      if (useBulkDescription && bulkDescription.trim()) {
        formData.append('bulkDescription', bulkDescription.trim());
      }
      
      // Add additional AI prompt if provided
      if (additionalAiPrompt.trim()) {
        formData.append('additionalAiPrompt', additionalAiPrompt.trim());
      }

      const response = await fetch('/api/events/bulk-upload-parse', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      console.log('Backend API Response:', {
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (!response.ok) {
        console.error('Backend API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
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
  }, [file, useBulkCategories, selectedBulkCategories, useBulkFormat, selectedBulkFormat, useBulkLocation, selectedBulkMainLocation, selectedBulkOtherLocations, useBulkOrganizer, selectedBulkMainOrganizer, selectedBulkOtherOrganizers, useBulkSpeaker, selectedBulkSpeakers, useBulkDescription, bulkDescription, additionalAiPrompt]);

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
        console.log('⏱️ Countdown:', countdown, 'seconds remaining');
        timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
      } else {
        // Auto-process when countdown reaches 0
        console.log('⏰ COUNTDOWN COMPLETE! Auto-processing with email deletion...');
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
  if (status === 'loading' || roleLoading) {
    return <LoadingScreen message="Loading smart bulk upload..." />
  }

  // Redirect if user doesn't have event management permission
  if (!canManageEvents) {
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
    // Validate file type - Excel only
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];

    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));

    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload an Excel file (.xlsx or .xls)');
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

      // Success! Redirect to events list page
      router.push('/events-list?bulkUpload=success&count=' + data.created);

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
    } else {
      return <FileSpreadsheet className="h-12 w-12 text-green-500" />; // Default to Excel icon
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step === 'upload' ? router.push('/event-data') : setStep(step === 'confirm' ? 'review' : 'upload')}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
            disabled={isProcessing}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">{step === 'upload' ? 'Back to Event Data' : 'Back'}</span>
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Smart Bulk Upload</h1>
          </div>
          <p className="text-gray-600 text-base sm:text-lg">
            Upload Excel documents and let AI extract event information automatically
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
                      <li>• Upload your Excel file containing event information</li>
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
                          title="Toggle category selection"
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
                          title="Toggle format selection"
                        >
                          <Sparkles className="h-4 w-4 mr-2 inline" />
                          Format
                        </button>
                        <button
                          onClick={() => setUseBulkDescription(!useBulkDescription)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            useBulkDescription
                              ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md'
                              : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400'
                          }`}
                          title="Toggle description input"
                        >
                          <MessageSquare className="h-4 w-4 mr-2 inline" />
                          Description
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Selection Sections */}
                    <div className="space-y-4">
                      {/* Categories Section - Conditional */}
                      {useBulkCategories && (
                        <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                            <h3 className="text-blue-900 font-medium">Categories</h3>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Select categories to apply to all events</span>
                            {selectedBulkCategories.length > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedBulkCategories([])}
                                className="text-xs"
                              >
                                Clear All
                              </Button>
                            )}
                          </div>
                          <DebugMultiSelect
                            options={getCategoryHierarchy().flatMap(parent => [
                              { value: parent.id, label: parent.name },
                              ...(parent.children?.map((child: any) => ({
                                value: child.id, 
                                label: `  ${child.name}`
                              })) || [])
                            ])}
                            selected={selectedBulkCategories}
                            onChange={setSelectedBulkCategories}
                            placeholder="Select categories"
                          />
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
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm text-gray-700">Other Locations:</label>
                                {selectedBulkOtherLocations.length > 0 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedBulkOtherLocations([])}
                                    className="text-xs"
                                  >
                                    Clear All
                                  </Button>
                                )}
                              </div>
                              <DebugMultiSelect
                                options={availableLocations
                                  .filter(location => location.id !== selectedBulkMainLocation)
                                  .map(location => ({ value: location.id, label: location.name }))}
                                selected={selectedBulkOtherLocations}
                                onChange={setSelectedBulkOtherLocations}
                                placeholder="Select additional locations"
                              />
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
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm text-gray-700">Other Organizers:</label>
                                {selectedBulkOtherOrganizers.length > 0 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedBulkOtherOrganizers([])}
                                    className="text-xs"
                                  >
                                    Clear All
                                  </Button>
                                )}
                              </div>
                              <DebugMultiSelect
                                options={availableOrganizers
                                  .filter(organizer => organizer.id !== selectedBulkMainOrganizer)
                                  .map(organizer => ({ value: organizer.id, label: organizer.name }))}
                                selected={selectedBulkOtherOrganizers}
                                onChange={setSelectedBulkOtherOrganizers}
                                placeholder="Select additional organizers"
                              />
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
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Select speakers to apply to all events</span>
                            {selectedBulkSpeakers.length > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedBulkSpeakers([])}
                                className="text-xs"
                              >
                                Clear All
                              </Button>
                            )}
                          </div>
                          <DebugMultiSelect
                            options={availableSpeakers.map(speaker => ({
                              value: speaker.id,
                              label: `${speaker.name}${speaker.role ? ` (${speaker.role})` : ''}`
                            }))}
                            selected={selectedBulkSpeakers}
                            onChange={setSelectedBulkSpeakers}
                            placeholder="Select speakers"
                          />
                        </div>
                      )}

                      {/* Format Section - Conditional */}
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

                      {/* Description Section - Conditional */}
                      {useBulkDescription && (
                        <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                            <h3 className="text-purple-900 font-medium">Description</h3>
                          </div>
                          <RichTextEditor
                            value={bulkDescription}
                            onChange={(value) => setBulkDescription(value)}
                            placeholder="Enter description to apply to all events..."
                          />
                          <p className="text-xs text-purple-600 mt-2">
                            This description will be applied to all events in the batch.
                          </p>
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
                  Upload Excel File
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
                    accept=".xlsx,.xls"
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
                          Excel (.xlsx, .xls)
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
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Additional AI Prompt Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Additional AI Instructions
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Provide specific instructions to help the AI better understand your data format and requirements.
                </p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-4">
                  {/* Input Field */}
                  <div>
                    <Label htmlFor="additionalPrompt" className="text-sm font-medium text-gray-700">
                      Custom Instructions
                    </Label>
                    <Textarea
                      id="additionalPrompt"
                      placeholder="e.g., 'All events start at 4PM', 'Use 24-hour time format', 'Assign Dr. Smith as default speaker for medical events'"
                      value={additionalAiPrompt}
                      onChange={(e) => setAdditionalAiPrompt(e.target.value)}
                      className="mt-2 min-h-[100px] resize-none text-sm"
                      rows={4}
                    />
                    {additionalAiPrompt.trim() && (
                      <p className="text-xs text-gray-500 mt-2">
                        {additionalAiPrompt.trim().length} characters
                      </p>
                    )}
                  </div>

                  {/* Quick Examples */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">💡 Quick Examples</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700 mb-2">Time & Format:</p>
                        <ul className="space-y-1 text-gray-600">
                          <li>• "All events start at 4PM"</li>
                          <li>• "Use 24-hour time format"</li>
                          <li>• "Events are weekdays only"</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 mb-2">People & Locations:</p>
                        <ul className="space-y-1 text-gray-600">
                          <li>• "Assign Dr. Smith as default speaker"</li>
                          <li>• "Use Education Centre for all teaching"</li>
                          <li>• "Mark as Foundation Year Doctor category"</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines Card */}
            <Card className="mt-6 bg-gray-50 border-gray-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Upload Guidelines</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Excel files only</strong> - Upload .xlsx or .xls files with your teaching schedule</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Format and category selection are optional</strong> - You can apply bulk settings to all events or leave them empty</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>The AI will extract event titles, dates, times, speakers, organizers, categories, and locations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Speakers, organizers, categories, and locations are automatically matched from your database (only existing names)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Organizers are assigned as additional organizers, not main organizers</span>
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

            {/* AI Capabilities Card */}
            <Card className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">🤖 AI-Powered Features</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Mic className="h-4 w-4 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Speaker Matching</p>
                        <p className="text-xs text-green-700">Automatically matches speakers from your database. Only existing names are assigned</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <UserCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-orange-900">Organizer Matching</p>
                        <p className="text-xs text-orange-700">Assigns organizers as additional organizers from your database</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Folder className="h-4 w-4 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Category Matching</p>
                        <p className="text-xs text-blue-700">Intelligently assigns categories from your database. Invalid names are safely skipped</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-purple-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-purple-900">Location Matching</p>
                        <p className="text-xs text-purple-700">Automatically matches locations as additional locations from your database</p>
                      </div>
                    </div>
                  </div>
                </div>
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

                <div className="border border-gray-200 rounded-lg p-3 sm:p-4 max-h-96 overflow-y-auto">
                  {extractedEvents.map((event, idx) => (
                    <div key={idx} className="py-3 border-b border-gray-100 last:border-0">
                      <p className="font-medium text-gray-900 break-words">{event.title}</p>
                      <p className="text-sm text-gray-600 break-words">
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

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleFinalConfirmation}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm sm:text-lg py-4 sm:py-6"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin flex-shrink-0" />
                        <span>Creating Events...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                        <span>Confirm & Create All Events</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setStep('review')}
                    variant="outline"
                    className="w-full border-gray-400 text-gray-700 text-sm sm:text-base py-4 sm:py-6"
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
  );
}