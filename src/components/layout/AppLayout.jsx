import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileMoreDrawer from './MobileMoreDrawer';
import MobileHeader from './MobileHeader';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  // fullMenu = hamburger (all nav), moreMenu = bottom "Plus" button (secondary pages)
  const [fullMenu, setFullMenu] = useState(false);
  const [moreMenu, setMoreMenu] = useState(false);

  return (
    <div className="min-h-screen bg-background drc-bg">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      <main className={`transition-all duration-300 pb-20 md:pb-0 ${collapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        {/* Mobile top header with hamburger */}
        <div className="md:hidden sticky top-0 z-30">
          <MobileHeader onMenu={() => setFullMenu(true)} />
        </div>
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto relative z-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav + drawers */}
      <div className="md:hidden">
        <BottomNav onMore={() => setMoreMenu(true)} />
        {/* Hamburger: full navigation */}
        <MobileMoreDrawer open={fullMenu} onClose={() => setFullMenu(false)} full />
        {/* Plus button: secondary pages only */}
        <MobileMoreDrawer open={moreMenu} onClose={() => setMoreMenu(false)} />
      </div>
    </div>
  );
}