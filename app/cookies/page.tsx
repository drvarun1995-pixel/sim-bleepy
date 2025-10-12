"use client";

import { Cookie, Settings, Eye, Shield, Clock, Globe, Mail, CheckCircle, XCircle } from "lucide-react";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
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
              Last Updated: October 2025
            </div>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Learn about how we use cookies and similar technologies to enhance your experience on Bleepy.
            </p>
          </div>

          {/* Cookie Types Overview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Essential Cookies",
                description: "Required for basic website functionality and security",
                color: "from-green-100 to-emerald-100",
                textColor: "text-green-600"
              },
              {
                icon: <Settings className="h-8 w-8" />,
                title: "Preference Cookies",
                description: "Remember your settings and preferences",
                color: "from-blue-100 to-cyan-100",
                textColor: "text-blue-600"
              },
              {
                icon: <Eye className="h-8 w-8" />,
                title: "Analytics Cookies",
                description: "Help us understand how you use our platform",
                color: "from-purple-100 to-pink-100",
                textColor: "text-purple-600"
              }
            ].map((type, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50">
                <div className={`w-12 h-12 bg-gradient-to-r ${type.color} rounded-xl flex items-center justify-center ${type.textColor} mb-4 mx-auto`}>
                  {type.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">{type.title}</h3>
                <p className="text-gray-600 text-sm text-center">{type.description}</p>
              </div>
            ))}
          </div>

          {/* Cookie Policy Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 text-left space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Cookie className="h-6 w-6 mr-2 text-purple-600" />
                1. What Are Cookies?
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) 
                  when you visit our website. They help us provide you with a better experience by remembering 
                  your preferences and understanding how you use our platform.
                </p>
                <p>
                  We also use similar technologies such as web beacons, pixel tags, and local storage to 
                  collect and store information about your interactions with our service.
                </p>
              </div>
            </section>

            {/* How We Use Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Settings className="h-6 w-6 mr-2 text-purple-600" />
                2. How We Use Cookies
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>We use cookies and similar technologies for the following purposes:</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <h3 className="font-semibold text-green-800">Essential Functions</h3>
                    </div>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• User authentication and login</li>
                      <li>• Session management</li>
                      <li>• Security and fraud prevention</li>
                      <li>• Load balancing and performance</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Settings className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-blue-800">User Experience</h3>
                    </div>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Remember user preferences</li>
                      <li>• Language and region settings</li>
                      <li>• Theme and display options</li>
                      <li>• Form data retention</li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Eye className="h-5 w-5 text-purple-600 mr-2" />
                      <h3 className="font-semibold text-purple-800">Analytics</h3>
                    </div>
                    <ul className="text-purple-700 text-sm space-y-1">
                      <li>• Usage statistics and patterns</li>
                      <li>• Performance monitoring</li>
                      <li>• Error tracking and debugging</li>
                      <li>• Feature usage analysis</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                      <h3 className="font-semibold text-yellow-800">Session Management</h3>
                    </div>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      <li>• Training session tracking</li>
                      <li>• Progress saving</li>
                      <li>• Timeout management</li>
                      <li>• State persistence</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Types of Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="h-6 w-6 mr-2 text-purple-600" />
                3. Types of Cookies We Use
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3.1 Strictly Necessary Cookies</h3>
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
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">next-auth.callback-url</td>
                          <td className="px-4 py-2">Redirects after authentication</td>
                          <td className="px-4 py-2">Session</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">__Secure-next-auth.session-token</td>
                          <td className="px-4 py-2">Secure session token (HTTPS only)</td>
                          <td className="px-4 py-2">Session (30 days)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3.2 Performance and Analytics Cookies</h3>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-3">
                    <p className="text-blue-700 mb-2">
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
                        <tr>
                          <td className="px-4 py-2 font-mono text-xs">_gat</td>
                          <td className="px-4 py-2">Google Analytics - throttle request rate</td>
                          <td className="px-4 py-2">1 minute</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3.3 Functional Cookies</h3>
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-3">
                    <p className="text-purple-700 mb-2">
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
              </div>
            </section>

            {/* Third-Party Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Globe className="h-6 w-6 mr-2 text-purple-600" />
                4. Third-Party Cookies
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>
                  We use third-party services that may set their own cookies. We do not control these cookies, 
                  and you should check the relevant third party's website for more information.
                </p>
                
                <div className="space-y-3">
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Google Analytics</h3>
                    <p className="text-sm text-gray-700 mb-2">
                      We use Google Analytics to understand how visitors use our site. Google Analytics uses cookies to collect 
                      anonymous information such as the number of visitors and most popular pages.
                    </p>
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer nofollow" 
                       className="text-purple-600 hover:underline text-sm">
                      View Google's Privacy Policy →
                    </a>
                  </div>

                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Vercel Analytics</h3>
                    <p className="text-sm text-gray-700 mb-2">
                      Our hosting provider, Vercel, may set cookies for performance monitoring and analytics purposes.
                    </p>
                    <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer nofollow" 
                       className="text-purple-600 hover:underline text-sm">
                      View Vercel's Privacy Policy →
                    </a>
                  </div>

                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Supabase</h3>
                    <p className="text-sm text-gray-700 mb-2">
                      Our database and authentication provider may set cookies for session management and security.
                    </p>
                    <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer nofollow" 
                       className="text-purple-600 hover:underline text-sm">
                      View Supabase's Privacy Policy →
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Managing Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Settings className="h-6 w-6 mr-2 text-purple-600" />
                5. How to Manage Cookies
              </h2>
              <div className="text-gray-700 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Browser Settings</h3>
                  <p className="text-yellow-700 mb-3">
                    Most web browsers allow you to control cookies through their settings. You can set your browser to refuse 
                    cookies or delete certain cookies. However, please note that if you block or delete essential cookies, 
                    some features of our platform may not function properly.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Browser-Specific Instructions</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">Google Chrome</h4>
                      <p className="text-sm text-gray-700">Settings → Privacy and security → Cookies and other site data</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">Mozilla Firefox</h4>
                      <p className="text-sm text-gray-700">Options → Privacy & Security → Cookies and Site Data</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">Microsoft Edge</h4>
                      <p className="text-sm text-gray-700">Settings → Cookies and site permissions → Manage and delete cookies</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-1">Safari</h4>
                      <p className="text-sm text-gray-700">Preferences → Privacy → Manage Website Data</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Opt-Out Tools</h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-700">
                          <strong>Google Analytics Opt-Out:</strong> Install the{' '}
                          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer nofollow" 
                             className="text-purple-600 hover:underline">
                            Google Analytics Opt-out Browser Add-on
                          </a>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-700">
                          <strong>Network Advertising Initiative:</strong> Visit{' '}
                          <a href="http://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer nofollow" 
                             className="text-purple-600 hover:underline">
                            NAI Opt-Out Page
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Cookie Duration */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="h-6 w-6 mr-2 text-purple-600" />
                6. Cookie Duration
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>Cookies we use fall into two categories based on their lifespan:</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-blue-800">Session Cookies</h3>
                    </div>
                    <p className="text-blue-700 text-sm mb-2">
                      These are temporary cookies that expire when you close your browser. They help us track your 
                      movements through our platform during a single session.
                    </p>
                    <p className="text-blue-600 text-xs font-medium">Duration: Until browser closes</p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-purple-600 mr-2" />
                      <h3 className="font-semibold text-purple-800">Persistent Cookies</h3>
                    </div>
                    <p className="text-purple-700 text-sm mb-2">
                      These cookies remain on your device for a set period (ranging from minutes to years) and are 
                      activated each time you visit our platform.
                    </p>
                    <p className="text-purple-600 text-xs font-medium">Duration: Varies (1 day to 2 years)</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Updates to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Cookie className="h-6 w-6 mr-2 text-purple-600" />
                7. Changes to This Cookie Policy
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for 
                  other operational, legal, or regulatory reasons. We will notify you of any material changes by:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Posting the updated policy on our website</li>
                  <li>Updating the "Last Updated" date at the top of this policy</li>
                  <li>Sending email notifications for significant changes</li>
                </ul>
                <p>
                  We encourage you to periodically review this Cookie Policy to stay informed about our use of cookies.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="h-6 w-6 mr-2 text-purple-600" />
                8. Contact Information
              </h2>
              <div className="text-gray-700 space-y-4">
                <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-3">Cookie Questions?</h3>
                  <div className="space-y-2 text-purple-700">
                    <p><strong>Email:</strong> support@bleepy.co.uk</p>
                    <p><strong>Subject Line:</strong> Cookie Policy Inquiry</p>
                    <p><strong>Response Time:</strong> Within 5 business days</p>
                  </div>
                </div>
                
                <p>
                  If you have questions about our use of cookies or would like to manage your cookie 
                  preferences, please contact us using the information above.
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm">
              This Cookie Policy is effective as of October 2025 and was last updated on October 8, 2025.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
