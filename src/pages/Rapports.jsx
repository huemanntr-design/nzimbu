import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { fmtUSD, fmtCDF, FX_DEFAULT } from '@/lib/fmt';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

const COLORS = ['#C0392B', '#1A3A8F', '#F1C40F', '#22c55e', '#a855f7'];

export default function Rapports() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 500),
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-date', 500),
  });
  const { data: fxRates = [] } = useQuery({
    queryKey: ['fxRates'],
    queryFn: () => base44.entities.FxRate.list('-date', 1),
  });

  const fxRate = fxRates[0]?.rate_cdf_per_usd || FX_DEFAULT;

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.subtotal_usd || 0), 0);
  const totalReceivables = invoices.filter(i => ['sent', 'viewed', 'partial', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.subtotal_usd || 0) - (i.paid_usd || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + ((e.amount || 0) / fxRate), 0);
  const netProfit = totalRevenue - totalExpenses;
  const collectionRate = totalRevenue > 0 ? ((totalRevenue / (totalRevenue + totalReceivables)) * 100).toFixed(1) : 0;

  // Monthly revenue chart (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const key = d.toISOString().slice(0, 7);
    const rev = invoices.filter(inv => (inv.issue_date || inv.created_date || '').startsWith(key) && inv.status === 'paid').reduce((s, inv) => s + (inv.subtotal_usd || 0), 0);
    return { month: key.slice(5), rev };
  });

  // Exposure pie (USD vs CDF invoices)
  const usdTotal = invoices.filter(i => i.currency !== 'CDF').reduce((s, i) => s + (i.subtotal_usd || 0), 0);
  const cdfTotal = invoices.filter(i => i.currency === 'CDF').reduce((s, i) => s + (i.subtotal_usd || 0), 0);
  const exposureData = [
    { name: 'USD', value: usdTotal },
    { name: 'CDF', value: cdfTotal },
  ].filter(d => d.value > 0);

  // Expense by category
  const expByCat = expenses.reduce((acc, e) => {
    const cat = e.category || 'Autre';
    acc[cat] = (acc[cat] || 0) + (e.amount || 0);
    return acc;
  }, {});
  const expData = Object.entries(expByCat).map(([name, value]) => ({ name, value }));

  const shareReport = () => {
    const text = `📊 *Rapport Nzimbu*\n\nRevenues: ${fmtUSD(totalRevenue)}\nCréances: ${fmtUSD(totalReceivables)}\nDépenses: ${fmtUSD(totalExpenses)}\nBénéfice net: ${fmtUSD(netProfit)}\nTaux recouvrement: ${collectionRate}%`;
    navigator.share?.({ text }) || window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div>
      <PageHeader title="Rapports" subtitle="P&L & Analyses" action={
        <Button size="sm" variant="outline" className="h-8" onClick={shareReport}>
          <Share2 size={14} /> WA
        </Button>
      } />

      {isLoading ? <LoadingSkeleton card /> : (
        <>
          {/* P&L Summary */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Revenus encaissés</p>
              <p className="text-base font-bold text-green-400">{fmtUSD(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">{fmtCDF(totalRevenue * fxRate)}</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Créances</p>
              <p className="text-base font-bold text-amber-400">{fmtUSD(totalReceivables)}</p>
              <p className="text-xs text-muted-foreground">{fmtCDF(totalReceivables * fxRate)}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Dépenses</p>
              <p className="text-base font-bold text-red-400">{fmtUSD(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground">{fmtCDF(totalExpenses * fxRate)}</p>
            </div>
            <div className={`border rounded-xl p-4 ${netProfit >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <p className="text-xs text-muted-foreground mb-1">Bénéfice net</p>
              <p className={`text-base font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmtUSD(netProfit)}</p>
              <p className="text-xs text-muted-foreground">Recouv. {collectionRate}%</p>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="bg-card border border-border rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-muted-foreground mb-3">REVENUS MENSUELS (6 MOIS)</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={months}>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#666' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#12121f', border: '1px solid #222', borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [fmtUSD(v), 'Revenus']} />
                <Bar dataKey="rev" fill="#C0392B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Currency Exposure */}
          {exposureData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-muted-foreground mb-3">EXPOSITION DEVISES</p>
              <div className="flex items-center gap-4">
                <PieChart width={100} height={100}>
                  <Pie data={exposureData} cx={50} cy={50} innerRadius={30} outerRadius={45} dataKey="value" paddingAngle={3}>
                    {exposureData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                </PieChart>
                <div className="flex-1">
                  {exposureData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                      <p className="text-xs text-muted-foreground">{d.name}</p>
                      <p className="text-xs font-semibold text-foreground ml-auto">{fmtUSD(d.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Expenses by Category */}
          {expData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3">DÉPENSES PAR CATÉGORIE</p>
              <div className="space-y-2">
                {expData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <p className="text-xs text-foreground flex-1">{d.name}</p>
                    <p className="text-xs font-bold text-foreground">{fmtCDF(d.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}