"use client";

import { Shield, Eye, Lock, FileText, Users, Calendar, Globe, Scale, Cookie, Mail } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-blue-100 text-green-800 mb-6">
              <Shield className="h-4 w-4 mr-2" />
              Effective Date: 15 November 2025
            </div>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              This Privacy Policy explains how Bleepy collects, uses, and protects your personal information when you use our platform, website, or related services.
            </p>
          </div>

          {/* Privacy Policy Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 text-left space-y-8">
            
            {/* Overview */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Overview
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  This Privacy Policy explains how Bleepy ("we," "us," or "our") collects, uses, and protects your personal information when you use our platform, website, or related services.
                </p>
                <p>
                  This policy complies with the General Data Protection Regulation (GDPR), UK GDPR, and other applicable privacy laws. By using our service, you consent to the data practices described in this policy.
                </p>
              </div>
            </section>

            {/* Data Controller */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Data Controller and Contact
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Bleepy acts as the Data Controller for individual user data and as a Data Processor for data uploaded by organisations.
                </p>
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Contact Information</h3>
                  <div className="space-y-1 text-purple-700">
                    <p><strong>Email:</strong> <a href="mailto:support@bleepy.co.uk" className="hover:text-purple-900 underline">support@bleepy.co.uk</a></p>
                    <p><strong>Subject Line:</strong> Privacy Policy Inquiry</p>
                    <p className="text-sm mt-2">We aim to acknowledge all requests within 2 working days and provide full responses within one month, as required by data protection law.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Information We Collect
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3.1 Voluntarily Provided Information</h3>
                  <p>We collect data you provide directly, including:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Account registration details (name, email, profession, university/institution)</li>
                    <li>Event participation and attendance information</li>
                    <li>Educational or organisational affiliation</li>
                    <li>Profile data (role, academic year, profile picture, bio)</li>
                    <li>Event bookings, registrations, and attendance records</li>
                    <li>Portfolio files and documents for IMT portfolio</li>
                    <li>Feedback form responses, ratings, and comments</li>
                    <li>Quiz challenge participation and leaderboard data</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3.2 Automatically Collected Information</h3>
                  <p>We collect certain information automatically when you use Bleepy, such as:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Log and usage data (e.g., access times, pages viewed, device type)</li>
                    <li>Browser details and technical information</li>
                    <li>Performance and diagnostic data</li>
                    <li>Training session transcripts, performance metrics, and scores</li>
                    <li>Interaction data (station attempts, completion times, gamification progress)</li>
                    <li>QR code scan data and attendance verification</li>
                  </ul>
                  <p className="mt-2">
                    We collect this data through cookies and similar technologies. For details, see our <Link href="/cookies" className="text-purple-600 hover:underline">Cookie Policy</Link>.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3.3 Organisation Data</h3>
                  <p>Event organisers and institutions may upload or generate:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Participant lists, resources, and attendance records</li>
                    <li>Certificates or survey responses created within the system</li>
                  </ul>
                  <p className="mt-2">
                    For this data, the organisation is the Data Controller and Bleepy acts as the Data Processor.
                  </p>
                  <p className="mt-2">
                    If you are a participant, contact your organisation directly to exercise your data rights.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3.4 Prohibited Data</h3>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-red-800 font-medium mb-2">
                      Bleepy is not designed for clinical or patient data.
                    </p>
                    <p className="text-red-700 mb-2">You must not upload:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-700 ml-4">
                      <li>Patient-identifiable information</li>
                      <li>Clinical data or medical records</li>
                      <li>Any data subject to healthcare confidentiality</li>
                  </ul>
                    <p className="text-red-700 mt-2 text-sm">
                      If such data is uploaded in error, immediately contact <a href="mailto:support@bleepy.co.uk" className="underline">support@bleepy.co.uk</a> with subject "Urgent: Data Breach".
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. How We Use Personal Information
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>We use your information to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Provide and improve the Bleepy platform</li>
                  <li>Facilitate events, resources, and learning activities</li>
                  <li>Manage subscriptions and payments</li>
                  <li>Communicate important updates</li>
                  <li>Maintain platform security and integrity</li>
                  <li>Comply with legal obligations</li>
                    <li>Track progress, performance metrics, and gamification achievements</li>
                  <li>Generate personalized feedback, reports, and certificates</li>
                  <li>Process voice interactions in real-time for emotion recognition and training assessment</li>
                  </ul>
              </div>
            </section>

            {/* Legal Basis */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Legal Basis for Processing
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>We process your data under the following legal bases:</p>
                <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Contract</h3>
                    <p className="text-sm text-gray-700">To provide services you request (e.g., account access, subscriptions)</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Legitimate Interests</h3>
                    <p className="text-sm text-gray-700">For service improvement, analytics, and security</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Consent</h3>
                    <p className="text-sm text-gray-700">For marketing communications and optional features</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Legal Obligation</h3>
                    <p className="text-sm text-gray-700">To meet regulatory, tax, or accounting requirements</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Marketing Communications */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Marketing Communications
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We may send communications about Bleepy and relevant professional opportunities or products.
                </p>
                <p>
                  You can opt out at any time via email footer links or by contacting <a href="mailto:support@bleepy.co.uk" className="text-purple-600 hover:underline">support@bleepy.co.uk</a>.
                    </p>
                  </div>
            </section>

            {/* Data Portability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Data Portability
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  You may request a copy of your data by contacting <a href="mailto:support@bleepy.co.uk" className="text-purple-600 hover:underline">support@bleepy.co.uk</a>.
                </p>
                <p>
                  We will verify your identity and provide exports in commonly used, machine-readable formats (CSV or JSON) within 14 days of verification.
                </p>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Data Retention
              </h2>
              <div className="text-gray-700 space-y-3">
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Active accounts:</strong> Retained for as long as your account remains active.</li>
                  <li><strong>Deleted accounts:</strong> Profile, settings, and content deleted within 7 days.</li>
                  <li><strong>System and billing records:</strong> Retained for up to 7 years to comply with UK tax and accounting laws (HMRC requirements).</li>
                  <li><strong>Session data:</strong> Retained for 1 year for educational analysis.</li>
                  <li><strong>Event bookings:</strong> Retained for 2 years after event date for attendance records.</li>
                  <li><strong>Certificate data:</strong> Retained for 5 years for verification and compliance purposes.</li>
                  <li><strong>Chat transcripts (Hume EVI):</strong> Stored in our database for 1 year, then automatically deleted. Zero retention on Hume's platform.</li>
                  <li><strong>Organisation data:</strong> Retained up to 90 days after subscription cancellation for export or reactivation, unless deletion is requested earlier.</li>
                  </ul>
                </div>
            </section>

            {/* Data Storage and Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Data Storage and Transfers
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Data is primarily stored in the UK and EEA.
                </p>
                <p>
                  Some sub-processors may process data in other jurisdictions with adequate safeguards, such as Standard Contractual Clauses (SCCs).
                </p>
                <p>
                  For a complete list of our sub-processors and their data processing locations, see our <Link href="/sub-processors" className="text-purple-600 hover:underline">Sub-Processors</Link> page.
                </p>
              </div>
            </section>

            {/* Sub-Processors */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. Sub-Processors
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We use trusted third-party providers to operate our Services securely and reliably. These sub-processors process personal data on our behalf.
                </p>
                <p>
                  We only use sub-processors that meet security, privacy, and compliance standards consistent with UK GDPR and EU GDPR, operate under written data-processing terms, and provide appropriate technical and organisational safeguards.
                </p>
                <p>
                  A maintained list of sub-processors is available on our <Link href="/sub-processors" className="text-purple-600 hover:underline">Sub-Processors</Link> page.
                </p>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                11. Data Security and User Responsibilities
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>We implement appropriate technical and organisational measures to protect your data.</p>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Users are responsible for:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Maintaining secure passwords</li>
                    <li>Avoiding account sharing</li>
                    <li>Not uploading prohibited or sensitive data</li>
                    <li>Reporting unauthorised access via <a href="mailto:support@bleepy.co.uk" className="text-purple-600 hover:underline">support@bleepy.co.uk</a> ("Security Incident")</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Breach Notification */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                12. Data Breach Notification
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>If a data breach occurs that poses a risk to individuals, Bleepy will:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Notify the ICO within 72 hours (where legally required)</li>
                  <li>Notify affected users without undue delay</li>
                  <li>Provide details of the breach and mitigation steps</li>
                </ul>
              </div>
            </section>

            {/* Children and Minors */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                13. Children and Minors
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Bleepy is intended for users aged 16 and above.
                </p>
                <p>
                  We do not knowingly collect data from children under 13.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Age Verification</h3>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700 ml-4">
                    <li>We rely on users and organisations to provide accurate age information.</li>
                    <li>We do not use automated age verification.</li>
                  </ul>
                  <p className="text-yellow-700 mt-2">
                    Parents or guardians may contact <a href="mailto:support@bleepy.co.uk" className="underline">support@bleepy.co.uk</a> to remove a minor's data.
                  </p>
                </div>
              </div>
            </section>

            {/* International Users */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                14. International Users
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>We comply with:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>UK GDPR and Data Protection Act 2018</li>
                  <li>EU GDPR (where applicable)</li>
                  <li>California Consumer Privacy Act (CCPA) and CPRA</li>
                  <li>Canada's PIPEDA (where applicable)</li>
                  <li>Australia's Privacy Act 1988 (where applicable)</li>
                </ul>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                15. Your Rights
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Access your data</li>
                  <li>Request correction or deletion</li>
                  <li>Withdraw marketing consent</li>
                  <li>Request data portability</li>
                  <li>Object to processing</li>
                  <li>Restrict processing (e.g., pending verification of accuracy)</li>
                  <li>Lodge a complaint with the ICO or your supervisory authority</li>
                </ul>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">To Exercise These Rights</h3>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700 ml-4">
                    <li>Email <a href="mailto:support@bleepy.co.uk" className="hover:text-yellow-900 underline">support@bleepy.co.uk</a></li>
                    <li>Specify your request</li>
                    <li>We verify identity within 2 working days</li>
                    <li>We respond within 30 days (extendable for complex cases)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* California Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                16. California (CCPA/CPRA) Rights
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>California residents have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Access, correct, or delete personal information</li>
                  <li>Know categories of data collected, disclosed, or sold</li>
                  <li>Opt out of sale or sharing of personal data</li>
                  <li>Limit use of sensitive personal information</li>
                  <li>Be free from discrimination for exercising these rights</li>
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  We verify identity before processing such requests. We verify your identity by confirming your registered email address and account details. For security, we may request additional information to prevent fraudulent requests.
                  </p>
                </div>
            </section>

            {/* Automated Decision-Making */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                17. Automated Decision-Making and Profiling
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We do not use automated decision-making or profiling that produces legal or similarly significant effects.
                </p>
              </div>
            </section>

            {/* Business Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                18. Business Transfers
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  If Bleepy or its assets are acquired, data may be transferred under equivalent privacy obligations.
                </p>
                <p>
                  Users will be notified as required by law.
                </p>
              </div>
            </section>

            {/* Third-Party Links */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                19. Third-Party Links
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Our services may include links to external websites.
                </p>
                <p>
                  We are not responsible for their content or privacy practices.
                </p>
                <p>
                  Please review their privacy policies before sharing personal information.
                </p>
              </div>
            </section>

            {/* Updates to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                20. Updates to This Policy
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We may update this policy periodically.
                </p>
                <p>
                  Material changes will be notified via the platform or email.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                21. Contact Us
              </h2>
              <div className="text-gray-700 space-y-4">
                <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-3">Data Protection Contact</h3>
                  <div className="space-y-2 text-purple-700">
                      <p><strong>Email:</strong> <a href="mailto:support@bleepy.co.uk" className="hover:text-purple-900 underline">support@bleepy.co.uk</a></p>
                    <p className="text-sm mt-2">We aim to respond within 2 working days and resolve formal data requests within 1 month.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm">
              This Privacy Policy is effective as of 15 November 2025 and was last updated on 15 November 2025.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
