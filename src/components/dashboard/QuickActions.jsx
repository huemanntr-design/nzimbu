import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, BarChart3, Megaphone, Receipt, FileText } from 'lucide-react';

const actions = [
  { label: 'Nouvelle Vente', icon: ShoppingCart, color: 'bg-blue-500 hover:bg-blue-600', path: '/sales' },
  { label: 'Nouveau Produit', icon: Package, color: 'bg-green-500 hover:bg-green-600', path: '/products' },
  { label: 'Rapport', icon: BarChart3, color: 'bg-yellow-500 hover:bg-yellow-600', path: '/accounting' },
  { label: 'Nouveau Post', icon: Megaphone, color: 'bg-purple-500 hover:bg-purple-600', path: '/marketing' },
  { label: 'Nouvelle Dépense', icon: Receipt, color: 'bg-red-500 hover:bg-red-600', path: '/accounting' },
  { label: 'Facture', icon: FileText, color: 'bg-gray-500 hover:bg-gray-600', path: '/sales' },
];

export default function QuickActions() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold text-foreground mb-4">⚡ Actions Rapides</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(action => (
          <Link
            key={action.label}
            to={action.path}
            className={`${action.color} text-white text-xs font-medium px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors`}
          >
            <action.icon className="w-3.5 h-3.5" />
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}