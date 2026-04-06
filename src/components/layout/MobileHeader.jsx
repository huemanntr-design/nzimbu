import React from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/sales': 'Ventes',
  '/clients': 'Clients',
  '/stock': 'Stock',
  '/accounting': 'Comptabilité',
  '/marketing': 'Marketing',
  '/finance-perso': 'Finance Perso',
  '/business-plan': 'Business Plan',
  '/assistant': 'Assistant IA',
  '/parametres': 'Paramètres',
};

export default function MobileHeader({ onMenu }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Nzimbu';

  return (
    <div className="glass-nav flex items-center justify-between px-4 h-14">
      <div className="flex items-center gap-3">
        <img
          src="https://media.base44.com/images/public/69c770bf5b4b3062eeb72886/4495a6469_Gemini_Generated_Image_xsx744xsx744xsx7-removebg-preview.png"
          alt="Nzimbu"
          className="w-8 h-8 object-contain rounded-lg"
        />
        <span className="font-bold text-sm text-foreground">{title}</span>
      </div>
      <button
        onClick={onMenu}
        className="glass-btn w-9 h-9 rounded-xl flex items-center justify-center text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>
    </div>
  );
}