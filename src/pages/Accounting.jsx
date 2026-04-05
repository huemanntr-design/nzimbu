import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Send, CheckCircle, ChevronDown, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import KpiCard from '../components/dashboard/KpiCard';
import ExpenseForm from '../components/accounting/ExpenseForm';
import TimelineView from '../components/accounting/TimelineView';
import { fmtUSD, fmtCDF, fmtDate, today, FX_DEFAULT } from '@/lib/fmt';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#3b82f6', '#ef4444', '#eab308', '#22c55e', '#8b5cf6', '#f97316'];

const STATUS_CONFIG = {
  draft:   { label: 'Brouillon', color: 'bg-muted text-muted-foreground' },
  sent:    { label: 'Envoyée',   color: 'bg-blue-500/20 text-blue-400' },
  viewed:  { label: 'Vue',       color: 'bg-purple-500/20 text-purple-400' },
  partial: { label: 'Partielle', color: 'bg-amber-500/20 text-amber-400' },
  paid:    { label: 'Payée',     color: 'bg-green-500/20 text-green-400' },
  overdue: { label: 'En retard', color: 'bg-red-500/20 text-red-400' },
};

const EMPTY_FORM = {
  client_name: '', client_id: '', currency: 'USD', fx_rate: FX_DEFAULT,
  issue_date: today(), due_date: '', notes: '', status: 'draft',
  lines: [{ description: '', qty: 1, unit_price: 0 }],
};

export default function Accounting() {
  const [tab, setTab] = useState('journal');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showInvForm, setShowInvForm] = useState(false);
  const [invForm, setInvForm] = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: () => base44.entities.Sale.list('-created_date', 200) });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: () => base44.entities.Expense.list('-created_date', 200) });
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: () => base44.entities.Invoice.list('-created_date', 200) });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: fxRates = [] } = useQuery({ queryKey: ['fxRates'], queryFn: () => base44.entities.FxRate.list('-date', 1) });

  const fxRate = fxRates[0]?.rate_cdf_per_usd || FX_DEFAULT;

  const totalRevenue = sales.reduce((s, r) => s + (r.total || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;
  const approvedCount = expenses.filter(e => e.status === 'approved').length;
  const totalReceivables = invoices.filter(i => ['sent', 'viewed', 'partial', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.subtotal_usd || 0) - (i.paid_usd || 0), 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0;
  const totalProfit = sales.reduce((s, r) => s + (r.profit || 0), 0);

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setShowExpenseForm(false); },
  });

  const createInvMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setShowInvForm(false); setInvForm(EMPTY_FORM); },
  });

  const updateInvMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  // Group expenses by category
  const byCategory = {};
  expenses.forEach(e => { const cat = e.category || 'Autre'; byCategory[cat] = (byCategory[cat] || 0) + (e.amount || 0); });
  const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  // Journal
  const journal = [
    ...sales.map(s => ({ date: s.date || s.created_date, description: `Vente: ${s.product_name}`, type: 'income', amount: s.total || 0 })),
    ...expenses.map(e => ({ date: e.date || e.created_date, description: e.description, type: 'expense', amount: e.amount || 0 })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Invoice form helpers
  const invSubtotal = invForm.lines.reduce((s, l) => s + (l.qty * l.unit_price), 0);
  const addLine = () => setInvForm(f => ({ ...f, lines: [...f.lines, { description: '', qty: 1, unit_price: 0 }] }));
  const setLine = (i, k, v) => setInvForm(f => { const lines = [...f.lines]; lines[i] = { ...lines[i], [k]: k === 'description' ? v : +v }; return { ...f, lines }; });
  const removeLine = (i) => setInvForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));

  const handleInvSubmit = (e) => {
    e.preventDefault();
    const num = `INV-${Date.now().toString().slice(-6)}`;
    createInvMutation.mutate({ ...invForm, invoice_number: num, subtotal_usd: invSubtotal, subtotal_cdf: invSubtotal * fxRate, fx_rate: fxRate });
  };

  const sendViaWA = (inv) => {
    const lines = (inv.lines || []).map(l => `• ${l.description} x${l.qty} = ${fmtUSD(l.qty * l.unit_price)}`).join('\n');
    const text = encodeURIComponent(`🧾 *Facture ${inv.invoice_number}*\n\nClient: ${inv.client_name}\nDate: ${fmtDate(inv.issue_date)}\nÉchéance: ${fmtDate(inv.due_date)}\n\n${lines}\n\n*Total: ${fmtUSD(inv.subtotal_usd)}*\n(${fmtCDF(inv.subtotal_cdf)})\n\nMerci pour votre confiance 🙏`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    updateInvMutation.mutate({ id: inv.id, data: { status: 'sent', wa_sent_at: new Date().toISOString() } });
  };

  // Tax calculations (DRC)
  const tva = totalRevenue * 0.16;
  const tvaDeductible = totalExpenses * 0.16;
  const tvaNet = Math.max(0, tva - tvaDeductible);
  const ipr = profit > 0 ? profit * 0.30 : 0; // IPR ~30% on profit
  const patente = 50; // Flat patente estimate
  const totalFiscal = tvaNet + ipr + patente;

  return (
    <div className="space-y-6">
      {/* Header KPIs */}
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Profit Net</p>
        <h2 className={`text-3xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${profit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Revenus: ${totalRevenue.toFixed(2)} · Dépenses: ${totalExpenses.toFixed(2)} · Marge: {profitMargin}%
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="🇨🇩" value={`$${totalRevenue.toFixed(2)}`} label="Revenus" trend="↗ +18%" trendColor="text-green-400"
          details={[
            { label: 'Nb ventes', value: sales.length },
            { label: 'Vente moyenne', value: `$${avgSale.toFixed(2)}` },
            { label: 'Profit brut', value: `$${totalProfit.toFixed(2)}`, color: 'text-green-400' },
            { label: 'Marge brute', value: `${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%`, color: 'text-green-400' },
          ]} />
        <KpiCard icon="💸" value={`$${totalExpenses.toFixed(2)}`} label="Dépenses" trend="↘ +5%" trendColor="text-red-400"
          details={[
            { label: 'Nb dépenses', value: expenses.length },
            { label: 'Approuvées', value: approvedCount, color: 'text-green-400' },
            { label: 'En attente', value: expenses.length - approvedCount, color: 'text-yellow-400' },
            ...categoryData.slice(0, 3).map(c => ({ label: c.name, value: `$${c.value.toFixed(2)}`, color: 'text-muted-foreground' })),
          ]} />
        <KpiCard icon="🧾" value={invoices.length} label="Factures"
          details={[
            { label: 'Créances à recouvrer', value: `$${totalReceivables.toFixed(2)}`, color: 'text-amber-400' },
            { label: 'En retard', value: overdueCount, color: overdueCount > 0 ? 'text-red-400' : 'text-green-400' },
            { label: 'Payées', value: invoices.filter(i => i.status === 'paid').length, color: 'text-green-400' },
            { label: 'Brouillons', value: invoices.filter(i => i.status === 'draft').length },
          ]} />
        <KpiCard icon="✅" value={approvedCount} label="Approuvées"
          details={[
            { label: 'Total approuvé', value: `$${expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0).toFixed(2)}`, color: 'text-green-400' },
            { label: 'En attente', value: expenses.length - approvedCount, color: 'text-yellow-400' },
            { label: 'Taux approbation', value: `${expenses.length > 0 ? Math.round((approvedCount / expenses.length) * 100) : 0}%` },
          ]} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">⊙ Comptabilité</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="text-sm h-8"><Download className="w-4 h-4 mr-1" /> Export</Button>
          <Button onClick={() => setShowInvForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-8">
            <Plus className="w-4 h-4 mr-1" /> Facture
          </Button>
          <Button onClick={() => setShowExpenseForm(true)} className="bg-red-500 hover:bg-red-600 text-white text-sm h-8">
            <Plus className="w-4 h-4 mr-1" /> Dépense
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="journal">📒 Journal</TabsTrigger>
          <TabsTrigger value="factures">🧾 Factures</TabsTrigger>
          <TabsTrigger value="expenses">💸 Dépenses</TabsTrigger>
          <TabsTrigger value="timeline">📅 Chronologie</TabsTrigger>
          <TabsTrigger value="reports">📊 Rapport</TabsTrigger>
          <TabsTrigger value="taxes">🏛 Taxes</TabsTrigger>
        </TabsList>
      </Tabs>

      {showExpenseForm && <ExpenseForm onSave={d => createExpenseMutation.mutate(d)} onCancel={() => setShowExpenseForm(false)} />}

      {/* ── Journal ── */}
      {tab === 'journal' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="text-sm font-medium mb-2">📥 Flux Entrant</h4>
              <p className="text-xl font-bold text-green-400">+${totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{sales.length} entrées</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="text-sm font-medium mb-2">📤 Flux Sortant</h4>
              <p className="text-xl font-bold text-red-400">-${totalExpenses.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{expenses.length} sorties</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="text-sm font-medium mb-3">🍩 Répartition Dépenses</h4>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={categoryData} dataKey="value" cx="50%" cy="50%" innerRadius={15} outerRadius={30}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {categoryData.slice(0, 4).map((c, i) => (
                    <div key={c.name} className="flex items-center gap-1 text-xs">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground truncate max-w-[60px]">{c.name}</span>
                      <span className="ml-auto">${c.value.toFixed(0)}</span>
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
                {journal.slice(0, 25).map((j, i) => (
                  <tr key={i} className="border-b border-border hover:bg-secondary/20">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{j.date ? new Date(j.date).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="px-4 py-3 text-sm">{j.description}</td>
                    <td className="px-4 py-3">
                      <Badge className={j.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}>
                        {j.type === 'income' ? '📥 Entrée' : '📤 Sortie'}
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 font-medium ${j.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {j.type === 'income' ? '+' : '-'}${j.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Factures ── */}
      {tab === 'factures' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Créances</p>
              <p className="text-base font-bold text-amber-400">{fmtUSD(totalReceivables)}</p>
            </div>
            <div className={`rounded-xl p-3 border ${overdueCount > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-card border-border'}`}>
              <p className="text-xs text-muted-foreground">En retard</p>
              <p className={`text-base font-bold ${overdueCount > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>{overdueCount}</p>
            </div>
          </div>

          <div className="space-y-2">
            {invoices.map(inv => {
              const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
              const isExpanded = expandedId === inv.id;
              const balance = (inv.subtotal_usd || 0) - (inv.paid_usd || 0);
              return (
                <div key={inv.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : inv.id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{inv.invoice_number}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{inv.client_name}</p>
                      <p className="text-xs text-muted-foreground">Échéance: {fmtDate(inv.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{fmtUSD(inv.subtotal_usd || 0)}</p>
                      {balance > 0 && <p className="text-xs text-amber-400">reste {fmtUSD(balance)}</p>}
                      <ChevronDown size={14} className={`text-muted-foreground ml-auto mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-border">
                        <div className="p-4 space-y-3">
                          {(inv.lines || []).map((l, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{l.description} × {l.qty}</span>
                              <span className="font-medium">{fmtUSD(l.qty * l.unit_price)}</span>
                            </div>
                          ))}
                          {inv.notes && <p className="text-xs text-muted-foreground italic">{inv.notes}</p>}
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => sendViaWA(inv)}>
                              <Send size={12} /> WhatsApp
                            </Button>
                            {inv.status !== 'paid' && (
                              <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 border-0"
                                onClick={() => updateInvMutation.mutate({ id: inv.id, data: { status: 'paid', paid_usd: inv.subtotal_usd } })}>
                                <CheckCircle size={12} /> Marquer payé
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            {invoices.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <p className="text-3xl mb-2">🧾</p>
                <p>Aucune facture. Créez-en une avec le bouton ci-dessus.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Dépenses ── */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="text-sm font-medium mb-3">📊 Répartition</h4>
              <div className="space-y-2">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="w-20 text-xs truncate">{c.name}</div>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${totalExpenses > 0 ? (c.value / totalExpenses) * 100 : 0}%`, backgroundColor: COLORS[Object.keys(byCategory).indexOf(c.name) % COLORS.length] }} />
                    </div>
                    <span className="text-xs">${c.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="text-sm font-medium mb-3">📋 Statut</h4>
              <div className="text-center">
                <p className="text-3xl font-bold">{expenses.length}</p>
                <p className="text-xs text-muted-foreground">dépenses enregistrées</p>
                <div className="flex gap-3 mt-2 text-xs justify-center">
                  <span className="text-green-400">● Approuvées: {approvedCount}</span>
                  <span className="text-yellow-400">● En attente: {expenses.length - approvedCount}</span>
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
                  <tr key={e.id} className="border-b border-border hover:bg-secondary/20">
                    <td className="px-4 py-3 text-sm font-medium">{e.description}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{e.category}</td>
                    <td className="px-4 py-3 text-red-400 font-medium">${(e.amount || 0).toFixed(2)}</td>
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

      {/* ── Timeline ── */}
      {tab === 'timeline' && (
        <TimelineView sales={sales} expenses={expenses} invoices={invoices} />
      )}

      {/* ── Rapport ── */}
      {tab === 'reports' && (
        <div className="space-y-4">
          {/* P&L */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-semibold mb-1 text-sm">📊 Compte de Résultat (P&L)</h4>
            <p className="text-xs text-muted-foreground mb-4">Le P&L (Profit & Loss) mesure si votre entreprise gagne ou perd de l'argent sur une période.</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">💰 Revenus</p>
                <p className="text-xl font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{sales.length} ventes</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">💸 Dépenses</p>
                <p className="text-xl font-bold text-red-400">${totalExpenses.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{expenses.length} postes</p>
              </div>
              <div className={`${profit >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-xl p-4 text-center`}>
                <p className="text-xs text-muted-foreground mb-1">✨ Profit Net</p>
                <p className={`text-xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${profit.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">marge: {profitMargin}%</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Marge nette: {profitMargin}%</span>
                <span>{profit >= 0 ? '✅ Rentable' : '⚠️ Déficitaire'}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${totalRevenue > 0 ? Math.min(100, Math.max(0, (profit / totalRevenue) * 100)) : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Revenue breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="font-semibold text-sm mb-1">📈 Analyse des revenus</h4>
              <p className="text-xs text-muted-foreground mb-3">Détail de la performance commerciale.</p>
              <div className="space-y-2">
                {[
                  { label: 'Vente moyenne / transaction', value: `$${avgSale.toFixed(2)}`, hint: 'Objectif: augmenter via vente incitative' },
                  { label: 'Profit brut (ventes)', value: `$${totalProfit.toFixed(2)}`, hint: 'Revenus - Coût d\'achat des produits' },
                  { label: 'Marge brute', value: `${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%`, hint: 'Idéal: >30% pour un commerce' },
                  { label: 'Créances non recouvrées', value: `$${totalReceivables.toFixed(2)}`, hint: 'Factures non encore payées' },
                ].map((row, i) => (
                  <div key={i} className="border border-border/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{row.label}</span>
                      <span className="text-xs font-bold text-foreground">{row.value}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">💡 {row.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="font-semibold text-sm mb-1">💸 Analyse des dépenses</h4>
              <p className="text-xs text-muted-foreground mb-3">Répartition et contrôle des coûts.</p>
              {categoryData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <PieChart width={100} height={100}>
                    <Pie data={categoryData} cx={45} cy={45} innerRadius={25} outerRadius={48} dataKey="value">
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                  <div className="space-y-1 flex-1">
                    {categoryData.map((d, i) => (
                      <div key={d.name} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-muted-foreground">{d.name}</span>
                        </div>
                        <span className="font-medium">${d.value.toFixed(0)} ({totalExpenses > 0 ? ((d.value / totalExpenses) * 100).toFixed(0) : 0}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="text-xs text-muted-foreground">Aucune dépense enregistrée.</p>}
            </div>
          </div>

          {/* Health score */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-sm mb-3">🩺 Bilan de santé financière</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  label: 'Rentabilité',
                  icon: profit >= 0 ? '✅' : '❌',
                  score: profit >= 0 ? 'Positive' : 'Négative',
                  desc: profit >= 0 ? 'Votre business génère plus qu\'il ne dépense.' : 'Attention: les dépenses dépassent les revenus.',
                  color: profit >= 0 ? 'text-green-400' : 'text-red-400',
                },
                {
                  label: 'Liquidité',
                  icon: totalReceivables < totalRevenue * 0.2 ? '✅' : '⚠️',
                  score: totalReceivables < totalRevenue * 0.2 ? 'Bonne' : 'À surveiller',
                  desc: `${fmtUSD(totalReceivables)} de créances en attente. ${totalReceivables > 0 ? 'Relancez vos clients.' : 'Très bien!'}`,
                  color: totalReceivables < totalRevenue * 0.2 ? 'text-green-400' : 'text-yellow-400',
                },
                {
                  label: 'Contrôle des coûts',
                  icon: totalExpenses < totalRevenue * 0.7 ? '✅' : '⚠️',
                  score: totalExpenses < totalRevenue * 0.7 ? 'Maîtrisé' : 'Élevé',
                  desc: `Les dépenses représentent ${totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(0) : 0}% des revenus. Idéal: <70%.`,
                  color: totalExpenses < totalRevenue * 0.7 ? 'text-green-400' : 'text-yellow-400',
                },
              ].map((item, i) => (
                <div key={i} className="bg-secondary rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`text-sm font-bold ${item.color}`}>{item.score}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Taxes ── */}
      {tab === 'taxes' && (
        <div className="space-y-4">
          {/* Intro pédagogique */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <h3 className="font-bold text-sm mb-2">🏛 Fiscalité en RDC — Guide simplifié</h3>
            <p className="text-xs text-muted-foreground">En tant que commerçant en RDC, vous êtes soumis à plusieurs taxes. Voici un résumé pédagogique pour comprendre vos obligations.</p>
          </div>

          {/* TVA */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="font-semibold text-sm">TVA — Taxe sur la Valeur Ajoutée</h4>
                <p className="text-xs text-muted-foreground mt-1">La TVA est une taxe que vous collectez auprès de vos clients (16%) et reversez à la DGI après déduction de la TVA que vous avez payé sur vos achats.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">TVA collectée<br/>(sur ventes)</p>
                <p className="text-lg font-bold text-green-400">${tva.toFixed(2)}</p>
                <p className="text-[9px] text-muted-foreground">{totalRevenue.toFixed(2)} × 16%</p>
              </div>
              <div className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">TVA déductible<br/>(sur achats)</p>
                <p className="text-lg font-bold text-blue-400">${tvaDeductible.toFixed(2)}</p>
                <p className="text-[9px] text-muted-foreground">{totalExpenses.toFixed(2)} × 16%</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">TVA nette<br/>à reverser</p>
                <p className="text-lg font-bold text-amber-400">${tvaNet.toFixed(2)}</p>
                <p className="text-[9px] text-muted-foreground">collectée - déductible</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              💡 <strong>Comment ça marche:</strong> Si vous vendez pour $100, vous collectez $16 de TVA. Si vous avez acheté pour $50 (avec $8 de TVA), vous reversez uniquement $16 - $8 = $8 à la DGI.
            </div>
          </div>

          {/* IPR */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">💼</span>
              <div>
                <h4 className="font-semibold text-sm">IPR — Impôt Professionnel sur les Revenus</h4>
                <p className="text-xs text-muted-foreground mt-1">L'IPR est calculé sur le bénéfice net de votre entreprise. Taux estimé: ~30% sur le profit.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Base imposable (profit)</p>
                <p className={`text-lg font-bold ${profit >= 0 ? 'text-foreground' : 'text-muted-foreground'}`}>${Math.max(0, profit).toFixed(2)}</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">IPR estimé (~30%)</p>
                <p className="text-lg font-bold text-amber-400">${ipr.toFixed(2)}</p>
              </div>
            </div>
            {profit <= 0 && <p className="text-xs text-muted-foreground mt-2">ℹ️ Pas d'IPR si pas de profit. Un bénéfice négatif = pas d'impôt sur les revenus.</p>}
          </div>

          {/* Patente */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">📋</span>
              <div>
                <h4 className="font-semibold text-sm">Patente — Taxe d'activité commerciale</h4>
                <p className="text-xs text-muted-foreground mt-1">La patente est une taxe annuelle fixe pour exercer une activité commerciale en RDC. Elle varie selon l'activité et la province.</p>
              </div>
            </div>
            <div className="bg-secondary rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Patente estimée (forfait annuel)</p>
              <p className="text-lg font-bold">${patente.toFixed(2)} / an</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">💡 Consultez la Mairie ou la DGI de votre commune pour le montant exact selon votre activité.</p>
          </div>

          {/* Total fiscal */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
            <h4 className="font-semibold text-sm mb-3">📦 Total des obligations fiscales estimées</h4>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span>TVA nette</span><span className="font-bold">${tvaNet.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>IPR (~30%)</span><span className="font-bold">${ipr.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Patente (forfait)</span><span className="font-bold">${patente.toFixed(2)}</span></div>
              <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                <span>Total fiscal estimé</span><span className="text-amber-400">${totalFiscal.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">⚠️ Ces estimations sont indicatives. Consultez un comptable agréé ou la DGI pour vos obligations fiscales exactes.</p>
            <Button className="bg-primary mt-3 w-full">🏛 Préparer ma déclaration</Button>
          </div>
        </div>
      )}

      {/* Invoice form modal */}
      <AnimatePresence>
        {showInvForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={() => setShowInvForm(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-screen-sm mx-auto bg-card rounded-t-2xl border border-border overflow-y-auto max-h-[95vh]">
              <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
                <h2 className="font-bold">Nouvelle Facture</h2>
                <button onClick={() => setShowInvForm(false)}><X size={18} className="text-muted-foreground" /></button>
              </div>
              <form onSubmit={handleInvSubmit} className="p-5 space-y-4 pb-8">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Client *</label>
                  <select required value={invForm.client_id}
                    onChange={e => { const c = clients.find(c => c.id === e.target.value); setInvForm(f => ({ ...f, client_id: e.target.value, client_name: c?.name || '' })); }}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                    <option value="">Sélectionner…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date émission</label>
                    <input type="date" value={invForm.issue_date} onChange={e => setInvForm(f => ({ ...f, issue_date: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Échéance</label>
                    <input type="date" value={invForm.due_date} onChange={e => setInvForm(f => ({ ...f, due_date: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Lignes</label>
                  <div className="space-y-2">
                    {invForm.lines.map((l, i) => (
                      <div key={i} className="grid grid-cols-[1fr_60px_80px_32px] gap-1.5 items-center">
                        <input placeholder="Description" value={l.description} onChange={e => setLine(i, 'description', e.target.value)}
                          className="bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                        <input type="number" placeholder="Qté" value={l.qty} onChange={e => setLine(i, 'qty', e.target.value)}
                          className="bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none text-center" />
                        <input type="number" placeholder="Prix" value={l.unit_price} onChange={e => setLine(i, 'unit_price', e.target.value)}
                          className="bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                        <button type="button" onClick={() => removeLine(i)} disabled={invForm.lines.length === 1}
                          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-400 disabled:opacity-30">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addLine} className="mt-2 text-xs text-primary flex items-center gap-1">
                    <Plus size={12} /> Ajouter une ligne
                  </button>
                </div>
                <div className="bg-muted rounded-xl p-3 text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{fmtUSD(invSubtotal)}</p>
                  <p className="text-xs text-muted-foreground">{fmtCDF(invSubtotal * fxRate)}</p>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 border-0" disabled={createInvMutation.isPending}>
                  {createInvMutation.isPending ? 'Création…' : 'Créer la facture'}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}