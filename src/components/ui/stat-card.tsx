import React from 'react';
import { Card } from './card.tsx';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  /** One muted line of real context, for example "3 unassigned". */
  context?: React.ReactNode;
  onClick?: () => void;
}

/** A label, a big figure and one line of context. No icons, no sparklines. */
export function StatCard({ label, value, context, onClick }: StatCardProps) {
  const body = (
    <>
      <span className="text-body text-zinc-400">{label}</span>
      <span className="mt-3 block font-mono text-[32px] font-medium leading-none text-zinc-100">{value}</span>
      <span className="mt-3 block min-h-5 truncate text-xs text-zinc-500">{context}</span>
    </>
  );

  if (!onClick) return <Card className="p-5">{body}</Card>;

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full cursor-pointer rounded-xl border border-white/8 bg-zinc-900 p-5 text-left transition-colors hover:bg-zinc-800/70"
    >
      {body}
    </button>
  );
}
