import React from 'react';

export function Alert({
  className = '',
  variant = 'default',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' | 'success' }) {
  const variants = {
    default: 'bg-zinc-900 border-zinc-800 text-zinc-200',
    destructive: 'bg-red-950 border-red-400/60 text-red-300',
    success: 'bg-emerald-950 border-emerald-400/60 text-emerald-300',
  };

  return (
    <div
      role={variant === 'destructive' ? 'alert' : 'status'}
      className={`relative w-full rounded-md border p-4 text-sm [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
