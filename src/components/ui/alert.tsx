import React from 'react';

export function Alert({
  className = '',
  variant = 'default',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' | 'success' }) {
  const variants = {
    default: 'bg-zinc-800/60 border-white/10 text-zinc-200',
    destructive: 'bg-red-400/10 border-red-400/20 text-red-300',
    success: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-300',
  };

  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border px-4 py-3 text-body ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
