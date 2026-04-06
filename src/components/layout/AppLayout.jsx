import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileMoreDrawer from './MobileMoreDrawer';
import { useViewMode } from '@/lib/ViewModeContext';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { mode } = useViewMode();

  if (mode === 'phone') {
    return (
      <div className="min-h-screen bg-background max-w-sm mx-auto relative">
        <main className="pb-20 pt-2">
          <div className="px-4">
            <Outlet />
          </div>
        </main>
        <BottomNav onMore={() => setMoreOpen(true)} />
        <MobileMoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-56'}`}>
        <div className="p-6 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}