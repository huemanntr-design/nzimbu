import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Users, Package, Landmark, MoreHorizontal } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const PRIMARY_NAV = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/sales', icon: ShoppingBag, label: 'Ventes' },
  { path: '/clients', icon: Users, label: 'Clients' },
  { path: '/stock', icon: Package, label: 'Stock' },
  { path: '/accounting', icon: Landmark, label: 'Compta' },
];

export default function BottomNav({ onMore }) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 flex items-center">
      {PRIMARY_NAV.map(item => {
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors
              ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />}
          </Link>
        );
      })}
      <button
        onClick={onMore}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground hover:text-foreground transition-colors">
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] font-medium">Plus</span>
      </button>
    </nav>
  );
}