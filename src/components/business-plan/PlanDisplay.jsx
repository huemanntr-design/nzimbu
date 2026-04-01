import { useState } from 'react';
import { RotateCcw, Edit3, Check, X } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7'];

// Normalize: arrays become bullet lists, anything else becomes a string
const normalize = (val) => {
  if (!val) return '';
  if (Array.isArray(val)) return val.map(v => `- ${v}`).join('\n');
  return String(val);
};

function EditableSection({ title, emoji, content, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  const save = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(content); setEditing(false); };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 group">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <span>{emoji}</span> {title}
        </h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-all px-2 py-1 rounded-lg bg-muted"
          >
            <Edit3 size={12} /> Modifier
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 px-2 py-1 rounded-lg bg-green-500/10">
              <Check size={12} /> Sauvegarder
            </button>
            <button onClick={cancel} className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded-lg bg-muted">
              <X size={12} /> Annuler
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={Math.max(6, (content || '').split('\n').length + 2)}
          className="w-full bg-muted border border-primary/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
        />
      ) : (
        <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{content}</div>
      )}
    </div>
  );
}

export default function PlanDisplay({ plan: initialPlan, answers, onReset }) {
  const raw = initialPlan.sections || {};
  const [sections, setSections] = useState(
    Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, normalize(v)]))
  );

  const updateSection = (key, value) => setSections(s => ({ ...s, [key]: value }));

  const revenue = Number(answers.monthly_revenue) || 0;
  const expenses = Number(answers.monthly_expenses) || 0;
  const profit = revenue - expenses;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const funding = Number(answers.funding_needed) || 0;

  const projectionData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][i],
    Revenus: Math.round(revenue * (1 + 0.05 * (i + 1))),
    Dépenses: Math.round(expenses * (1 + 0.02 * i)),
    Profit: Math.round(profit * (1 + 0.08 * (i + 1))),
  }));

  const breakdownData = [
    { name: 'Bénéfice', value: Math.max(0, profit) },
    { name: 'Charges', value: expenses },
  ];

  const fundingData = funding > 0 ? [
    { name: 'Stock', value: Math.round(funding * 0.4) },
    { name: 'Marketing', value: Math.round(funding * 0.2) },
    { name: 'Opérations', value: Math.round(funding * 0.25) },
    { name: 'Réserve', value: Math.round(funding * 0.15) },
  ] : [];

  return (
    <div className="space-y-5">
      {/* Cover */}
      <div className="bg-gradient-to-br from-primary/20 to-card border border-primary/30 rounded-2xl p-8 text-center">
        <p className="text-5xl mb-3">📋</p>
        <h1 className="text-3xl font-bold mb-1">{answers.business_type || 'Mon Entreprise'}</h1>
        <p className="text-muted-foreground text-sm">{answers.sector}</p>
        <div className="flex justify-center gap-3 mt-4">
          <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">Plan Stratégique 2026–2029</span>
          <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">✨ Généré par IA</span>
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
          <Edit3 size={11} /> Survolez une section pour la modifier
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'CA Mensuel', value: `$${revenue.toLocaleString('fr-FR')}`, color: 'text-green-400', icon: '💵' },
          { label: 'Bénéfice Net', value: `$${profit.toLocaleString('fr-FR')}`, color: profit >= 0 ? 'text-green-400' : 'text-red-400', icon: '✨' },
          { label: 'Marge', value: `${margin}%`, color: 'text-blue-400', icon: '📊' },
          { label: 'Financement', value: funding > 0 ? `$${funding.toLocaleString('fr-FR')}` : 'N/A', color: 'text-yellow-400', icon: '🏦' },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl mb-1">{k.icon}</p>
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <EditableSection emoji="📝" title="Résumé Exécutif" content={sections.executive_summary} onSave={v => updateSection('executive_summary', v)} />
      <EditableSection emoji="🌍" title="Analyse du Marché" content={sections.market_analysis} onSave={v => updateSection('market_analysis', v)} />

      {/* SWOT */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-base font-bold mb-4 flex items-center gap-2">⚡ Analyse SWOT</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'swot_strengths', label: 'Forces', color: 'border-green-500/30 bg-green-500/5', badge: 'bg-green-500/20 text-green-400' },
            { key: 'swot_weaknesses', label: 'Faiblesses', color: 'border-red-500/30 bg-red-500/5', badge: 'bg-red-500/20 text-red-400' },
            { key: 'swot_opportunities', label: 'Opportunités', color: 'border-blue-500/30 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-400' },
            { key: 'swot_threats', label: 'Menaces', color: 'border-amber-500/30 bg-amber-500/5', badge: 'bg-amber-500/20 text-amber-400' },
          ].map(s => (
            <div key={s.key} className={`rounded-xl border p-4 ${s.color}`}>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{s.label}</span>
              <p className="text-xs text-foreground/80 mt-2 leading-relaxed whitespace-pre-wrap">{sections[s.key]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-base font-bold mb-4">📈 Projections Financières — 12 Mois</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={projectionData} barGap={3}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip
              contentStyle={{ background: 'hsl(222 41% 10%)', border: '1px solid hsl(222 30% 18%)', borderRadius: 10, fontSize: 12 }}
              formatter={v => [`$${Number(v).toLocaleString('fr-FR')}`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Revenus" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-bold mb-4">🥧 Répartition du CA</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={breakdownData} cx={50} cy={50} innerRadius={28} outerRadius={50} dataKey="value" strokeWidth={0}>
                  {breakdownData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {breakdownData.map((d, i) => (
                <div key={d.name} className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-bold">${d.value.toLocaleString('fr-FR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {funding > 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-base font-bold mb-4">💼 Usage du Financement</h2>
            <div className="space-y-3">
              {fundingData.map((d, i) => (
                <div key={d.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-medium">${d.value.toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round((d.value / funding) * 100)}%`, background: COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-base font-bold mb-4">📉 Tendance du Profit</h2>
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={projectionData}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(222 41% 10%)', border: 'none', borderRadius: 8, fontSize: 11 }} formatter={v => [`$${v}`, 'Profit']} />
                <Line type="monotone" dataKey="Profit" stroke="#22c55e" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <EditableSection emoji="🎯" title="Stratégie Commerciale" content={sections.strategy} onSave={v => updateSection('strategy', v)} />

      {/* Roadmap */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-base font-bold mb-4">🗓 Feuille de Route</h2>
        <div className="space-y-3">
          {[
            { key: 'roadmap_6m', label: '6 mois', color: 'border-blue-500', bg: 'bg-blue-500/10' },
            { key: 'roadmap_1y', label: '1 an', color: 'border-green-500', bg: 'bg-green-500/10' },
            { key: 'roadmap_3y', label: '3 ans', color: 'border-purple-500', bg: 'bg-purple-500/10' },
          ].map(r => (
            <div key={r.key} className={`border-l-4 ${r.color} ${r.bg} rounded-r-xl pl-4 py-3 pr-3`}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Objectif {r.label}</p>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{sections[r.key]}</p>
            </div>
          ))}
        </div>
      </div>

      <EditableSection emoji="✅" title="Conclusion & Recommandations" content={sections.conclusion} onSave={v => updateSection('conclusion', v)} />

      <div className="text-center pb-8">
        <button onClick={onReset} className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-xl bg-muted hover:bg-muted/80">
          <RotateCcw size={14} /> Créer un nouveau business plan
        </button>
      </div>
    </div>
  );
}