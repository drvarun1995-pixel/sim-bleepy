"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, BookOpen, Microscope, Award, Users } from "lucide-react";

import NewsletterSignup from "@/components/NewsletterSignup";

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">

      {/* Main Content */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Under Construction Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Construction className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Research Papers
            </h1>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 mb-6">
              <Construction className="h-4 w-4 mr-2" />
              Under Construction
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Explore the scientific research behind AI-powered medical training and its impact on clinical education.
            </p>
          </div>

          {/* Research Categories */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Microscope className="h-6 w-6" />,
                title: "AI in Medical Education",
                description: "Studies on artificial intelligence in clinical training"
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Learning Outcomes",
                description: "Research on student performance and skill development"
              },
              {
                icon: <Award className="h-6 w-6" />,
                title: "Clinical Competency",
                description: "Assessment and measurement of clinical skills"
              }
            ].map((category, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100/50 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 mx-auto">
                  {category.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
            ))}
          </div>

          {/* Coming Soon Research Papers */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {[
              {
                title: "The Efficacy of AI-Powered Patient Simulations in Medical Education: A Randomized Controlled Trial",
                authors: "Dr. Sarah Chen, Dr. Michael Rodriguez, Dr. Emily Watson",
                journal: "Journal of Medical Education",
                year: "2024",
                abstract: "This study examines the effectiveness of AI-powered patient simulations compared to traditional training methods in improving clinical skills among medical students.",
                impact: "High Impact",
                citations: "45 citations"
              },
              {
                title: "Real-time Feedback in Clinical Training: Impact on Learning Outcomes and Student Confidence",
                authors: "Dr. James Park, Dr. Lisa Thompson, Dr. David Kim",
                journal: "Medical Teacher",
                year: "2024",
                abstract: "Research investigating how real-time feedback during AI patient interactions affects learning outcomes and student confidence in clinical scenarios.",
                impact: "Medium Impact",
                citations: "32 citations"
              },
              {
                title: "Comparative Analysis of Traditional vs. AI-Enhanced OSCE Preparation",
                authors: "Dr. Maria Garcia, Dr. Robert Johnson, Dr. Anna Lee",
                journal: "Clinical Simulation in Nursing",
                year: "2023",
                abstract: "A comprehensive study comparing traditional OSCE preparation methods with AI-enhanced training approaches in medical education.",
                impact: "High Impact",
                citations: "67 citations"
              },
              {
                title: "The Role of Emotional Intelligence in AI Patient Interactions",
                authors: "Dr. Thomas Wilson, Dr. Jennifer Brown, Dr. Alex Chen",
                journal: "Advances in Health Sciences Education",
                year: "2023",
                abstract: "Exploring how emotional intelligence development through AI patient interactions translates to improved real-world clinical practice.",
                impact: "Medium Impact",
                citations: "28 citations"
              }
            ].map((paper, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {paper.impact}
                  </div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Coming Soon
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">{paper.title}</h3>
                <div className="text-sm text-gray-600 mb-3">
                  <div className="font-semibold">Authors:</div>
                  <div>{paper.authors}</div>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <div className="font-semibold">Journal:</div>
                  <div>{paper.journal} ({paper.year})</div>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{paper.abstract}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-500">{paper.citations}</div>
                  <Button className="bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs px-3 py-1" disabled>
                    Read Paper
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Research Collaboration */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Collaborate with Us
            </h2>
            <p className="text-gray-600 mb-6">
              Interested in conducting research with Bleepy Simulator? We welcome academic partnerships!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                Contact Research Team
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
