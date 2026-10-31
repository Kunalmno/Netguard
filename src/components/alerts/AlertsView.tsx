import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { Card, CardContent } from '../ui/card.tsx';
import { SeverityTag, StatusTag } from '../ui/tags.tsx';
import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { AlertDetailModal } from './AlertDetailModal.tsx';
import { Search, Filter, RefreshCw, Eye, ChevronLeft, ChevronRight, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { Select } from '../ui/select.tsx';
import { Table } from '../ui/table.tsx';
import { PageHeader } from '../ui/page-header.tsx';
import type { AlertStatus } from '../../db/schema.ts';

export const AlertsView: React.FC = () => {
  const { token, user } = useAuth();
  const { subscribe } = useRealtime();

  // Data & Pagination
  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [sourceIpFilter, setSourceIpFilter] = useState<string>('');

  // Modals & Action Notifications
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setActionError(null);

      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));

      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (sourceIpFilter.trim()) params.append('sourceIp', sourceIpFilter.trim());

      const res = await fetch(`/api/alerts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAlertsList(json.data || []);
          if (json.pagination) {
            setTotalCount(json.pagination.total);
            setTotalPages(json.pagination.totalPages);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, search, statusFilter, severityFilter, sourceIpFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Realtime subscription for live alert updates
  useEffect(() => {
    const unsubscribe = subscribe('*', (msg) => {
      if (
        msg.event === 'alert:created' ||
        msg.event === 'alert:status_changed' ||
        msg.event === 'gateway:resync_required'
      ) {
        fetchAlerts();
      }
    });
    return unsubscribe;
  }, [subscribe, fetchAlerts]);

  const handleStatusChange = async (alertId: number, newStatus: AlertStatus) => {
    if (!token) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/alerts/${alertId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error || 'Failed to update alert status');
        return;
      }

      setActionSuccess(`Alert #${alertId} updated to ${newStatus}`);
      fetchAlerts();
      if (selectedAlert?.id === alertId) {
        setSelectedAlert((prev: any) => (prev ? { ...prev, status: newStatus } : null));
      }
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Network error updating alert status');
    }
  };

  const handleInspectAlert = async (alertId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSelectedAlert(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch alert detail:', err);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSeverityFilter('');
    setSourceIpFilter('');
    setPage(1);
  };

  const getSeverityBadge = (s: string) => <SeverityTag severity={s} />;

  const getStatusBadge = (s: string) => <StatusTag status={s} />;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        title="Alerts"
        description={<>{totalCount} alerts from Snort telemetry</>}
        actions={<>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            disabled={loading}
            className="text-body flex items-center gap-2 border-white/10"
            title="Refresh alerts"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            <span>Refresh</span>
          </Button>
        </>}
      />

      {actionError && (
        <div className="p-3 bg-red-400/10 border border-red-400/20 rounded-lg text-body text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" strokeWidth={1.5} />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-lg text-body text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={1.5} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search alert title or context"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-body font-mono"
              />
            </div>

            {/* Status Selector */}
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              >
                <option value="">All statuses</option>
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
              </Select>
            </div>

            {/* Severity Selector */}
            <div>
              <Select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              >
                <option value="">All severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Select>
            </div>

            {/* Reset */}
            <div className="flex gap-2">
              <Input
                placeholder="Filter Source IP"
                value={sourceIpFilter}
                onChange={(e) => {
                  setSourceIpFilter(e.target.value);
                  setPage(1);
                }}
                className="text-body font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleResetFilters}
                className="shrink-0 h-9 w-9 text-zinc-400 hover:text-zinc-100"
                title="Reset filters"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">SID</th>
                  <th className="py-3 px-4">Alert title</th>
                  <th className="py-3 px-4">Source &rarr; destination</th>
                  <th className="py-3 px-4">Detected</th>
                  <th className="py-3 px-4 text-right">Quick triage</th>
                  <th className="py-3 px-3 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 font-mono">
                      Loading operational alerts
                    </td>
                  </tr>
                ) : alertsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center space-y-2">
                      <p className="text-zinc-400">No alerts match the active filters.</p>
                      <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-body">
                        Clear filters
                      </Button>
                    </td>
                  </tr>
                ) : (
                  alertsList.map((alertItem) => (
                    <tr key={alertItem.id} className="hover:bg-zinc-900/50 transition-colors group">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getSeverityBadge(alertItem.severity)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(alertItem.status)}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-zinc-300 whitespace-nowrap">
                        {alertItem.signatureId}
                      </td>
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <div className="font-medium text-zinc-200 truncate">
                          {alertItem.title}
                        </div>
                        {alertItem.description && (
                          <div className="text-xs text-zinc-500 truncate">
                            {alertItem.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-400 whitespace-nowrap">
                        <span className="text-zinc-300">{alertItem.sourceIp}</span>
                        <span className="text-zinc-600 px-1">&rarr;</span>
                        <span className="text-zinc-300">{alertItem.destinationIp}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(alertItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        <span className="text-zinc-600">{new Date(alertItem.createdAt).toISOString().split('T')[0]}</span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {canManage ? (
                          <div className="inline-flex items-center gap-2">
                            {alertItem.status === 'NEW' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(alertItem.id, 'IN_PROGRESS')}
                                  className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-300 hover:bg-amber-400/20 text-xs font-mono cursor-pointer"
                                  title="Acknowledge & start triage"
                                >
                                  Ack
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(alertItem.id, 'DISMISSED')}
                                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono cursor-pointer"
                                  title="Dismiss as non-actionable"
                                >
                                  Dismiss
                                </button>
                              </>
                            )}
                            {alertItem.status === 'IN_PROGRESS' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(alertItem.id, 'RESOLVED')}
                                className="px-2 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 hover:bg-emerald-400/20 text-xs font-mono cursor-pointer"
                                title="Mark alert resolved"
                              >
                                Resolve
                              </button>
                            )}
                            {(alertItem.status === 'RESOLVED' || alertItem.status === 'DISMISSED') && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(alertItem.id, 'IN_PROGRESS')}
                                className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono cursor-pointer"
                                title="Reopen alert"
                              >
                                Reopen
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600 font-mono">View only</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInspectAlert(alertItem.id)}
                          className="h-7 px-2 text-body text-zinc-400 hover:text-zinc-100 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                          <span>Inspect</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-body text-zinc-400">
            <div className="flex items-center gap-2">
              <span>Showing page {page} of {totalPages || 1}</span>
              <span className="text-zinc-600">&bull;</span>
              <span>{totalCount} total alerts</span>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded border border-zinc-800 bg-zinc-900 px-2 text-body font-mono text-zinc-300"
              >
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
              </Select>

              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 px-2"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onStatusChange={handleStatusChange}
        canManage={canManage}
      />
    </div>
  );
};
