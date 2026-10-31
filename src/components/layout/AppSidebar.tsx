import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { StatusDot, type Tone } from '../ui/status-dot.tsx';
import { Activity, Bell, Flame, ShieldAlert, Users, FileCode2, LogOut, Shield, Menu, X } from 'lucide-react';

export type Tab = 'overview' | 'alerts' | 'incidents' | 'events' | 'admin' | 'docs';

export interface AppSidebarProps {
  currentTab: Tab;
  onSelectTab: (tab: Tab) => void;
}

type NavItem = { tab: Tab; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> };

const monitor: NavItem[] = [
  { tab: 'overview', label: 'Dashboard', icon: Activity },
  { tab: 'alerts', label: 'Alerts', icon: Bell },
  { tab: 'incidents', label: 'Incidents', icon: Flame },
  { tab: 'events', label: 'Security events', icon: ShieldAlert },
];

const roleLabel = (role?: string) => (role ? role.charAt(0) + role.slice(1).toLowerCase() : '');

export const AppSidebar: React.FC<AppSidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();
  const { status: realtimeStatus, reconnect } = useRealtime();
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (mounted) setBackendHealthy(res.ok);
      } catch {
        if (mounted) setBackendHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isLive = realtimeStatus === 'CONNECTED';
  const isPending = realtimeStatus === 'RECONNECTING' || realtimeStatus === 'CONNECTING';
  const tone: Tone = isLive ? 'positive' : isPending ? 'warning' : 'muted';
  const statusLabel = isLive ? 'Live' : realtimeStatus === 'RECONNECTING' ? 'Reconnecting' : realtimeStatus === 'CONNECTING' ? 'Connecting' : 'Offline';

  const select = (tab: Tab) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  const row = (item: NavItem) => {
    const active = currentTab === item.tab;
    const Icon = item.icon;
    return (
      <button
        key={item.tab}
        type="button"
        onClick={() => select(item.tab)}
        aria-current={active ? 'page' : undefined}
        className={`flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 text-body font-medium transition-colors ${
          active
            ? 'bg-zinc-800 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  const sectionLabel = 'mb-2 mt-6 px-3 text-xs text-zinc-500';

  const panel = (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Brand */}
      <button
        type="button"
        onClick={() => select('overview')}
        className="flex h-16 shrink-0 cursor-pointer items-center gap-2.5 px-6 text-left"
      >
        <Shield className="h-5 w-5 text-zinc-100" strokeWidth={1.5} />
        <span className="text-[17px] font-medium leading-none text-zinc-100">NetGuard</span>
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="flex flex-col gap-0.5">{monitor.map(row)}</div>

        <p className={sectionLabel}>Manage</p>
        <div className="flex flex-col gap-0.5">
          {user?.role === 'ADMIN' && row({ tab: 'admin', label: 'Administration', icon: Users })}
          {row({ tab: 'docs', label: 'API specs', icon: FileCode2 })}
        </div>
      </nav>

      {/* Status and user */}
      <div className="border-t border-white/8 p-3">
        <button
          type="button"
          onClick={!isLive ? reconnect : undefined}
          disabled={isLive}
          title={
            isLive
              ? `Connected to the realtime gateway${backendHealthy === false ? ' (API health check failing)' : ''}`
              : 'Reconnect to the realtime gateway'
          }
          className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-body text-zinc-400 transition-colors ${
            isLive ? 'cursor-default' : 'cursor-pointer hover:bg-zinc-900 hover:text-zinc-100'
          }`}
        >
          <StatusDot tone={tone} className="mx-1" />
          <span>{statusLabel}</span>
        </button>

        {user && (
          <div className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-body text-zinc-200" title={user.email}>{user.email}</p>
              <p className="text-xs text-zinc-500">{roleLabel(user.role)}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        )}
        <p className="px-3 pt-1 font-mono text-xs text-zinc-600">v2.2</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-screen w-62 shrink-0 border-r border-white/8 lg:block">{panel}</aside>

      {/* Mobile top bar and drawer */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/8 bg-sidebar px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <Shield className="h-5 w-5 text-zinc-100" strokeWidth={1.5} />
          <span className="text-[17px] font-medium leading-none text-zinc-100">NetGuard</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="modal-enter absolute inset-y-0 left-0 w-62 border-r border-white/8">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
            {panel}
          </aside>
        </div>
      )}
    </>
  );
};
