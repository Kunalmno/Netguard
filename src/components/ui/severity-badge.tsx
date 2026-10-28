import React from 'react';

type Level = 'critical' | 'high' | 'medium' | 'low';

const LEVELS: Record<Level, { label: string; cls: string; shape: string }> = {
  critical: { label: 'CRITICAL', cls: 'text-red-400 bg-red-950 border-red-400/60', shape: '[clip-path:none]' },
  high: { label: 'HIGH', cls: 'text-amber-400 bg-amber-950 border-amber-400/60', shape: '[clip-path:polygon(50%_0,100%_100%,0_100%)]' },
  medium: { label: 'MEDIUM', cls: 'text-yellow-300 bg-yellow-950 border-yellow-300/50', shape: '[clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]' },
  low: { label: 'LOW', cls: 'text-sky-400 bg-sky-950 border-sky-400/60', shape: 'rounded-full' },
};

/** Accepts SEV1..SEV4 or CRITICAL/HIGH/MEDIUM/LOW */
export function normalizeSeverity(raw?: string | null): Level {
  switch ((raw || '').toUpperCase()) {
    case 'SEV1':
    case 'CRITICAL':
      return 'critical';
    case 'SEV2':
    case 'HIGH':
      return 'high';
    case 'SEV3':
    case 'MEDIUM':
      return 'medium';
    default:
      return 'low';
  }
}

/**
 * Severity is never colour-only: each level has its own shape marker AND a text label.
 */
export function SeverityBadge({ severity, className = '' }: { severity?: string | null; className?: string }) {
  const level = LEVELS[normalizeSeverity(severity)];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-semibold font-mono whitespace-nowrap ${level.cls} ${className}`}
    >
      <span aria-hidden="true" className={`inline-block h-2 w-2 bg-current ${level.shape}`} />
      {level.label}
    </span>
  );
}
