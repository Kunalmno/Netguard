import React from 'react';
import { PriorityTag } from '../ui/tags.tsx';
import { Button } from '../ui/button.tsx';
import { X, Copy, Check, ShieldAlert, ArrowRight, Network, FileText } from 'lucide-react';
import { Modal } from '../ui/modal.tsx';

export interface EventDetailModalProps {
  event: any | null;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!event) return null;

  const handleCopyPayload = () => {
    if (event.rawPayload) {
      navigator.clipboard.writeText(event.rawPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPriorityBadge = (s: number) => <PriorityTag priority={s} />;

  return (
    <Modal size="2xl" onClose={onClose}>
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
              <span className="font-mono text-body text-zinc-400">Telemetry record #{event.id}</span>
              {getPriorityBadge(event.priority)}
            </div>
            <h2 className="text-base font-medium text-zinc-100 pt-1">
              {event.signatureMessage}
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
        <div className="py-4 space-y-5 text-body">
          {/* Snort Signature Identifiers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border border-zinc-800/80 font-mono">
            <div>
              <span className="text-xs text-zinc-500 block">Signature ID (SID)</span>
              <span className="text-zinc-200 font-medium">{event.signatureId}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">Generator ID (gid)</span>
              <span className="text-zinc-200">{event.generatorId}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">Revision</span>
              <span className="text-zinc-200">{event.signatureRevision}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">Protocol</span>
              <span className="text-zinc-200 font-medium text-sky-400">{event.protocol}</span>
            </div>
          </div>

          {/* Network Path */}
          <div className="space-y-2 p-4 rounded-lg border border-zinc-800/80">
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs mb-2">
              <Network className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
              <span>Network traffic vector</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-body font-mono">
              <div className="space-y-0.5">
                <span className="text-xs text-zinc-500 block">Source IP & port</span>
                <span className="text-zinc-100 font-medium">
                  {event.sourceIp}
                  {event.sourcePort !== null && (
                    <span className="text-zinc-400">:{event.sourcePort}</span>
                  )}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-600 hidden sm:block shrink-0" strokeWidth={1.5} />
              <div className="space-y-0.5 sm:text-right">
                <span className="text-xs text-zinc-500 block">Destination IP & port</span>
                <span className="text-zinc-100 font-medium">
                  {event.destinationIp}
                  {event.destinationPort !== null && (
                    <span className="text-zinc-400">:{event.destinationPort}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Classification & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-zinc-800/80 space-y-1">
              <span className="text-xs text-zinc-500 font-mono block">Classification</span>
              <span className="text-zinc-300 font-medium">{event.classification || 'None specified'}</span>
            </div>
            <div className="p-3 rounded-lg border border-zinc-800/80 space-y-1">
              <span className="text-xs text-zinc-500 font-mono block">Detected timestamp</span>
              <span className="text-zinc-300 font-mono">{new Date(event.timestamp).toUTCString()}</span>
            </div>
          </div>

          {/* Raw Payload Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                Raw packet telemetry payload
              </span>
              {event.rawPayload && (
                <button
                  onClick={handleCopyPayload}
                  className="flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" strokeWidth={1.5} />
                      <span>Copy payload</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all max-h-36">
              {event.rawPayload || '// No raw packet payload attached to this alert'}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <Button size="sm" onClick={onClose} className="text-body">
            Close inspector
          </Button>
        </div>
    </Modal>
  );
};
