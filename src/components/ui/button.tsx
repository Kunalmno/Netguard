import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-body font-medium transition-[color,background-color,border-color,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

    const variants = {
      default: 'bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:bg-accent-hover',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      outline: 'border border-white/10 bg-zinc-800 text-zinc-100 hover:bg-zinc-700/70',
      secondary: 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700/70',
      ghost: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
      link: 'text-zinc-300 underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-9 px-4',
      sm: 'h-8 px-3',
      lg: 'h-10 px-5',
      icon: 'h-8 w-8',
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
