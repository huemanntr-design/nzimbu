import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import RevenueHeader from '../components/dashboard/RevenueHeader';
import KpiCard from '../components/dashboard/KpiCard';
import WeeklyChart from '../components/dashboard/WeeklyChart';
import QuickActions from '../components/dashboard/QuickActions';
import LowStockAlert from '../components/dashboard/LowStockAlert';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 50),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-created_date', 50),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;
  const lowStockCount = products.filter(p => (p.stock_qty ?? p.stock ?? 0) <= (p.reorder_point ?? p.alert_threshold ?? 10)).length;

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Bienvenue 👋</p>
          <h1 className="text-2xl font-bold text-foreground">{user?.full_name || 'Utilisateur'}</h1>
          <p className="text-xs text-muted-foreground capitalize">{dateStr}</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-lg font-medium">Tout</button>
          <button className="bg-secondary text-muted-foreground text-xs px-4 py-2 rounded-lg">Aujourd'hui</button>
          <button className="bg-secondary text-muted-foreground text-xs px-4 py-2 rounded-lg">7 Jours</button>
          <button className="bg-secondary text-muted-foreground text-xs px-4 py-2 rounded-lg">30 Jours</button>
        </div>
      </div>

      {/* Revenue Header */}
      <RevenueHeader revenue={totalRevenue} goal={2000} businessName="Mon Entreprise" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="💸" value={`$${totalExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`} label="Dépenses" trend="↘ +5.1%" trendColor="text-red-400" />
        <KpiCard icon="✨" value={`$${totalProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`} label="Bénéfice" trend="↗ +23.7%" trendColor="text-green-400" />
        <KpiCard icon="📦" value={sales.length} label="Nb de Ventes" trend="↗ +12%" />
        <KpiCard icon="⚠️" value={lowStockCount} label="Produits en Rupture" trendColor="text-yellow-400" />
      </div>

      {/* Summary */}
      <div className="flex items-center justify-center">
        <Link to="/accounting" className="bg-secondary text-foreground text-sm px-6 py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2">
          📊 Voir l'analyse complète →
        </Link>
      </div>

      {/* Charts + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyChart sales={sales} />
        </div>
        <QuickActions />
      </div>

      {/* Low Stock */}
      <LowStockAlert products={products} />
    </div>
  );
}