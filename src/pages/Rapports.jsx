import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];

export default function Rapports() {
  const { data: invoices = [], isLoading: loadingInv } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list(),
  });
  const { data: expenses = [], isLoading: loadingExp } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list(),
  });
  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
  });

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.subtotal_usd || 0), 0);
  const totalReceivables = invoices.filter(i => ['sent', 'viewed', 'partial', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.subtotal_usd || 0) - (i.paid_usd || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const profit = totalRevenue - totalExpenses;

  // Monthly revenue from sales
  const monthlyMap = {};
  sales.forEach(s => {
    const m = (s.date || '').slice(0, 7);
    if (m) monthlyMap[m] = (monthlyMap[m] || 0) + (s.total || 0);
  });
  const monthlyData = Object.entries(monthlyMap).sort().slice(-6).map(([m, v]) => ({ mois: m.slice(5), revenus: v }));

  // Expense by category
  const catMap = {};
  expenses.forEach(e => {
    catMap[e.category || 'Autre'] = (catMap[e.category || 'Autre'] || 0) + (e.amount || 0);
  });
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  const isLoading = loadingInv || loadingExp;

  return (
    <div>
      <PageHeader title="Rapports" subtitle="Analyse financière" />

      {isLoading ? <LoadingSkeleton rows={3} /> : (
        <>
          {/* P&L Summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-card border border-border rounded-xl p-4 col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Bénéfice Net</p>
              <p className={`text-3xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${profit.toFixed(2)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Revenus encaissés</p>
              <p className="text-lg font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Dépenses</p>
              <p className="text-lg font-bold text-red-400">${totalExpenses.toFixed(2)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 col-span-2">
              <p className="text-xs text-muted-foreground">Créances en cours</p>
              <p className="text-lg font-bold text-amber-400">${totalReceivables.toFixed(2)}</p>
            </div>
          </div>

          {/* Monthly chart */}
          {monthlyData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <p className="text-xs text-muted-foreground mb-3">Revenus mensuels</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="revenus" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Expense pie */}
          {pieData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-3">Dépenses par catégorie</p>
              <div className="flex items-center gap-4">
                <PieChart width={120} height={120}>
                  <Pie data={pieData} cx={55} cy={55} innerRadius={30} outerRadius={55} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div className="space-y-1 flex-1">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-medium">${d.value.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}