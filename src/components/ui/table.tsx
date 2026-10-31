import React from 'react';

/**
 * Shared table styling: sentence-case muted headers, hairline rows,
 * one row height. Pass plain <thead>, <tbody>, <tr>, <th>, <td>.
 */
export function Table({ className = '', ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={`w-full border-collapse text-left text-body
        [&_thead_tr]:border-b [&_thead_tr]:border-white/8
        [&_th]:h-10 [&_th]:px-4 [&_th]:py-0 [&_th]:text-xs [&_th]:font-normal [&_th]:text-zinc-500
        [&_tbody]:divide-y [&_tbody]:divide-white/6
        [&_tbody_td]:px-4 [&_tbody_td]:py-3
        ${className}`}
      {...props}
    />
  );
}
