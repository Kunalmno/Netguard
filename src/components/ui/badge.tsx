import React from 'react';
import { StatusDot, type Tone } from './status-dot.tsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

const variantTone: Record<NonNullable<BadgeProps['variant']>, Tone> = {
  default: 'neutral',
  secondary: 'muted',
  destructive: 'negative',
  success: 'positive',
  warning: 'warning',
  info: 'accent',
  outline: 'muted',
};

/** IN_PROGRESS -> In progress, ADMIN -> Admin */
export function humanize(value: string): string {
  const spaced = value.replace(/_/g, ' ').trim();
  if (!spaced) return spaced;
  // keep short codes such as SEV1, SID, IP and acronyms with digits readable
  if (/^[A-Z]{2,4}\d+$/.test(spaced)) return spaced;
  const lower = spaced.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** A quiet status tag: a dot and sentence-case text, no filled pill. */
export function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  const content = React.Children.map(children, (child) => (typeof child === 'string' ? humanize(child) : child));
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-zinc-300 ${className}`}
      {...props}
    >
      <StatusDot tone={variantTone[variant]} />
      {content}
    </span>
  );
}
