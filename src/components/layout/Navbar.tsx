import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';
import { Activity, Users, FileCode2, LogOut, ShieldAlert, Bell, Flame, Menu, X } from 'lucide-react';

export type TabId = 'overview' | 'alerts' | 'incidents' | 'events' | 'admin' | 'docs';

export interface NavbarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();
  const { status: realtimeStatus, reconnect } = useRealtime();
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs: { id: TabId; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: 'overview', label: 'Dashboard', icon: <Activity className="h-4 w-4" aria-hidden="true" />, show: true },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="h-4 w-4" aria-hidden="true" />, show: true },
    { id: 'incidents', label: 'Incidents', icon: <Flame className="h-4 w-4" aria-hidden="true" />, show: true },
    { id: 'events', label: 'Events', icon: <ShieldAlert className="h-4 w-4" aria-hidden="true" />, show: true },
    { id: 'admin', label: 'Admin', icon: <Users className="h-4 w-4" aria-hidden="true" />, show: user?.role === 'ADMIN' },
    { id: 'docs', label: 'API', icon: <FileCode2 className="h-4 w-4" aria-hidden="true" />, show: true },
  ];

  // Esc closes the mobile menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const choose = (id: TabId) => {
    setMenuOpen(false);
    onSelectTab(id);
  };

  const roleVariant = user?.role === 'ADMIN' ? 'destructive' : user?.role === 'ANALYST' ? 'info' : 'secondary';

  const live = realtimeStatus === 'CONNECTED';
  const connecting = realtimeStatus === 'CONNECTING' || realtimeStatus === 'RECONNECTING';
  const liveLabel = live ? 'Realtime live' : realtimeStatus === 'RECONNECTING' ? 'Reconnecting…' : connecting ? 'Connecting…' : 'Socket offline';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-900">
      <div className="max-w-[1400px] mx-auto flex min-h-14 items-center gap-2 sm:gap-4 px-3 sm:px-4">
        {/* Brand */}
        <button
          type="button"
          onClick={() => choose('overview')}
          className="flex items-center gap-2 cursor-pointer font-bold tracking-wide text-zinc-100"
          aria-label="NetGuard – go to dashboard"
        >
          <span aria-hidden="true" className="h-7 w-7 grid place-items-center bg-accent text-on-accent font-mono font-semibold rounded-sm">N</span>
          <span>NetGuard</span>
          <span className="hidden sm:inline font-mono text-xs font-normal text-zinc-500">v2.2</span>
        </button>

        {/* Primary nav (desktop) */}
        <nav aria-label="Primary" className="hidden lg:flex items-stretch">
          {tabs.filter((t) => t.show).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => choose(t.id)}
              aria-current={currentTab === t.id ? 'page' : undefined}
              className={`flex items-center gap-2 min-h-14 px-3 text-sm font-medium cursor-pointer border-b-[3px] transition-colors ${
                currentTab === t.id
                  ? 'text-zinc-100 border-accent'
                  : 'text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-800'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={!live ? reconnect : undefined}
            disabled={live}
            role="status"
            title={live ? 'Connected to the NetGuard realtime gateway' : 'Click to reconnect'}
            className={`inline-flex items-center gap-2 whitespace-nowrap font-mono text-xs ${live ? 'text-zinc-400 cursor-default' : 'text-amber-400 cursor-pointer underline underline-offset-4'}`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 ${live ? 'bg-emerald-400 animate-pulse' : connecting ? 'bg-amber-400' : 'bg-zinc-500'}`}
            />
            <span className="hidden sm:inline">{liveLabel}</span>
            <span className="sm:hidden sr-only">{liveLabel}</span>
          </button>

          <div className="hidden md:block"><ThemeToggle /></div>

          {user && (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-zinc-800">
              <span className="hidden xl:inline text-xs font-mono text-zinc-300 truncate max-w-[180px]">{user.email}</span>
              <Badge variant={roleVariant}>{user.role}</Badge>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out" title="Log out">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}

          <Button aria-label="Close"
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {/* Mobile / tablet menu */}
      {menuOpen && (
        <div id="mobile-menu" className="lg:hidden border-t border-zinc-800 bg-zinc-900">
          <nav aria-label="Mobile" className="max-w-[1400px] mx-auto p-2 flex flex-col">
            {tabs.filter((t) => t.show).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => choose(t.id)}
                aria-current={currentTab === t.id ? 'page' : undefined}
                className={`flex items-center gap-3 min-h-12 px-3 text-sm cursor-pointer border-l-4 text-left ${
                  currentTab === t.id ? 'border-accent bg-zinc-800 text-zinc-100' : 'border-transparent text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
            <div className="md:hidden p-3 flex items-center justify-between border-t border-zinc-800 mt-2">
              <span className="text-xs text-zinc-400">Theme</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
