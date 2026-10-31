import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { SeverityTag, StatusTag } from '../ui/tags.tsx';
import { Button } from '../ui/button.tsx';
import { X, ShieldAlert, Unlink, FileCheck, MessageSquare, Terminal, ShieldCheck, Archive, Send, Link as LinkIcon } from 'lucide-react';
import { Select } from '../ui/select.tsx';
import { Modal } from '../ui/modal.tsx';
import type { IncidentStatus, InvestigationEntryType } from '../../db/schema.ts';

export interface IncidentDetailModalProps {
  incident: any | null;
  onClose: () => void;
  onStatusChange: (incidentId: number, newStatus: IncidentStatus, resolutionSummary?: string) => void;
  onAssign?: (incidentId: number, assigneeId: number | null) => void;
  onUnlinkAlert: (incidentId: number, alertId: number) => void;
  onLinkAlerts: (incidentId: number, alertIds: number[]) => void;
  canManage?: boolean;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onStatusChange,
  onAssign,
  onUnlinkAlert,
  canManage = false,
}) => {
  const { token } = useAuth();

  // Resolution state
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  // Assignment editing state
  const [isChangingAssignee, setIsChangingAssignee] = useState(false);
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);

  // Investigation timeline state
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryType, setNewEntryType] = useState<InvestigationEntryType>('NOTE');
  const [submittingEntry, setSubmittingEntry] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // Fetch operators eligible for assignment (ADMIN and ANALYST)
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json.data) {
          const eligible = json.data.filter((u: any) => u.isActive && (u.role === 'ADMIN' || u.role === 'ANALYST'));
          setEligibleUsers(eligible);
        }
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!incident?.id || !token) return;
    setLoadingInv(true);
    fetch(`/api/incidents/${incident.id}/investigations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success) {
          setInvestigations(json.data || []);
        }
      })
      .catch((err) => console.error('Failed to load investigation entries:', err))
      .finally(() => setLoadingInv(false));
  }, [incident?.id, token]);

  if (!incident) return null;

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryContent.trim() || !token) return;

    setSubmittingEntry(true);
    setEntryError(null);
    try {
      const res = await fetch(`/api/incidents/${incident.id}/investigations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          entryType: newEntryType,
          content: newEntryContent.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add investigation entry');
      }

      setInvestigations((prev) => [...prev, json.data]);
      setNewEntryContent('');
    } catch (err: any) {
      setEntryError(err.message || 'Error recording entry');
    } finally {
      setSubmittingEntry(false);
    }
  };

  const getSeverityBadge = (s: string) => <SeverityTag severity={s} />;

  const getStatusBadge = (s: string) => <StatusTag status={s} />;

  const getEntryBadge = (type: InvestigationEntryType) => {
    switch (type) {
      case 'ACTION_TAKEN':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-950/70 border border-accent/20 text-sky-400 text-xs font-mono">
            <Terminal className="h-4 w-4" strokeWidth={1.5} /> Action
          </span>
        );
      case 'CONTAINMENT':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-400/20 text-amber-400 text-xs font-mono">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.5} /> Containment
          </span>
        );
      case 'EVIDENCE':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800/60 text-purple-400 text-xs font-mono">
            <Archive className="h-4 w-4" strokeWidth={1.5} /> Evidence
          </span>
        );
      case 'NOTE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-mono">
            <MessageSquare className="h-4 w-4" strokeWidth={1.5} /> Note
          </span>
        );
    }
  };

  const handleConfirmResolve = (targetStatus: IncidentStatus) => {
    if (!resolutionSummary.trim()) {
      setResolutionError('A resolution summary is required to resolve or close an incident.');
      return;
    }
    onStatusChange(incident.id, targetStatus, resolutionSummary.trim());
    setIsResolving(false);
    setResolutionSummary('');
    setResolutionError(null);
  };

  return (
    <Modal size="3xl" onClose={onClose}>
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
              <span className="font-mono text-body text-zinc-400">Incident #{incident.id}</span>
              {getSeverityBadge(incident.severity)}
              {getStatusBadge(incident.status)}
            </div>
            <h2 className="text-base font-medium text-zinc-100 pt-1">
              {incident.title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-zinc-400 hover:text-zinc-100 -mr-2 -mt-2"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4 text-body">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border border-zinc-800 font-mono">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 block">Assignee</span>
                {canManage && onAssign && !isChangingAssignee && (
                  <button
                    type="button"
                    onClick={() => setIsChangingAssignee(true)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                  >
                    Change
                  </button>
                )}
              </div>
              {isChangingAssignee ? (
                <div className="mt-1 flex items-center gap-1">
                  <Select
                    defaultValue={incident.assignedTo || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      onAssign && onAssign(incident.id, val);
                      setIsChangingAssignee(false);
                    }}
                    className="h-6 text-xs bg-zinc-950 border border-white/10 rounded px-1 text-zinc-200 font-mono w-full"
                  >
                    <option value="">Unassigned</option>
                    {eligibleUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email} ({u.role.charAt(0) + u.role.slice(1).toLowerCase()})
                      </option>
                    ))}
                  </Select>
                  <button
                    type="button"
                    onClick={() => setIsChangingAssignee(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span className="text-zinc-200 font-medium truncate block">
                  {incident.assignee ? incident.assignee.email : 'Unassigned'}
                </span>
              )}
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">Created by</span>
              <span className="text-zinc-300">
                {incident.creator ? incident.creator.email : 'System/Bootstrap'}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">Declared time</span>
              <span className="text-zinc-300 font-mono">
                {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                <span className="text-zinc-500">{new Date(incident.createdAt).toISOString().split('T')[0]}</span>
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">Resolved at</span>
              <span className="text-emerald-400 font-mono">
                {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-lg border border-zinc-800 space-y-1">
            <span className="text-xs text-zinc-500 font-mono block">Scope & initial assessment</span>
            <p className="text-zinc-300 font-medium leading-relaxed">{incident.description}</p>
          </div>

          {/* Resolution Summary if present */}
          {incident.resolutionSummary && (
            <div className="p-4 bg-emerald-950/20 rounded-lg border border-emerald-400/20 space-y-1">
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-2">
                <FileCheck className="h-4 w-4" strokeWidth={1.5} /> Resolution summary
              </span>
              <p className="text-emerald-200 font-medium leading-relaxed">{incident.resolutionSummary}</p>
            </div>
          )}

          {/* Linked Alerts Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                ASSOCIATED CORRELATED ALERTS ({incident.alerts?.length || 0})
              </span>
            </div>

            {(!incident.alerts || incident.alerts.length === 0) ? (
              <div className="p-3 rounded-lg border border-zinc-800/80 text-center text-zinc-500 font-mono text-xs">
                No alerts currently linked to this incident.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800 overflow-hidden">
                {incident.alerts.map((al: any) => (
                  <div key={al.id} className="p-3 flex items-center justify-between gap-3 text-body">
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-400 font-medium">#{al.id}</span>
                        <span className="font-mono text-xs text-zinc-500">[SID:{al.signatureId}]</span>
                        <span className="font-medium text-zinc-200 truncate">{al.title}</span>
                      </div>
                      <div className="font-mono text-xs text-zinc-500">
                        {al.sourceIp} &rarr; {al.destinationIp}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs text-zinc-400">{al.severity}</span>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onUnlinkAlert(incident.id, al.id)}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                          title="Unlink alert from this incident"
                        >
                          <Unlink className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Investigation Findings Timeline */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                INVESTIGATION TIMELINE & FORENSIC FINDINGS ({investigations.length})
              </span>
            </div>

            {loadingInv ? (
              <div className="p-4 text-center text-zinc-500 font-mono text-xs">
                Loading investigation timeline
              </div>
            ) : investigations.length === 0 ? (
              <div className="p-4 rounded-lg border border-zinc-800/80 text-center text-zinc-500 font-mono text-xs">
                No investigation findings recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {investigations.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-lg border border-zinc-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getEntryBadge(entry.entryType)}
                        <span className="font-mono text-xs text-zinc-300">
                          {entry.author ? entry.author.email : 'System/Bootstrap'}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-zinc-500">
                        {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        {new Date(entry.createdAt).toISOString().split('T')[0]}
                      </span>
                    </div>
                    <p className="text-zinc-200 text-body pl-0.5 leading-relaxed font-sans whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Append Investigation Finding Form */}
            {canManage && (
              <form onSubmit={handleAddEntry} className="pt-2 space-y-2">
                {entryError && (
                  <p className="text-red-400 text-xs font-mono">{entryError}</p>
                )}
                <div className="flex items-center gap-2">
                  <Select
                    value={newEntryType}
                    onChange={(e) => setNewEntryType(e.target.value as InvestigationEntryType)}
                    className="h-8 rounded border border-white/10 bg-zinc-900 px-2 text-body font-mono text-zinc-200"
                  >
                    <option value="NOTE">Note (General finding)</option>
                    <option value="ACTION_TAKEN">Action (Remediation step)</option>
                    <option value="CONTAINMENT">Containment (Host/Net isolation)</option>
                    <option value="EVIDENCE">Evidence (Packet/Log artifact)</option>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={newEntryContent}
                    onChange={(e) => setNewEntryContent(e.target.value)}
                    placeholder="Record analytical observation, remediation action, or forensic note"
                    rows={2}
                    required
                    className="flex-1 rounded border border-white/10 bg-zinc-950 p-2 text-body text-zinc-100"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submittingEntry || !newEntryContent.trim()}
                    className="self-end text-body flex items-center gap-2 h-9"
                  >
                    <Send className="h-4 w-4" strokeWidth={1.5} />
                    <span>Post</span>
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Resolution Prompt Form */}
          {isResolving && (
            <div className="p-3 bg-zinc-900/80 rounded-lg border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-body font-medium text-zinc-200">Incident resolution notes</span>
                <button
                  type="button"
                  onClick={() => setIsResolving(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-body"
                >
                  Cancel
                </button>
              </div>
              {resolutionError && (
                <p className="text-red-400 text-xs">{resolutionError}</p>
              )}
              <textarea
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                placeholder="Detail containment actions taken, root cause findings, and perimeter adjustments"
                rows={2}
                className="w-full rounded border border-white/10 bg-zinc-950 p-2 text-body text-zinc-100"
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  onClick={() => handleConfirmResolve('RESOLVED')}
                  className="text-body bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Mark as resolved
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConfirmResolve('CLOSED')}
                  className="text-body"
                >
                  Close incident
                </Button>
              </div>
            </div>
          )}

          {/* Incident Lifecycle Action Buttons */}
          {canManage && !isResolving && (
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-mono text-zinc-400">Lifecycle State Actions:</span>
              <div className="flex items-center gap-2">
                {incident.status === 'OPEN' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(incident.id, 'INVESTIGATING')}
                    className="text-body text-amber-300 hover:text-amber-200"
                  >
                    Start investigation
                  </Button>
                )}

                {incident.status === 'INVESTIGATING' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusChange(incident.id, 'CONTAINED')}
                      className="text-body text-sky-300 hover:text-sky-200"
                    >
                      Mark contained
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsResolving(true)}
                      className="text-body text-emerald-300 hover:text-emerald-200"
                    >
                      Resolve incident
                    </Button>
                  </>
                )}

                {incident.status === 'CONTAINED' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusChange(incident.id, 'INVESTIGATING')}
                      className="text-body text-zinc-300 hover:text-zinc-100"
                    >
                      Resume investigation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsResolving(true)}
                      className="text-body text-emerald-300 hover:text-emerald-200"
                    >
                      Resolve incident
                    </Button>
                  </>
                )}

                {incident.status === 'RESOLVED' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusChange(incident.id, 'CLOSED')}
                      className="text-body text-zinc-300 hover:text-zinc-100"
                    >
                      Close incident
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onStatusChange(incident.id, 'INVESTIGATING')}
                      className="text-body text-amber-400 hover:text-amber-300"
                    >
                      Reopen incident
                    </Button>
                  </>
                )}

                {incident.status === 'CLOSED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(incident.id, 'INVESTIGATING')}
                    className="text-body text-amber-400 hover:text-amber-300"
                  >
                    Reopen incident
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <Button size="sm" onClick={onClose} className="text-body">
            Close
          </Button>
        </div>
    </Modal>
  );
};
