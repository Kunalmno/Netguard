import React from 'react';
import { SeverityTag, StatusTag } from '../ui/tags.tsx';
import { Button } from '../ui/button.tsx';
import { X, ShieldAlert, ArrowRight, Network, FileText } from 'lucide-react';
import { Modal } from '../ui/modal.tsx';
import type { AlertStatus } from '../../db/schema.ts';

export interface AlertDetailModalProps {
  alert: any | null;
  onClose: () => void;
  onStatusChange?: (alertId: number, newStatus: AlertStatus) => void;
  canManage?: boolean;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  onClose,
  onStatusChange,
  canManage = false,
}) => {
  if (!alert) return null;

  const getSeverityBadge = (s: string) => <SeverityTag severity={s} />;

  const getStatusBadge = (s: string) => <StatusTag status={s} />;

  return (
    <Modal size="2xl" onClose={onClose}>
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
              <span className="font-mono text-body text-zinc-400">Alert #{alert.id}</span>
              {getSeverityBadge(alert.severity)}
              {getStatusBadge(alert.status)}
            </div>
            <h2 className="text-base font-medium text-zinc-100 pt-1">
              {alert.title}
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
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border border-zinc-800 font-mono">
            <div>
              <span className="text-xs text-zinc-500 block">Signature ID (SID)</span>
              <span className="text-zinc-200 font-medium">{alert.signatureId}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">Status</span>
              <span className="text-zinc-200">{getStatusBadge(alert.status)}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">Created</span>
              <span className="text-zinc-300">{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">Source event</span>
              <span className="text-sky-400">{alert.securityEventId ? `#${alert.securityEventId}` : 'Manual'}</span>
            </div>
          </div>

          {/* Traffic Path */}
          <div className="space-y-2 p-4 rounded-lg border border-zinc-800 font-mono">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
              <Network className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
              <span>Network traffic vector</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-body">
              <div className="space-y-0.5">
                <span className="text-xs text-zinc-500 block">Source host</span>
                <span className="text-zinc-100 font-medium">{alert.sourceIp}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-600 hidden sm:block shrink-0" strokeWidth={1.5} />
              <div className="space-y-0.5 sm:text-right">
                <span className="text-xs text-zinc-500 block">Destination host</span>
                <span className="text-zinc-100 font-medium">{alert.destinationIp}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {alert.description && (
            <div className="p-3 rounded-lg border border-zinc-800 space-y-1">
              <span className="text-xs text-zinc-500 font-mono block">Context / description</span>
              <p className="text-zinc-300 font-medium leading-relaxed">{alert.description}</p>
            </div>
          )}

          {/* Source Raw Event Snippet if linked */}
          {alert.sourceEvent && (
            <div className="space-y-2 p-3 rounded-lg border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                  ORIGINATING SNORT TELEMETRY EVENT #{alert.sourceEvent.id}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {alert.sourceEvent.protocol} {alert.sourceEvent.sourcePort ? `:${alert.sourceEvent.sourcePort}` : ''}
                </span>
              </div>
              {alert.sourceEvent.rawPayload && (
                <pre className="p-3 rounded bg-zinc-950 border border-zinc-800/80 font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all max-h-28">
                  {alert.sourceEvent.rawPayload}
                </pre>
              )}
            </div>
          )}

          {/* Status Quick Action Controls for Analysts/Admins */}
          {canManage && onStatusChange && (
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400">Transition Status:</span>
              <div className="flex items-center gap-2">
                {alert.status === 'NEW' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusChange(alert.id, 'IN_PROGRESS')}
                      className="text-body text-amber-300 hover:text-amber-200"
                    >
                      Acknowledge (In progress)
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onStatusChange(alert.id, 'DISMISSED')}
                      className="text-body text-zinc-400 hover:text-zinc-200"
                    >
                      Dismiss
                    </Button>
                  </>
                )}
                {alert.status === 'IN_PROGRESS' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStatusChange(alert.id, 'RESOLVED')}
                      className="text-body text-emerald-300 hover:text-emerald-200"
                    >
                      Mark resolved
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onStatusChange(alert.id, 'DISMISSED')}
                      className="text-body text-zinc-400 hover:text-zinc-200"
                    >
                      Dismiss
                    </Button>
                  </>
                )}
                {(alert.status === 'RESOLVED' || alert.status === 'DISMISSED') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(alert.id, 'IN_PROGRESS')}
                    className="text-body text-zinc-300 hover:text-zinc-100"
                  >
                    Reopen alert
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
