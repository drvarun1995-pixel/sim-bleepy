"use client";

import { Shield, Database, Cloud, Mail, BarChart, Globe } from "lucide-react";
import Link from "next/link";

export default function SubProcessorsPage() {
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
              Sub-Processors
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-blue-100 text-green-800 mb-6">
              <Shield className="h-4 w-4 mr-2" />
              Effective Date: 19 November 2025
            </div>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              To operate our Services securely and reliably, Bleepy engages a small number of trusted third-party providers that process personal data on our behalf.
            </p>
          </div>

          {/* Overview */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 text-left space-y-8 mb-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Overview
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  To operate our Services securely and reliably, Bleepy ("we," "us," or "our") engages a small number of trusted third-party providers ("sub-processors") that process personal data on our behalf.
                </p>
                <p>
                  We only use sub-processors that:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Meet security, privacy, and compliance standards consistent with UK GDPR and EU GDPR;</li>
                  <li>Operate under written data-processing terms; and</li>
                  <li>Provide appropriate technical and organisational safeguards, including, where required, Standard Contractual Clauses (SCCs) for international transfers.</li>
                </ul>
                <p>
                  This list reflects our current sub-processors and may change as our Services evolve.
                </p>
              </div>
            </section>
          </div>

          {/* Infrastructure and Hosting */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 text-left space-y-8 mb-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Cloud className="h-6 w-6 mr-2 text-purple-600" />
                1. Infrastructure and Hosting
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Provider</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Purpose</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Region of Processing</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Safeguards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-medium">Supabase</td>
                      <td className="px-4 py-3 text-gray-700">Database, authentication services, and file storage</td>
                      <td className="px-4 py-3 text-gray-700">EU / UK (Ireland and London regions)</td>
                      <td className="px-4 py-3 text-gray-700">DPA signed, data remains in EU/UK data centres</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Vercel Inc.</td>
                      <td className="px-4 py-3 text-gray-700">Website hosting and deployment</td>
                      <td className="px-4 py-3 text-gray-700">Global (edge network)</td>
                      <td className="px-4 py-3 text-gray-700">DPA signed, SCCs and regional routing controls</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Cloudflare, Inc.</td>
                      <td className="px-4 py-3 text-gray-700">CDN, DNS, DDoS protection, and SSL/TLS services</td>
                      <td className="px-4 py-3 text-gray-700">Global (edge network with data centers worldwide)</td>
                      <td className="px-4 py-3 text-gray-700">DPA signed, GDPR-compliant, SCCs in place</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Authentication and Communications */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 text-left space-y-8 mb-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="h-6 w-6 mr-2 text-purple-600" />
                2. Authentication and Communications
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Provider</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Purpose</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Region of Processing</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Safeguards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-medium">Microsoft 365 / Azure</td>
                      <td className="px-4 py-3 text-gray-700">Email services and certificate delivery</td>
                      <td className="px-4 py-3 text-gray-700">EU / UK</td>
                      <td className="px-4 py-3 text-gray-700">DPA automatically included in Microsoft Online Services Terms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* AI and Analytics Services */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 text-left space-y-8 mb-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <BarChart className="h-6 w-6 mr-2 text-purple-600" />
                3. AI and Analytics Services
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Provider</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Purpose</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Region of Processing</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Safeguards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-medium">OpenAI</td>
                      <td className="px-4 py-3 text-gray-700">AI-powered conversation features, content generation, and consultation scoring</td>
                      <td className="px-4 py-3 text-gray-700">US</td>
                      <td className="px-4 py-3 text-gray-700">DPA signed, SCCs in place</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Hume AI</td>
                      <td className="px-4 py-3 text-gray-700">Real-time voice processing and emotion analysis (Zero Data Retention enabled)</td>
                      <td className="px-4 py-3 text-gray-700">US</td>
                      <td className="px-4 py-3 text-gray-700">Zero Data Retention - no data stored on their platform. Chat transcripts stored only in our database (Supabase)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Google Analytics</td>
                      <td className="px-4 py-3 text-gray-700">Website analytics and usage statistics</td>
                      <td className="px-4 py-3 text-gray-700">US / EU</td>
                      <td className="px-4 py-3 text-gray-700">SCCs and GDPR-compliant processing</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mt-4">
                <p className="text-green-800 text-sm">
                  <strong>Note:</strong> Hume AI is configured with Zero Data Retention. Audio recordings and chat history are NOT stored on Hume's platform. Chat transcripts are stored ONLY in our secure database (Supabase) for 1 year, then automatically deleted.
                </p>
              </div>
            </section>
          </div>

          {/* Updates */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100/50 text-left space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Updates
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  We review our sub-processors periodically and update this page as needed.
                </p>
                <p>
                  Material changes are communicated to organisational customers where required by agreement.
                </p>
                <p>
                  The "Effective Date" above reflects the most recent revision.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Contact
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  For questions about our sub-processors, please contact us at:
                </p>
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <p className="text-purple-800">
                    <strong>Email:</strong> <a href="mailto:support@bleepy.co.uk" className="hover:text-purple-900 underline">support@bleepy.co.uk</a>
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm">
              This Sub-Processors list is effective as of 19 November 2025.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

