import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const today = () => new Date().toISOString().split('T')[0];

export default function Taux() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: today(), rate_cdf_per_usd: '', buying: '', selling: '', source: 'manuel' });

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['fxRates'],
    queryFn: () => base44.entities.FxRate.list('-date', 30),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FxRate.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fxRates'] }); setShowForm(false); },
  });

  const latest = rates[0];
  const prev = rates[1];
  const delta = latest && prev ? latest.rate_cdf_per_usd - prev.rate_cdf_per_usd : 0;
  const avg7 = rates.slice(0, 7).reduce((s, r) => s + r.rate_cdf_per_usd, 0) / Math.min(rates.length, 7);
  const deviation = latest ? Math.abs((latest.rate_cdf_per_usd - avg7) / avg7) * 100 : 0;
  const isAlert = deviation > 5;

  const chartData = [...rates].reverse().map(r => ({ date: r.date?.slice(5), rate: r.rate_cdf_per_usd }));

  const handleSubmit = () => {
    const rate = +form.rate_cdf_per_usd;
    if (!rate) return;
    createMutation.mutate({ ...form, rate_cdf_per_usd: rate, buying: +form.buying || rate - 10, selling: +form.selling || rate + 10 });
  };

  return (
    <div>
      <PageHeader
        title="Taux de Change"
        subtitle="CDF / USD"
        action={
          <Button size="sm" className="bg-primary hover:bg-primary/90 border-0 h-8" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Saisir
          </Button>
        }
      />

      {/* Current rate */}
      {latest && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Taux actuel</p>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold">{latest.rate_cdf_per_usd?.toLocaleString('fr-FR')} CDF</p>
            <p className="text-sm text-muted-foreground mb-1">= 1 USD</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {delta !== 0 && (
              <span className={`flex items-center gap-1 text-xs font-medium ${delta > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {delta > 0 ? '+' : ''}{delta.toFixed(0)} CDF vs hier
              </span>
            )}
            {isAlert && (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <AlertTriangle size={12} /> Déviation {deviation.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-3">Tendance 30 jours</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#6b7280' }} width={55} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <h3 className="font-semibold text-sm">Nouveau taux</h3>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground col-span-2 focus:outline-none" />
            <input type="number" placeholder="Taux moyen CDF/USD *" value={form.rate_cdf_per_usd} onChange={e => setForm(f => ({ ...f, rate_cdf_per_usd: e.target.value }))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground col-span-2 focus:outline-none" />
            <input type="number" placeholder="Achat" value={form.buying} onChange={e => setForm(f => ({ ...f, buying: e.target.value }))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
            <input type="number" placeholder="Vente" value={form.selling} onChange={e => setForm(f => ({ ...f, selling: e.target.value }))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 border-0" onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {isLoading ? <LoadingSkeleton rows={4} /> : (
        <div className="space-y-2">
          {rates.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold">{r.date}</p>
                <p className="text-xs text-muted-foreground">{r.source}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{r.rate_cdf_per_usd?.toLocaleString('fr-FR')} CDF</p>
                {r.buying && <p className="text-xs text-muted-foreground">Achat: {r.buying} · Vente: {r.selling}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}