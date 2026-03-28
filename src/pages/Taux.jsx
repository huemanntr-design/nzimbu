import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { fmtDate, today } from '@/lib/fmt';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Taux() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: today(), rate_cdf_per_usd: 2800, buying: 2780, selling: 2820, source: 'manual' });

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['fxRates'],
    queryFn: () => base44.entities.FxRate.list('-date', 30),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.FxRate.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fxRates'] }); setShowForm(false); },
  });

  const current = rates[0];
  const last7 = rates.slice(0, 7);
  const avg7 = last7.length > 0 ? last7.reduce((s, r) => s + r.rate_cdf_per_usd, 0) / last7.length : 0;
  const deviation = current && avg7 ? Math.abs((current.rate_cdf_per_usd - avg7) / avg7 * 100) : 0;
  const chartData = rates.slice(0, 30).reverse().map(r => ({ date: r.date?.slice(5), rate: r.rate_cdf_per_usd }));

  return (
    <div>
      <PageHeader
        title="Taux de Change"
        subtitle="CDF / USD"
        action={
          <Button size="sm" className="gradient-primary border-0 h-8" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Saisir
          </Button>
        }
      />

      {/* Deviation alert */}
      {deviation > 5 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400">
            Le taux actuel dévie de <strong>{deviation.toFixed(1)}%</strong> par rapport à la moyenne sur 7 jours ({avg7.toFixed(0)} CDF).
          </p>
        </div>
      )}

      {/* Current rate */}
      {current && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Taux actuel ({fmtDate(current.date)})</p>
          <p className="font-playfair text-4xl font-bold text-foreground mb-2">{current.rate_cdf_per_usd.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">CDF par 1 USD</p>
          <div className="flex justify-center gap-6 mt-3">
            <div>
              <p className="text-xs text-muted-foreground">Achat</p>
              <p className="text-sm font-semibold text-green-400">{current.buying?.toLocaleString() || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vente</p>
              <p className="text-sm font-semibold text-red-400">{current.selling?.toLocaleString() || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">HISTORIQUE</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#666' }} tickLine={false} axisLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#666' }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: '#12121f', border: '1px solid #222', borderRadius: 8, fontSize: 11 }}
                formatter={(v) => [`${v.toLocaleString()} CDF`, 'Taux']}
              />
              <Line type="monotone" dataKey="rate" stroke="#F1C40F" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History list */}
      <div className="space-y-2">
        {rates.slice(0, 10).map(r => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{r.rate_cdf_per_usd.toLocaleString()} CDF</p>
              <p className="text-xs text-muted-foreground">{fmtDate(r.date)} · {r.source}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p className="text-green-400">↑ {r.buying?.toLocaleString() || '—'}</p>
              <p className="text-red-400">↓ {r.selling?.toLocaleString() || '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Form Sheet */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end"
            onClick={() => setShowForm(false)}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-screen-sm mx-auto bg-card rounded-t-2xl p-5 pb-8 border border-border"
            >
              <h2 className="font-playfair font-semibold mb-4">Saisir Taux du Jour</h2>
              <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ ...form, rate_cdf_per_usd: +form.rate_cdf_per_usd, buying: +form.buying, selling: +form.selling }); }} className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { k: 'rate_cdf_per_usd', label: 'Taux moyen' },
                    { k: 'buying', label: 'Achat' },
                    { k: 'selling', label: 'Vente' },
                  ].map(({ k, label }) => (
                    <div key={k}>
                      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                      <input type="number" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
                    </div>
                  ))}
                </div>
                <Button type="submit" className="w-full gradient-primary border-0" disabled={createMutation.isPending}>
                  Enregistrer
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}