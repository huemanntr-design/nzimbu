import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, TrendingUp, Wallet, BookOpen, Megaphone, Settings } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const MORE_ITEMS = [
  { path: '/marketing', icon: TrendingUp, label: 'Marketing', color: 'text-pink-400' },
  { path: '/finance-perso', icon: Wallet, label: 'Finance Perso', color: 'text-blue-400' },
  { path: '/business-plan', icon: BookOpen, label: 'Business Plan', color: 'text-purple-400' },
  { path: '/assistant', icon: Megaphone, label: 'Assistant IA', color: 'text-yellow-400' },
  { path: '/parametres', icon: Settings, label: 'Paramètres', color: 'text-muted-foreground' },
];

export default function MobileMoreDrawer({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl p-5 pb-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">Plus d'options</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {MORE_ITEMS.map(item => (
            <Link key={item.path} to={item.path} onClick={onClose}
              className="flex flex-col items-center gap-2 bg-secondary rounded-xl p-4 hover:bg-secondary/80 transition-colors">
              <item.icon className={`w-6 h-6 ${item.color}`} />
              <span className="text-xs font-medium text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}