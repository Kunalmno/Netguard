import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', type = 'button', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 cursor-pointer pointer-coarse:min-h-11 pointer-coarse:min-w-11';

    const variants = {
      default: 'bg-accent text-on-accent font-semibold border border-accent hover:brightness-110 active:brightness-95',
      destructive: 'bg-red-950 text-red-400 border border-red-400/60 hover:bg-red-400 hover:text-zinc-950',
      outline: 'border border-zinc-700 bg-transparent hover:bg-zinc-800 hover:text-zinc-50 text-zinc-300',
      secondary: 'bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700',
      ghost: 'hover:bg-zinc-800 hover:text-zinc-50 text-zinc-300',
      link: 'text-zinc-300 underline underline-offset-4 hover:text-zinc-50',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-11 px-8',
      icon: 'h-9 w-9',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
