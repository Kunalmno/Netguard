import React from 'react';
import { StatusDot, type Tone } from './status-dot.tsx';

function Tag({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-zinc-300">
      <StatusDot tone={tone} />
      {children}
    </span>
  );
}

const severityMap: Record<string, { label: string; tone: Tone }> = {
  SEV1: { label: 'SEV1 · Critical', tone: 'negative' },
  CRITICAL: { label: 'Critical', tone: 'negative' },
  SEV2: { label: 'SEV2 · High', tone: 'warning' },
  HIGH: { label: 'High', tone: 'warning' },
  SEV3: { label: 'SEV3 · Medium', tone: 'neutral' },
  MEDIUM: { label: 'Medium', tone: 'neutral' },
  SEV4: { label: 'SEV4 · Low', tone: 'muted' },
  LOW: { label: 'Low', tone: 'muted' },
};

/** Critical and high carry color. Medium and low stay neutral so they do not compete. */
export function SeverityTag({ severity }: { severity: string }) {
  const entry = severityMap[severity] ?? severityMap.LOW;
  return <Tag tone={entry.tone}>{entry.label}</Tag>;
}

const statusMap: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: 'Open', tone: 'negative' },
  NEW: { label: 'New', tone: 'negative' },
  INVESTIGATING: { label: 'Investigating', tone: 'warning' },
  IN_PROGRESS: { label: 'In progress', tone: 'warning' },
  CONTAINED: { label: 'Contained', tone: 'accent' },
  RESOLVED: { label: 'Resolved', tone: 'positive' },
  CLOSED: { label: 'Closed', tone: 'muted' },
  DISMISSED: { label: 'Dismissed', tone: 'muted' },
};

export function StatusTag({ status }: { status: string }) {
  const entry = statusMap[status] ?? { label: status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' '), tone: 'muted' as Tone };
  return <Tag tone={entry.tone}>{entry.label}</Tag>;
}

/** Snort priority: 1 is the most urgent. */
export function PriorityTag({ priority }: { priority: number }) {
  switch (priority) {
    case 1:
      return <Tag tone="negative">High (1)</Tag>;
    case 2:
      return <Tag tone="warning">Medium (2)</Tag>;
    case 3:
      return <Tag tone="neutral">Low (3)</Tag>;
    default:
      return <Tag tone="muted">Info ({priority})</Tag>;
  }
}
