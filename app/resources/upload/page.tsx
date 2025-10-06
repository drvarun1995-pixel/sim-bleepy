"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAdmin } from "@/lib/useAdmin";
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
  AlertCircle
} from "lucide-react";

export default function UploadResourcePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'others',
    customCategory: '',
    teachingDate: '',
    taughtBy: '',
    file: null as File | null
  });

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

    try {
      // Create FormData object
      const uploadData = new FormData();
      uploadData.append('file', formData.file);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('category', formData.category);
      uploadData.append('customCategory', formData.customCategory);
      uploadData.append('teachingDate', formData.teachingDate);
      uploadData.append('taughtBy', formData.taughtBy);

      // Upload to API
      const response = await fetch('/api/resources/upload', {
        method: 'POST',
        body: uploadData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Success
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

