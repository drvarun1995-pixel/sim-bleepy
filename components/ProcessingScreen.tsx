"use client";

import { motion } from "framer-motion";
import { Stethoscope, CheckCircle, Loader2 } from "lucide-react";

interface ProcessingScreenProps {
  title: string;
  subtitle: string;
  steps: string[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      loop: Infinity,
      ease: "linear",
      duration: 2,
    },
  },
};

export default function ProcessingScreen({ title, subtitle, steps }: ProcessingScreenProps) {
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        className="bg-white rounded-modern-lg shadow-modern-lg p-6 sm:p-8 lg:p-10 max-w-md w-full text-center border border-gray-200"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="w-20 h-20 sm:w-24 sm:h-24 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-md"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <motion.div
            className="w-12 h-12 sm:w-14 sm:h-14 border-4 border-white border-t-transparent rounded-full"
            variants={spinnerVariants}
          />
          <Stethoscope className="absolute h-8 w-8 sm:h-10 sm:w-10 text-white" />
        </motion.div>

        <motion.h2
          className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3"
          variants={itemVariants}
        >
          {title}
        </motion.h2>
        <motion.p
          className="text-gray-600 mb-8 text-base sm:text-lg"
          variants={itemVariants}
        >
          {subtitle}
        </motion.p>

        <motion.div
          className="space-y-4 text-left mb-8"
          variants={containerVariants}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex items-center text-gray-700 text-sm sm:text-base"
              variants={itemVariants}
            >
              <motion.div
                className="w-5 h-5 mr-3 flex items-center justify-center"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.5 + index * 0.2, duration: 0.3 }}
              >
                <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
              </motion.div>
              <span>{step}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="flex items-center justify-center text-purple-600 font-medium text-sm sm:text-base"
          variants={itemVariants}
        >
          <motion.div
            className="w-3 h-3 bg-purple-500 rounded-full mr-2"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
          <span>Please wait...</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
