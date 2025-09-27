"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  Eye, 
  Mail, 
  Settings, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Save,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface ConsentData {
  consent_given: boolean;
  consent_timestamp: string;
  consent_version: string;
  marketing_consent: boolean;
  analytics_consent: boolean;
}

interface ConsentPreferences {
  marketing: boolean;
  analytics: boolean;
}

export function ConsentManagement() {
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    marketing: false,
    analytics: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchConsentData();
  }, []);

  useEffect(() => {
    // Check if there are unsaved changes
    if (consentData) {
      const hasChanges = 
        preferences.marketing !== consentData.marketing_consent ||
        preferences.analytics !== consentData.analytics_consent;
      setHasChanges(hasChanges);
    }
  }, [preferences, consentData]);

  const fetchConsentData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/consent');
      
      if (response.ok) {
        const data = await response.json();
        setConsentData(data);
        setPreferences({
          marketing: data.marketing_consent,
          analytics: data.analytics_consent
        });
      } else {
        console.error('Failed to fetch consent data');
        toast.error('Failed to load consent preferences', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error fetching consent data:', error);
      toast.error('Error loading consent preferences', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/user/consent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketing_consent: preferences.marketing,
          analytics_consent: preferences.analytics,
          consent_version: '1.1' // Increment version when preferences change
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Consent preferences updated successfully!', { duration: 3000 });
        await fetchConsentData(); // Refresh data
      } else {
        toast.error(data.error || 'Failed to update preferences', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error updating consent:', error);
      toast.error('Error updating consent preferences', { duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading consent preferences...</span>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Consent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Current Consent Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Consent Given:</span>
                <Badge variant={consentData?.consent_given ? "success" : "destructive"}>
                  {consentData?.consent_given ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Consent Version:</span>
                <Badge variant="outline">{consentData?.consent_version}</Badge>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Marketing Consent:</span>
                <Badge variant={consentData?.marketing_consent ? "success" : "secondary"}>
                  {consentData?.marketing_consent ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Analytics Consent:</span>
                <Badge variant={consentData?.analytics_consent ? "success" : "secondary"}>
                  {consentData?.analytics_consent ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>
          
          {consentData?.consent_timestamp && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Last updated: {formatDate(consentData.consent_timestamp)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consent Preferences Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Manage Your Consent Preferences</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            You can change your consent preferences at any time. Changes will take effect immediately.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Marketing Consent */}
          <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">Marketing Communications</h4>
                  <p className="text-sm text-gray-600">
                    Receive newsletters, product updates, and promotional content
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketing: checked }))}
                />
              </div>
              <div className="text-xs text-gray-500">
                When enabled, we may send you marketing emails about new features, updates, and educational content.
              </div>
            </div>
          </div>

          {/* Analytics Consent */}
          <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">Analytics & Performance</h4>
                  <p className="text-sm text-gray-600">
                    Help us improve our service by sharing anonymous usage data
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))}
                />
              </div>
              <div className="text-xs text-gray-500">
                When enabled, we collect anonymous data about how you use our platform to improve user experience.
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Important Notice</p>
              <p>
                Essential cookies and data processing required for the platform to function cannot be disabled. 
                This includes authentication, security, and core functionality features.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={handleSavePreferences}
              disabled={!hasChanges || saving}
              className="flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Preferences</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Consent History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <span>Consent History</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Track your consent preferences over time
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Initial Consent</div>
                <div className="text-sm text-gray-600">Version {consentData?.consent_version}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {consentData?.consent_timestamp ? formatDate(consentData.consent_timestamp) : 'N/A'}
                </div>
                <Badge variant="success" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
