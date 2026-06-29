import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_ENDPOINTS } from '../lib/auth/constants';
import { useAuth } from '../contexts/AuthContext';
import { IconClock, IconShield, IconX, IconXCircle } from './Icons';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  summary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

const POLL_INTERVAL_MS = 60000;

const SystemStatusNotice: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [dismissedTimestamp, setDismissedTimestamp] = useState<string | null>(null);

  const shouldMonitor = user?.role === 'admin';

  useEffect(() => {
    if (!shouldMonitor) {
      setHealthData(null);
      setDismissedTimestamp(null);
      return;
    }

    let cancelled = false;

    const fetchHealthStatus = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.HEALTH_CHECK, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Health check failed with status ${response.status}`);
        }

        const data = (await response.json()) as HealthCheckResult;
        if (!cancelled) {
          setHealthData(data);
          if (dismissedTimestamp && dismissedTimestamp !== data.timestamp) {
            setDismissedTimestamp(null);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('System status notice error:', error);
        }
      }
    };

    fetchHealthStatus();
    const interval = window.setInterval(fetchHealthStatus, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [dismissedTimestamp, shouldMonitor]);

  const activeAlert = useMemo(() => {
    if (!healthData || healthData.status === 'healthy') {
      return null;
    }

    if (dismissedTimestamp === healthData.timestamp) {
      return null;
    }

    return healthData;
  }, [dismissedTimestamp, healthData]);

  if (!shouldMonitor || !activeAlert || location.pathname === '/status') {
    return null;
  }

  const isCritical = activeAlert.status === 'unhealthy';
  const title = isCritical ? 'System needs attention' : 'System running with issues';
  const message = isCritical
    ? `${activeAlert.summary.unhealthy} critical check${activeAlert.summary.unhealthy === 1 ? '' : 's'} need attention right now.`
    : `${activeAlert.summary.degraded} check${activeAlert.summary.degraded === 1 ? '' : 's'} are degraded. Review system health details.`;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] w-[min(22rem,calc(100vw-2rem))]">
      <div
        className={`pointer-events-auto rounded-2xl border bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.16)] slide-up ${
          isCritical ? 'border-red-200' : 'border-amber-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isCritical ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {isCritical ? <IconXCircle size={18} /> : <IconClock size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  isCritical ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {activeAlert.status}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{message}</p>
            <div className="mt-3 flex items-center gap-2">
              <Link
                to="/status"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-[11px] font-semibold text-white transition-all hover:bg-primary-700"
              >
                <IconShield size={13} />
                View status
              </Link>
              <button
                type="button"
                onClick={() => setDismissedTimestamp(activeAlert.timestamp)}
                className="rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-gray-600 transition-all hover:bg-surface-secondary"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss system notice"
            onClick={() => setDismissedTimestamp(activeAlert.timestamp)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-secondary hover:text-gray-600"
          >
            <IconX size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusNotice;
