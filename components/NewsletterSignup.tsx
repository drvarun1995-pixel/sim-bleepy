"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NewsletterSignupProps {
  title?: string;
  description?: string;
  buttonText?: string;
  placeholder?: string;
  className?: string;
  source?: string; // Track where the signup came from
}

export default function NewsletterSignup({
  title = "Stay Updated",
  description = "Get the latest updates and news delivered to your inbox!",
  buttonText = "Subscribe",
  placeholder = "Enter your email",
  className = "",
  source = "unknown"
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, source }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Successfully subscribed!");
        setEmail("");
      } else {
        toast.error(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200 text-center ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      <p className="text-gray-600 mb-6">
        {description}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        />
        <Button 
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {isLoading ? "Subscribing..." : buttonText}
        </Button>
      </form>
      <p className="text-xs text-gray-500 mt-3">
        By signing up, you agree to our{" "}
        <a href="/privacy" className="text-purple-600 hover:text-purple-700 underline">
          Privacy Policy
        </a>
        {" "}and consent to receive marketing communications.
      </p>
    </div>
  );
}
