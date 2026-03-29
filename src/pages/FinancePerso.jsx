import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#eab308', '#22c55e', '#8b5cf6'];
const GOAL_ICONS = { 'Fonds': '🛡', 'Voiture': '🚗', 'Investissement': '📈', 'Vacances': '✈', default: '🎯' };

function goalIcon(name) {
  const key = Object.keys(GOAL_ICONS).find(k => name?.includes(k));
  return GOAL_ICONS[key] || GOAL_ICONS.default;
}

const TABS = ['Vue d\'ensemble', 'Budget', 'Objectifs', 'Dettes'];

export default function FinancePerso() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('Vue d\'ensemble');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: '', target_amount: '' });

  const { data: transactions = [] } = useQuery({ queryKey: ['transactions'], queryFn: () => base44.entities.Transaction.list('-created_date', 100) });
  const { data: budgets = [] } = useQuery({ queryKey: ['budgets'], queryFn: () => base44.entities.BudgetCategory.list() });
  const { data: goals = [] } = useQuery({ queryKey: ['goals'], queryFn: () => base44.entities.SavingsGoal.list() });
  const { data: debts = [] } = useQuery({ queryKey: ['debts'], queryFn: () => base44.entities.Debt.list() });
  const { data: momoAccounts = [] } = useQuery({ queryKey: ['momoAccounts'], queryFn: () => base44.entities.MomoAccount.list() });

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const savedAmount = income - expense;
  const savingsPct = income > 0 ? Math.round((savedAmount / income) * 100) : 0;
  const totalBudget = budgets.reduce((s, b) => s + (b.budget || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const remaining = totalBudget - totalSpent;
  const spentPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const totalGoals = goals.reduce((s, g) => s + (g.target_amount || 0), 0);
  const totalSaved = goals.reduce((s, g) => s + (g.current_amount || 0), 0);
  const totalDebt = debts.reduce((s, d) => s + (d.total_amount || 0), 0);
  const totalPaid = debts.reduce((s, d) => s + (d.paid_amount || 0), 0);
  const totalMonthlyDebt = debts.reduce((s, d) => s + (d.monthly_payment || 0), 0);

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.SavingsGoal.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setShowGoalForm(false); setGoalForm({ name: '', target_amount: '' }); },
  });
  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SavingsGoal.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.SavingsGoal.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  const budgetData = budgets.map(b => ({ name: b.name, value: b.spent || 0 }));

  // Mock monthly trend data (last 7 months)
  const trendData = [
    { m: 'Sep', rev: income * 0.7, exp: expense * 0.85 },
    { m: 'Oct', rev: income * 0.8, exp: expense * 0.9 },
    { m: 'Nov', rev: income * 0.75, exp: expense * 0.8 },
    { m: 'Déc', rev: income * 0.9, exp: expense * 0.95 },
    { m: 'Jan', rev: income * 0.85, exp: expense * 0.88 },
    { m: 'Fév', rev: income * 0.95, exp: expense * 0.92 },
    { m: 'Mar', rev: income, exp: expense },
  ];

  return (
    <div className="space-y-4">
      {/* Santé Financière Header */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Santé Financière du Mois</p>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-4xl font-bold">${remaining.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-green-400 mt-1">💚 Il vous reste ce montant à dépenser ce mois</p>
          </div>
          <div className="text-right">
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">↗{savingsPct}% épargné</span>
            <p className="text-2xl mt-1">🏦</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(spentPct, 100)}%`, background: spentPct > 90 ? 'linear-gradient(90deg,#eab308,#ef4444)' : 'linear-gradient(90deg,#22c55e,#3b82f6)' }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>${totalSpent.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} dépensés sur ${totalBudget.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
            <span className="text-primary font-medium">● {spentPct}%</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Revenus 🖊</p>
            <p className="text-base font-bold text-green-400">${income.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="flex items-center justify-center text-muted-foreground">→</div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Dépenses 🖊</p>
            <p className="text-base font-bold text-red-400">${expense.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '💵', value: `$${income.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`, label: 'Revenus', trend: '↗ +8%', trendColor: 'text-green-400' },
          { icon: '✂️', value: `$${expense.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`, label: 'Dépensé', trend: '↘ +3%', trendColor: 'text-red-400' },
          { icon: '🏦', value: `${savingsPct}%`, label: 'Épargne', trend: '↗ +2%', trendColor: 'text-green-400' },
          { icon: '📱', value: `+$${(momoAccounts.reduce((s, a) => s + (a.balance || 0), 0)).toFixed(0)}`, label: 'M-PESA', trend: '', trendColor: '' },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl mb-1">{k.icon}</p>
            <p className="text-lg font-bold text-foreground">{k.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{k.label}</p>
            {k.trend && <p className={`text-[10px] mt-0.5 ${k.trendColor}`}>{k.trend}</p>}
          </div>
        ))}
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">⊙ Finance Personnelle</h2>
        <Button size="sm" variant="outline" className="h-8 text-xs">📊 Sync</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${tab === t ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'Vue d\'ensemble' ? '📊 ' : t === 'Budget' ? '🔴 ' : t === 'Objectifs' ? '🟢 ' : '⚠️ '}{t}
          </button>
        ))}
      </div>

      {/* VUE D'ENSEMBLE */}
      {tab === 'Vue d\'ensemble' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h4 className="font-semibold mb-4 text-sm">📊 Où va votre argent?</h4>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-28 h-28 shrink-0">
                <PieChart width={112} height={112}>
                  <Pie data={budgetData.length ? budgetData : [{ name: 'vide', value: 1 }]} cx={52} cy={52} innerRadius={32} outerRadius={52} dataKey="value" strokeWidth={0}>
                    {(budgetData.length ? budgetData : [{ name: 'vide', value: 1 }]).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-base font-bold">{spentPct}%</p>
                  <p className="text-[9px] text-muted-foreground">utilisé</p>
                </div>
              </div>
              <div className="space-y-1.5 flex-1">
                {budgets.map((b, i) => (
                  <div key={b.id} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{b.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={b.spent > b.budget ? 'text-red-400 font-medium' : 'text-foreground'}>${(b.spent || 0).toFixed(2)}</span>
                      <Pencil size={9} className="text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground mb-3">
              💡 Astuce: La règle 50/30/20 — 50% besoins, 30% envies, 20% épargne. Votre taux d'épargne est de <span className="text-primary font-bold">{savingsPct}%</span>.
            </div>
            <h5 className="text-xs font-semibold mb-2">📊 Répartition par Catégorie</h5>
            <div className="space-y-2">
              {budgets.map((b, i) => {
                const pct = b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0;
                const isOver = pct > 100;
                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-muted-foreground">{b.name}</span>
                      <span className={isOver ? 'text-red-400' : 'text-foreground'}>${(b.spent || 0).toFixed(2)} / ${(b.budget || 0).toFixed(2)} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: isOver ? '#ef4444' : COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h4 className="font-semibold mb-3 text-sm">📈 Tendance Mensuelle</h4>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={trendData}>
                  <XAxis dataKey="m" tick={{ fontSize: 9, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', fontSize: 11 }} />
                  <Line type="monotone" dataKey="rev" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="exp" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-green-400 mt-1">↗ Revenus en hausse constante ces 7 derniers mois</p>
              <p className="text-[10px] text-yellow-400 mt-0.5">⚡ Dépenses stables — bon signe!</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h4 className="font-semibold mb-3 text-sm">💡 Conseils Personnalisés</h4>
              <div className="space-y-2">
                {budgets.filter(b => b.spent > b.budget).map(b => (
                  <div key={b.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-lg shrink-0">🔴</span>
                    <div>
                      <p className="text-xs font-semibold">{b.name}: +${((b.spent || 0) - (b.budget || 0)).toFixed(2)} au-dessus du budget</p>
                      <p className="text-[10px] text-muted-foreground">Vous avez dépensé ${(b.spent || 0).toFixed(2)} au lieu de ${(b.budget || 0).toFixed(2)}. Essayez de limiter les sorties.</p>
                    </div>
                  </div>
                ))}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start justify-between gap-2">
                  <div className="flex gap-2">
                    <span className="text-lg shrink-0">🟡</span>
                    <div>
                      <p className="text-xs font-semibold">Épargne: {savingsPct}% — Objectif 20%</p>
                      <p className="text-[10px] text-muted-foreground">Augmentez votre virement automatique pour atteindre l'objectif.</p>
                    </div>
                  </div>
                  <Button size="sm" className="text-[10px] h-6 px-2 shrink-0">Ajuster</Button>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-start gap-2">
                  <span className="text-lg shrink-0">🟢</span>
                  <div>
                    <p className="text-xs font-semibold">Finances: {savingsPct >= 10 ? 'Sous contrôle!' : 'À améliorer'}</p>
                    <p className="text-[10px] text-muted-foreground">{savingsPct >= 10 ? 'Continuez ainsi ce mois!' : 'Réduisez les dépenses non essentielles.'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Money */}
            {momoAccounts.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="font-semibold mb-3 text-sm">📱 Comptes Mobile Money</h4>
                <div className="grid grid-cols-3 gap-2">
                  {momoAccounts.map(a => (
                    <div key={a.id} className="bg-muted/50 rounded-xl p-2.5 text-center">
                      <p className="text-lg">{a.provider === 'mpesa' ? '💚' : a.provider === 'airtel' ? '❤️' : '🟠'}</p>
                      <p className="text-[10px] font-semibold">{a.label || a.provider}</p>
                      <p className="text-xs font-bold text-green-400">${(a.balance || 0).toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BUDGET */}
      {tab === 'Budget' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-card border border-border rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-sm">🔴 Budget Mensuel par Catégorie</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-muted px-2 py-1 rounded-lg">✏ Budget: ${totalBudget.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                <button className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"><Plus size={12} className="text-white" /></button>
              </div>
            </div>
            <div className="space-y-4">
              {budgets.map((b, i) => {
                const pct = b.budget > 0 ? (b.spent / b.budget) * 100 : 0;
                const isOver = pct > 100;
                return (
                  <div key={b.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{b.icon || '📌'} {b.name} <Pencil size={10} className="inline text-muted-foreground" /></span>
                      <span className={`text-sm ${isOver ? 'text-red-400 font-bold' : 'text-foreground'}`}>${(b.spent || 0).toFixed(2)} / ${(b.budget || 0).toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%`, background: isOver ? '#ef4444' : COLORS[i % COLORS.length] }} />
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: isOver ? '#ef4444' : '#eab308' }}>
                      {isOver
                        ? `⚠ Dépassé de $${((b.spent || 0) - (b.budget || 0)).toFixed(2)} — ${Math.round(pct - 100)}% au-dessus`
                        : pct > 80 ? `⚡ Attention: ${Math.round(100 - pct)}% restant ($${((b.budget || 0) - (b.spent || 0)).toFixed(2)})`
                        : `⚡ Attention: ${Math.round(100 - pct)}% restant ($${((b.budget || 0) - (b.spent || 0)).toFixed(2)})`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              <div className="relative w-28 h-28 mx-auto mb-3">
                <svg width="112" height="112" viewBox="0 0 112 112">
                  <circle cx="56" cy="56" r="46" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                  <circle cx="56" cy="56" r="46" fill="none"
                    stroke={remaining <= 0 ? '#ef4444' : remaining < 100 ? '#eab308' : '#22c55e'}
                    strokeWidth="10"
                    strokeDasharray={`${Math.min(spentPct / 100 * 289, 289)} 289`}
                    strokeLinecap="round" transform="rotate(-90 56 56)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-bold">${Math.abs(remaining).toFixed(2)}</p>
                  <p className="text-[9px] text-muted-foreground">restant</p>
                </div>
              </div>
              <p className={`font-semibold text-sm ${remaining <= 0 ? 'text-red-400' : remaining < 100 ? 'text-yellow-400' : 'text-green-400'}`}>
                {remaining <= 0 ? '🔴 Budget épuisé' : remaining < 100 ? '🟡 Presque épuisé' : '🟢 Sous contrôle'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Il vous reste ${remaining.toFixed(2)} pour les jours restants.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-semibold mb-2">💡 Le saviez-vous?</p>
              <p className="text-[10px] text-muted-foreground">La règle 50/30/20 est simple:<br />• 50% pour les besoins (loyer, nourriture)<br />• 30% pour les envies (loisirs, sorties)<br />• 20% pour l'épargne et les dettes</p>
              {income > 0 && <p className="text-[10px] text-muted-foreground mt-2">Sur vos ${income.toFixed(2)}, visez <span className="text-primary font-bold">${(income * 0.2).toFixed(2)}</span> d'épargne minimum.</p>}
            </div>
          </div>
        </div>
      )}

      {/* OBJECTIFS */}
      {tab === 'Objectifs' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-sm">🎯 Progression Globale de vos Objectifs</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-primary">${totalSaved.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} / ${totalGoals.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                <Button size="sm" className="bg-primary h-7 text-xs" onClick={() => setShowGoalForm(true)}>+ Objectif</Button>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${totalGoals > 0 ? (totalSaved / totalGoals) * 100 : 0}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">💡 Vous avez épargné <span className="text-primary font-bold">{totalGoals > 0 ? Math.round((totalSaved / totalGoals) * 100) : 0}%</span> de vos objectifs totaux. Continuez, chaque petit montant compte!</p>
          </div>

          {showGoalForm && (
            <div className="bg-card border border-border rounded-2xl p-4 grid grid-cols-3 gap-3">
              <input placeholder="Nom de l'objectif" value={goalForm.name} onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))}
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
              <input type="number" placeholder="Montant cible ($)" value={goalForm.target_amount} onChange={e => setGoalForm(f => ({ ...f, target_amount: e.target.value }))}
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600 border-0"
                  onClick={() => goalForm.name && createGoalMutation.mutate({ ...goalForm, target_amount: Number(goalForm.target_amount), current_amount: 0 })}>Créer</Button>
                <Button size="sm" variant="outline" onClick={() => setShowGoalForm(false)}>✕</Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(g => {
              const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
              const rem = (g.target_amount || 0) - (g.current_amount || 0);
              return (
                <div key={g.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{goalIcon(g.name)}</span>
                      <div>
                        <p className="font-bold text-sm">{g.name}</p>
                        <p className="text-xs text-muted-foreground">Objectif: ${(g.target_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <div className="relative w-12 h-12 shrink-0">
                      <svg width="48" height="48" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="18" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                        <circle cx="24" cy="24" r="18" fill="none" stroke="#eab308" strokeWidth="4"
                          strokeDasharray={`${(pct / 100) * 113} 113`} strokeLinecap="round" transform="rotate(-90 24 24)" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-yellow-400">{pct}%</span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-400">${(g.current_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground my-1">Il reste ${rem.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} · ~{rem > 0 && income > 0 ? Math.ceil(rem / (income * 0.1)) : '?'} mois au rythme actuel</p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">{pct}% atteint</p>
                    <div className="flex items-center gap-1">
                      <Button size="sm" className="h-6 text-[10px] px-2 bg-primary/20 text-primary border-0 hover:bg-primary/30"
                        onClick={() => updateGoalMutation.mutate({ id: g.id, data: { current_amount: (g.current_amount || 0) + 100 } })}>+ $100</Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground"><Pencil size={10} /></Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400"
                        onClick={() => deleteGoalMutation.mutate(g.id)}><Trash2 size={10} /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETTES */}
      {tab === 'Dettes' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h4 className="font-semibold text-sm mb-1">📊 Vue d'ensemble de vos Dettes</h4>
            <p className="text-[10px] text-muted-foreground mb-4">
              💡 <strong>Stratégie avalanche:</strong> Remboursez d'abord la dette au taux le plus élevé pour économiser sur les intérêts. Ou utilisez la <strong>stratégie boule de neige:</strong> commencez par la plus petite dette pour la satisfaction rapide.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Total Restant</p>
                <p className="text-lg font-bold text-red-400">${(totalDebt - totalPaid).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Déjà Remboursé</p>
                <p className="text-lg font-bold text-green-400">${totalPaid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Paiement/Mois</p>
                <p className="text-lg font-bold text-primary">${totalMonthlyDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {debts.sort((a, b) => (b.interest_rate || 0) - (a.interest_rate || 0)).map((d, idx) => {
            const pct = d.total_amount > 0 ? Math.round(((d.paid_amount || 0) / d.total_amount) * 100) : 0;
            const remMonths = d.remaining_months || (d.monthly_payment > 0 ? Math.ceil((d.total_amount - d.paid_amount) / d.monthly_payment) : '?');
            const isHighRate = (d.interest_rate || 0) > 10;
            return (
              <div key={d.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{isHighRate ? '🏦' : '📦'}</span>
                    <div>
                      <p className="font-bold text-sm">{d.name}</p>
                      <p className="text-xs text-muted-foreground">Taux: {d.interest_rate || 0}% · ${(d.monthly_payment || 0).toFixed(2)}/mois</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-400">${((d.total_amount || 0) - (d.paid_amount || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground">/ ${(d.total_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-green-400">{pct}% remboursé</span>
                  <span className="text-muted-foreground">~{remMonths} mois restants</span>
                </div>
                <div className={`rounded-xl p-2.5 text-[10px] ${isHighRate ? 'bg-amber-500/10 text-amber-300' : 'bg-green-500/10 text-green-300'}`}>
                  💡 {idx === 0 ? `Priorité #${idx + 1} — taux élevé. Envisagez un paiement supplémentaire.` : `Pas d'intérêts! Maintenez les paiements réguliers.`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}