import React, { useState, useEffect, useCallback } from 'react';
import { SeverityBadge } from '../ui/severity-badge.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card.tsx';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import {
  Flame,
  Bell,
  ShieldAlert,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  Radio,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { AnalyticsTrendsChart } from './AnalyticsTrendsChart.tsx';
import type { AnalyticsTimeRange, AnalyticsSummary, AnalyticsTrends, AnalyticsMttdDetails } from '../../server/analytics/analytics.service.ts';

export interface SocDashboardViewProps {
  onNavigate: (tab: 'overview' | 'alerts' | 'incidents' | 'events' | 'admin' | 'docs') => void;
}

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
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

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
      setLastUpdated(Date.now());
    }
  }, [token, timeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // tick every 5s so the "updated Ns ago" stamp stays honest
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const ageSec = lastUpdated ? Math.max(0, Math.round((now - lastUpdated) / 1000)) : null;
  const isStale = ageSec !== null && ageSec > 60;

  // Realtime subscription & mandatory resync
  useEffect(() => {
    let resyncTimer: ReturnType<typeof setTimeout> | null = null;
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

      // Mandatory full REST resync – batched so bursts of events cause one refetch
      if (resyncTimer) clearTimeout(resyncTimer);
      resyncTimer = setTimeout(() => fetchDashboardData(), 2000);
    });

    return () => {
      if (resyncTimer) clearTimeout(resyncTimer);
      unsubscribe();
    };
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
        setIngestSuccess(`Snort alert ingested [SID:${pick.signatureId}] & auto-promoted to Alert.`);
        fetchDashboardData();
        setTimeout(() => setIngestSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Failed to ingest sample:', err);
    } finally {
      setIngestingSample(false);
    }
  };

  const getSeverityBadge = (sev: string) => <SeverityBadge severity={sev} />;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'NEW':
        return <Badge variant="destructive">{status}</Badge>;
      case 'INVESTIGATING':
      case 'IN_PROGRESS':
        return <Badge variant="warning">{status}</Badge>;
      case 'CONTAINED':
        return <Badge variant="info">CONTAINED</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">RESOLVED</Badge>;
      case 'CLOSED':
      case 'DISMISSED':
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatMttdLatency = (sec: number | null) => {
    if (sec === null) return 'N/A';
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const remS = Math.round(sec % 60);
    return `${m}m ${remS}s`;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b-2 border-zinc-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Security operations
          </h1>
          <p className="text-sm text-zinc-400 max-w-prose">
            Triage the highest-severity work first. Metrics cover the selected window.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-mono text-xs ${isStale ? 'text-amber-400' : 'text-zinc-500'}`}
            role="status"
          >
            {isStale ? '⚠ ' : ''}
            {ageSec === null ? 'Loading…' : ageSec < 5 ? 'Updated just now' : `Updated ${ageSec}s ago`}
          </span>

          {/* Time range selector */}
          <div role="group" aria-label="Time range" className="inline-flex rounded-md border border-zinc-800 divide-x divide-zinc-800 font-mono">
            {(['24h', '7d', '30d'] as AnalyticsTimeRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                aria-pressed={timeRange === range}
                className={`px-3 h-10 pointer-coarse:h-11 text-xs font-semibold cursor-pointer transition-colors ${
                  timeRange === range
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Button variant="outline" onClick={fetchDashboardData} disabled={loading} title="Refresh dashboard metrics">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </Button>

          {canManage && (
            <Button
              variant="ghost"
              onClick={handleIngestSample}
              disabled={ingestingSample}
              title="Developer tool: simulate an incoming Snort IDS alert"
            >
              <Radio className="h-4 w-4" aria-hidden="true" />
              <span>Dev: simulate alert</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-red-950 border border-red-800 rounded-md text-sm text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchDashboardData} className="h-6 text-xs text-red-300">
            Retry
          </Button>
        </div>
      )}

      {ingestSuccess && (
        <div role="status" className="p-3 bg-emerald-950 border border-emerald-800 rounded-md text-sm text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{ingestSuccess}</span>
        </div>
      )}

      {/* 4 Primary SOC KPI Cards (Powered by V2.1 Analytics Summary) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Active Incidents & Unassigned Queue */}
        <Card className="border-t-4 border-t-red-400">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-mono uppercase text-xs tracking-wider">Active Incidents</span>
              <Flame className="h-4 w-4 text-red-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span data-numeric className="text-3xl font-semibold font-mono text-zinc-100 leading-none">
                {summary ? summary.incidents.active : 0}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('incidents')}
                className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pt-1 border-t border-zinc-800/60">
              <span className="text-amber-400 font-semibold">{summary?.incidents.unassigned || 0} unassigned</span>
              <span>&bull;</span>
              <span className="text-red-400">{summary?.incidents.bySeverity.sev1 || 0} SEV1</span>
              <span>&bull;</span>
              <span className="text-zinc-400">{summary?.incidents.total || 0} in {timeRange}</span>
            </div>
          </CardContent>
        </Card>

        {/* Open Actionable Alerts */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-mono uppercase text-xs tracking-wider">Open Alerts</span>
              <Bell className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span data-numeric className="text-3xl font-semibold font-mono text-zinc-100 leading-none">
                {summary ? summary.alerts.open : 0}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('alerts')}
                className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1"
              >
                <span>Triage</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pt-1 border-t border-zinc-800/60">
              <span className="text-red-400">{summary?.alerts.bySeverity.critical || 0} Crit</span>
              <span>&bull;</span>
              <span className="text-amber-400">{summary?.alerts.bySeverity.high || 0} High</span>
              <span>&bull;</span>
              <span className="text-zinc-400">{summary?.alerts.total || 0} in {timeRange}</span>
            </div>
          </CardContent>
        </Card>

        {/* Mean Time to Detect (MTTD) */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-mono uppercase text-xs tracking-wider">MTTD (Detection Latency)</span>
              <Timer className="h-4 w-4 text-sky-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span data-numeric className="text-3xl font-semibold font-mono text-zinc-100 leading-none">
                {formatMttdLatency(summary?.mttd.averageSeconds ?? null)}
              </span>
              <Badge
                variant={summary?.mttd.status === 'available' ? 'success' : 'secondary'}
                className="text-xs"
              >
                {summary?.mttd.status === 'available' ? 'AVAILABLE' : 'INSUFFICIENT DATA'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pt-1 border-t border-zinc-800/60">
              <span>{summary?.mttd.sampleCount || 0} calibrated samples</span>
              {mttdDetails?.medianSeconds !== null && mttdDetails?.medianSeconds !== undefined && (
                <span>Median: {mttdDetails.medianSeconds}s</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Snort Telemetry Ingestion */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-mono uppercase text-xs tracking-wider">Snort Telemetry</span>
              <ShieldAlert className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span data-numeric className="text-3xl font-semibold font-mono text-zinc-100 leading-none">
                {summary ? summary.telemetry.totalEvents : 0}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('events')}
                className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1"
              >
                <span>Inspect</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pt-1 border-t border-zinc-800/60 truncate">
              <span className="text-red-400">{summary?.telemetry.highPriorityEvents || 0} High Priority</span>
              <span>&bull;</span>
              <span className="text-zinc-400">Past {timeRange}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Queues: Ongoing Security Incidents & Urgent Untriaged Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Ongoing Incidents Feed (primary) */}
        <Card className="xl:col-span-7">
          <CardHeader className="p-4 pb-3 border-b border-zinc-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Flame className="h-4 w-4 text-red-400" />
                Active Security Incidents
              </CardTitle>
              <CardDescription className="text-xs">
                Coordinated investigations currently underway
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('incidents')}
              className="text-xs"
            >
              View All ({summary?.incidents.total || 0})
            </Button>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-zinc-800/80">
            {loading ? (
              <div className="py-8 text-center text-zinc-400 font-mono text-xs">
                Loading active incidents...
              </div>
            ) : activeIncidents.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 font-mono text-xs">
                No active incidents currently recorded.
              </div>
            ) : (
              activeIncidents.map((inc) => (
                <div key={inc.id} className="p-3.5 hover:bg-zinc-800 transition-colors flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(inc.severity)}
                      {getStatusBadge(inc.status)}
                      <span className="font-semibold text-zinc-200 truncate">{inc.title}</span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono truncate">
                      Assignee: {inc.assignee ? inc.assignee.email : <span className="text-amber-400">Unassigned</span>} &bull; {inc.alertCount} alerts linked
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate('incidents')}
                    className="px-2 text-xs text-zinc-400 hover:text-zinc-100 shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    <span>Open</span>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Untriaged Alerts Feed */}
        <Card className="xl:col-span-5">
          <CardHeader className="p-4 pb-3 border-b border-zinc-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-400" />
                Urgent Alerts Triage Feed
              </CardTitle>
              <CardDescription className="text-xs">
                High-priority detections awaiting triage
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('alerts')}
              className="text-xs"
            >
              Alerts Table
            </Button>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-zinc-800/80">
            {loading ? (
              <div className="py-8 text-center text-zinc-400 font-mono text-xs">
                Loading urgent alerts...
              </div>
            ) : urgentAlerts.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 font-mono text-xs">
                Zero untriaged alerts. Clean operating queue.
              </div>
            ) : (
              urgentAlerts.map((al) => (
                <div key={al.id} className="p-3.5 hover:bg-zinc-800 transition-colors flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(al.severity)}
                      <span className="font-mono text-zinc-400 font-bold">#{al.id}</span>
                      <span className="font-semibold text-zinc-200 truncate">{al.title}</span>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono truncate">
                      {al.sourceIp} &rarr; {al.destinationIp} &bull; SID:{al.signatureId}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate('alerts')}
                    className="px-2 text-xs text-zinc-400 hover:text-zinc-100 shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    <span>Triage</span>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* V2.1 Historical Trends Visualizations */}
      {trends && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnalyticsTrendsChart
            title="Alert Ingestion & Triage Velocity"
            description={`Continuous hourly/daily alert distribution over the past ${timeRange}`}
            timeRange={timeRange}
            bucketInterval={trends.bucketInterval}
            buckets={trends.buckets}
            type="alerts"
          />
          <AnalyticsTrendsChart
            title="Incident Escalation vs Resolution Velocity"
            description={`Declared vs resolved incident volume over the past ${timeRange}`}
            timeRange={timeRange}
            bucketInterval={trends.bucketInterval}
            buckets={trends.buckets}
            type="incidents"
          />
        </div>
      )}

      {/* Cross Navigation Shortcuts */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-zinc-400">
        <span>Operational Quick Links:</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate('alerts')}
            className="px-2.5 py-1 min-h-8 pointer-coarse:min-h-11 rounded-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 cursor-pointer text-xs"
          >
            Alert Triage
          </button>
          <button
            type="button"
            onClick={() => onNavigate('incidents')}
            className="px-2.5 py-1 min-h-8 pointer-coarse:min-h-11 rounded-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 cursor-pointer text-xs"
          >
            Incidents
          </button>
          <button
            type="button"
            onClick={() => onNavigate('events')}
            className="px-2.5 py-1 min-h-8 pointer-coarse:min-h-11 rounded-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 cursor-pointer text-xs"
          >
            Telemetry Events
          </button>
          {user?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-2.5 py-1 min-h-8 pointer-coarse:min-h-11 rounded-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 cursor-pointer text-xs"
            >
              Operator Admin
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('docs')}
            className="px-2.5 py-1 min-h-8 pointer-coarse:min-h-11 rounded-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 cursor-pointer text-xs"
          >
            OpenAPI Specs
          </button>
        </div>
      </div>
    </div>
  );
};
