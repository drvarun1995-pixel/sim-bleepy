"use client";

import { Shield, Eye, Lock, FileText, Users, Calendar, Globe, Scale, Cookie, Mail } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Privacy Policy
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-blue-100 text-green-800 mb-6">
              <FileText className="h-4 w-4 mr-2" />
              Last Updated: October 2025
            </div>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use Bleepy.
            </p>
          </div>

          {/* Quick Overview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              {
                icon: <Users className="h-6 w-6" />,
                title: "Data We Collect",
                description: "Email, name, university, session data"
              },
              {
                icon: <Eye className="h-6 w-6" />,
                title: "How We Use It",
                description: "Provide services, improve platform"
              },
              {
                icon: <Lock className="h-6 w-6" />,
                title: "Data Security",
                description: "Encrypted, secure storage"
              },
              {
                icon: <Calendar className="h-6 w-6" />,
                title: "Data Retention",
                description: "2 years or until deletion"
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

          {/* Privacy Policy Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 text-left space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-purple-600" />
                1. Introduction
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Bleepy ("we," "our," or "us") is committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our clinical training platform.
                </p>
                <p>
                  This policy complies with the General Data Protection Regulation (GDPR) and other applicable privacy laws. By using our service, you consent to the data practices described in this policy.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Users className="h-6 w-6 mr-2 text-purple-600" />
                2. Information We Collect
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2.1 Personal Information</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Account Information:</strong> Email address, full name, university/institution, year of study</li>
                    <li><strong>Authentication Data:</strong> Encrypted password, authentication provider (email)</li>
                    <li><strong>Profile Data:</strong> Role (student/admin), university affiliation, academic year</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2.2 Usage Data</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Session Data:</strong> Training session recordings, performance metrics, scores</li>
                    <li><strong>Interaction Data:</strong> Station attempts, completion times, feedback responses</li>
                    <li><strong>Technical Data:</strong> IP address, browser type, device information, usage patterns</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2.3 Communication Data</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Support Communications:</strong> Emails, support tickets, feedback messages</li>
                    <li><strong>Marketing Communications:</strong> Newsletter subscriptions, promotional content preferences</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="h-6 w-6 mr-2 text-purple-600" />
                3. How We Use Your Information
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3.1 Service Provision</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Provide access to clinical training simulations</li>
                    <li>Authenticate users and manage accounts</li>
                    <li>Track progress and performance metrics</li>
                    <li>Generate personalized feedback and reports</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3.2 Platform Improvement</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Analyze usage patterns to improve user experience</li>
                    <li>Develop new features and training scenarios</li>
                    <li>Conduct research on educational effectiveness</li>
                    <li>Monitor system performance and security</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3.3 Communication</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Send account-related notifications and updates</li>
                    <li>Provide customer support and respond to inquiries</li>
                    <li>Send educational content and platform updates (with consent)</li>
                    <li>Notify users of important policy changes</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Legal Basis */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Scale className="h-6 w-6 mr-2 text-purple-600" />
                4. Legal Basis for Processing (GDPR)
              </h2>
              <div className="text-gray-700 space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Contract Performance</h3>
                  <p>We process your personal data to provide our clinical training services as outlined in our Terms of Service.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Legitimate Interest</h3>
                  <p>We process data to improve our platform, ensure security, and provide better educational outcomes.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Consent</h3>
                  <p>We obtain your explicit consent for marketing communications and optional data processing activities.</p>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Globe className="h-6 w-6 mr-2 text-purple-600" />
                5. Data Sharing and Disclosure
              </h2>
              <div className="text-gray-700 space-y-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">We Do NOT Sell Your Data</h3>
                  <p className="text-red-700">We do not sell, rent, or trade your personal information to third parties for marketing purposes.</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">5.1 Service Providers</h3>
                  <p>We may share data with trusted third-party service providers who assist us in operating our platform:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li><strong>Supabase:</strong> Database and authentication services</li>
                    <li><strong>Vercel:</strong> Website hosting and deployment</li>
                    <li><strong>Hume AI:</strong> Voice processing and emotion analysis</li>
                    <li><strong>OpenAI:</strong> AI-powered conversation features</li>
                    <li><strong>Microsoft Graph API:</strong> Email delivery services</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">5.2 Legal Requirements</h3>
                  <p>We may disclose your information if required by law or to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Comply with legal obligations or court orders</li>
                    <li>Protect our rights, property, or safety</li>
                    <li>Prevent fraud or security threats</li>
                    <li>Protect the rights and safety of our users</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-6 w-6 mr-2 text-purple-600" />
                6. Data Retention
              </h2>
              <div className="text-gray-700 space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Retention Periods</h3>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li><strong>Account Data:</strong> Retained until account deletion or 2 years of inactivity</li>
                    <li><strong>Session Data:</strong> Retained for 1 year for educational analysis</li>
                    <li><strong>Communication Data:</strong> Retained for 3 years for support purposes</li>
                    <li><strong>Technical Logs:</strong> Retained for 90 days for security monitoring</li>
                  </ul>
                </div>
                <p>
                  We will automatically delete your personal data at the end of the retention period, unless we have a legal obligation to retain it longer or you request earlier deletion.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="h-6 w-6 mr-2 text-purple-600" />
                7. Your Rights Under GDPR
              </h2>
              <div className="text-gray-700 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Right to Access</h3>
                    <p className="text-green-700 text-sm">Request a copy of all personal data we hold about you.</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Right to Rectification</h3>
                    <p className="text-green-700 text-sm">Correct inaccurate or incomplete personal data.</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Right to Erasure</h3>
                    <p className="text-green-700 text-sm">Request deletion of your personal data ("right to be forgotten").</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Right to Portability</h3>
                    <p className="text-green-700 text-sm">Receive your data in a structured, machine-readable format.</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Right to Restrict Processing</h3>
                    <p className="text-green-700 text-sm">Limit how we process your personal data.</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Right to Object</h3>
                    <p className="text-green-700 text-sm">Object to processing based on legitimate interests.</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">How to Exercise Your Rights</h3>
                  <p className="text-yellow-700 mb-2">To exercise any of these rights, please contact us at:</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700 ml-4">
                    <li>Email: support@bleepy.co.uk</li>
                    <li>Subject line: "GDPR Data Request"</li>
                    <li>Include your account email and specify which right you wish to exercise</li>
                  </ul>
                  <p className="text-yellow-700 mt-2 text-sm">We will respond within 30 days of receiving your request.</p>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="h-6 w-6 mr-2 text-purple-600" />
                8. Data Security
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>We implement appropriate technical and organizational measures to protect your personal data:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Encryption:</strong> Data encrypted in transit (HTTPS) and at rest</li>
                  <li><strong>Access Controls:</strong> Role-based access and authentication requirements</li>
                  <li><strong>Regular Updates:</strong> Security patches and system updates</li>
                  <li><strong>Monitoring:</strong> Continuous security monitoring and threat detection</li>
                  <li><strong>Staff Training:</strong> Regular privacy and security training for our team</li>
                </ul>
              </div>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Globe className="h-6 w-6 mr-2 text-purple-600" />
                9. International Data Transfers
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>Some of our service providers may be located outside the European Economic Area (EEA). When we transfer your data internationally, we ensure appropriate safeguards are in place:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Standard Contractual Clauses (SCCs) with data processors</li>
                  <li>Adequacy decisions by the European Commission</li>
                  <li>Certification schemes and codes of conduct</li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Cookie className="h-6 w-6 mr-2 text-purple-600" />
                10. Cookies and Tracking Technologies
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>We use cookies and similar technologies to enhance your experience. For detailed information about our cookie practices, please see our <Link href="/cookies" className="text-purple-600 hover:underline">Cookie Policy</Link>.</p>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Users className="h-6 w-6 mr-2 text-purple-600" />
                11. Children's Privacy
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>Our service is intended for university students and healthcare professionals. We do not knowingly collect personal information from children under 16. If you believe we have collected information from a child under 16, please contact us immediately.</p>
              </div>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-purple-600" />
                12. Changes to This Privacy Policy
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Posting the updated policy on our website</li>
                  <li>Sending an email notification to registered users</li>
                  <li>Displaying a notice on our platform</li>
                </ul>
                <p>Your continued use of our service after changes are posted constitutes acceptance of the updated policy.</p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="h-6 w-6 mr-2 text-purple-600" />
                13. Contact Information
              </h2>
              <div className="text-gray-700 space-y-4">
                <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-3">Data Protection Contact</h3>
                  <div className="space-y-2 text-purple-700">
                    <p><strong>Email:</strong> support@bleepy.co.uk</p>
                    <p><strong>Subject Line:</strong> Privacy Policy Inquiry</p>
                    <p><strong>Response Time:</strong> Within 30 days</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Supervisory Authority</h3>
                  <p className="text-gray-700">If you are not satisfied with our response to your privacy concerns, you have the right to lodge a complaint with your local data protection supervisory authority.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm">
              This Privacy Policy is effective as of October 2025 and was last updated on October 8, 2025.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}