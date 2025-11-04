"use client";

import { FileText, Scale, Shield, Users, AlertTriangle, Clock, Globe, Mail, Calendar } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Terms of Service
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-blue-100 text-green-800 mb-6">
              <FileText className="h-4 w-4 mr-2" />
              Last Updated: January 2025
            </div>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              These terms govern your use of Bleepy. Please read them carefully before using our clinical training platform.
            </p>
          </div>

          {/* Quick Overview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              {
                icon: <Users className="h-6 w-6" />,
                title: "User Eligibility",
                description: "University students & healthcare professionals"
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Service Availability",
                description: "99.9% uptime commitment"
              },
              {
                icon: <Scale className="h-6 w-6" />,
                title: "Data Processing",
                description: "GDPR compliant data handling"
              },
              {
                icon: <AlertTriangle className="h-6 w-6" />,
                title: "Limitations",
                description: "Educational use only, not medical advice"
              }
            ].map((item, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100/50 text-center">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-purple-600 mb-3 mx-auto">
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Terms Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 text-left space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-purple-600" />
                1. Acceptance of Terms
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Welcome to Bleepy. These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and Bleepy ("we," "us," or "our") regarding your use of our clinical training platform.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-yellow-800 font-medium">
                    By accessing or using our service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our service.
                  </p>
                </div>
              </div>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Users className="h-6 w-6 mr-2 text-purple-600" />
                2. Service Description
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>
                  Bleepy is an AI-powered clinical training platform that provides:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Interactive clinical simulation scenarios with AI-powered patient interactions</li>
                  <li>Voice-based consultation training using Hume AI and OpenAI technologies</li>
                  <li>Event booking system for teaching sessions and educational events</li>
                  <li>QR code-based attendance tracking and verification</li>
                  <li>Digital certificate generation and management system</li>
                  <li>Feedback form creation, distribution, and analysis</li>
                  <li>Teaching calendar with event management and attendance tracking</li>
                  <li>Performance tracking, feedback systems, and gamification features</li>
                  <li>Educational resource downloads and file management</li>
                  <li>IMT portfolio system for document storage and management</li>
                  <li>Progress monitoring, analytics, achievements, and leaderboards</li>
                  <li>System-wide announcements and notifications</li>
                  <li>Newsletter subscriptions and event update emails</li>
                </ul>
                
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Important Medical Disclaimer</h3>
                  <p className="text-red-700">
                    Bleepy is for educational and training purposes only. It does not provide medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals for medical decisions.
                  </p>
                </div>
              </div>
            </section>

            {/* User Eligibility */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Users className="h-6 w-6 mr-2 text-purple-600" />
                3. User Eligibility and Registration
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3.1 Eligibility Requirements</h3>
                  <p>To use our service, you must:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Be at least 16 years of age</li>
                    <li>Be a current university student or healthcare professional</li>
                    <li>Have a valid email address from an approved institution</li>
                    <li>Provide accurate and complete registration information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3.2 Approved Email Domains</h3>
                  <p>We currently accept registrations from:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>University College London (@ucl.ac.uk)</li>
                    <li>Anglia Ruskin University (@aru.ac.uk, @student.aru.ac.uk)</li>
                    <li>NHS (@nhs.net)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3.3 Account Security</h3>
                  <p>You are responsible for:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized use</li>
                    <li>Using a strong, unique password</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Processing */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Scale className="h-6 w-6 mr-2 text-purple-600" />
                4. Data Processing and Privacy
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>
                  Your privacy is important to us. Our data processing practices are governed by our Privacy Policy, which is incorporated into these Terms by reference.
                </p>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">4.1 Data Collection and Use</h3>
                  <p>We collect and process personal data for the following purposes:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Providing and improving our clinical training services</li>
                    <li>Authenticating users and managing accounts</li>
                    <li>Tracking progress and performance metrics</li>
                    <li>Communicating important service updates</li>
                    <li>Ensuring platform security and preventing fraud</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">4.2 GDPR Compliance</h3>
                  <p>We process personal data in compliance with the General Data Protection Regulation (GDPR) and other applicable privacy laws. This includes:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Obtaining appropriate consent where required</li>
                    <li>Implementing data minimization principles</li>
                    <li>Providing data subject rights (access, rectification, erasure, portability)</li>
                    <li>Maintaining appropriate security measures</li>
                    <li>Limiting data retention periods</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Your Rights</h3>
                  <p className="text-green-700">
                    You have the right to access, correct, delete, or port your personal data. For more information, 
please see our Privacy Policy or contact us at <a href="mailto:support@bleepy.co.uk" className="hover:text-green-900 underline">support@bleepy.co.uk</a>.
                  </p>
                </div>
              </div>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="h-6 w-6 mr-2 text-purple-600" />
                5. Acceptable Use Policy
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">5.1 Permitted Uses</h3>
                  <p>You may use our service for:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Educational and training purposes, including clinical simulations</li>
                    <li>Personal skill development and portfolio management</li>
                    <li>Registering for and attending teaching events and educational sessions</li>
                    <li>Accessing educational resources and downloading permitted materials</li>
                    <li>Participating in gamification features, achievements, and leaderboards</li>
                    <li>Academic research (with proper authorization)</li>
                    <li>Professional development and IMT portfolio activities</li>
                    <li>Using QR codes for attendance tracking and verification</li>
                    <li>Generating and downloading digital certificates for completed training</li>
                    <li>Completing feedback forms and providing educational feedback</li>
                    <li>Using Hume EVI stations for voice-based training (with consent to audio recording)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">5.2 Prohibited Uses</h3>
                  <p>You agree not to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Use the service for any unlawful purpose or in violation of applicable laws</li>
                    <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                    <li>Interfere with or disrupt the service, servers, or event bookings</li>
                    <li>Use automated tools to access the service or bulk-book events (except as expressly permitted)</li>
                    <li>Share your account credentials with others or create multiple accounts</li>
                    <li>Upload malicious files, inappropriate content, or copyrighted materials without permission</li>
                    <li>Use the service to provide medical advice, diagnosis, or treatment</li>
                    <li>Manipulate gamification systems, leaderboards, or achievement metrics</li>
                    <li>Make fraudulent event bookings or repeatedly cancel confirmed bookings</li>
                    <li>Violate any intellectual property rights</li>
                    <li>Engage in any form of harassment or inappropriate behavior</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Consequences of Violations</h3>
                  <p className="text-red-700">
                    Violations of this Acceptable Use Policy may result in immediate suspension or termination of your account and access to our service.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">5.3 Audio Recording and Hume EVI Stations</h3>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-3">
                    <p className="text-yellow-800 font-medium mb-2">
                      <strong>Important Notice:</strong> When using Hume EVI stations, your voice will be recorded for emotion analysis and training assessment.
                    </p>
                  </div>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Consent:</strong> By using Hume EVI stations, you consent to voice recording for educational assessment purposes</li>
                    <li><strong>Purpose:</strong> Audio recordings are used to analyze emotional responses during clinical training scenarios</li>
                    <li><strong>Processing:</strong> Voice data is processed by Hume AI for emotion recognition and training feedback</li>
                    <li><strong>Retention:</strong> Audio recordings are temporarily stored and automatically deleted after analysis (typically within 24-48 hours)</li>
                    <li><strong>Data Sharing:</strong> Audio data may be shared with Hume AI (our third-party emotion analysis provider) for processing</li>
                    <li><strong>Opt-out:</strong> You can choose not to use Hume EVI stations if you prefer not to have your voice recorded</li>
                    <li><strong>Privacy:</strong> Audio data is handled in accordance with our Privacy Policy and applicable data protection laws</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="h-6 w-6 mr-2 text-purple-600" />
                6. Service Availability and Limitations
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">6.1 Service Availability</h3>
                  <p>
                    We strive to maintain high service availability but cannot guarantee uninterrupted access. The service may be temporarily unavailable due to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Scheduled maintenance and updates</li>
                    <li>Technical difficulties or system failures</li>
                    <li>Third-party service disruptions</li>
                    <li>Force majeure events</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">6.2 Usage Limits</h3>
                  <p>To ensure fair access for all users, we implement the following limits:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Students: 3 AI training sessions per day (resets at midnight UTC)</li>
                    <li>Administrators: Unlimited AI training session access</li>
                    <li>Session duration: 8 minutes per clinical scenario</li>
                    <li>Event bookings: One booking per user per event</li>
                    <li>Profile picture: Maximum 3MB file size</li>
                    <li>Portfolio files: Subject to reasonable storage limits per account</li>
                    <li>Concurrent users: Subject to system capacity</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">6.3 Third-Party Dependencies</h3>
                  <p>
                    Our service depends on third-party technologies including Hume AI, OpenAI, and cloud infrastructure providers. 
                    Service availability may be affected by these dependencies.
                  </p>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-purple-600" />
                7. Intellectual Property Rights
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">7.1 Our Intellectual Property</h3>
                  <p>
                    Bleepy and all related content, including but not limited to software, algorithms, 
                    training scenarios, user interface, and documentation, are protected by intellectual property laws.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">7.2 License to Use</h3>
                  <p>
                    We grant you a limited, non-exclusive, non-transferable license to use our service for 
                    educational and training purposes in accordance with these Terms.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">7.3 User-Generated Content</h3>
                  <p>
                    You retain ownership of any content you create using our service. By using our service, 
                    you grant us a license to use such content for the purpose of providing and improving our services.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">7.4 Third-Party Content</h3>
                  <p>
                    Our service may include content from third parties. Such content is protected by 
                    applicable intellectual property laws and is used under appropriate licenses.
                  </p>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-6 w-6 mr-2 text-purple-600" />
                8. Limitation of Liability and Disclaimers
              </h2>
              <div className="text-gray-700 space-y-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Medical Disclaimer</h3>
                  <p className="text-red-700">
                    BLEEPY IS FOR EDUCATIONAL PURPOSES ONLY. IT DOES NOT PROVIDE MEDICAL ADVICE, 
                    DIAGNOSIS, OR TREATMENT. ALWAYS CONSULT QUALIFIED HEALTHCARE PROFESSIONALS FOR MEDICAL DECISIONS.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">8.1 Service Disclaimers</h3>
                  <p>Our service is provided "as is" and "as available" without warranties of any kind, including:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Warranties of merchantability or fitness for a particular purpose</li>
                    <li>Warranties regarding accuracy, reliability, or completeness</li>
                    <li>Warranties that the service will be uninterrupted or error-free</li>
                    <li>Warranties regarding the security of data transmission</li>
                  </ul>
                </div>

              <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">8.2 Limitation of Liability</h3>
                  <p>
                    To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, 
                    special, consequential, or punitive damages, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Loss of profits, data, or business opportunities</li>
                    <li>Service interruptions or downtime</li>
                    <li>Third-party actions or content</li>
                    <li>Unauthorized access to or alteration of your data</li>
                  </ul>
              </div>

              <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">8.3 Maximum Liability</h3>
                  <p>
                    Our total liability to you for any claims arising from or related to these Terms or 
                    the service shall not exceed the amount you paid us for the service in the 12 months 
                    preceding the claim, or £100, whichever is greater.
                  </p>
                </div>
              </div>
            </section>

            {/* Event Bookings and Cancellations */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-6 w-6 mr-2 text-purple-600" />
                7. Event Bookings and Cancellations
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">7.1 Event Registration</h3>
                  <p>When booking an event through our platform:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>You must provide accurate information and confirm your attendance</li>
                    <li>Bookings may be subject to capacity limits and waitlist management</li>
                    <li>Some events may require manual approval by organizers</li>
                    <li>You will receive email confirmations for bookings, cancellations, and waitlist updates</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">7.2 Cancellation Policy</h3>
                  <p>Our event cancellation policy includes:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>You may cancel your booking in accordance with the event's specific cancellation deadline</li>
                    <li>Late cancellations or no-shows may affect your future booking privileges</li>
                    <li>Repeated cancellations without valid reasons may result in booking restrictions</li>
                    <li>For detailed information, please see our <Link href="/cancellation-policy" className="text-purple-600 hover:underline">Cancellation Policy</Link></li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">7.3 Attendance and Check-in</h3>
                  <p>For events you've registered for:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>You are expected to attend events you've confirmed</li>
                    <li>Event organizers may track attendance through check-in systems</li>
                    <li>Attendance records may be used for educational assessment and reporting</li>
                    <li>No-shows may be noted in your event history</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* File Storage and Portfolio */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-purple-600" />
                8. File Storage and Portfolio Management
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">8.1 Permitted File Usage</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You may upload files for your IMT portfolio and personal educational use</li>
                    <li>Uploaded files must comply with our content guidelines and applicable laws</li>
                    <li>File size and type restrictions apply (as specified in the upload interface)</li>
                    <li>You are responsible for maintaining backups of important files</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">8.2 File Retention and Deletion</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Files are retained until you delete them or your account is terminated</li>
                    <li>We reserve the right to remove files that violate our policies</li>
                    <li>Profile pictures and portfolio files are stored in secure cloud storage</li>
                    <li>You may delete your files at any time through your account settings</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Storage Limits</h3>
                  <p className="text-yellow-700">
                    While we don't currently enforce strict storage limits, we reserve the right to implement 
                    reasonable storage quotas in the future with advance notice.
                  </p>
                </div>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-6 w-6 mr-2 text-purple-600" />
                9. Termination
              </h2>
              <div className="text-gray-700 space-y-4">
              <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">9.1 Termination by You</h3>
                  <p>
                    You may terminate your account at any time by contacting us at <a href="mailto:support@bleepy.co.uk" className="text-purple-600 hover:text-purple-800 underline">support@bleepy.co.uk</a> 
                    or using the account deletion feature in your profile settings.
                  </p>
              </div>

              <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">9.2 Termination by Us</h3>
                  <p>We may suspend or terminate your account if:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>You violate these Terms or our Acceptable Use Policy</li>
                    <li>You provide false or misleading information</li>
                    <li>Your account remains inactive for an extended period</li>
                    <li>We are required to do so by law or regulation</li>
                    <li>We discontinue the service</li>
                  </ul>
              </div>

              <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">9.3 Effect of Termination</h3>
                  <p>
                    Upon termination, your right to use the service ceases immediately. We may delete 
                    your account data in accordance with our Privacy Policy and data retention practices.
                  </p>
              </div>
            </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Globe className="h-6 w-6 mr-2 text-purple-600" />
                10. Governing Law and Dispute Resolution
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">10.1 Governing Law</h3>
                  <p>
                    These Terms are governed by and construed in accordance with the laws of England and Wales, 
                    without regard to conflict of law principles.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">10.2 Dispute Resolution</h3>
                  <p>
                    Any disputes arising from these Terms or your use of our service shall be resolved through 
                    binding arbitration or in the courts of England and Wales.
                  </p>
          </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">10.3 Class Action Waiver</h3>
                  <p>
                    You agree to resolve disputes on an individual basis and waive any right to participate 
                    in class action lawsuits or class-wide arbitration.
                  </p>
                </div>
              </div>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-purple-600" />
                11. Changes to Terms
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We may update these Terms from time to time to reflect changes in our service, 
                  legal requirements, or business practices. We will notify you of material changes by:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Posting the updated Terms on our website</li>
                  <li>Sending an email notification to registered users</li>
                  <li>Displaying a notice on our platform</li>
                </ul>
                <p>
                  Your continued use of our service after changes are posted constitutes acceptance 
                  of the updated Terms.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="h-6 w-6 mr-2 text-purple-600" />
                12. Contact Information
            </h2>
              <div className="text-gray-700 space-y-4">
                                 <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                   <h3 className="font-semibold text-purple-800 mb-3">Legal and Support Contact</h3>
                   <div className="space-y-2 text-purple-700">
                     <p><strong>Email:</strong> <a href="mailto:support@bleepy.co.uk" className="hover:text-purple-900 underline">support@bleepy.co.uk</a></p>
                     <p><strong>Subject Line:</strong> Terms of Service Inquiry</p>
                     <p><strong>Response Time:</strong> Within 5 business days</p>
                   </div>
                  </div>
                
                <p>
                  For questions about these Terms, technical support, or account-related issues, 
                  please contact us using the information above.
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm">
              These Terms of Service are effective as of January 2025 and were last updated on January 27, 2025.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
