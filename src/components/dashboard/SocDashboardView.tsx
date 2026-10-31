import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card.tsx';
import { Button } from '../ui/button.tsx';
import { Alert } from '../ui/alert.tsx';
import { PageHeader } from '../ui/page-header.tsx';
import { StatCard } from '../ui/stat-card.tsx';
import { TimeRangeToggle } from '../ui/time-range-toggle.tsx';
import { SeverityTag, StatusTag } from '../ui/tags.tsx';
import { RefreshCw, Radio } from 'lucide-react';
import { AnalyticsTrendsChart } from './AnalyticsTrendsChart.tsx';
import type { Tab } from '../layout/AppSidebar.tsx';
import type { AnalyticsTimeRange, AnalyticsSummary, AnalyticsTrends, AnalyticsMttdDetails } from '../../server/analytics/analytics.service.ts';

export interface SocDashboardViewProps {
  onNavigate: (tab: Tab) => void;
}

const RANGE_LABEL: Record<string, string> = { '24h': 'Last 24 hours', '7d': 'Last 7 days', '30d': 'Last 30 days' };

export const SocDashboardView: React.FC<SocDashboardViewProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const { subscribe } = useRealtime();

  // Time Range Filter
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('24h');

  // Analytics Metrics (V2.1)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [mttdDetails, setMttdDetails] = useState<AnalyticsMttdDetails | null>(null);

  // Operational feeds
  const [activeIncidents, setActiveIncidents] = useState<any[]>([]);
  const [urgentAlerts, setUrgentAlerts] = useState<any[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ingestingSample, setIngestingSample] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, trendsRes, mttdRes, incListRes, alertListRes] = await Promise.all([
        fetch(`/api/analytics/summary?timeRange=${timeRange}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/analytics/trends?timeRange=${timeRange}&entity=all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/analytics/mttd?timeRange=${timeRange}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/incidents?limit=5', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/alerts?limit=5&status=NEW', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (summaryRes.ok) {
        const json = await summaryRes.json();
        if (json.success) setSummary(json.data);
      }

      if (trendsRes.ok) {
        const json = await trendsRes.json();
        if (json.success) setTrends(json.data);
      }

      if (mttdRes.ok) {
        const json = await mttdRes.json();
        if (json.success) setMttdDetails(json.data);
      }

      if (incListRes.ok) {
        const json = await incListRes.json();
        if (json.success) setActiveIncidents(json.data || []);
      }

      if (alertListRes.ok) {
        const json = await alertListRes.json();
        if (json.success) setUrgentAlerts(json.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load SOC dashboard analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [token, timeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Realtime subscription & mandatory resync
  useEffect(() => {
    const unsubscribe = subscribe('*', (msg) => {
      // Optimistic updates
      if (msg.event === 'alert:created' && msg.data) {
        setUrgentAlerts((prev) => {
          if (prev.some((a) => a.id === msg.data.id)) return prev;
          return [msg.data, ...prev].slice(0, 5);
        });
      } else if (msg.event === 'alert:status_changed' && msg.data) {
        setUrgentAlerts((prev) => prev.filter((a) => a.id !== msg.data.id || msg.data.status === 'NEW'));
      } else if (msg.event === 'incident:created' && msg.data) {
        setActiveIncidents((prev) => {
          if (prev.some((i) => i.id === msg.data.id)) return prev;
          return [msg.data, ...prev].slice(0, 5);
        });
      } else if (msg.event === 'incident:status_changed' && msg.data) {
        setActiveIncidents((prev) =>
          prev.map((inc) => (inc.id === msg.data.id ? { ...inc, status: msg.data.status } : inc))
        );
      }

      // Mandatory full REST resync / refresh metrics
      fetchDashboardData();
    });

    return unsubscribe;
  }, [subscribe, fetchDashboardData]);

  // Quick ingest sample Snort alert
  const handleIngestSample = async () => {
    if (!token || !canManage) return;
    setIngestingSample(true);
    setIngestSuccess(null);

    const samples = [
      {
        signatureId: 2100498,
        signatureMessage: 'GPL ATTACK_RESPONSE id check returned root',
        classification: 'Privilege Escalation Attempt',
        priority: 1,
        protocol: 'TCP',
        sourceIp: '198.51.100.77',
        destinationIp: '192.168.1.50',
        rawPayload: 'uid=0(root) gid=0(root) groups=0(root)',
      },
      {
        signatureId: 2014819,
        signatureMessage: 'ET WEB_SPECIFIC_APPS WordPress SQLi Union Select Attempt',
        classification: 'Web Application Attack',
        priority: 1,
        protocol: 'TCP',
        sourceIp: '203.0.113.45',
        destinationIp: '192.168.1.10',
        rawPayload: "GET /wp-admin/admin-ajax.php?id=1' UNION SELECT 1,user_pass FROM wp_users--",
      },
    ];

    const pick = samples[Math.floor(Math.random() * samples.length)];

    try {
      const res = await fetch('/api/events/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pick),
      });

      if (res.ok) {
        setIngestSuccess(`Snort alert ingested (SID ${pick.signatureId}) and promoted to an alert`);
        fetchDashboardData();
        setTimeout(() => setIngestSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Failed to ingest sample:', err);
    } finally {
      setIngestingSample(false);
    }
  };


  const formatMttdLatency = (sec: number | null) => {
    if (sec === null) return '–';
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const remS = Math.round(sec % 60);
    return `${m}m ${remS}s`;
  };

  const n = (value: number | undefined) => (value ?? 0).toLocaleString();

  const mttdContext =
    summary?.mttd.status === 'available'
      ? `${n(summary.mttd.sampleCount)} samples${
          mttdDetails?.medianSeconds !== null && mttdDetails?.medianSeconds !== undefined ? ` · median ${mttdDetails.medianSeconds}s` : ''
        }`
      : 'Insufficient data';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={RANGE_LABEL[timeRange]}
        actions={
          <>
            <TimeRangeToggle value={timeRange} options={['24h', '7d', '30d'] as AnalyticsTimeRange[]} onChange={setTimeRange} />
            {canManage && (
              <Button variant="outline" size="sm" onClick={handleIngestSample} disabled={ingestingSample} title="Simulate an incoming Snort alert">
                <Radio className="h-4 w-4" strokeWidth={1.5} />
                <span>Simulate alert</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading} title="Refresh dashboard">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              <span>Refresh</span>
            </Button>
          </>
        }
      />

      {error && (
        <Alert variant="destructive" className="flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchDashboardData} className="text-red-300 hover:text-red-300">
            Retry
          </Button>
        </Alert>
      )}

      {ingestSuccess && <Alert variant="success">{ingestSuccess}</Alert>}

      {/* Key figures: numbers only */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active incidents"
          value={n(summary?.incidents.active)}
          context={`${n(summary?.incidents.unassigned)} unassigned · ${n(summary?.incidents.bySeverity.sev1)} SEV1`}
          onClick={() => onNavigate('incidents')}
        />
        <StatCard
          label="Open alerts"
          value={n(summary?.alerts.open)}
          context={`${n(summary?.alerts.bySeverity.critical)} critical · ${n(summary?.alerts.bySeverity.high)} high`}
          onClick={() => onNavigate('alerts')}
        />
        <StatCard label="Mean time to detect" value={formatMttdLatency(summary?.mttd.averageSeconds ?? null)} context={mttdContext} />
        <StatCard
          label="Snort events"
          value={n(summary?.telemetry.totalEvents)}
          context={`${n(summary?.telemetry.highPriorityEvents)} high priority`}
          onClick={() => onNavigate('events')}
        />
      </div>

      {/* One main chart, one compact companion */}
      {trends && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AnalyticsTrendsChart
              title="Alerts over time"
              description={`Alert volume by severity, ${RANGE_LABEL[timeRange].toLowerCase()}`}
              timeRange={timeRange}
              bucketInterval={trends.bucketInterval}
              buckets={trends.buckets}
              type="alerts"
              size="main"
            />
          </div>
          <AnalyticsTrendsChart
            title="Incidents"
            description="Declared and resolved"
            timeRange={timeRange}
            bucketInterval={trends.bucketInterval}
            buckets={trends.buckets}
            type="incidents"
            size="compact"
          />
        </div>
      )}

      {/* Queues */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between border-b border-white/8">
            <div>
              <CardTitle>Active incidents</CardTitle>
              <CardDescription>Investigations currently underway</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('incidents')}>
              View all{summary ? ` (${n(summary.incidents.total)})` : ''}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading && activeIncidents.length === 0 ? (
              <div className="py-8 text-center text-body text-zinc-500">Loading incidents</div>
            ) : activeIncidents.length === 0 ? (
              <div className="py-8 text-center text-body text-zinc-500">No active incidents</div>
            ) : (
              <ul className="divide-y divide-white/6">
                {activeIncidents.map((inc) => (
                  <li key={inc.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate('incidents')}
                      className="flex w-full cursor-pointer flex-col gap-1 px-5 py-3 text-left transition-colors hover:bg-zinc-800/60"
                    >
                      <span className="flex items-center gap-3">
                        <SeverityTag severity={inc.severity} />
                        <StatusTag status={inc.status} />
                      </span>
                      <span className="truncate text-body font-medium text-zinc-100">{inc.title}</span>
                      <span className="truncate text-xs text-zinc-500">
                        {inc.assignee ? inc.assignee.email : 'Unassigned'} · {inc.alertCount} alerts linked
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between border-b border-white/8">
            <div>
              <CardTitle>Urgent alerts</CardTitle>
              <CardDescription>New detections awaiting triage</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('alerts')}>
              View all
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading && urgentAlerts.length === 0 ? (
              <div className="py-8 text-center text-body text-zinc-500">Loading alerts</div>
            ) : urgentAlerts.length === 0 ? (
              <div className="py-8 text-center text-body text-zinc-500">No untriaged alerts</div>
            ) : (
              <ul className="divide-y divide-white/6">
                {urgentAlerts.map((al) => (
                  <li key={al.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate('alerts')}
                      className="flex w-full cursor-pointer flex-col gap-1 px-5 py-3 text-left transition-colors hover:bg-zinc-800/60"
                    >
                      <span className="flex items-center gap-3">
                        <SeverityTag severity={al.severity} />
                        <span className="font-mono text-xs text-zinc-500">#{al.id}</span>
                      </span>
                      <span className="truncate text-body font-medium text-zinc-100">{al.title}</span>
                      <span className="truncate font-mono text-xs text-zinc-500">
                        {al.sourceIp} &rarr; {al.destinationIp} · SID {al.signatureId}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
