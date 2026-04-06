import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileMoreDrawer from './MobileMoreDrawer';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      <main className={`transition-all duration-300 pb-16 md:pb-0 ${collapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav onMore={() => setMoreOpen(true)} />
        <MobileMoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
      </div>
    </div>
  );
}