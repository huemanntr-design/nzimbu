import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { fmtUSD, fmtCDF, fmtDate, today, FX_DEFAULT } from '@/lib/fmt';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Plus, Send, CheckCircle, Clock, AlertTriangle, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function Invoices() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 200),
  });
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });
  const { data: fxRates = [] } = useQuery({
    queryKey: ['fxRates'],
    queryFn: () => base44.entities.FxRate.list('-date', 1),
  });

  const fxRate = fxRates[0]?.rate_cdf_per_usd || FX_DEFAULT;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const subtotalUSD = form.lines.reduce((s, l) => s + (l.qty * l.unit_price), 0);
  const subtotalCDF = subtotalUSD * fxRate;

  const addLine = () => setForm(f => ({ ...f, lines: [...f.lines, { description: '', qty: 1, unit_price: 0 }] }));
  const setLine = (i, k, v) => setForm(f => {
    const lines = [...f.lines];
    lines[i] = { ...lines[i], [k]: k === 'description' ? v : +v };
    return { ...f, lines };
  });
  const removeLine = (i) => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = `INV-${Date.now().toString().slice(-6)}`;
    createMutation.mutate({
      ...form,
      invoice_number: num,
      subtotal_usd: subtotalUSD,
      subtotal_cdf: subtotalCDF,
      fx_rate: fxRate,
    });
  };

  const sendViaWA = (inv) => {
    const lines = (inv.lines || []).map(l => `• ${l.description} x${l.qty} = ${fmtUSD(l.qty * l.unit_price)}`).join('\n');
    const text = encodeURIComponent(
      `🧾 *Facture ${inv.invoice_number}*\n\nClient: ${inv.client_name}\nDate: ${fmtDate(inv.issue_date)}\nÉchéance: ${fmtDate(inv.due_date)}\n\n${lines}\n\n*Total: ${fmtUSD(inv.subtotal_usd)}*\n(${fmtCDF(inv.subtotal_cdf)})\n\nMerci pour votre confiance 🙏`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
    updateMutation.mutate({ id: inv.id, data: { status: 'sent', wa_sent_at: new Date().toISOString() } });
  };

  const totalReceivables = invoices
    .filter(i => ['sent', 'viewed', 'partial', 'overdue'].includes(i.status))
    .reduce((s, i) => s + (i.subtotal_usd || 0) - (i.paid_usd || 0), 0);

  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  return (
    <div>
      <PageHeader
        title="Factures"
        subtitle={`${invoices.length} facture${invoices.length !== 1 ? 's' : ''}`}
        action={
          <Button size="sm" className="bg-primary hover:bg-primary/90 border-0 h-8" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Nouvelle
          </Button>
        }
      />

      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Créances</p>
          <p className="text-base font-bold text-amber-400">{fmtUSD(totalReceivables)}</p>
        </div>
        <div className={`rounded-xl p-3 border ${overdueCount > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-card border-border'}`}>
          <p className="text-xs text-muted-foreground">En retard</p>
          <p className={`text-base font-bold ${overdueCount > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>{overdueCount}</p>
        </div>
      </div>

      {isLoading ? <LoadingSkeleton rows={4} /> : invoices.length === 0 ? (
        <EmptyState icon="🧾" title="Aucune facture" description="Créez votre première facture." action={
          <Button size="sm" onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 border-0">Créer une facture</Button>
        } />
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => {
            const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
            const isExpanded = expandedId === inv.id;
            const balance = (inv.subtotal_usd || 0) - (inv.paid_usd || 0);

            return (
              <motion.div key={inv.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div
                  className="p-4 flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">{inv.invoice_number}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{inv.client_name}</p>
                    <p className="text-xs text-muted-foreground">Échéance: {fmtDate(inv.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{fmtUSD(inv.subtotal_usd || 0)}</p>
                    {balance > 0 && <p className="text-xs text-amber-400">reste {fmtUSD(balance)}</p>}
                    <ChevronDown size={14} className={`text-muted-foreground ml-auto mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-4 space-y-3">
                        {/* Lines */}
                        {(inv.lines || []).map((l, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{l.description} × {l.qty}</span>
                            <span className="text-foreground font-medium">{fmtUSD(l.qty * l.unit_price)}</span>
                          </div>
                        ))}
                        {inv.notes && <p className="text-xs text-muted-foreground italic">{inv.notes}</p>}

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => sendViaWA(inv)}>
                            <Send size={12} /> WhatsApp
                          </Button>
                          {inv.status !== 'paid' && (
                            <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 border-0"
                              onClick={() => updateMutation.mutate({ id: inv.id, data: { status: 'paid', paid_usd: inv.subtotal_usd } })}>
                              <CheckCircle size={12} /> Marquer payé
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Invoice Sheet */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            onClick={() => setShowForm(false)}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-screen-sm mx-auto bg-card rounded-t-2xl border border-border overflow-y-auto max-h-[95vh]"
            >
              <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
                <h2 className="font-bold text-foreground">Nouvelle Facture</h2>
                <button onClick={() => setShowForm(false)}><X size={18} className="text-muted-foreground" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 pb-8">
                {/* Client */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Client *</label>
                  <select
                    required
                    value={form.client_id}
                    onChange={e => {
                      const c = clients.find(c => c.id === e.target.value);
                      setForm(f => ({ ...f, client_id: e.target.value, client_name: c?.name || '' }));
                    }}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Sélectionner un client…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date émission</label>
                    <input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Échéance</label>
                    <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
                  </div>
                </div>

                {/* Lines */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Lignes</label>
                  <div className="space-y-2">
                    {form.lines.map((l, i) => (
                      <div key={i} className="grid grid-cols-[1fr_60px_80px_32px] gap-1.5 items-center">
                        <input placeholder="Description" value={l.description} onChange={e => setLine(i, 'description', e.target.value)}
                          className="bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        <input type="number" placeholder="Qté" value={l.qty} onChange={e => setLine(i, 'qty', e.target.value)}
                          className="bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none text-center" />
                        <input type="number" placeholder="Prix" value={l.unit_price} onChange={e => setLine(i, 'unit_price', e.target.value)}
                          className="bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                        <button type="button" onClick={() => removeLine(i)} disabled={form.lines.length === 1}
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

                {/* Total */}
                <div className="bg-muted rounded-xl p-3 text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-foreground">{fmtUSD(subtotalUSD)}</p>
                  <p className="text-xs text-muted-foreground">{fmtCDF(subtotalCDF)}</p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none resize-none" />
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 border-0" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Création…' : 'Créer la facture'}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}