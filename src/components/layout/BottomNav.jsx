import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Users, Package, Landmark, MoreHorizontal } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/sales', icon: ShoppingBag, label: 'Ventes' },
  { path: '/clients', icon: Users, label: 'Clients' },
  { path: '/stock', icon: Package, label: 'Stock' },
  { path: '/accounting', icon: Landmark, label: 'Compta' },
];

export default function BottomNav({ onMore }) {
  const location = useLocation();

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 h-16 z-40 flex items-center px-2">
      {NAV_ITEMS.map(item => {
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl mx-0.5 transition-all
              ${isActive ? 'glass-active text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
      <button
        onClick={onMore}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl mx-0.5 text-muted-foreground hover:text-foreground glass-btn transition-all">
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] font-medium">Plus</span>
      </button>
    </nav>
  );
}