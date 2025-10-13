'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Clock,
  User,
  Heart,
  Users,
  Star,
  Award,
  Zap,
  Globe,
  Phone,
  MapPin,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Stethoscope,
  ExternalLink
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

// Declare grecaptcha for TypeScript
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

interface ContactFormData {
  name: string
  email: string
  subject: string
  category: string
  message: string
}

const CONTACT_CATEGORIES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Technical Support' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'media', label: 'Media Inquiry' },
  { value: 'other', label: 'Other' }
]

const TEAM_MEMBERS = [
  {
    name: "Dr. Varun Tyagi",
    role: "Co-Founder & CEO",
    expertise: "Medical AI, Clinical Training",
    image: "/varun-tyagi.png",
    description: "Emergency Medicine physician with expertise in AI-powered medical education. Passionate about revolutionizing clinical training.",
    social: {
      linkedin: "https://linkedin.com/in/varun-tyagi",
      twitter: "https://twitter.com/varun_tyagi"
    }
  },
  {
    name: "Dr. Simran Mahmud",
    role: "Co-Founder & CTO",
    expertise: "Clinical Education, Product Development",
    image: "/simran-mahmud.png",
    description: "Clinical Teaching Fellow and product visionary with a passion for creating innovative healthcare solutions that make a difference.",
    social: {
      linkedin: "https://linkedin.com/in/simran-mahmud",
      github: "https://github.com/simran-mahmud"
    }
  }
]


const STATS = [
  { number: "300+", label: "Students Trained" },
  { number: "2", label: "Partner Institutions" },
  { number: "95%", label: "Student Satisfaction" },
  { number: "24/7", label: "Available" }
]

export default function ContactPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Animation on mount
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Auto-fill email for logged-in users
  useEffect(() => {
    if (session?.user?.email && !formData.email) {
      setFormData(prev => ({
        ...prev,
        email: session.user?.email || '',
        name: session.user?.name || prev.name
      }))
    }
  }, [session, formData.email])

  // Load reCAPTCHA v3 (only in production)
  useEffect(() => {
    const loadRecaptcha = () => {
      // Only load reCAPTCHA in production (sim.bleepy.co.uk)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Skipping reCAPTCHA in development mode')
        return
      }

      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          setIsRecaptchaLoaded(true)
        })
      } else {
        // Load the reCAPTCHA script if not already loaded
        const script = document.createElement('script')
        script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`
        script.async = true
        script.defer = true
        script.onload = () => {
          window.grecaptcha.ready(() => {
            setIsRecaptchaLoaded(true)
          })
        }
        script.onerror = () => {
          console.warn('Failed to load reCAPTCHA script')
        }
        document.head.appendChild(script)
      }
    }

    loadRecaptcha()
  }, [])

  // Cleanup reCAPTCHA when component unmounts
  useEffect(() => {
    return () => {
      // Clean up reCAPTCHA elements when leaving the page
      const recaptchaElements = document.querySelectorAll('[data-recaptcha]')
      recaptchaElements.forEach(element => element.remove())
      
      // Reset reCAPTCHA state
      setIsRecaptchaLoaded(false)
      
      // Clear any reCAPTCHA tokens from memory
      if (window.grecaptcha && window.grecaptcha.reset) {
        try {
          window.grecaptcha.reset()
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    }
  }, [])

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate message length before submitting
      if (formData.message.trim().length < 10) {
        toast.error('Message must be at least 10 characters long', {
          description: 'Please provide more details to help us assist you better.',
          duration: 5000,
        })
        setIsSubmitting(false)
        return
      }

      let recaptchaToken = ''

      // Get reCAPTCHA token if available (skip in development)
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && 
          isRecaptchaLoaded && window.grecaptcha && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        try {
          recaptchaToken = await window.grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, {
            action: 'contact_form'
          })
        } catch (recaptchaError) {
          console.warn('reCAPTCHA token generation failed:', recaptchaError)
          // Continue without token
        }
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Skipping reCAPTCHA in development mode')
      }

      console.log('Submitting contact form with data:', {
        ...formData,
        recaptchaToken: recaptchaToken ? '[TOKEN_PROVIDED]' : '[NO_TOKEN]'
      })

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken
        }),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      const result = await response.json()
      console.log('Response result:', result)

      if (response.ok) {
        setIsSubmitted(true)
        toast.success('Message sent successfully!', {
          description: 'We\'ll get back to you as soon as possible.',
          duration: 5000,
        })
      } else {
        console.error('Contact form error:', result)
        throw new Error(result.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      toast.error('Failed to send message', {
        description: 'Please try again or contact us directly.',
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.name && formData.email && formData.subject && formData.category && formData.message && formData.message.trim().length >= 10

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/80 backdrop-blur-sm animate-in fade-in-50 duration-500">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-50 duration-500">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Message Sent!</CardTitle>
            <CardDescription className="text-gray-600">
              Thank you for reaching out to us. We'll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <Button 
              onClick={() => {
                setIsSubmitted(false)
                setFormData({
                  name: '',
                  email: '',
                  subject: '',
                  category: '',
                  message: ''
                })
              }}
              variant="outline"
              className="w-full"
            >
              Send Another Message
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="relative bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full mb-6 animate-in zoom-in-50 duration-700">
                <MessageSquare className="h-10 w-10 text-purple-600" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
                Get in Touch
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                We're here to help you revolutionize medical education. Whether you're a student, educator, or institution, 
                we'd love to hear from you and explore how Bleepy can transform your clinical training experience.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                {STATS.map((stat, index) => (
                  <div 
                    key={index}
                    className={`text-center transition-all duration-1000 delay-${index * 200} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  >
                    <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Contact Form - Show first on mobile */}
          <div className="lg:col-span-2 lg:order-2">
            <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm h-full flex flex-col">
                <CardHeader className="pb-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                      <Send className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Send us a Message
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                    Fill out the form below and we'll get back to you as soon as possible. We're excited to hear from you!
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  <form onSubmit={handleSubmit} className="flex-grow flex flex-col space-y-6">
                    {/* Form Fields */}
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Full Name *
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="name"
                              type="text"
                              placeholder="Your full name"
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email Address *
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="your.email@example.com"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                            Category *
                          </Label>
                          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                            <SelectTrigger className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {CONTACT_CATEGORIES.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                            Subject *
                          </Label>
                          <Input
                            id="subject"
                            type="text"
                            placeholder="Brief description of your inquiry"
                            value={formData.subject}
                            onChange={(e) => handleInputChange('subject', e.target.value)}
                            className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      {/* Message Field - Expanded */}
                      <div className="space-y-2 flex-grow">
                        <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                          Message *
                        </Label>
                        <Textarea
                          id="message"
                          placeholder="Please provide details about your inquiry. The more information you provide, the better we can assist you..."
                          value={formData.message}
                          onChange={(e) => handleInputChange('message', e.target.value)}
                          className="!min-h-[135px] sm:!min-h-[320px] lg:!min-h-[350px] border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 resize-none transition-all duration-200 flex-grow"
                          required
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">
                            Minimum 10 characters. Be as detailed as possible to help us assist you better.
                          </p>
                          <p className={`text-xs font-medium ${formData.message.trim().length < 10 ? 'text-red-500' : 'text-green-500'}`}>
                            {formData.message.trim().length}/10
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Buttons - Stick to bottom */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-gray-100 mt-auto">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="flex items-center justify-center hover:bg-gray-50 transition-all duration-200 w-full sm:w-auto border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900 font-medium"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        <span className="font-medium">Go Back</span>
                      </Button>

                      <Button
                        type="submit"
                        disabled={!isFormValid || isSubmitting}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 sm:px-8 py-3 h-12 w-full sm:w-auto sm:min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            <span className="font-semibold">Sending...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Send className="h-4 w-4 mr-2" />
                            <span className="font-semibold">Send Message</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Left Column - Varun's Card + Team Section */}
          <div className="lg:col-span-1 lg:order-1 space-y-8">
            {/* Varun's Profile Card - Aligned with Form */}
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-200">
                        <Image
                          src={TEAM_MEMBERS[0].image}
                          alt={TEAM_MEMBERS[0].name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{TEAM_MEMBERS[0].name}</h3>
                      <p className="text-purple-600 font-medium">{TEAM_MEMBERS[0].role}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {TEAM_MEMBERS[0].expertise}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">{TEAM_MEMBERS[0].description}</p>
                </CardContent>
              </Card>
            </div>

            {/* Team Section - Below Varun's Card */}
            <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>

              <div className="space-y-4">
                {TEAM_MEMBERS.slice(1).map((member, index) => (
                  <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-200">
                            <Image
                              src={member.image}
                              alt={member.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base">{member.name}</h3>
                          <p className="text-purple-600 font-medium text-sm">{member.role}</p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {member.expertise}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-3">{member.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Heart className="h-5 w-5 text-red-500 mr-2" />
                    Get in Touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">support@bleepy.co.uk</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Response Time</p>
                      <p className="text-sm text-gray-600">Usually within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Globe className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Available</p>
                      <p className="text-sm text-gray-600">Worldwide support</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}