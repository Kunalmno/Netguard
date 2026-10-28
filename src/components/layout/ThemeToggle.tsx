import React, { useState } from 'react';
import { applyTheme, getStoredTheme, type ThemeChoice } from './theme.ts';

const OPTIONS: { value: ThemeChoice; label: string; hint: string }[] = [
  { value: 'system', label: 'Auto', hint: 'Match system' },
  { value: 'light', label: 'Light', hint: 'Light theme' },
  { value: 'dark', label: 'Dark', hint: 'Dark theme' },
];

/** Three-state System / Light / Dark switch. */
export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<ThemeChoice>(() => getStoredTheme());

  const choose = (t: ThemeChoice) => {
    setTheme(t);
    applyTheme(t);
  };

  return (
    <div role="group" aria-label="Theme" className="inline-flex rounded-md border border-zinc-800 divide-x divide-zinc-800">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.hint}
          aria-pressed={theme === o.value}
          onClick={() => choose(o.value)}
          className={`px-2.5 h-8 pointer-coarse:h-11 text-xs font-mono cursor-pointer transition-colors ${
            theme === o.value ? 'bg-zinc-100 text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};
