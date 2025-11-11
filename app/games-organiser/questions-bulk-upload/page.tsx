'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Upload, 
  FileText, 
  FileSpreadsheet,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  X
} from 'lucide-react'
import { BulkQuestionReview } from '@/components/quiz/BulkQuestionReview'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { QUIZ_DIFFICULTIES, getDifficultyDisplayName } from '@/lib/quiz/categories'
import { useQuizCategories } from '@/hooks/useQuizCategories'

export default function BulkUploadPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { categories, loading: categoriesLoading } = useQuizCategories()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailWarning, setEmailWarning] = useState<{
    found: boolean
    count: number
    emails: string[]
  } | null>(null)
  const [showEmailWarning, setShowEmailWarning] = useState(false)
  const [extractedQuestions, setExtractedQuestions] = useState<any[] | null>(null)
  const [step, setStep] = useState<'upload' | 'review' | 'confirm'>('upload')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [autoProcessEnabled, setAutoProcessEnabled] = useState(true)
  
  // Bulk selection states
  const [useBulkCategory, setUseBulkCategory] = useState(false)
  const [selectedBulkCategory, setSelectedBulkCategory] = useState<string>('')
  const [useBulkDifficulty, setUseBulkDifficulty] = useState(false)
  const [selectedBulkDifficulty, setSelectedBulkDifficulty] = useState<string>('')
  const [additionalAiPrompt, setAdditionalAiPrompt] = useState<string>('')

  const handleProcessFile = useCallback(async (autoDeleteEmails: boolean = false) => {
    if (!file) return

    setIsProcessing(true)
    setError(null)
    setShowEmailWarning(false)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('autoDeleteEmails', autoDeleteEmails.toString())

      if (useBulkCategory && selectedBulkCategory) {
        formData.append('bulkCategory', selectedBulkCategory)
      }
      if (useBulkDifficulty && selectedBulkDifficulty) {
        formData.append('bulkDifficulty', selectedBulkDifficulty)
      }
      if (additionalAiPrompt.trim()) {
        formData.append('additionalAiPrompt', additionalAiPrompt.trim())
      }

      const response = await fetch('/api/quiz/bulk-upload-parse', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.emailsFound && data.emailsFound.length > 0) {
          setEmailWarning({
            found: true,
            count: data.emailsFound.length,
            emails: data.emailsFound
          })
          setShowEmailWarning(true)
          setCountdown(30)
          setAutoProcessEnabled(true)
          setIsProcessing(false)
          return
        }
        throw new Error(data.error || 'Failed to process file')
      }

      if (!data.questions || data.questions.length === 0) {
        setError('No questions were extracted from the file. Please check the file content and try again.')
        return
      }

      setExtractedQuestions(data.questions)
      setStep('review')

    } catch (err: any) {
      console.error('File processing error:', err)
      setError(err.message || 'Failed to process file. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [file, useBulkCategory, selectedBulkCategory, useBulkDifficulty, selectedBulkDifficulty, additionalAiPrompt])

  const handleEmailWarningAction = useCallback((action: 'skip' | 'auto-delete') => {
    setCountdown(null)
    setAutoProcessEnabled(false)
    
    if (action === 'skip') {
      setShowEmailWarning(false)
      setEmailWarning(null)
    } else if (action === 'auto-delete') {
      handleProcessFile(true)
    }
  }, [handleProcessFile])

  // Auto-countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (showEmailWarning && emailWarning && autoProcessEnabled && countdown !== null) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(countdown - 1)
        }, 1000)
      } else {
        handleEmailWarningAction('auto-delete')
      }
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [showEmailWarning, emailWarning, countdown, autoProcessEnabled, handleEmailWarningAction])

  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/games-organiser/questions-bulk-upload')
    return null
  }

  if (status === 'loading') {
    return <LoadingScreen message="Loading bulk upload..." />
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      validateAndSetFile(selectedFile)
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    const allowedExtensions = ['.xlsx', '.xls', '.pdf', '.doc', '.docx']
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'))

    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload an Excel, PDF, or Word file.')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit. Please upload a smaller file.')
      return
    }

    setFile(selectedFile)
    setError(null)
    setEmailWarning(null)
    setShowEmailWarning(false)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      validateAndSetFile(files[0])
    }
  }

  const handleQuestionsReviewed = (questions: any[]) => {
    setExtractedQuestions(questions)
    setStep('confirm')
  }

  const handleFinalConfirmation = async () => {
    if (!extractedQuestions || extractedQuestions.length === 0) {
      setError('No questions to upload')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/quiz/bulk-upload-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: extractedQuestions })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create questions')
      }

      router.push('/games-organiser/questions?bulkUpload=success&count=' + data.created)

    } catch (err: any) {
      console.error('Question creation error:', err)
      setError(err.message || 'Failed to create questions. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => step === 'upload' ? router.push('/games-organiser/questions') : setStep(step === 'confirm' ? 'review' : 'upload')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 'upload' ? 'Back to Questions' : 'Back'}
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Smart Bulk Upload - Questions</h1>
        </div>
        <p className="text-gray-600 text-base sm:text-lg">
          Upload Excel, PDF, or Word documents and let AI extract medical questions automatically
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
          {/* Email Warning */}
          {showEmailWarning && emailWarning && (
            <Card className="border-yellow-500 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-5 h-5" />
                  Email Addresses Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-800 mb-4">
                  Found {emailWarning.count} email address(es) in the file. For privacy, these should be removed.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEmailWarningAction('auto-delete')}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Auto-remove and Continue
                    {countdown !== null && countdown > 0 && ` (${countdown}s)`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleEmailWarningAction('skip')}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                }`}
              >
                {file ? (
                  <div className="space-y-4">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-green-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-purple-600 hover:text-purple-700 font-medium">
                          Click to upload
                        </span>
                        {' '}or drag and drop
                      </Label>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".xlsx,.xls,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Excel, PDF, or Word files (max 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Bulk Options */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Bulk Options (Optional)</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useBulkCategory"
                      checked={useBulkCategory}
                      onCheckedChange={(checked) => setUseBulkCategory(checked as boolean)}
                    />
                    <Label htmlFor="useBulkCategory" className="cursor-pointer">
                      Apply category to all questions
                    </Label>
                  </div>
                  {useBulkCategory && (
                    <Select
                      value={selectedBulkCategory}
                      onValueChange={setSelectedBulkCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <SelectItem value="" disabled>Loading categories...</SelectItem>
                        ) : (
                          categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useBulkDifficulty"
                      checked={useBulkDifficulty}
                      onCheckedChange={(checked) => setUseBulkDifficulty(checked as boolean)}
                    />
                    <Label htmlFor="useBulkDifficulty" className="cursor-pointer">
                      Apply difficulty to all questions
                    </Label>
                  </div>
                  {useBulkDifficulty && (
                    <Select
                      value={selectedBulkDifficulty}
                      onValueChange={setSelectedBulkDifficulty}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty..." />
                      </SelectTrigger>
                      <SelectContent>
                        {QUIZ_DIFFICULTIES.map((diff) => (
                          <SelectItem key={diff} value={diff}>{getDifficultyDisplayName(diff)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label htmlFor="additionalAiPrompt">Additional AI Instructions (Optional)</Label>
                  <Textarea
                    id="additionalAiPrompt"
                    value={additionalAiPrompt}
                    onChange={(e) => setAdditionalAiPrompt(e.target.value)}
                    placeholder="e.g., 'Focus on cardiology topics', 'Use UK medical terminology'..."
                    className="mt-1"
                  />
                </div>
              </div>

              <Button
                onClick={() => handleProcessFile(false)}
                disabled={!file || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Process File with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Review Step */}
      {step === 'review' && extractedQuestions && (
        <BulkQuestionReview
          questions={extractedQuestions}
          onConfirm={handleQuestionsReviewed}
          onCancel={() => setStep('upload')}
        />
      )}

      {/* Confirm Step */}
      {step === 'confirm' && extractedQuestions && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Ready to create {extractedQuestions.filter(q => q.isValid !== false).length} question(s).
            </p>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('review')}>
                Back to Review
              </Button>
              <Button
                onClick={handleFinalConfirmation}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Questions
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

