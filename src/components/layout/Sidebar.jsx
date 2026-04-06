import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { useLang } from '@/lib/LanguageContext';
import { 
  Home, ShoppingBag, Users, Megaphone,
  Landmark, Package, ChevronLeft, ChevronRight, Settings,
  Wallet, BookOpen, TrendingUp
} from 'lucide-react';

const LANGS = [
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'ln', flag: '🇨🇩', label: 'LN' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { t, lang, switchLang } = useLang();

  const navItems = [
    { path: '/', icon: Home, label: t('nav_dashboard') },
    { path: '/sales', icon: ShoppingBag, label: t('nav_sales') },
    { path: '/clients', icon: Users, label: t('nav_clients') },
    { path: '/stock', icon: Package, label: t('nav_stock') },
    { path: '/accounting', icon: Landmark, label: t('nav_accounting') },
    { path: '/marketing', icon: TrendingUp, label: t('nav_marketing') },
    { path: '/finance-perso', icon: Wallet, label: t('nav_finance') },
    { path: '/business-plan', icon: BookOpen, label: t('nav_business_plan') },
    { path: '/assistant', icon: Megaphone, label: t('nav_assistant') },
    { path: '/parametres', icon: Settings, label: t('nav_settings') },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-full glass-sidebar z-40 transition-all duration-300 flex flex-col ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 h-16 border-b border-white/5 shrink-0">
        <img
          src="https://media.base44.com/images/public/69c770bf5b4b3062eeb72886/4495a6469_Gemini_Generated_Image_xsx744xsx744xsx7-removebg-preview.png"
          alt="Nzimbu"
          className="w-9 h-9 object-contain rounded-xl shrink-0"
        />
        {!collapsed && (
          <div>
            <span className="font-bold text-base text-foreground tracking-tight">Nzimbu</span>
            <p className="text-[10px] text-muted-foreground leading-none">Business DRC</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'glass-active text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
              {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
              {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(59,130,246,0.8)]" />}
            </Link>
          );
        })}
      </nav>

      {/* Language Switcher */}
      <div className={`px-2 pb-2 ${collapsed ? 'flex flex-col gap-1 items-center' : 'flex gap-1'}`}>
        {LANGS.map(l => (
          <button
            key={l.code}
            onClick={() => switchLang(l.code)}
            title={l.label}
            className={`flex-1 rounded-lg py-1 text-xs font-bold transition-all ${
              lang === l.code
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'glass-btn text-muted-foreground hover:text-foreground'
            }`}
          >
            {collapsed ? l.flag : `${l.flag} ${l.label}`}
          </button>
        ))}
      </div>

      {/* Notification Bell */}
      <NotificationBell collapsed={collapsed} />

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="glass-btn mx-auto mb-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}