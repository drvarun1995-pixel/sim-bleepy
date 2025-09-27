"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, User, Calendar, Database } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  profile: any;
  sessions: any[];
  attempts: any[];
  analytics: any[];
}

export function DataExport() {
  const [loading, setLoading] = useState(false);

  const handleExportData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/data-export');
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const data = await response.json();
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bleepy-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!', { duration: 3000 });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Download className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Download Your Data
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Export all your personal data including profile information, training sessions, 
            and performance analytics in a machine-readable JSON format.
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Profile information and account details</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Training session history and timestamps</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Database className="h-4 w-4" />
              <span>Performance analytics and scores</span>
            </div>
          </div>
          
          <Button
            onClick={handleExportData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download My Data
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 mt-2">
            Your data will be exported as a JSON file that you can save locally or import into other applications.
          </p>
        </div>
      </div>
    </div>
  );
}
