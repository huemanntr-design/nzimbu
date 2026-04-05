import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import RevenueHeader from '../components/dashboard/RevenueHeader';
import KpiCard from '../components/dashboard/KpiCard';
import WeeklyChart from '../components/dashboard/WeeklyChart';
import QuickActions from '../components/dashboard/QuickActions';
import LowStockAlert from '../components/dashboard/LowStockAlert';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';

const USD_TO_FC = 2800;

const QUOTES = [
  'Mosala ezali nzela ya bomoi',
  'Mbongo euti na misato',
  'Biso nyonso tozali bato ya misota',
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const { t } = useLang();

  const dailyQuote = QUOTES[new Date().getDate() % QUOTES.length];

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

  const totalRevenueUSD = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalExpensesUSD = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalProfitUSD = totalRevenueUSD - totalExpensesUSD;
  const lowStockCount = products.filter(p => (p.stock_qty ?? p.stock ?? 0) <= (p.reorder_point ?? p.alert_threshold ?? 10)).length;

  const fmt = (usd) => {
    if (currency === 'FC') {
      return `${(usd * USD_TO_FC).toLocaleString('fr-FR')} FC`;
    }
    return `$${usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`;
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Lingala Quote */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-3 flex items-center gap-3">
        <span className="text-2xl">🇨🇩</span>
        <p className="text-sm font-medium text-primary italic">"{dailyQuote}"</p>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <p className="text-sm text-muted-foreground">👋 {t('welcome')}</p>
          <h1 className="text-2xl font-bold text-foreground">{user?.full_name || t('nav_dashboard')}</h1>
          <p className="text-xs text-muted-foreground capitalize">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Currency Toggle */}
          <div className="flex bg-secondary rounded-lg p-1 gap-1">
            {['USD', 'FC'].map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition-colors ${currency === c ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {c === 'USD' ? '$ USD' : 'FC'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Header */}
      <RevenueHeader revenue={totalRevenueUSD} goal={2000} businessName="Mon Entreprise" currency={currency} usdToFc={USD_TO_FC} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="💸" value={fmt(totalExpensesUSD)} label={t('expenses')} trend="↘ +5.1%" trendColor="text-red-400"
          details={[
            { label: 'Total dépenses', value: fmt(totalExpensesUSD), color: 'text-red-400' },
            { label: 'Nb postes', value: expenses.length },
            { label: 'En % des revenus', value: `${totalRevenueUSD > 0 ? ((totalExpensesUSD / totalRevenueUSD) * 100).toFixed(1) : 0}%` },
            { label: 'Voir détails', value: '→ Comptabilité' },
          ]} />
        <KpiCard icon="✨" value={fmt(totalProfitUSD)} label={t('net_profit')} trend="↗ +23.7%" trendColor="text-green-400"
          details={[
            { label: 'Revenus', value: fmt(totalRevenueUSD), color: 'text-green-400' },
            { label: 'Dépenses', value: fmt(totalExpensesUSD), color: 'text-red-400' },
            { label: 'Profit net', value: fmt(totalProfitUSD), color: totalProfitUSD >= 0 ? 'text-green-400' : 'text-red-400' },
            { label: 'Marge nette', value: `${totalRevenueUSD > 0 ? ((totalProfitUSD / totalRevenueUSD) * 100).toFixed(1) : 0}%` },
          ]} />
        <KpiCard icon="📦" value={sales.length} label={t('sales')} trend="↗ +12%"
          details={[
            { label: 'Total ventes', value: sales.length },
            { label: 'Revenus', value: fmt(totalRevenueUSD), color: 'text-green-400' },
            { label: 'Vente moyenne', value: fmt(sales.length > 0 ? totalRevenueUSD / sales.length : 0) },
            { label: 'Cash', value: sales.filter(s => s.payment_method === 'cash').length },
            { label: 'Mobile Money', value: sales.filter(s => ['mpesa','airtel','orange','mobile_money'].includes(s.payment_method)).length },
          ]} />
        <KpiCard icon="⚠️" value={lowStockCount} label={t('low_stock')} trendColor="text-yellow-400"
          details={[
            { label: 'Produits en alerte', value: lowStockCount, color: lowStockCount > 0 ? 'text-yellow-400' : 'text-green-400' },
            { label: 'Total produits', value: products.length },
            { label: 'Stocks OK', value: products.length - lowStockCount, color: 'text-green-400' },
            { label: 'Action', value: '→ Gérer le stock' },
          ]} />
      </div>

      {/* Summary */}
      <div className="flex items-center justify-center">
        <Link to="/accounting" className="bg-secondary text-foreground text-sm px-6 py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2">
          📊 {t('see_full_analysis')} →
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