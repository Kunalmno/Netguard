import React from 'react';
import { fieldBase } from './field.ts';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => (
    <textarea ref={ref} className={`${fieldBase} min-h-20 py-2 ${className}`} {...props} />
  )
);
Textarea.displayName = 'Textarea';
