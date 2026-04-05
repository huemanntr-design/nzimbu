import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function groupByMonth(entries) {
  const map = {};
  entries.forEach(e => {
    const d = e.date ? new Date(e.date) : null;
    if (!d || isNaN(d)) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map[key]) map[key] = { year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0, entries: [] };
    map[key].entries.push(e);
    if (e.type === 'income') map[key].income += e.amount;
    else map[key].expense += e.amount;
  });
  return Object.values(map).sort((a, b) => b.year - a.year || b.month - a.month);
}

export default function TimelineView({ sales, expenses, invoices = [] }) {
  const [expandedKey, setExpandedKey] = useState(null);
  const [filter, setFilter] = useState('all');

  const allEntries = [
    ...sales.map(s => ({ date: s.date || s.created_date, description: `Vente: ${s.product_name}`, type: 'income', amount: s.total || 0, client: s.client_name, payment: s.payment_method, id: s.id })),
    ...expenses.map(e => ({ date: e.date || e.created_date, description: e.description, type: 'expense', amount: e.amount || 0, category: e.category, status: e.status, id: e.id })),
    ...invoices.map(i => ({ date: i.issue_date || i.created_date, description: `Facture ${i.invoice_number}: ${i.client_name}`, type: 'invoice', amount: i.subtotal_usd || 0, status: i.status, id: i.id })),
  ];

  const filtered = filter === 'all' ? allEntries : allEntries.filter(e => e.type === filter);
  const monthGroups = groupByMonth(filtered);

  const maxVal = Math.max(...monthGroups.map(m => Math.max(m.income, m.expense)), 1);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { val: 'all', label: '🔀 Tout', color: 'bg-primary text-white' },
          { val: 'income', label: '📥 Revenus', color: 'bg-green-600 text-white' },
          { val: 'expense', label: '📤 Dépenses', color: 'bg-red-600 text-white' },
          { val: 'invoice', label: '🧾 Factures', color: 'bg-blue-600 text-white' },
        ].map(f => (
          <button
            key={f.val}
            onClick={() => setFilter(f.val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.val ? f.color : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Monthly bar overview */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Vue mensuelle</p>
        <div className="flex items-end gap-2 h-24 overflow-x-auto pb-2">
          {monthGroups.slice(0, 12).reverse().map(m => {
            const key = `${m.year}-${m.month}`;
            return (
              <div key={key} className="flex flex-col items-center gap-1 min-w-[32px] cursor-pointer group"
                onClick={() => setExpandedKey(expandedKey === key ? null : key)}>
                <div className="flex items-end gap-0.5 h-16">
                  <div className="w-3 rounded-sm bg-green-500/70 transition-all group-hover:bg-green-500"
                    style={{ height: `${(m.income / maxVal) * 100}%`, minHeight: m.income > 0 ? 2 : 0 }} />
                  <div className="w-3 rounded-sm bg-red-500/70 transition-all group-hover:bg-red-500"
                    style={{ height: `${(m.expense / maxVal) * 100}%`, minHeight: m.expense > 0 ? 2 : 0 }} />
                </div>
                <span className="text-[9px] text-muted-foreground">{MONTHS[m.month]}</span>
                {expandedKey === key && <div className="w-1 h-1 rounded-full bg-primary" />}
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-1">
          <span className="text-[10px] flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500" /> Revenus</span>
          <span className="text-[10px] flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> Dépenses</span>
        </div>
      </div>

      {/* Timeline entries */}
      <div className="space-y-4">
        {monthGroups.map(m => {
          const key = `${m.year}-${m.month}`;
          const isExpanded = expandedKey === key || expandedKey === null;
          const net = m.income - m.expense;

          return (
            <div key={key} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Month header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
                onClick={() => setExpandedKey(expandedKey === key ? null : key)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {MONTHS[m.month]}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{MONTHS[m.month]} {m.year}</p>
                    <p className="text-xs text-muted-foreground">{m.entries.length} opération{m.entries.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {net >= 0 ? '+' : ''}${net.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">net</p>
                </div>
              </button>

              {/* Month summary strip */}
              <div className="px-4 pb-2 flex gap-4 text-xs border-b border-border/50">
                <span className="text-green-400">+${m.income.toFixed(2)}</span>
                <span className="text-red-400">-${m.expense.toFixed(2)}</span>
              </div>

              {/* Entries */}
              {(expandedKey === key) && (
                <div className="divide-y divide-border/30">
                  {m.entries
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((e, i) => (
                      <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                        {/* Timeline dot */}
                        <div className="relative shrink-0">
                          <div className={`w-2 h-2 rounded-full ${e.type === 'income' ? 'bg-green-500' : e.type === 'invoice' ? 'bg-blue-500' : 'bg-red-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{e.description}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '—'}
                            {e.client && ` · ${e.client}`}
                            {e.category && ` · ${e.category}`}
                            {e.payment && ` · ${e.payment}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {e.status && (
                            <Badge className={`text-[9px] px-1.5 py-0 ${e.status === 'approved' || e.status === 'paid' ? 'bg-green-500/10 text-green-400' : e.status === 'overdue' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                              {e.status}
                            </Badge>
                          )}
                          <span className={`text-xs font-semibold ${e.type === 'income' ? 'text-green-400' : e.type === 'invoice' ? 'text-blue-400' : 'text-red-400'}`}>
                            {e.type === 'income' ? '+' : '-'}${e.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}

        {monthGroups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <p className="text-3xl mb-2">📭</p>
            <p>Aucune opération enregistrée</p>
          </div>
        )}
      </div>
    </div>
  );
}