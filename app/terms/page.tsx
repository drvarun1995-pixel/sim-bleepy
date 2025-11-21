"use client";

import { FileText, Scale, Shield, Users, AlertTriangle, Clock, Globe, Mail, Calendar } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl lg:max-w-[70%] mx-auto">
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
              Effective Date: 15 November 2025
            </div>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              These terms govern your use of Bleepy. Please read them carefully before using our clinical training platform.
            </p>
          </div>

          {/* Terms Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 text-left space-y-8">
            
            {/* About Us */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. About Us
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  This website and platform are operated by Bleepy.
                </p>
                <p>
                  References to "Bleepy," "we," "our," or "us" mean Bleepy.
                </p>
                <p>
                  To contact us, email <a href="mailto:support@bleepy.co.uk" className="text-purple-600 hover:underline">support@bleepy.co.uk</a>.
                  </p>
                </div>
            </section>

            {/* Acceptance of Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Acceptance of These Terms
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  By creating an account or using the Bleepy platform, website, or related services, you agree to these Terms of Service and to comply with all applicable laws and regulations.
                </p>
                <p>
                  If you do not agree, you must not use Bleepy.
                </p>
                <p>
                  These Terms incorporate our <Link href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>, <Link href="/acceptable-use" className="text-purple-600 hover:underline">Acceptable Use Policy</Link>, and <Link href="/cookies" className="text-purple-600 hover:underline">Cookie Policy</Link> (together, the Policies).
                </p>
                <p>
                  We may update these Terms occasionally. Material updates will be announced through the platform or by email with at least 7 days' notice, and your continued use after the effective date constitutes acceptance.
                </p>
              </div>
            </section>

            {/* Eligibility and Minors */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Eligibility and Minors
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Bleepy is intended for users aged 16 and over.
                </p>
                <p>
                  Organisations that invite or manage participants under 16 are solely responsible for obtaining lawful parental or guardian consent and complying with all child data laws.
                </p>
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-red-800 font-medium">
                    Bleepy strictly prohibits any data relating to children under 13. If such data is discovered, we may delete it without notice.
                  </p>
                </div>
                <p>
                  Bleepy bears no responsibility for safeguarding or consent management for minors—these remain the full responsibility of the organiser.
                </p>
              </div>
            </section>

            {/* Accounts and Access */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Accounts and Access
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>
                  Each Bleepy user account is unique to an individual and may not be shared or transferred.
                </p>
                <p>
                  We use technical measures to prevent account sharing or circumvention of restrictions.
                </p>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">4.1 Account Security</h3>
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

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Service Description
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>
                  Bleepy is an AI-powered clinical training platform that provides:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Interactive clinical simulation scenarios</li>
                  <li>Event booking and management system</li>
                  <li>QR code-based attendance tracking</li>
                  <li>Digital certificate generation</li>
                  <li>Feedback form creation and analysis</li>
                  <li>Performance tracking and gamification</li>
                  <li>Educational resource management</li>
                  <li>IMT portfolio system</li>
                  <li>Push notifications for events, bookings, certificates, and feedback</li>
                  </ul>
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Important Medical Disclaimer</h3>
                  <p className="text-red-700">
                    Bleepy is for educational and training purposes only. It does not provide medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals for medical decisions.
                  </p>
                </div>
              </div>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Acceptable Use
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Your use of Bleepy must comply with our <Link href="/acceptable-use" className="text-purple-600 hover:underline">Acceptable Use Policy</Link>.
                </p>
                <p>
                  Violations of the Acceptable Use Policy may result in immediate suspension or termination of your account.
                  </p>
                </div>
            </section>

            {/* Data Processing and Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Data Processing and Privacy
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Your privacy is important to us. Our data processing practices are governed by our <Link href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.
                </p>
                <p>
                  We process personal data in compliance with the General Data Protection Regulation (GDPR) and other applicable privacy laws.
                </p>
              </div>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Service Availability and Limitations
              </h2>
              <div className="text-gray-700 space-y-4">
                  <p>
                    We strive to maintain high service availability but cannot guarantee uninterrupted access. The service may be temporarily unavailable due to:
                  </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Scheduled maintenance and updates</li>
                    <li>Technical difficulties or system failures</li>
                    <li>Third-party service disruptions</li>
                    <li>Force majeure events</li>
                  </ul>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">8.1 Usage Limits</h3>
                  <p>To ensure fair access for all users, we implement the following limits:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Students: 3 AI training sessions per day (resets at midnight UTC)</li>
                    <li>Administrators: Unlimited AI training session access</li>
                    <li>Session duration: 8 minutes per clinical scenario</li>
                    <li>Event bookings: One booking per user per event</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Intellectual Property Rights
              </h2>
              <div className="text-gray-700 space-y-3">
                  <p>
                  Bleepy and all related content, including but not limited to software, algorithms, training scenarios, user interface, and documentation, are protected by intellectual property laws.
                  </p>
                  <p>
                  We grant you a limited, non-exclusive, non-transferable license to use our service for educational and training purposes in accordance with these Terms.
                  </p>
                  <p>
                  You retain ownership of any content you create using our service. By using our service, you grant us a license to use such content for the purpose of providing and improving our services.
                  </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. Limitation of Liability and Disclaimers
              </h2>
              <div className="text-gray-700 space-y-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Medical Disclaimer</h3>
                  <p className="text-red-700">
                    BLEEPY IS FOR EDUCATIONAL PURPOSES ONLY. IT DOES NOT PROVIDE MEDICAL ADVICE, DIAGNOSIS, OR TREATMENT. ALWAYS CONSULT QUALIFIED HEALTHCARE PROFESSIONALS FOR MEDICAL DECISIONS.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">10.1 Service Disclaimers</h3>
                  <p>Our service is provided "as is" and "as available" without warranties of any kind.</p>
                </div>
              <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">10.2 Limitation of Liability</h3>
                  <p>
                    To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">10.3 Maximum Liability</h3>
                  <p>
                    Our total liability to you for any claims arising from or related to these Terms or the service shall not exceed the amount you paid us for the service in the 12 months preceding the claim, or £100, whichever is greater.
                  </p>
                </div>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                11. Termination
              </h2>
              <div className="text-gray-700 space-y-4">
              <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">11.1 Termination by You</h3>
                  <p>
                    You may terminate your account at any time by contacting us at <a href="mailto:support@bleepy.co.uk" className="text-purple-600 hover:underline">support@bleepy.co.uk</a> or using the account deletion feature in your profile settings.
                  </p>
              </div>
              <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">11.2 Termination by Us</h3>
                  <p>We may suspend or terminate your account if:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>You violate these Terms or our Acceptable Use Policy</li>
                    <li>You provide false or misleading information</li>
                    <li>Your account remains inactive for an extended period</li>
                    <li>We are required to do so by law or regulation</li>
                  </ul>
              </div>
              <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">11.3 Effect of Termination</h3>
                  <p>
                    Upon termination, your right to use the service ceases immediately. We may delete your account data in accordance with our Privacy Policy and data retention practices.
                  </p>
              </div>
            </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                12. Governing Law
              </h2>
              <div className="text-gray-700 space-y-3">
                  <p>
                  These Terms are governed by and construed under the laws of England and Wales.
                  </p>
                <p>
                  You agree to submit to the exclusive jurisdiction of the courts of England and Wales.
                  </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                13. Changes to Terms
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We may update these Terms from time to time to reflect changes in our service, legal requirements, or business practices.
                </p>
                <p>
                  Material changes will be notified via the platform or email with at least 7 days' notice.
                </p>
                <p>
                  Your continued use of our service after changes are posted constitutes acceptance of the updated Terms.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                14. Contact
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
                  For questions about these Terms, technical support, or account-related issues, please contact us using the information above.
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm">
              These Terms of Service are effective as of 15 November 2025 and were last updated on 15 November 2025.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
