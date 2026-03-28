import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import KpiCard from '../components/dashboard/KpiCard';

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6'];

export default function Finance() {
  const [tab, setTab] = useState('overview');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: '', target_amount: '' });
  const queryClient = useQueryClient();

  const { data: transactions = [] } = useQuery({ queryKey: ['transactions'], queryFn: () => base44.entities.Transaction.list('-created_date', 100) });
  const { data: budgets = [] } = useQuery({ queryKey: ['budgets'], queryFn: () => base44.entities.BudgetCategory.list() });
  const { data: goals = [] } = useQuery({ queryKey: ['goals'], queryFn: () => base44.entities.SavingsGoal.list() });
  const { data: debts = [] } = useQuery({ queryKey: ['debts'], queryFn: () => base44.entities.Debt.list() });

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const savings = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
  const totalBudget = budgets.reduce((s, b) => s + (b.budget || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const remaining = totalBudget - totalSpent;

  const totalGoals = goals.reduce((s, g) => s + (g.target_amount || 0), 0);
  const totalSaved = goals.reduce((s, g) => s + (g.current_amount || 0), 0);
  const totalDebt = debts.reduce((s, d) => s + (d.total_amount || 0), 0);
  const totalPaid = debts.reduce((s, d) => s + (d.paid_amount || 0), 0);
  const totalMonthlyDebt = debts.reduce((s, d) => s + (d.monthly_payment || 0), 0);

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.SavingsGoal.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); setShowGoalForm(false); setGoalForm({ name: '', target_amount: '' }); },
  });

  const budgetData = budgets.map(b => ({ name: b.name, value: b.spent || 0 }));

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="🇨🇩" value={`$${income.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`} label="Revenus" trend="↗ +8%" trendColor="text-green-400" />
        <KpiCard icon="💸" value={`$${expense.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`} label="Dépensé" trend="↘ +3%" trendColor="text-red-400" />
        <KpiCard icon="🏦" value={`${savings}%`} label="Épargne" trend="↗ +2%" />
        <KpiCard icon="📱" value="+$320" label="M-PESA" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">⊙ Finance Personnelle</h2>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="overview">📊 Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="budget">🔴 Budget</TabsTrigger>
          <TabsTrigger value="goals">🟢 Objectifs</TabsTrigger>
          <TabsTrigger value="debts">⚠ Dettes</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h4 className="font-semibold mb-4">📊 Où va votre argent?</h4>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={budgetData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45}>
                      {budgetData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1">
                {budgets.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{b.name}</span>
                    <span className="ml-auto">${(b.spent || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h4 className="font-semibold mb-4">💡 Conseils Personnalisés</h4>
            <div className="space-y-3">
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-sm font-medium">Épargne: {savings}%</p>
                <p className="text-xs text-muted-foreground">Objectif 20%. {savings >= 20 ? 'Excellent travail!' : 'Augmentez votre épargne mensuelle.'}</p>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-sm font-medium">Règle 50/30/20</p>
                <p className="text-xs text-muted-foreground">50% besoins · 30% envies · 20% épargne</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">🔴 Budget Mensuel par Catégorie</h4>
              <span className="text-xs text-muted-foreground">Budget: ${totalBudget.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="space-y-4">
              {budgets.map((b, i) => {
                const pct = b.budget > 0 ? (b.spent / b.budget) * 100 : 0;
                const isOver = pct > 100;
                return (
                  <div key={b.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{b.icon || '📌'} {b.name}</span>
                      <span className="text-sm">${(b.spent || 0).toFixed(2)} / ${(b.budget || 0).toFixed(2)}</span>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-2" />
                    {pct > 80 && (
                      <p className="text-xs mt-1" style={{ color: isOver ? '#ef4444' : '#eab308' }}>
                        ⚡ {isOver ? `Dépassement de $${((b.spent || 0) - (b.budget || 0)).toFixed(2)}` : `Attention: ${Math.round(100 - pct)}% restant ($${((b.budget || 0) - (b.spent || 0)).toFixed(2)})`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(222 35% 16%)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={remaining <= 0 ? '#ef4444' : '#22c55e'} strokeWidth="10"
                  strokeDasharray={`${Math.min(totalBudget > 0 ? (totalSpent / totalBudget) * 314 : 0, 314)} 314`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">${Math.abs(remaining).toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">restant</span>
              </div>
            </div>
            <p className={`font-semibold ${remaining <= 0 ? 'text-red-400' : remaining < 100 ? 'text-yellow-400' : 'text-green-400'}`}>
              {remaining <= 0 ? '🔴 Budget épuisé' : remaining < 100 ? '🟡 Presque épuisé' : '🟢 Sous contrôle'}
            </p>
          </div>
        </div>
      )}

      {tab === 'goals' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">🟢 Progression Globale de vos Objectifs</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm">${totalSaved.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} / ${totalGoals.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                <Button size="sm" onClick={() => setShowGoalForm(true)} className="bg-green-500 hover:bg-green-600 text-xs">+ Objectif</Button>
              </div>
            </div>
            <Progress value={totalGoals > 0 ? (totalSaved / totalGoals) * 100 : 0} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">💡 Vous avez épargné {totalGoals > 0 ? Math.round((totalSaved / totalGoals) * 100) : 0}% de vos objectifs totaux.</p>
          </div>

          {showGoalForm && (
            <div className="bg-card border border-border rounded-xl p-6">
              <form onSubmit={e => { e.preventDefault(); createGoalMutation.mutate({ ...goalForm, target_amount: Number(goalForm.target_amount), current_amount: 0 }); }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Nom</Label><Input value={goalForm.name} onChange={e => setGoalForm({ ...goalForm, name: e.target.value })} className="bg-secondary" /></div>
                <div><Label>Objectif ($)</Label><Input type="number" value={goalForm.target_amount} onChange={e => setGoalForm({ ...goalForm, target_amount: e.target.value })} className="bg-secondary" /></div>
                <div className="flex items-end gap-2">
                  <Button type="submit" className="bg-green-500 hover:bg-green-600">Créer</Button>
                  <Button type="button" variant="outline" onClick={() => setShowGoalForm(false)}>Annuler</Button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(g => {
              const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
              const remaining = (g.target_amount || 0) - (g.current_amount || 0);
              return (
                <div key={g.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{g.name}</h4>
                      <p className="text-xs text-muted-foreground">Objectif: ${(g.target_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <span className="text-sm font-bold text-yellow-400">{pct}%</span>
                  </div>
                  <p className="text-xl font-bold text-green-400">${(g.current_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground">Il reste ${remaining.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                  <Progress value={pct} className="mt-2 h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">{pct}% atteint</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'debts' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h4 className="font-semibold mb-2">📊 Vue d'ensemble de vos Dettes</h4>
            <p className="text-xs text-muted-foreground mb-4">💡 Stratégie avalanche: Remboursez d'abord la dette au taux le plus élevé.</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-secondary rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">Total Restant</p>
                <p className="text-xl font-bold text-red-400">${(totalDebt - totalPaid).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-secondary rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">Déjà Remboursé</p>
                <p className="text-xl font-bold text-green-400">${totalPaid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-secondary rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">Paiement/Mois</p>
                <p className="text-xl font-bold">${totalMonthlyDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {debts.map(d => {
            const pct = d.total_amount > 0 ? Math.round(((d.paid_amount || 0) / d.total_amount) * 100) : 0;
            return (
              <div key={d.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{d.name}</h4>
                    <p className="text-xs text-muted-foreground">Taux: {d.interest_rate || 0}% · ${(d.monthly_payment || 0).toFixed(2)}/mois</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-400">${((d.total_amount || 0) - (d.paid_amount || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground">/ ${(d.total_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <Progress value={pct} className="mt-3 h-2" />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-green-400">{pct}% remboursé</span>
                  <span className="text-xs text-muted-foreground">~{d.remaining_months || '?'} mois restants</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}