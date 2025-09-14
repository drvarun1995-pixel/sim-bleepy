"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, Stethoscope, Heart, Brain, Baby, User } from "lucide-react";
import Link from "next/link";

export default function ScenariosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/bleepy-logo.svg" alt="Bleepy Simulator" className="w-8 h-8" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Bleepy Simulator</span>
            </div>
            <Link href="/">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Under Construction Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Construction className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Clinical Scenarios
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              We're developing a comprehensive library of realistic clinical scenarios to help you master every aspect of patient care.
            </p>
          </div>

          {/* Coming Soon Scenarios Preview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Cardiology",
                description: "Chest pain, heart failure, arrhythmias",
                scenarios: ["Acute MI", "Stable Angina", "Heart Failure", "Atrial Fibrillation"],
                color: "from-red-100 to-pink-100",
                iconColor: "text-red-600"
              },
              {
                icon: <Brain className="h-8 w-8" />,
                title: "Neurology",
                description: "Stroke, seizures, headaches, dementia",
                scenarios: ["Acute Stroke", "Epilepsy", "Migraine", "Alzheimer's"],
                color: "from-blue-100 to-indigo-100",
                iconColor: "text-blue-600"
              },
              {
                icon: <Baby className="h-8 w-8" />,
                title: "Pediatrics",
                description: "Child development, common illnesses",
                scenarios: ["Fever in Children", "Asthma", "Growth Issues", "Vaccinations"],
                color: "from-green-100 to-emerald-100",
                iconColor: "text-green-600"
              },
              {
                icon: <Stethoscope className="h-8 w-8" />,
                title: "Emergency Medicine",
                description: "Trauma, acute presentations",
                scenarios: ["Trauma Assessment", "Sepsis", "Anaphylaxis", "Poisoning"],
                color: "from-orange-100 to-red-100",
                iconColor: "text-orange-600"
              },
              {
                icon: <User className="h-8 w-8" />,
                title: "Internal Medicine",
                description: "Chronic conditions, complex cases",
                scenarios: ["Diabetes Management", "Hypertension", "COPD", "Renal Failure"],
                color: "from-purple-100 to-violet-100",
                iconColor: "text-purple-600"
              },
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Psychiatry",
                description: "Mental health, behavioral issues",
                scenarios: ["Depression", "Anxiety", "Bipolar", "Schizophrenia"],
                color: "from-teal-100 to-cyan-100",
                iconColor: "text-teal-600"
              }
            ].map((specialty, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-300">
                <div className={`w-16 h-16 bg-gradient-to-r ${specialty.color} rounded-2xl flex items-center justify-center ${specialty.iconColor} mb-6`}>
                  {specialty.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{specialty.title}</h3>
                <p className="text-gray-600 mb-4">{specialty.description}</p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800 text-sm">Sample Scenarios:</h4>
                  <ul className="space-y-1">
                    {specialty.scenarios.map((scenario, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-center">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                        {scenario}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <Button className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Request a Scenario
            </h2>
            <p className="text-gray-600 mb-6">
              Have a specific clinical scenario in mind? Let us know what you'd like to see!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="text"
                placeholder="Describe your scenario"
                className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
