import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { Card, CardContent } from '../ui/card.tsx';
import { SeverityTag, StatusTag } from '../ui/tags.tsx';
import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { CreateIncidentModal } from './CreateIncidentModal.tsx';
import { IncidentDetailModal } from './IncidentDetailModal.tsx';
import { Search, PlusCircle, RefreshCw, Eye, ChevronLeft, ChevronRight, RotateCcw, CheckCircle, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Select } from '../ui/select.tsx';
import { Table } from '../ui/table.tsx';
import { PageHeader } from '../ui/page-header.tsx';
import type { IncidentStatus } from '../../db/schema.ts';

export const IncidentsView: React.FC = () => {
  const { token, user } = useAuth();
  const { subscribe } = useRealtime();

  // Data & Pagination
  const [incidentsList, setIncidentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');

  // Modals & Notifications
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  const fetchIncidents = useCallback(async () => {
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

      const res = await fetch(`/api/incidents?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setIncidentsList(json.data || []);
          if (json.pagination) {
            setTotalCount(json.pagination.total);
            setTotalPages(json.pagination.totalPages);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, search, statusFilter, severityFilter]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Realtime subscription for live incident updates
  useEffect(() => {
    const unsubscribe = subscribe('*', (msg) => {
      if (
        msg.event === 'incident:created' ||
        msg.event === 'incident:status_changed' ||
        msg.event === 'incident:assigned' ||
        msg.event === 'investigation:entry_added' ||
        msg.event === 'gateway:resync_required'
      ) {
        fetchIncidents();
      }
    });
    return unsubscribe;
  }, [subscribe, fetchIncidents]);

  const handleInspectIncident = async (incidentId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSelectedIncident(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch incident detail:', err);
    }
  };

  const handleStatusChange = async (incidentId: number, newStatus: IncidentStatus, resolutionSummary?: string) => {
    if (!token) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      const isResolve = newStatus === 'RESOLVED' || newStatus === 'CLOSED';
      const endpoint = isResolve ? `/api/incidents/${incidentId}/resolve` : `/api/incidents/${incidentId}/status`;
      const body = isResolve
        ? { resolutionSummary, status: newStatus }
        : { status: newStatus };

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error || 'Failed to update incident status');
        return;
      }

      setActionSuccess(`Incident #${incidentId} status transitioned to ${newStatus}`);
      fetchIncidents();
      handleInspectIncident(incidentId);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Error updating incident status');
    }
  };

  const handleAssignIncident = async (incidentId: number, assigneeId: number | null) => {
    if (!token) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignedTo: assigneeId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error || 'Failed to update assignment');
        return;
      }
      setActionSuccess(`Incident #${incidentId} assignment updated.`);
      fetchIncidents();
      handleInspectIncident(incidentId);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Error updating assignment');
    }
  };

  const handleUnlinkAlert = async (incidentId: number, alertId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/incidents/${incidentId}/alerts/${alertId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        handleInspectIncident(incidentId);
        fetchIncidents();
      }
    } catch (err) {
      console.error('Failed to unlink alert:', err);
    }
  };

  const handleLinkAlerts = async (incidentId: number, alertIds: number[]) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/incidents/${incidentId}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alertIds }),
      });
      if (res.ok) {
        handleInspectIncident(incidentId);
        fetchIncidents();
      }
    } catch (err) {
      console.error('Failed to link alerts:', err);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSeverityFilter('');
    setPage(1);
  };

  const getSeverityBadge = (s: string) => <SeverityTag severity={s} />;

  const getStatusBadge = (s: string) => <StatusTag status={s} />;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        title="Incidents"
        description={<>{totalCount} response cases</>}
        actions={<>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIncidents}
            disabled={loading}
            className="text-body flex items-center gap-2 border-white/10"
            title="Refresh incidents"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            <span>Refresh</span>
          </Button>

          {canManage && (
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="text-body flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" strokeWidth={1.5} />
              <span>Declare incident</span>
            </Button>
          )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search incident title, scope, or resolution summary"
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
                <option value="OPEN">Open</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="CONTAINED">Contained</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </Select>
            </div>

            {/* Severity Selector */}
            <div className="flex gap-2">
              <Select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              >
                <option value="">All severities</option>
                <option value="SEV1">SEV1 (Critical)</option>
                <option value="SEV2">SEV2 (High)</option>
                <option value="SEV3">SEV3 (Medium)</option>
                <option value="SEV4">SEV4 (Low)</option>
              </Select>

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

      {/* Incidents Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-4">Incident case title & scope</th>
                  <th className="py-3 px-3">Alerts</th>
                  <th className="py-3 px-4">Lead assignee</th>
                  <th className="py-3 px-4">Declared</th>
                  <th className="py-3 px-3 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 font-mono">
                      Loading security incidents
                    </td>
                  </tr>
                ) : incidentsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center space-y-2">
                      <p className="text-zinc-400">No security incidents match the active filters.</p>
                      <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-body">
                        Clear filters
                      </Button>
                    </td>
                  </tr>
                ) : (
                  incidentsList.map((inc) => (
                    <tr key={inc.id} className="hover:bg-zinc-900/50 transition-colors group">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getSeverityBadge(inc.severity)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(inc.status)}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-zinc-300 whitespace-nowrap">
                        #{inc.id}
                      </td>
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <div className="font-medium text-zinc-100 truncate">
                          {inc.title}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">
                          {inc.description}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs">
                          <LinkIcon className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                          {inc.alertCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs">
                        {inc.assignee ? (
                          <span className="text-zinc-300">{inc.assignee.email}</span>
                        ) : (
                          <span className="text-amber-400 font-sans italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        <span className="text-zinc-600">{new Date(inc.createdAt).toISOString().split('T')[0]}</span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInspectIncident(inc.id)}
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
              <span>{totalCount} total incidents</span>
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

      {/* Modals */}
      <CreateIncidentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchIncidents()}
      />

      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onStatusChange={handleStatusChange}
        onAssign={handleAssignIncident}
        onUnlinkAlert={handleUnlinkAlert}
        onLinkAlerts={handleLinkAlerts}
        canManage={canManage}
      />
    </div>
  );
};
