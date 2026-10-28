export type ThemeChoice = 'system' | 'light' | 'dark';
const KEY = 'ng-theme';

export function getStoredTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch { /* storage unavailable */ }
  return 'dark'; // SOC default; user can switch to Auto/Light
}

export function applyTheme(t: ThemeChoice) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
}

/** Call once before first render so there is no flash of the wrong theme. */
export function initTheme() {
  document.documentElement.dataset.theme = getStoredTheme();
}
