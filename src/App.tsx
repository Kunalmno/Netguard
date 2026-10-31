import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AuthView } from './components/auth/AuthView.tsx';
import { AppSidebar, type Tab } from './components/layout/AppSidebar.tsx';
import { SocDashboardView } from './components/dashboard/SocDashboardView.tsx';
import { SecurityEventsView } from './components/events/SecurityEventsView.tsx';
import { AlertsView } from './components/alerts/AlertsView.tsx';
import { IncidentsView } from './components/incidents/IncidentsView.tsx';
import { UserAdminView } from './components/admin/UserAdminView.tsx';
import { ApiDocsView } from './components/docs/ApiDocsView.tsx';
import { Shield } from 'lucide-react';

import { RealtimeProvider } from './context/RealtimeContext.tsx';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<Tab>('overview');

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-zinc-950 text-zinc-100">
        <Shield className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
        <div className="text-body text-zinc-500">Loading console</div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  // Guard against non-admin manually selecting admin tab
  const handleSelectTab = (tab: Tab) => {
    if (tab === 'admin' && user.role !== 'ADMIN') {
      setCurrentTab('overview');
      return;
    }
    setCurrentTab(tab);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 lg:flex-row">
      <AppSidebar currentTab={currentTab} onSelectTab={handleSelectTab} />

      <main className="min-w-0 flex-1">
        {/* key restarts the single entrance animation on every page change */}
        <div key={currentTab} className="page-enter mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {currentTab === 'overview' && <SocDashboardView onNavigate={handleSelectTab} />}
          {currentTab === 'alerts' && <AlertsView />}
          {currentTab === 'incidents' && <IncidentsView />}
          {currentTab === 'events' && <SecurityEventsView />}
          {currentTab === 'admin' && user.role === 'ADMIN' && <UserAdminView />}
          {currentTab === 'docs' && <ApiDocsView />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <MainApp />
      </RealtimeProvider>
    </AuthProvider>
  );
}
