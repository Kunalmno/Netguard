import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

/** Status badge. Always carries a text label; use <SeverityBadge> for severity levels. */
export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-zinc-100 text-zinc-900 border border-transparent',
    secondary: 'bg-zinc-800 text-zinc-200 border border-zinc-600',
    destructive: 'bg-red-950 text-red-400 border border-red-400/60',
    success: 'bg-emerald-950 text-emerald-400 border border-emerald-400/60',
    warning: 'bg-amber-950 text-amber-400 border border-amber-400/60',
    info: 'bg-sky-950 text-sky-400 border border-sky-400/60',
    outline: 'text-zinc-300 border border-zinc-700',
  };

  return (
    <div
      className={`inline-flex items-center rounded-4xl px-5 py-0.5 text-xs font-semibold font-mono whitespace-nowrap ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
