import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../lib/auth/constants';
import { 
  IconCheckCircle, 
  IconXCircle, 
  IconClock, 
  IconRefresh, 
  IconShield, 
  IconMail, 
  IconPhone, 
  IconTicket, 
  IconDatabase,
  IconSettings
} from '../components/Icons';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: { status: string; latency?: number; error?: string };
    firebaseAuth: { status: string; latency?: number; error?: string };
    emailService: { status: string; latency?: number; error?: string };
    otpSystem: { status: string; latency?: number; error?: string };
    ticketGeneration: { status: string; latency?: number; error?: string };
    environment: { status: string; variables: string[] };
  };
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

const StatusPage: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchHealthStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINTS.HEALTH_CHECK, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }

      const data = await response.json() as HealthCheckResult;
      setHealthData(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch health status';
      setError(errorMessage);
      console.error('Health check fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchHealthStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'degraded':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-100';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <IconCheckCircle size={16} />;
      case 'degraded':
        return <IconClock size={16} />;
      case 'unhealthy':
        return <IconXCircle size={16} />;
      default:
        return <IconClock size={16} />;
    }
  };

  const formatLatency = (latency?: number) => {
    if (latency === undefined) return 'N/A';
    return `${latency}ms`;
  };

  const systemChecks = [
    {
      key: 'database',
      label: 'Database Connectivity',
      icon: <IconDatabase size={18} />,
      description: 'Firestore database connection and query performance',
    },
    {
      key: 'firebaseAuth',
      label: 'Authentication System',
      icon: <IconShield size={18} />,
      description: 'Firebase Authentication service status',
    },
    {
      key: 'emailService',
      label: 'Email Service',
      icon: <IconMail size={18} />,
      description: 'SMTP email delivery service configuration',
    },
    {
      key: 'otpSystem',
      label: 'OTP System',
      icon: <IconPhone size={18} />,
      description: 'Email and SMS OTP generation and verification',
    },
    {
      key: 'ticketGeneration',
      label: 'Ticket Generation',
      icon: <IconTicket size={18} />,
      description: 'Booking creation and QR code generation',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-60px)] bg-surface-secondary">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600">
              <IconShield size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">System Status</h1>
              <p className="text-xs text-gray-400">Real-time health monitoring dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchHealthStatus}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-border px-3 py-2 text-[12px] font-semibold text-gray-700 transition-all hover:bg-surface-secondary disabled:opacity-50"
            >
              <IconRefresh size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all ${
                autoRefresh 
                  ? 'bg-primary-600 text-white hover:bg-primary-700' 
                  : 'bg-white border border-border text-gray-700 hover:bg-surface-secondary'
              }`}
            >
              Auto-refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-600">
            {error}
          </div>
        )}

        {healthData && (
          <>
            {/* Overall Status */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className={`rounded-xl border p-4 ${
                healthData.status === 'healthy' 
                  ? 'bg-emerald-50 border-emerald-100' 
                  : healthData.status === 'degraded'
                  ? 'bg-amber-50 border-amber-100'
                  : 'bg-red-50 border-red-100'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Overall Status</span>
                  {getStatusIcon(healthData.status)}
                </div>
                <div className={`text-lg font-bold ${
                  healthData.status === 'healthy' 
                    ? 'text-emerald-600' 
                    : healthData.status === 'degraded'
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}>
                  {healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Last checked: {lastChecked || 'Never'}
                </div>
              </div>

              {[
                { label: 'Healthy', value: healthData.summary.healthy, color: 'text-emerald-600' },
                { label: 'Degraded', value: healthData.summary.degraded, color: 'text-amber-600' },
                { label: 'Unhealthy', value: healthData.summary.unhealthy, color: 'text-red-600' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{stat.label}</span>
                  </div>
                  <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[11px] text-gray-500 mt-1">Systems</div>
                </div>
              ))}
            </div>

            {/* System Checks */}
            <div className="grid gap-4 md:grid-cols-2">
              {systemChecks.map((check) => {
                const checkData = healthData.checks[check.key as keyof HealthCheckResult['checks']] as any;
                if (!checkData) return null;

                return (
                  <div key={check.key} className="bg-white rounded-xl border border-border p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusColor(checkData.status)}`}>
                          {check.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{check.label}</h3>
                          <p className="text-[11px] text-gray-400">{check.description}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-3 py-1 rounded-full border ${getStatusColor(checkData.status)}`}>
                        {checkData.status.charAt(0).toUpperCase() + checkData.status.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {checkData.latency !== undefined && (
                        <div className="flex justify-between items-center py-2 border-b border-border-light">
                          <span className="text-xs text-gray-500">Latency</span>
                          <span className="text-xs font-bold text-gray-900">{formatLatency(checkData.latency)}</span>
                        </div>
                      )}
                      
                      {checkData.error && (
                        <div className="rounded-lg bg-red-50 p-3">
                          <div className="flex items-start gap-2">
                            <IconXCircle size={14} className="text-red-500 mt-0.5" />
                            <div className="text-[11px] text-red-600">{checkData.error}</div>
                          </div>
                        </div>
                      )}

                      {check.key === 'environment' && checkData.variables && (
                        <div>
                          <div className="text-[11px] text-gray-500 mb-2">Configured Environment Variables:</div>
                          <div className="flex flex-wrap gap-1">
                            {checkData.variables.map((variable: string, i: number) => (
                              <span key={i} className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-100">
                                {variable}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timestamp */}
            <div className="mt-6 text-center">
              <div className="text-[10px] text-gray-400">
                Server timestamp: {new Date(healthData.timestamp).toLocaleString()}
              </div>
            </div>
          </>
        )}

        {loading && !healthData && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-[3px] border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusPage;
