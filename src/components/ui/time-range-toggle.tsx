import React from 'react';

export interface TimeRangeToggleProps<T extends string> {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}

export function TimeRangeToggle<T extends string>({ value, options, onChange }: TimeRangeToggleProps<T>) {
  return (
    <div role="group" className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-white/8 bg-zinc-900 p-0.5 font-mono text-xs">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`h-7 cursor-pointer rounded-md px-3 transition-colors ${
            value === option
              ? 'bg-zinc-800 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
              : 'text-zinc-500 hover:text-zinc-200'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
