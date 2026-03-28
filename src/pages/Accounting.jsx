import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis } from 'recharts';
import KpiCard from '../components/dashboard/KpiCard';
import ExpenseForm from '../components/accounting/ExpenseForm';

const COLORS = ['#3b82f6', '#ef4444', '#eab308', '#22c55e', '#8b5cf6', '#f97316'];

export default function Accounting() {
  const [tab, setTab] = useState('journal');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: () => base44.entities.Sale.list('-created_date', 50) });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: () => base44.entities.Expense.list('-created_date', 50) });

  const totalRevenue = sales.reduce((s, r) => s + (r.total || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const profit = totalRevenue - totalExpenses;
  const approvedCount = expenses.filter(e => e.status === 'approved').length;

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setShowExpenseForm(false); },
  });

  // Group expenses by category
  const byCategory = {};
  expenses.forEach(e => {
    const cat = e.category || 'Autre';
    byCategory[cat] = (byCategory[cat] || 0) + (e.amount || 0);
  });
  const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  // Build journal entries
  const journal = [
    ...sales.map(s => ({ date: s.date || s.created_date, description: `Vente: ${s.product_name}`, type: 'income', amount: s.total || 0 })),
    ...expenses.map(e => ({ date: e.date || e.created_date, description: e.description, type: 'expense', amount: e.amount || 0 })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">
      {/* Header KPIs */}
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Profit Net</p>
        <h2 className="text-3xl font-bold">${profit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</h2>
        <p className="text-sm text-muted-foreground mt-1">Revenus: ${totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} · Dépenses: ${totalExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="🇨🇩" value={`$${totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`} label="Revenus" trend="↗ +18%" trendColor="text-green-400" />
        <KpiCard icon="💸" value={`$${totalExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`} label="Dépenses" trend="↘ +5%" trendColor="text-red-400" />
        <KpiCard icon="📄" value={expenses.length} label="Nb Dépenses" />
        <KpiCard icon="✅" value={approvedCount} label="Approuvées" />
      </div>

      {/* Info */}
      <div className="bg-card border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-2">
        <p>📊 La comptabilité c'est le suivi de tout l'argent qui entre et sort. Le «journal de caisse» note chaque mouvement. Les «revenus» c'est l'argent gagné par vos ventes. Les «dépenses» c'est l'argent dépensé.</p>
        <p>💡 Conseils: 1) Notez TOUTES vos dépenses 2) Séparez l'argent du business et personnel 3) Gardez un fonds de roulement 4) Exportez vos rapports en PDF chaque mois.</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">⊙ Comptabilité</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="text-sm"><Download className="w-4 h-4 mr-2" /> Export PDF</Button>
          <Button onClick={() => setShowExpenseForm(true)} className="bg-red-500 hover:bg-red-600 text-white text-sm">
            <Plus className="w-4 h-4 mr-2" /> Dépense
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="journal">📒 Journal</TabsTrigger>
          <TabsTrigger value="expenses">💸 Dépenses</TabsTrigger>
          <TabsTrigger value="reports">📊 Rapports</TabsTrigger>
          <TabsTrigger value="taxes">🏛 Taxes</TabsTrigger>
        </TabsList>
      </Tabs>

      {showExpenseForm && <ExpenseForm onSave={d => createExpenseMutation.mutate(d)} onCancel={() => setShowExpenseForm(false)} />}

      {tab === 'journal' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="text-sm font-medium mb-2">📥 Flux Entrant</h4>
              <p className="text-xl font-bold text-green-400">+${totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">{sales.length} entrées</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="text-sm font-medium mb-2">📤 Flux Sortant</h4>
              <p className="text-xl font-bold text-red-400">-${totalExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">{expenses.length} sorties</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="text-sm font-medium mb-2">🍩 Dépenses par Catégorie</h4>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" innerRadius={15} outerRadius={30}>
                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {categoryData.slice(0, 4).map((c, i) => (
                    <div key={c.name} className="flex items-center gap-1 text-xs">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{c.name}</span>
                      <span className="ml-auto">${c.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Montant</th>
                </tr>
              </thead>
              <tbody>
                {journal.slice(0, 20).map((j, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{j.date ? new Date(j.date).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="px-4 py-3 text-sm">{j.description}</td>
                    <td className="px-4 py-3">
                      <Badge className={j.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}>
                        {j.type === 'income' ? '📥 Entrée' : '📤 Sortie'}
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 font-medium ${j.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {j.type === 'income' ? '+' : '-'}${j.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="text-sm font-medium mb-3">📊 Répartition Dépenses</h4>
              <div className="space-y-2">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="w-20 text-xs truncate">{c.name}</div>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${totalExpenses > 0 ? (c.value / totalExpenses) * 100 : 0}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className="text-xs">${c.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="text-sm font-medium mb-3">📋 Statut des Dépenses</h4>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold">{expenses.length}</p>
                  <p className="text-xs text-muted-foreground">dépenses</p>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="text-green-400">● Approuvées: {approvedCount}</span>
                    <span className="text-yellow-400">● En attente: {expenses.length - approvedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-left px-4 py-3">Catégorie</th>
                  <th className="text-left px-4 py-3">Montant</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} className="border-b border-border">
                    <td className="px-4 py-3 text-sm font-medium">{e.description}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{e.category}</td>
                    <td className="px-4 py-3 text-red-400 font-medium">${(e.amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{e.date || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge className={e.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}>
                        {e.status === 'approved' ? 'Approuvé' : 'En attente'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h4 className="font-semibold mb-4">📊 Compte de Résultat (P&L)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-secondary rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">Revenus</p>
                <p className="text-xl font-bold text-green-400">${totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-secondary rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">Dépenses</p>
                <p className="text-xl font-bold text-red-400">${totalExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-secondary rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">Profit Net</p>
                <p className={`text-xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${profit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Marge nette:</span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalRevenue > 0 ? Math.max(0, (profit / totalRevenue) * 100) : 0}%` }} />
              </div>
              <span className="text-xs text-green-400">{totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'taxes' && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-4xl mb-3">🏛</p>
          <h3 className="text-xl font-bold mb-2">Gestion Fiscale DRC</h3>
          <p className="text-sm text-muted-foreground mb-4">TVA 16% · Impôts DGI · Déclarations automatiques</p>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-secondary rounded-xl p-4">
              <p className="text-xs text-muted-foreground">TVA collectée</p>
              <p className="text-xl font-bold text-green-400">${(totalRevenue * 0.16).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-secondary rounded-xl p-4">
              <p className="text-xs text-muted-foreground">TVA déductible</p>
              <p className="text-xl font-bold text-blue-400">${(totalExpenses * 0.16).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-secondary rounded-xl p-4">
              <p className="text-xs text-muted-foreground">TVA à payer</p>
              <p className="text-xl font-bold text-yellow-400">${((totalRevenue - totalExpenses) * 0.16).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <Button className="bg-primary">🏛 Déclarer TVA</Button>
        </div>
      )}
    </div>
  );
}