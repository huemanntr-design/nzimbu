import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, TrendingUp, Wallet, BookOpen, Megaphone, Settings, Home, ShoppingBag, Users, Package, Landmark } from 'lucide-react';

const ALL_ITEMS = [
  { path: '/', icon: Home, label: 'Accueil', color: 'text-blue-400' },
  { path: '/sales', icon: ShoppingBag, label: 'Ventes', color: 'text-green-400' },
  { path: '/clients', icon: Users, label: 'Clients', color: 'text-cyan-400' },
  { path: '/stock', icon: Package, label: 'Stock', color: 'text-orange-400' },
  { path: '/accounting', icon: Landmark, label: 'Comptabilité', color: 'text-purple-400' },
  { path: '/marketing', icon: TrendingUp, label: 'Marketing', color: 'text-pink-400' },
  { path: '/finance-perso', icon: Wallet, label: 'Finance Perso', color: 'text-blue-400' },
  { path: '/business-plan', icon: BookOpen, label: 'Business Plan', color: 'text-indigo-400' },
  { path: '/assistant', icon: Megaphone, label: 'Assistant IA', color: 'text-yellow-400' },
  { path: '/parametres', icon: Settings, label: 'Paramètres', color: 'text-muted-foreground' },
];

// When `full` is true — this is the full-screen hamburger menu
export default function MobileMoreDrawer({ open, onClose, full }) {
  if (!open) return null;

  const items = full ? ALL_ITEMS : ALL_ITEMS.slice(5);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="absolute bottom-0 left-0 right-0 glass rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <img
              src="https://media.base44.com/images/public/69c770bf5b4b3062eeb72886/4495a6469_Gemini_Generated_Image_xsx744xsx744xsx7-removebg-preview.png"
              alt="Nzimbu"
              className="w-8 h-8 object-contain"
            />
            <h3 className="font-bold text-base">{full ? 'Navigation' : "Plus d'options"}</h3>
          </div>
          <button onClick={onClose} className="glass-btn w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {items.map(item => (
            <Link key={item.path} to={item.path} onClick={onClose}
              className="glass-btn flex flex-col items-center gap-2 rounded-2xl p-4 hover:bg-white/10 transition-all">
              <item.icon className={`w-6 h-6 ${item.color}`} />
              <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}