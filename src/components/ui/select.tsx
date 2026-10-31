import React from 'react';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', ...props }, ref) => (
    <select
      ref={ref}
      className={`h-9 w-full rounded-lg border border-white/10 bg-zinc-800/60 px-3 text-body text-zinc-100 transition-colors hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
);
Select.displayName = 'Select';
