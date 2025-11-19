"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Video, Play, BookOpen, Stethoscope, Calendar, CalendarDays, Ticket, 
  UserCheck, Award, Download, FolderOpen, Brain, MessageCircle, 
  Upload, QrCode, Users, Bell, FileText, ArrowRight, Clock, 
  CheckCircle, TrendingUp, Target, Lightbulb, AlertCircle, 
  GraduationCap, BarChart3, Settings, MapPin, Sparkles, Search,
  Mail, Database, Tag, Layers, HelpCircle, PenSquare, UserCircle, Mic
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function TutorialsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Search functionality - must be called before any early returns
  const [searchQuery, setSearchQuery] = useState("");

  // Determine user role and tutorials - must be done before useMemo hooks
  const userRole = session?.user?.role;
  const isStudent = userRole === "student";
  const isMedEdTeam = userRole === "meded_team" || userRole === "ctf" || userRole === "admin";

  // Student tutorials
  const studentTutorials = [
    {
      id: "events-overview",
      title: "Discovering and Viewing Events",
      description: "Learn how to browse teaching events, filter by category, and view event details",
      icon: Calendar,
      duration: "5 min",
      category: "Events",
      slug: "events-overview",
      keywords: ["events", "browse", "view", "filter", "discover", "teaching"]
    },
    {
      id: "booking-events",
      title: "Booking Events",
      description: "Step-by-step guide to booking your spot at teaching sessions",
      icon: Ticket,
      duration: "4 min",
      category: "Events",
      slug: "booking-events",
      keywords: ["booking", "reserve", "register", "sign up", "events", "sessions"]
    },
    {
      id: "my-bookings",
      title: "Managing My Bookings",
      description: "How to view, manage, and cancel your event bookings",
      icon: Ticket,
      duration: "3 min",
      category: "Events",
      slug: "my-bookings",
      keywords: ["bookings", "manage", "cancel", "view", "my bookings", "reservations"]
    },
    {
      id: "calendar-navigation",
      title: "Using the Calendar",
      description: "Navigate the teaching calendar and find events by date",
      icon: CalendarDays,
      duration: "4 min",
      category: "Events",
      slug: "calendar-navigation",
      keywords: ["calendar", "date", "schedule", "navigate", "find events", "timeline"]
    },
    {
      id: "attendance-tracking",
      title: "Marking Attendance",
      description: "Learn how to scan QR codes and mark your attendance at events",
      icon: UserCheck,
      duration: "3 min",
      category: "Attendance",
      slug: "attendance-tracking",
      keywords: ["attendance", "qr code", "scan", "check in", "mark", "track"]
    },
    {
      id: "my-attendance",
      title: "Viewing My Attendance",
      description: "Track your attendance history and view attendance records",
      icon: UserCheck,
      duration: "3 min",
      category: "Attendance",
      slug: "my-attendance",
      keywords: ["attendance", "history", "records", "view", "track", "my attendance"]
    },
    {
      id: "certificates",
      title: "Accessing Certificates",
      description: "How to view and download your event completion certificates",
      icon: Award,
      duration: "3 min",
      category: "Certificates",
      slug: "certificates",
      keywords: ["certificates", "download", "completion", "certificate", "award", "view"]
    },
    {
      id: "resources-downloads",
      title: "Downloading Resources",
      description: "Find and download study materials, presentations, and teaching resources",
      icon: Download,
      duration: "4 min",
      category: "Resources",
      slug: "resources-downloads",
      keywords: ["resources", "download", "files", "materials", "study", "presentations"]
    },
    {
      id: "placements-guide",
      title: "Placements Guide",
      description: "Navigate placement-specific resources and specialty guides",
      icon: MapPin,
      duration: "5 min",
      category: "Resources",
      slug: "placements-guide",
      keywords: ["placements", "specialty", "guides", "resources", "navigate", "clinical"]
    },
    {
      id: "ai-simulator",
      title: "AI Patient Simulator",
      description: "Complete guide to using the AI simulator for clinical practice",
      icon: Brain,
      duration: "8 min",
      category: "AI Simulator",
      slug: "ai-simulator",
      keywords: ["simulator", "ai", "patient", "practice", "clinical", "simulation"]
    },
    {
      id: "portfolio",
      title: "My Portfolio",
      description: "Build and manage your learning portfolio with achievements and progress",
      icon: GraduationCap,
      duration: "5 min",
      category: "Portfolio",
      slug: "portfolio",
      keywords: ["portfolio", "achievements", "progress", "learning", "manage", "build"]
    },
    {
      id: "feedback",
      title: "Submitting Feedback",
      description: "How to provide feedback on teaching events and sessions",
      icon: MessageCircle,
      duration: "3 min",
      category: "Feedback",
      slug: "feedback",
      keywords: ["feedback", "submit", "review", "rate", "comment", "evaluate"]
    }
  ];

  // MedEd Team tutorials
  const mededTutorials = [
    {
      id: "event-management",
      title: "Event Management Overview",
      description: "Complete guide to creating, editing, and managing teaching events",
      icon: Calendar,
      duration: "10 min",
      category: "Event Management",
      slug: "event-management",
      keywords: ["event", "create", "edit", "manage", "teaching", "sessions"]
    },
    {
      id: "bulk-upload",
      title: "Bulk Event Upload",
      description: "Learn how to upload multiple events using Excel/CSV files with AI assistance",
      icon: Upload,
      duration: "8 min",
      category: "Event Management",
      slug: "bulk-upload",
      keywords: ["bulk", "upload", "excel", "csv", "multiple", "events", "ai"]
    },
    {
      id: "formats-management",
      title: "Managing Event Formats",
      description: "Create, edit, and organize event formats like workshops, lectures, and seminars",
      icon: Layers,
      duration: "6 min",
      category: "Event Management",
      slug: "formats-management",
      keywords: ["formats", "workshop", "lecture", "seminar", "event types", "categories"]
    },
    {
      id: "categories-management",
      title: "Event Categories Management",
      description: "Organize events by categories and manage category settings",
      icon: Tag,
      duration: "5 min",
      category: "Event Management",
      slug: "categories-management",
      keywords: ["categories", "organize", "classify", "event types", "grouping"]
    },
    {
      id: "locations-management",
      title: "Event Locations Management",
      description: "Create, edit, and organize event locations like rooms, halls, and venues",
      icon: MapPin,
      duration: "6 min",
      category: "Event Management",
      slug: "locations-management",
      keywords: ["locations", "venues", "rooms", "halls", "addresses", "coordinates"]
    },
    {
      id: "organizers-management",
      title: "Event Organizers Management",
      description: "Create, edit, and organize event organizers who coordinate teaching sessions",
      icon: UserCircle,
      duration: "6 min",
      category: "Event Management",
      slug: "organizers-management",
      keywords: ["organizers", "coordinators", "event managers", "coordination"]
    },
    {
      id: "speakers-management",
      title: "Event Speakers Management",
      description: "Create, edit, and organize event speakers who deliver teaching content",
      icon: Mic,
      duration: "6 min",
      category: "Event Management",
      slug: "speakers-management",
      keywords: ["speakers", "presenters", "instructors", "teachers", "delivery"]
    },
    {
      id: "bookings-management",
      title: "Managing Bookings",
      description: "How to view, manage, and handle event bookings and waitlists",
      icon: Ticket,
      duration: "6 min",
      category: "Bookings",
      slug: "bookings-management",
      keywords: ["bookings", "reservations", "waitlist", "capacity", "attendees"]
    },
    {
      id: "qr-codes",
      title: "QR Code Generation",
      description: "Create and manage QR codes for event attendance tracking",
      icon: QrCode,
      duration: "5 min",
      category: "Attendance",
      slug: "qr-codes",
      keywords: ["qr", "code", "attendance", "scan", "tracking", "check-in"]
    },
    {
      id: "attendance-tracking-admin",
      title: "Attendance Tracking",
      description: "Monitor and track student attendance across all events",
      icon: Users,
      duration: "6 min",
      category: "Attendance",
      slug: "attendance-tracking-admin",
      keywords: ["attendance", "tracking", "monitor", "students", "events", "records"]
    },
    {
      id: "feedback-management",
      title: "Feedback Management",
      description: "View, analyze, and respond to student feedback on events",
      icon: MessageCircle,
      duration: "5 min",
      category: "Feedback",
      slug: "feedback-management",
      keywords: ["feedback", "reviews", "responses", "analysis", "templates"]
    },
    {
      id: "certificates-generation",
      title: "Certificate Generation",
      description: "Generate and manage certificates for event completion",
      icon: Award,
      duration: "7 min",
      category: "Certificates",
      slug: "certificates-generation",
      keywords: ["certificates", "generate", "templates", "download", "completion"]
    },
    {
      id: "resources-management",
      title: "Resource Management",
      description: "Upload, organize, and manage teaching resources and materials",
      icon: FolderOpen,
      duration: "8 min",
      category: "Resources",
      slug: "resources-management",
      keywords: ["resources", "upload", "files", "materials", "documents", "downloads"]
    },
    {
      id: "announcements",
      title: "Creating Announcements",
      description: "Create and manage platform announcements for students with rich text and images",
      icon: Bell,
      duration: "5 min",
      category: "Announcements",
      slug: "announcements",
      keywords: ["announcements", "notifications", "alerts", "messages", "broadcast"]
    },
    {
      id: "contact-messages",
      title: "Contact Messages",
      description: "Manage contact form submissions and respond to inquiries",
      icon: FileText,
      duration: "4 min",
      category: "Support",
      slug: "contact-messages",
      keywords: ["contact", "messages", "inquiries", "support", "respond", "triage"]
    },
    {
      id: "email-sending",
      title: "Sending Custom Emails",
      description: "Send targeted emails to users, roles, or specific groups with rich text formatting",
      icon: Mail,
      duration: "7 min",
      category: "Communication",
      slug: "email-sending",
      keywords: ["email", "send", "communication", "recipients", "custom", "messages"]
    },
    {
      id: "email-tracking",
      title: "Email Tracking & Logs",
      description: "Monitor email delivery, track success rates, and view detailed email logs",
      icon: BarChart3,
      duration: "5 min",
      category: "Communication",
      slug: "email-tracking",
      keywords: ["email", "tracking", "logs", "delivery", "success", "failure", "monitor"]
    },
    {
      id: "email-signatures",
      title: "Email Signatures",
      description: "Create and manage personalized email signatures with rich text and images",
      icon: PenSquare,
      duration: "4 min",
      category: "Communication",
      slug: "email-signatures",
      keywords: ["signatures", "email", "personalize", "branding", "contact information"]
    },
    {
      id: "file-requests",
      title: "File Requests Management",
      description: "Manage student file requests, update status, and handle file deliveries",
      icon: FileText,
      duration: "5 min",
      category: "Support",
      slug: "file-requests",
      keywords: ["file", "requests", "documents", "manage", "status", "deliver"]
    },
    {
      id: "teaching-requests",
      title: "Teaching Requests Management",
      description: "Handle teaching session requests, assign educators, and manage scheduling",
      icon: BookOpen,
      duration: "6 min",
      category: "Support",
      slug: "teaching-requests",
      keywords: ["teaching", "requests", "sessions", "assign", "schedule", "manage"]
    },
    {
      id: "cohorts",
      title: "Student Cohorts Management",
      description: "View and analyze student cohorts by university, year, and foundation year",
      icon: GraduationCap,
      duration: "6 min",
      category: "Analytics",
      slug: "cohorts",
      keywords: ["cohorts", "students", "university", "year", "foundation", "groups", "analytics"]
    },
    {
      id: "analytics",
      title: "Analytics & Reports",
      description: "Access event analytics, attendance reports, and platform insights",
      icon: BarChart3,
      duration: "6 min",
      category: "Analytics",
      slug: "analytics",
      keywords: ["analytics", "reports", "insights", "statistics", "data", "metrics"]
    }
  ];

  // Calculate tutorials - must be done before useMemo hooks
  const tutorials = isMedEdTeam ? mededTutorials : isStudent ? studentTutorials : [];
  const roleName = userRole === "admin" ? "Admin" : isMedEdTeam ? "MedEd Team" : isStudent ? "Student" : "Guest";

  // All hooks must be called before any early returns
  const filteredTutorials = useMemo(() => {
    if (!searchQuery.trim()) return tutorials;
    
    const query = searchQuery.toLowerCase();
    return tutorials.filter(tutorial => {
      const searchableText = [
        tutorial.title,
        tutorial.description,
        tutorial.category,
        ...(tutorial.keywords || [])
      ].join(" ").toLowerCase();
      
      return searchableText.includes(query);
    });
  }, [tutorials, searchQuery]);

  // Group tutorials by category
  const tutorialsByCategory = useMemo(() => {
    return filteredTutorials.reduce((acc, tutorial) => {
      if (!acc[tutorial.category]) {
        acc[tutorial.category] = [];
      }
      acc[tutorial.category].push(tutorial);
      return acc;
    }, {} as Record<string, typeof filteredTutorials>);
  }, [filteredTutorials]);

  // Early return after all hooks are called
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg">
            <Video className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading tutorials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Bleepy Tutorials
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-4">
              Step-by-step guides to master all platform features
            </p>
            {!session && (
              <div className="mt-6">
                <Link href="/auth/signin">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                    Sign In to View Tutorials
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
            {session && (
              <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mt-4">
                <CheckCircle className="h-4 w-4 mr-2" />
                Tutorials for {roleName}
              </div>
            )}
          </div>

          {!session ? (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Sign In Required</CardTitle>
                <CardDescription>
                  Please sign in to access role-specific tutorials and guides.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/signin">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                    Sign In
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Search Bar */}
              <div className="mb-8 max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search database for topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-6 text-lg border-2 border-gray-200 focus:border-purple-500 rounded-xl shadow-lg"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {searchQuery && (
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Found {filteredTutorials.length} tutorial{filteredTutorials.length !== 1 ? 's' : ''} matching "{searchQuery}"
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid sm:grid-cols-3 gap-4 mb-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100/50 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-purple-600 mb-3 mx-auto">
                    <Video className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{filteredTutorials.length}</div>
                  <div className="text-sm text-gray-600">
                    {searchQuery ? 'Matching Tutorials' : 'Available Tutorials'}
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100/50 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-purple-600 mb-3 mx-auto">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Math.ceil(filteredTutorials.reduce((sum, t) => {
                      const duration = parseInt(t.duration);
                      return sum + (isNaN(duration) ? 0 : duration);
                    }, 0))} min
                  </div>
                  <div className="text-sm text-gray-600">Total Content</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100/50 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-purple-600 mb-3 mx-auto">
                    <Target className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{Object.keys(tutorialsByCategory).length}</div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
              </div>

              {/* Tutorials by Category */}
              {Object.keys(tutorialsByCategory).length === 0 ? (
                <Card className="max-w-2xl mx-auto">
                  <CardContent className="p-12 text-center">
                    <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No tutorials found</h3>
                    <p className="text-gray-600 mb-4">
                      No tutorials match your search query "{searchQuery}". Try different keywords.
                    </p>
                    <Button onClick={() => setSearchQuery("")} variant="outline">
                      Clear Search
                    </Button>
                  </CardContent>
                </Card>
              ) : (
              <div className="space-y-12">
                {Object.entries(tutorialsByCategory).map(([category, categoryTutorials]) => (
                  <div key={category}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="w-1 h-8 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full mr-3"></span>
                      {category}
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryTutorials.map((tutorial) => {
                        const Icon = tutorial.icon;
                        return (
                          <Card key={tutorial.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <CardHeader>
                              <div className="flex items-start justify-between mb-2">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                                  <Icon className="h-6 w-6 text-purple-600" />
                                </div>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                  {tutorial.duration}
                                </span>
                              </div>
                              <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                              <CardDescription>{tutorial.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Link href={`/tutorials/${isMedEdTeam ? 'meded' : 'student'}/${tutorial.slug}`}>
                                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                                  <Play className="h-4 w-4 mr-2" />
                                  View Tutorial
                                </Button>
                              </Link>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* Quick Tips */}
              <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Lightbulb className="h-6 w-6 mr-2 text-yellow-600" />
                  Quick Tips
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Follow in Order</h3>
                      <p className="text-sm text-gray-600">
                        Start with basic tutorials and progress to advanced features for the best learning experience.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Practice as You Learn</h3>
                      <p className="text-sm text-gray-600">
                        Try out features in the platform while following along with the tutorials.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
