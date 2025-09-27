"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Database, 
  Trash2, 
  Clock, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface RetentionStats {
  user_accounts?: {
    total: number;
    expired: number;
    retention_days: number;
  };
  training_attempts?: {
    total: number;
    expired: number;
    retention_days: number;
  };
  audit_logs?: {
    total: number;
    expired: number;
    retention_days: number;
  };
}

interface RetentionPolicies {
  user_accounts: number;
  training_attempts: number;
  audit_logs: number;
  verification_tokens: number;
  password_reset_tokens: number;
  api_usage_logs: number;
}

export function DataRetentionManager() {
  const [stats, setStats] = useState<RetentionStats>({});
  const [policies, setPolicies] = useState<RetentionPolicies>({} as RetentionPolicies);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [dryRun, setDryRun] = useState(true);

  useEffect(() => {
    fetchRetentionStats();
  }, []);

  const fetchRetentionStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/data-retention');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics);
        setPolicies(data.retention_policies);
      } else {
        toast.error('Failed to fetch retention statistics', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error fetching retention stats:', error);
      toast.error('Error fetching retention statistics', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const executeCleanup = async (cleanupType: string) => {
    try {
      setCleanupLoading(true);
      const response = await fetch('/api/admin/data-retention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cleanup_type: cleanupType,
          dry_run: dryRun
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const action = dryRun ? 'simulated' : 'executed';
        toast.success(`Cleanup ${action} successfully!`, { duration: 3000 });
        await fetchRetentionStats(); // Refresh stats
      } else {
        toast.error(data.error || 'Failed to execute cleanup', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error executing cleanup:', error);
      toast.error('Error executing cleanup', { duration: 3000 });
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getExpiredPercentage = (total: number, expired: number) => {
    if (total === 0) return 0;
    return Math.round((expired / total) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading retention statistics...</span>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Retention Policies Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Data Retention Policies</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Current data retention periods defined for GDPR compliance
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">User Accounts</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{policies.user_accounts} days</div>
              <div className="text-xs text-blue-700">After last activity</div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Training Attempts</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{policies.training_attempts} days</div>
              <div className="text-xs text-green-700">After creation</div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-900">Audit Logs</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{policies.audit_logs} days</div>
              <div className="text-xs text-purple-700">Legal requirement</div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-900">Verification Tokens</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">{policies.verification_tokens} days</div>
              <div className="text-xs text-yellow-700">After creation</div>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900">Reset Tokens</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{policies.password_reset_tokens} day</div>
              <div className="text-xs text-red-700">After creation</div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-900">API Usage Logs</span>
              </div>
              <div className="text-2xl font-bold text-gray-600">{policies.api_usage_logs} days</div>
              <div className="text-xs text-gray-700">After creation</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-green-600" />
            <span>Current Data Statistics</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Data that can be cleaned up based on retention policies
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats).map(([key, stat]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    {key === 'user_accounts' && <Database className="h-5 w-5 text-blue-600" />}
                    {key === 'training_attempts' && <Clock className="h-5 w-5 text-green-600" />}
                    {key === 'audit_logs' && <Shield className="h-5 w-5 text-purple-600" />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 capitalize">
                      {key.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatNumber(stat.total)} total, {formatNumber(stat.expired)} expired
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {getExpiredPercentage(stat.total, stat.expired)}%
                  </div>
                  <div className="text-xs text-gray-600">expired</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cleanup Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <span>Data Cleanup</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Execute data retention cleanup based on current policies
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dry Run Toggle */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-900">Dry Run Mode</div>
                <div className="text-sm text-yellow-700">
                  Simulate cleanup without actually deleting data
                </div>
              </div>
            </div>
            <Switch
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
          </div>

          {/* Cleanup Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              onClick={() => executeCleanup('tokens')}
              disabled={cleanupLoading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {cleanupLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              <span>Clean Expired Tokens</span>
            </Button>

            <Button
              onClick={() => executeCleanup('training_attempts')}
              disabled={cleanupLoading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {cleanupLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>Clean Training Attempts</span>
            </Button>

            <Button
              onClick={() => executeCleanup('audit_logs')}
              disabled={cleanupLoading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {cleanupLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              <span>Clean Audit Logs</span>
            </Button>

            <Button
              onClick={() => executeCleanup('all')}
              disabled={cleanupLoading}
              variant={dryRun ? "default" : "destructive"}
              className="flex items-center space-x-2"
            >
              {cleanupLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>Clean All Data</span>
            </Button>
          </div>

          {/* Warning Notice */}
          {!dryRun && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Warning: Live Mode Active</p>
                <p>
                  Data deletion is enabled. This action will permanently delete expired data 
                  and cannot be undone. Make sure you have backups if needed.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
