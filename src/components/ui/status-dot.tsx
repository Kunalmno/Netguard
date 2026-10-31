import React from 'react';

export type Tone = 'positive' | 'warning' | 'negative' | 'accent' | 'neutral' | 'muted';

export const toneDot: Record<Tone, string> = {
  positive: 'bg-emerald-400',
  warning: 'bg-amber-400',
  negative: 'bg-red-400',
  accent: 'bg-accent',
  neutral: 'bg-zinc-300',
  muted: 'bg-zinc-600',
};

/**
 * NetGuard's signature detail: a flat status dot.
 * Static on purpose, it only changes color when the state changes.
 */
export function StatusDot({ tone = 'neutral', className = '' }: { tone?: Tone; className?: string }) {
  return <span aria-hidden className={`inline-block h-2 w-2 shrink-0 rounded-full ${toneDot[tone]} ${className}`} />;
}
