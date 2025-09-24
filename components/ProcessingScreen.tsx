"use client";

import { motion } from "framer-motion";
import { Stethoscope, Loader2 } from "lucide-react";

interface ProcessingScreenProps {
  title: string;
  subtitle: string;
  steps: string[];
}

export default function ProcessingScreen({ title, subtitle, steps }: ProcessingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 lg:p-10 max-w-md w-full text-center border border-gray-200">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md relative">
          <div className="w-12 h-12 sm:w-14 sm:h-14 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <Stethoscope className="absolute h-8 w-8 sm:h-10 sm:w-10 text-white" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          {title}
        </h2>
        <p className="text-gray-600 mb-8 text-base sm:text-lg">
          {subtitle}
        </p>

        <div className="space-y-4 text-left mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center text-gray-700 text-sm sm:text-base">
              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
              </div>
              <span>{step}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center text-purple-600 font-medium text-sm sm:text-base">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2 animate-pulse" />
          <span>Please wait...</span>
        </div>
      </div>
    </div>
  );
}
