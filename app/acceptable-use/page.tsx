"use client";

import { Shield, AlertTriangle, FileText, Users, Ban, Mail } from "lucide-react";
import Link from "next/link";

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl lg:max-w-[70%] mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Acceptable Use Policy
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-blue-100 text-green-800 mb-6">
              <Shield className="h-4 w-4 mr-2" />
              Effective Date: 15 November 2025
            </div>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              This policy defines acceptable and prohibited uses of the Bleepy platform to ensure a safe and respectful environment for all users.
            </p>
          </div>

          {/* Policy Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 text-left space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Overview
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  This Acceptable Use Policy ("Policy") governs your use of the Bleepy platform, website, and related services. By using Bleepy, you agree to comply with this Policy.
                </p>
                <p>
                  This Policy is incorporated into our <Link href="/terms" className="text-purple-600 hover:underline">Terms of Service</Link> by reference.
                </p>
                <p>
                  We may update this Policy from time to time. Material changes will be notified via the platform or email.
                </p>
              </div>
            </section>

            {/* Permitted Uses */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Permitted Uses
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>You may use Bleepy for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
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
                  <li>Using voice-based training features (with consent to audio processing)</li>
                  <li>Hosting quiz challenges using provided features and controls</li>
                </ul>
              </div>
            </section>

            {/* Prohibited Uses */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Prohibited Uses
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Use the service for any unlawful purpose or in violation of applicable laws</li>
                  <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                  <li>Interfere with or disrupt the service, servers, or event bookings</li>
                  <li>Use automated tools to access the service or bulk-book events (except as expressly permitted)</li>
                  <li>Share your account credentials with others or create multiple accounts</li>
                  <li>Upload malicious files, inappropriate content, or copyrighted materials without permission</li>
                  <li>Use the service to provide medical advice, diagnosis, or treatment</li>
                  <li>Manipulate gamification systems, leaderboards, or achievement metrics</li>
                  <li>Upload or stream unlicensed audio or interfere with audio controls</li>
                  <li>Make fraudulent event bookings or repeatedly cancel confirmed bookings</li>
                  <li>Violate any intellectual property rights</li>
                  <li>Engage in any form of harassment, bullying, or inappropriate behavior</li>
                  <li>Upload patient-identifiable information, clinical data, or medical records</li>
                  <li>Impersonate any person or entity or falsely state or misrepresent your affiliation with any person or entity</li>
                  <li>Collect or store personal data about other users without their explicit consent</li>
                  <li>Use the service to transmit spam, chain letters, or other unsolicited communications</li>
                </ul>
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Prohibited Data</h3>
                  <p className="text-red-700">
                    Bleepy is not designed for clinical or patient data. You must not upload patient-identifiable information, clinical data, or medical records. If such data is uploaded in error, immediately contact <a href="mailto:support@bleepy.co.uk" className="underline">support@bleepy.co.uk</a> with subject "Urgent: Data Breach".
                  </p>
                </div>
              </div>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. User Responsibilities
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>You are responsible for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Maintaining the security and confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Ensuring that any content you upload complies with applicable laws and this Policy</li>
                  <li>Obtaining necessary permissions before uploading copyrighted or third-party content</li>
                  <li>Reporting any security incidents or unauthorized access to <a href="mailto:support@bleepy.co.uk" className="text-purple-600 hover:underline">support@bleepy.co.uk</a></li>
                  <li>Using the service in a manner that does not infringe upon the rights of others</li>
                </ul>
              </div>
            </section>

            {/* Content Standards */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Content Standards
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>All content you upload or submit must:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Be accurate and truthful</li>
                  <li>Comply with applicable laws and regulations</li>
                  <li>Respect intellectual property rights</li>
                  <li>Not contain offensive, discriminatory, or harmful material</li>
                  <li>Not violate any third-party rights</li>
                  <li>Be appropriate for an educational and professional environment</li>
                </ul>
                <p>
                  We reserve the right to remove any content that violates this Policy without prior notice.
                </p>
              </div>
            </section>

            {/* Consequences of Violations */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Consequences of Violations
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Violations of this Acceptable Use Policy may result in:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Immediate suspension or termination of your account</li>
                  <li>Removal of content that violates this Policy</li>
                  <li>Legal action, where appropriate</li>
                  <li>Reporting to relevant authorities in cases of illegal activity</li>
                </ul>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-yellow-800">
                    <strong>Warning:</strong> We take violations of this Policy seriously. Repeated violations or serious breaches may result in permanent account termination.
                  </p>
                </div>
              </div>
            </section>

            {/* Reporting Violations */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Reporting Violations
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  If you become aware of any violation of this Policy, please report it to us immediately.
                </p>
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">How to Report</h3>
                  <div className="space-y-2 text-purple-700">
                    <p><strong>Email:</strong> <a href="mailto:support@bleepy.co.uk" className="hover:text-purple-900 underline">support@bleepy.co.uk</a></p>
                    <p><strong>Subject Line:</strong> Acceptable Use Policy Violation</p>
                    <p><strong>Include:</strong> Description of the violation, relevant account information, and any supporting evidence</p>
                  </div>
                </div>
                <p>
                  We will investigate all reports promptly and take appropriate action.
                </p>
              </div>
            </section>

            {/* Updates to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Updates to This Policy
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We may update this Acceptable Use Policy from time to time to reflect changes in our service, legal requirements, or business practices.
                </p>
                <p>
                  Material changes will be notified via the platform or email with at least 7 days' notice.
                </p>
                <p>
                  Your continued use of our service after changes are posted constitutes acceptance of the updated Policy.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Contact Information
              </h2>
              <div className="text-gray-700 space-y-4">
                <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-3">Questions About This Policy?</h3>
                  <div className="space-y-2 text-purple-700">
                    <p><strong>Email:</strong> <a href="mailto:support@bleepy.co.uk" className="hover:text-purple-900 underline">support@bleepy.co.uk</a></p>
                    <p><strong>Subject Line:</strong> Acceptable Use Policy Inquiry</p>
                    <p><strong>Response Time:</strong> Within 5 business days</p>
                  </div>
                </div>
                <p>
                  For questions about this Policy or to report violations, please contact us using the information above.
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm">
              This Acceptable Use Policy is effective as of 15 November 2025 and was last updated on 15 November 2025.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

