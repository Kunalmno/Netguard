import React from 'react';
import { fieldBase } from './field.ts';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type, ...props }, ref) => (
    <input
      type={type}
      className={`${fieldBase} h-10 py-1 pointer-coarse:h-11 file:border-0 file:bg-transparent file:text-sm file:font-medium ${className}`}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';
