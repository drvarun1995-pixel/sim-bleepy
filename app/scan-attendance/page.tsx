'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  QrCode, 
  Camera, 
  CameraOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Smartphone
} from 'lucide-react'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface ScanResult {
  success: boolean
  message: string
  details?: {
    eventTitle?: string
    eventDate?: string
    checkedInAt?: string
    feedbackEmailSent?: boolean
  }
}

function QRScannerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningControllerRef = useRef<any>(null)
  const lastScannedCodeRef = useRef<string | null>(null)
  const lastScanTimeRef = useRef<number>(0)
  
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const [isProcessing, setIsProcessing] = useState(false)
  const [qrCodeDetector, setQrCodeDetector] = useState<any>(null)
  const [eventId, setEventId] = useState<string | null>(null)

  // Get event ID from URL parameters
  useEffect(() => {
    const event = searchParams.get('event')
    if (event) {
      setEventId(event)
    }
  }, [searchParams])

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Initialize QR code detector
  useEffect(() => {
    const initQRDetector = async () => {
      try {
        // Dynamic import for QR code detection library
        const { BrowserQRCodeReader } = await import('@zxing/library')
        const reader = new BrowserQRCodeReader()
        setQrCodeDetector(reader)
      } catch (error) {
        console.error('Failed to initialize QR code detector:', error)
        toast.error('Failed to initialize QR code scanner')
      }
    }

    initQRDetector()
  }, [])

  // Check camera permission
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        setCameraPermission(permission.state)
      } catch (error) {
        console.error('Failed to check camera permission:', error)
        setCameraPermission('unknown')
      }
    }

    checkCameraPermission()
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop scanning when component unmounts
      stopScanning()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startScanning = async () => {
    if (!qrCodeDetector) {
      toast.error('QR code scanner not ready. Please refresh the page.')
      return
    }

    try {
      setIsScanning(true)
      setScanResult(null)
      
      // Reset tracking when starting a new scan
      lastScannedCodeRef.current = null
      lastScanTimeRef.current = 0

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      setCameraPermission('granted')
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Start QR code detection with controller for cleanup
      scanningControllerRef.current = new AbortController()
      const controller = scanningControllerRef.current
      
      // Use decodeFromVideoDevice - it returns a promise that resolves when scanning starts
      await qrCodeDetector.decodeFromVideoDevice(undefined, videoRef.current, (result: any, error: any) => {
        // Check if scanning was cancelled
        if (controller.signal.aborted) {
          return
        }
        
        if (result) {
          const qrCodeText = result.getText()
          handleQRCodeDetected(qrCodeText)
        }
        if (error && error.name !== 'NotFoundException') {
          console.error('QR code detection error:', error)
        }
      })

    } catch (error) {
      console.error('Error starting camera:', error)
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraPermission('denied')
          toast.error('Camera permission denied. Please allow camera access and try again.')
        } else if (error.name === 'NotFoundError') {
          toast.error('No camera found. Please ensure you have a camera connected.')
        } else {
          toast.error('Failed to access camera. Please try again.')
        }
      }
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    // Cancel any ongoing scanning - this prevents callbacks from processing
    if (scanningControllerRef.current) {
      scanningControllerRef.current.abort()
      scanningControllerRef.current = null
    }
    
    // Stop QR code detector scanning if it's active
    if (qrCodeDetector) {
      try {
        // The zxing library's decodeFromVideoDevice can be stopped by resetting the video
        // We'll handle cleanup through the stream stopping
      } catch (error) {
        console.error('Error stopping QR detector:', error)
      }
    }
    
    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    // Reset video element - this also stops the QR detection
    if (videoRef.current) {
      videoRef.current.srcObject = null
      // Pause the video to ensure detection stops
      videoRef.current.pause()
    }
    
    setIsScanning(false)
  }

  const handleQRCodeDetected = async (qrCodeData: string) => {
    // Prevent duplicate scans of the same code within 3 seconds
    const now = Date.now()
    const timeSinceLastScan = now - lastScanTimeRef.current
    
    if (isProcessing) return
    
    // Ignore if this is the same code scanned recently
    if (lastScannedCodeRef.current === qrCodeData && timeSinceLastScan < 3000) {
      console.log('Ignoring duplicate scan within cooldown period')
      return
    }
    
    // Update tracking
    lastScannedCodeRef.current = qrCodeData
    lastScanTimeRef.current = now
    
    setIsProcessing(true)
    stopScanning()

    try {
      const response = await fetch('/api/qr-codes/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCodeData: qrCodeData,
          eventId: eventId
        })
      })

      const result = await response.json()

      if (response.ok) {
        setScanResult({
          success: true,
          message: result.message,
          details: result.details
        })
        toast.success('Attendance marked successfully!')
      } else {
        setScanResult({
          success: false,
          message: result.error,
          details: result.details
        })
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Error processing QR code:', error)
      setScanResult({
        success: false,
        message: 'Failed to process QR code. Please try again.'
      })
      toast.error('Failed to process QR code')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    setIsProcessing(false)
    lastScannedCodeRef.current = null
    lastScanTimeRef.current = 0
  }

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      setCameraPermission('granted')
      toast.success('Camera permission granted!')
    } catch (error) {
      setCameraPermission('denied')
      toast.error('Camera permission denied')
    }
  }

  if (status === 'loading') {
    return <LoadingScreen message="Loading QR Scanner..." />
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/my-bookings')}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:scale-105 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to My Bookings</span>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scan Attendance QR Code</h1>
          <p className="text-gray-600">
            Point your camera at the QR code to mark your attendance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code Scanner
              </CardTitle>
              <CardDescription>
                Use your camera to scan the attendance QR code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Camera Permission Status */}
                {cameraPermission === 'denied' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Camera Permission Denied</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">
                      Please allow camera access in your browser settings and refresh the page.
                    </p>
                    <Button
                      onClick={requestCameraPermission}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Request Permission
                    </Button>
                  </div>
                )}

                {/* Scanner Interface */}
                <div className="relative">
                  {isScanning ? (
                    <div className="relative">
                      <video
                        ref={videoRef}
                        className="w-full h-64 bg-black rounded-lg object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-white border-dashed rounded-lg w-48 h-48 flex items-center justify-center">
                          <QrCode className="h-12 w-12 text-white opacity-50" />
                        </div>
                      </div>
                      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        Scanning...
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Camera not active</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scanner Controls */}
                <div className="flex gap-2">
                  {!isScanning ? (
                    <Button
                      onClick={startScanning}
                      disabled={cameraPermission === 'denied' || isProcessing}
                      className="flex-1"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Start Scanning
                    </Button>
                  ) : (
                    <Button
                      onClick={stopScanning}
                      variant="outline"
                      className="flex-1"
                    >
                      <CameraOff className="h-4 w-4 mr-2" />
                      Stop Scanning
                    </Button>
                  )}
                  
                  {scanResult && (
                    <Button
                      onClick={resetScanner}
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Scan Again
                    </Button>
                  )}
                </div>

                {/* Processing Indicator */}
                {isProcessing && (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing QR code...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Results</CardTitle>
              <CardDescription>
                Your attendance status and next steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!scanResult ? (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No scan results yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Scan a QR code to see results here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Success/Error Status */}
                  <div className={`flex items-center gap-2 p-4 rounded-lg ${
                    scanResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {scanResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        scanResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {scanResult.success ? 'Success!' : 'Error'}
                      </p>
                      <p className={`text-sm ${
                        scanResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {scanResult.message}
                      </p>
                    </div>
                  </div>

                  {/* Success Details */}
                  {scanResult.success && scanResult.details && (
                    <div className="space-y-3">
                      {scanResult.details.eventTitle && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Event:</span>
                          <p className="text-gray-900">{scanResult.details.eventTitle}</p>
                        </div>
                      )}
                      
                      {scanResult.details.eventDate && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Date:</span>
                          <p className="text-gray-900">{scanResult.details.eventDate}</p>
                        </div>
                      )}
                      
                      {scanResult.details.checkedInAt && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Checked in at:</span>
                          <p className="text-gray-900">
                            {new Date(scanResult.details.checkedInAt).toLocaleString('en-GB')}
                          </p>
                        </div>
                      )}
                      
                      {scanResult.details.feedbackEmailSent && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-blue-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium text-sm">Next Steps</span>
                          </div>
                          <p className="text-blue-700 text-sm mt-1">
                            Check your email for a feedback form link. Complete the feedback to receive your certificate.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Details */}
                  {!scanResult.success && scanResult.details && (
                    <div className="space-y-2">
                      {Object.entries(scanResult.details).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-sm font-medium text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                          </span>
                          <p className="text-gray-900">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Scan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Point Camera</h3>
                <p className="text-sm text-gray-600">
                  Point your camera at the QR code displayed at the event
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Wait for Detection</h3>
                <p className="text-sm text-gray-600">
                  Keep the QR code in view until it's automatically detected
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Complete Feedback</h3>
                <p className="text-sm text-gray-600">
                  Check your email for the feedback form link to get your certificate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Tips */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Mobile Tips</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Make sure you have good lighting</li>
                  <li>• Hold your phone steady</li>
                  <li>• Keep the QR code centered in the viewfinder</li>
                  <li>• If scanning fails, try moving closer or further away</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QRScannerPageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading QR Scanner...</p>
        </div>
      </div>
    }>
      <QRScannerPage />
    </Suspense>
  )
}

export default QRScannerPageWithSuspense
