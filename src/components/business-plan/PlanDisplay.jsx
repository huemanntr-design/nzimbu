import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];

function SectionCard({ emoji, title, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h2>
      {children}
    </div>
  );
}

export default function PlanDisplay({ plan, answers, appData, onReset }) {
  const [activeSection, setActiveSection] = useState('all');

  if (!plan) return null;

  const revenue = Number(answers.monthly_revenue) || 0;
  const expenses = Number(answers.monthly_expenses) || 0;
  const profit = revenue - expenses;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  // 12-month projection data
  const projectionData = Array.from({ length: 12 }, (_, i) => {
    const growthRate = 1 + (0.05 + i * 0.01);
    return {
      month: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][i],
      revenus: Math.round(revenue * growthRate),
      dépenses: Math.round(expenses * (1 + i * 0.02)),
      profit: Math.round((revenue - expenses) * growthRate),
    };
  });

  // Revenue breakdown pie
  const revenueBreakdown = [
    { name: 'Bénéfice', value: Math.max(0, profit) },
    { name: 'Charges', value: expenses },
  ];

  // Funding usage (if applicable)
  const funding = Number(answers.funding_needed) || 0;
  const fundingData = funding > 0 ? [
    { name: 'Stock & Produits', value: Math.round(funding * 0.4) },
    { name: 'Marketing', value: Math.round(funding * 0.2) },
    { name: 'Opérations', value: Math.round(funding * 0.25) },
    { name: 'Réserve', value: Math.round(funding * 0.15) },
  ] : [];

  // SWOT data from plan (parsed sections)
  const sections = plan.sections || {};

  return (
    <div className="space-y-6">
      {/* Cover */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-8 text-center">
        <p className="text-5xl mb-3">📋</p>
        <h1 className="text-3xl font-bold mb-2">{answers.company_name}</h1>
        <p className="text-muted-foreground">{answers.sector} · {answers.location}</p>
        <div className="flex justify-center gap-4 mt-4">
          <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">Plan Stratégique 2026–2029</span>
          <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">Généré par IA</span>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "CA Mensuel", value: `$${revenue.toLocaleString('fr-FR')}`, color: "text-green-400", icon: "💵" },
          { label: "Bénéfice Net", value: `$${profit.toLocaleString('fr-FR')}`, color: profit >= 0 ? "text-green-400" : "text-red-400", icon: "✨" },
          { label: "Marge", value: `${margin}%`, color: "text-blue-400", icon: "📊" },
          { label: "Employés", value: answers.employees || '0', color: "text-purple-400", icon: "👥" },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl mb-1">{k.icon}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Executive Summary */}
      <SectionCard emoji="📝" title="Résumé Exécutif">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{sections.executive_summary || ''}</ReactMarkdown>
        </div>
      </SectionCard>

      {/* 12-month Revenue Projection Chart */}
      <SectionCard emoji="📈" title="Projections Financières — 12 Mois">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={projectionData} barGap={4}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip
              contentStyle={{ background: 'hsl(222 41% 10%)', border: '1px solid hsl(222 30% 18%)', borderRadius: 12, fontSize: 12 }}
              formatter={v => [`$${v.toLocaleString('fr-FR')}`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenus" name="Revenus" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="dépenses" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-2 text-center">Projection basée sur une croissance mensuelle de 5–17% sur 12 mois</p>
      </SectionCard>

      {/* Revenue / Expenses breakdown + Funding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard emoji="🥧" title="Répartition du Chiffre d'Affaires">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={revenueBreakdown} cx={55} cy={55} innerRadius={32} outerRadius={55} dataKey="value" strokeWidth={0}>
                  {revenueBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {revenueBreakdown.map((d, i) => (
                <div key={d.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-bold">${d.value.toLocaleString('fr-FR')}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {funding > 0 ? (
          <SectionCard emoji="💼" title={`Utilisation du Financement ($${funding.toLocaleString('fr-FR')})`}>
            <div className="space-y-3">
              {fundingData.map((d, i) => (
                <div key={d.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-medium">${d.value.toLocaleString('fr-FR')} ({Math.round((d.value / funding) * 100)}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round((d.value / funding) * 100)}%`, background: COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : (
          <SectionCard emoji="📊" title="Tendance Profit — 12 Mois">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={projectionData}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(222 41% 10%)', border: 'none', borderRadius: 8, fontSize: 11 }} formatter={v => [`$${v}`, 'Profit']} />
                <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>
        )}
      </div>

      {/* Market Analysis */}
      <SectionCard emoji="🌍" title="Analyse du Marché">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{sections.market_analysis || ''}</ReactMarkdown>
        </div>
      </SectionCard>

      {/* SWOT */}
      <SectionCard emoji="⚡" title="Analyse SWOT">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Forces', color: 'border-green-500/30 bg-green-500/5', badge: 'bg-green-500/20 text-green-400', content: sections.swot_strengths },
            { label: 'Faiblesses', color: 'border-red-500/30 bg-red-500/5', badge: 'bg-red-500/20 text-red-400', content: sections.swot_weaknesses },
            { label: 'Opportunités', color: 'border-blue-500/30 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-400', content: sections.swot_opportunities },
            { label: 'Menaces', color: 'border-amber-500/30 bg-amber-500/5', badge: 'bg-amber-500/20 text-amber-400', content: sections.swot_threats },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{s.label}</span>
              <div className="prose prose-invert prose-sm max-w-none mt-2">
                <ReactMarkdown>{s.content || ''}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Strategy */}
      <SectionCard emoji="🎯" title="Stratégie Commerciale & Plan d'Action">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{sections.strategy || ''}</ReactMarkdown>
        </div>
      </SectionCard>

      {/* Goals Timeline */}
      <SectionCard emoji="🗓" title="Feuille de Route">
        <div className="space-y-4">
          {[
            { period: '6 mois', color: 'border-blue-500', bg: 'bg-blue-500/10', content: sections.roadmap_6m },
            { period: '1 an', color: 'border-green-500', bg: 'bg-green-500/10', content: sections.roadmap_1y },
            { period: '3 ans', color: 'border-purple-500', bg: 'bg-purple-500/10', content: sections.roadmap_3y },
          ].map(r => (
            <div key={r.period} className={`border-l-4 ${r.color} ${r.bg} rounded-r-xl pl-4 py-3 pr-3`}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Objectif {r.period}</p>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{r.content || ''}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Conclusion */}
      <SectionCard emoji="✅" title="Conclusion & Recommandations">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{sections.conclusion || ''}</ReactMarkdown>
        </div>
      </SectionCard>

      {/* Reset */}
      <div className="text-center pb-8">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw size={14} /> Créer un nouveau business plan
        </Button>
      </div>
    </div>
  );
}