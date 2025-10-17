'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Camera, Upload, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import Cropper from 'react-easy-crop'
import imageCompression from 'browser-image-compression'
import { createClient } from '@supabase/supabase-js'

interface ProfilePictureUploadProps {
  userId: string
  currentPictureUrl?: string | null
  userRole?: string
  onUploadComplete?: (url: string) => void
  onDeleteComplete?: () => void
}

// Helper function to create image from cropped area
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

// Helper function to get cropped image
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // Set canvas size to desired output size (400x400)
  canvas.width = 400
  canvas.height = 400

  // Draw the cropped image scaled to 400x400
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    400,
    400
  )

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Canvas is empty'))
      }
    }, 'image/webp', 0.95)
  })
}

// Helper function to get role-based background colors
const getRoleBackgroundColors = (role?: string) => {
  switch (role) {
    case 'student':
      return 'bg-gradient-to-br from-blue-400 to-blue-600' // Blue for students
    case 'educator':
      return 'bg-gradient-to-br from-green-400 to-green-600' // Green for educators
    case 'admin':
      return 'bg-gradient-to-br from-red-400 to-red-600' // Red for admins
    case 'meded_team':
      return 'bg-gradient-to-br from-purple-400 to-purple-600' // Purple for MedEd Team
    case 'ctf':
      return 'bg-gradient-to-br from-orange-400 to-orange-600' // Orange for CTF
    default:
      return 'bg-gradient-to-br from-gray-400 to-gray-600' // Gray as default
  }
}

export function ProfilePictureUpload({
  userId,
  currentPictureUrl,
  userRole,
  onUploadComplete,
  onDeleteComplete,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showCropper, setShowCropper] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [cacheTimestamp, setCacheTimestamp] = useState(Date.now()) // Cache-busting timestamp
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Invalid File Type', {
        description: 'Please upload a JPEG, PNG, or WebP image.',
      })
      return
    }

    // Validate file size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast.error('File Too Large', {
        description: 'Please upload an image smaller than 3MB.',
      })
      return
    }

    // Read file and show cropper
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setShowCropper(true)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.readAsDataURL(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    try {
      setUploading(true)
      setUploadProgress(10)

      // Step 1: Get cropped image blob
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      setUploadProgress(30)

      // Step 2: Compress image (target: 200-300KB)
      const compressedFile = await imageCompression(
        new File([croppedBlob], 'profile.webp', { type: 'image/webp' }),
        {
          maxSizeMB: 0.3, // 300KB
          maxWidthOrHeight: 400,
          useWebWorker: true,
          fileType: 'image/webp',
        }
      )
      setUploadProgress(60)

      // Step 3: Upload to Supabase Storage via API (which handles storage interaction)
      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('userId', userId)

      const response = await fetch('/api/user/profile-picture', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(90)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      setUploadProgress(100)

      toast.success('Profile Picture Updated', {
        description: 'Your profile picture has been updated successfully.',
      })

      // Close cropper and reset
      setShowCropper(false)
      setImageSrc(null)
      setCacheTimestamp(Date.now()) // Update timestamp to bust cache
      onUploadComplete?.(data.url)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Upload Failed', {
        description: error.message || 'Failed to upload profile picture.',
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async () => {
    if (!currentPictureUrl) return

    try {
      setDeleting(true)

      const response = await fetch('/api/user/profile-picture', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Delete failed')
      }

      toast.success('Profile Picture Removed', {
        description: 'Your profile picture has been removed.',
      })

      setCacheTimestamp(Date.now()) // Update timestamp to bust cache
      onDeleteComplete?.()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Delete Failed', {
        description: error.message || 'Failed to remove profile picture.',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleCloseCropper = () => {
    setShowCropper(false)
    setImageSrc(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Picture
          </CardTitle>
          <CardDescription>
            Upload a profile picture (max 3MB, JPEG/PNG/WebP)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {/* Avatar Display */}
          <div className="relative">
            <div className={`h-32 w-32 rounded-full ${getRoleBackgroundColors(userRole)} flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg`}>
              {currentPictureUrl ? (
                <img
                  src={currentPictureUrl.startsWith('http') ? `/api/user/profile-picture/${userId}?t=${cacheTimestamp}` : `${currentPictureUrl}?t=${cacheTimestamp}`}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // Fallback to user initial if image fails to load
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <span className={`text-4xl font-bold text-white ${currentPictureUrl ? 'hidden' : ''}`}>
                {userId ? userId.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>

            {/* Camera overlay button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg transition-colors"
              disabled={uploading || deleting}
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || deleting}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              {currentPictureUrl ? 'Change Picture' : 'Upload Picture'}
            </Button>

            {currentPictureUrl && (
              <Button
                onClick={handleDelete}
                disabled={uploading || deleting}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Removing...' : 'Remove'}
              </Button>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="w-full space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-gray-500">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cropper Modal */}
      <Dialog open={showCropper} onOpenChange={handleCloseCropper}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Your Profile Picture</DialogTitle>
            <DialogDescription>
              Adjust the crop area to select the part of your image you want to use
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-96 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          {/* Zoom Control */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseCropper}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {uploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Picture
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

