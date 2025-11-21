"use client";

import { Cookie, Settings, Eye, Shield, Clock, Globe, Mail } from "lucide-react";
import Link from "next/link";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl lg:max-w-[70%] mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Cookie className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Cookie Policy
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-blue-100 text-green-800 mb-6">
              <Cookie className="h-4 w-4 mr-2" />
              Effective Date: 15 November 2025
            </div>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Learn about how we use cookies and similar technologies to enhance your experience on Bleepy.
            </p>
          </div>

          {/* Cookie Policy Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 text-left space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. What Are Cookies?
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our platform.
                </p>
                <p>
                  We also use similar technologies such as web beacons, pixel tags, and local storage to collect and store information about your interactions with our service.
                </p>
              </div>
            </section>

            {/* How We Use Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. How We Use Cookies
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>We use cookies and similar technologies for the following purposes:</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Shield className="h-5 w-5 text-green-600 mr-2" />
                      <h3 className="font-semibold text-green-800">Essential Cookies</h3>
                    </div>
                    <p className="text-green-700 text-sm mb-2">
                      Required for basic website functionality and security. These cookies cannot be disabled.
                    </p>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• User authentication and login</li>
                      <li>• Session management</li>
                      <li>• Security and fraud prevention</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Settings className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-blue-800">Functional Cookies</h3>
                    </div>
                    <p className="text-blue-700 text-sm mb-2">
                      Remember your preferences and settings to enhance your experience.
                    </p>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Theme preferences</li>
                      <li>• Cookie consent preferences</li>
                      <li>• User preference settings</li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Eye className="h-5 w-5 text-purple-600 mr-2" />
                      <h3 className="font-semibold text-purple-800">Analytics Cookies</h3>
                    </div>
                    <p className="text-purple-700 text-sm mb-2">
                      Help us understand how visitors interact with our platform.
                    </p>
                    <ul className="text-purple-700 text-sm space-y-1">
                      <li>• Usage statistics and patterns</li>
                      <li>• Performance monitoring</li>
                      <li>• Error tracking and debugging</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                      <h3 className="font-semibold text-yellow-800">Session Management</h3>
                    </div>
                    <p className="text-yellow-700 text-sm mb-2">
                      Track your session and maintain state during your visit.
                    </p>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      <li>• Training session tracking</li>
                      <li>• Progress saving</li>
                      <li>• State persistence</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Types of Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Types of Cookies We Use
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3.1 Essential Cookies</h3>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-3">
                    <p className="text-green-700 mb-2">
                      <strong>These cookies are essential and cannot be disabled.</strong> They enable core functionality such as security, network management, and accessibility.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Cookie Name</th>
                          <th className="px-4 py-2 text-left font-semibold">Purpose</th>
                          <th className="px-4 py-2 text-left font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">next-auth.session-token</td>
                          <td className="px-4 py-2">User authentication and session management</td>
                          <td className="px-4 py-2">Session (30 days)</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">next-auth.csrf-token</td>
                          <td className="px-4 py-2">Security - prevents cross-site request forgery</td>
                          <td className="px-4 py-2">Session</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3.2 Functional Cookies</h3>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-3">
                    <p className="text-blue-700 mb-2">
                      These cookies enable enhanced functionality and personalization, such as remembering your preferences.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Cookie Name</th>
                          <th className="px-4 py-2 text-left font-semibold">Purpose</th>
                          <th className="px-4 py-2 text-left font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">theme</td>
                          <td className="px-4 py-2">Remembers your theme preference (light/dark mode)</td>
                          <td className="px-4 py-2">1 year</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">cookie-consent</td>
                          <td className="px-4 py-2">Stores your cookie consent preferences</td>
                          <td className="px-4 py-2">1 year</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">user-preferences</td>
                          <td className="px-4 py-2">Stores various user preference settings</td>
                          <td className="px-4 py-2">1 year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3.2.1 Push Notification Data</h3>
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-3">
                    <p className="text-purple-700 mb-2">
                      <strong>Note:</strong> Push notifications use browser service workers and subscription data stored in our database, not cookies. However, we include this information here for transparency.
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Stored Data:</strong> When you enable push notifications, we store:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                      <li>Push subscription endpoint (unique URL for your browser)</li>
                      <li>Encryption keys (p256dh and auth) for secure message delivery</li>
                      <li>Your notification preferences (events, bookings, certificates, feedback, announcements)</li>
                    </ul>
                    <p className="text-sm text-gray-700 mt-3">
                      This data is stored in our secure database and is only used to deliver push notifications you've requested. You can delete this data at any time by disabling push notifications in your profile settings.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3.3 Analytics Cookies</h3>
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-3">
                    <p className="text-purple-700 mb-2">
                      These cookies help us understand how visitors interact with our platform by collecting anonymous information.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Cookie Name</th>
                          <th className="px-4 py-2 text-left font-semibold">Purpose</th>
                          <th className="px-4 py-2 text-left font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">_ga</td>
                          <td className="px-4 py-2">Google Analytics - distinguishes users</td>
                          <td className="px-4 py-2">2 years</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">_ga_*</td>
                          <td className="px-4 py-2">Google Analytics - maintains session state</td>
                          <td className="px-4 py-2">2 years</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">_gid</td>
                          <td className="px-4 py-2">Google Analytics - distinguishes users</td>
                          <td className="px-4 py-2">24 hours</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Third-Party Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Third-Party Cookies
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>
                  We use third-party services that may set their own cookies. We do not control these cookies, and you should check the relevant third party's website for more information.
                </p>
                <p>
                  For a complete list of our third-party service providers, see our <Link href="/sub-processors" className="text-purple-600 hover:underline">Sub-Processors</Link> page.
                    </p>
              </div>
            </section>

            {/* Managing Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. How to Manage Cookies
              </h2>
              <div className="text-gray-700 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Browser Settings</h3>
                  <p className="text-yellow-700 mb-3">
                    Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies or delete certain cookies. However, please note that if you block or delete essential cookies, some features of our platform may not function properly.
                  </p>
                </div>
                <p>
                  You can manage your cookie preferences using our cookie consent banner, which appears when you first visit our website.
                    </p>
              </div>
            </section>

            {/* Updates to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Changes to This Cookie Policy
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
                </p>
                <p>
                  Material changes will be notified via the platform or email.
                </p>
                <p>
                  We encourage you to periodically review this Cookie Policy to stay informed about our use of cookies.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Contact Information
              </h2>
              <div className="text-gray-700 space-y-4">
                <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-3">Cookie Questions?</h3>
                  <div className="space-y-2 text-purple-700">
                      <p><strong>Email:</strong> <a href="mailto:support@bleepy.co.uk" className="hover:text-purple-900 underline">support@bleepy.co.uk</a></p>
                    <p><strong>Subject Line:</strong> Cookie Policy Inquiry</p>
                    <p><strong>Response Time:</strong> Within 5 business days</p>
                  </div>
                </div>
                <p>
                  If you have questions about our use of cookies or would like to manage your cookie preferences, please contact us using the information above.
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm">
              This Cookie Policy is effective as of 15 November 2025 and was last updated on 15 November 2025.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
