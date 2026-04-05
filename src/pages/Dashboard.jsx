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
import ExchangeRateWidget from '../components/currency/ExchangeRateWidget';
import { formatDual, usdToCents } from '@/utils/currency';

const QUOTES = [
  'Mosala ezali nzela ya bomoi',
  'Mbongo euti na misato',
  'Biso nyonso tozali bato ya misota',
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [rate, setRate] = useState(2500);
  const { t } = useLang();

  const dailyQuote = QUOTES[new Date().getDate() % QUOTES.length];

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.exchange_rate) setRate(u.exchange_rate);
    }).catch(() => {});
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

  const fmtDual = (usd) => formatDual(usdToCents(usd), rate);

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
      </div>

      {/* Exchange Rate Widget */}
      <ExchangeRateWidget rate={rate} onRateChange={setRate} />

      {/* Revenue Header */}
      <RevenueHeader revenue={totalRevenueUSD} goal={2000} businessName="Mon Entreprise" currency="USD" usdToFc={rate} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="💸" value={fmtDual(totalExpensesUSD)} label={t('expenses')} trend="↘ +5.1%" trendColor="text-red-400" />
        <KpiCard icon="✨" value={fmtDual(totalProfitUSD)} label={t('net_profit')} trend="↗ +23.7%" trendColor="text-green-400" />
        <KpiCard icon="📦" value={sales.length} label={t('sales')} trend="↗ +12%" />
        <KpiCard icon="⚠️" value={lowStockCount} label={t('low_stock')} trendColor="text-yellow-400" />
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