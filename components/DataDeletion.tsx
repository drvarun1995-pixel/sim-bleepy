"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function DataDeletion() {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE') {
      toast.error('Please type DELETE to confirm account deletion', { duration: 3000 });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      toast.success('Account deleted successfully. You will be redirected shortly.', { duration: 3000 });
      
      // Redirect to home page after a delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete account. Please try again.', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  if (!showConfirmation) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Your Account
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Warning: This action is irreversible</p>
                  <ul className="space-y-1 text-xs">
                    <li>• All your training sessions and progress will be lost</li>
                    <li>• Your account and profile information will be permanently deleted</li>
                    <li>• You will no longer be able to access the platform</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => setShowConfirmation(true)}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
            
            <p className="text-xs text-gray-500 mt-2">
              If you're having issues with your account, consider contacting support first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-red-200 p-6">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Confirm Account Deletion
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Are you absolutely sure you want to delete your account? This action cannot be undone.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-2">The following data will be permanently deleted:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Your profile and account information</li>
                  <li>• All training session recordings and data</li>
                  <li>• Performance analytics and progress tracking</li>
                  <li>• Any saved preferences or settings</li>
                  <li>• All associated authentication data</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-mono bg-gray-100 px-1 rounded">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Type DELETE to confirm"
              />
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleDeleteAccount}
                disabled={loading || confirmationText !== 'DELETE'}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Permanently Delete Account
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => {
                  setShowConfirmation(false);
                  setConfirmationText('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            Once deleted, your account and all data cannot be recovered.
          </p>
        </div>
      </div>
    </div>
  );
}
