import React from 'react';
import { fieldBase } from './field.ts';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', ...props }, ref) => (
    <select ref={ref} className={`${fieldBase} h-10 py-1 pointer-coarse:h-11 ${className}`} {...props} />
  )
);
Select.displayName = 'Select';
