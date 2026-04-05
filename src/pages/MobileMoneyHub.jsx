import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatUSD, formatCDF, formatDual, usdToCents, cdfToCents } from '@/utils/currency';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, Phone, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLang } from '@/lib/LanguageContext';

const PROVIDERS = [
  { key: 'mpesa', label: 'M-Pesa', sub: 'Vodacom Congo', color: '#E31837', emoji: '💚', bg: 'bg-red-500/10 border-red-500/30' },
  { key: 'airtel', label: 'Airtel Money', sub: 'Airtel Congo', color: '#EE1C23', emoji: '❤️', bg: 'bg-red-600/10 border-red-600/30' },
  { key: 'orange', label: 'Orange Money', sub: 'Orange Congo', color: '#FF7900', emoji: '🟠', bg: 'bg-orange-500/10 border-orange-500/30' },
];

const PIE_COLORS = { mpesa: '#E31837', airtel: '#EE1C23', orange: '#FF7900' };
const STATUS_COLORS = { pending: 'bg-yellow-500/10 text-yellow-400', confirmed: 'bg-green-500/10 text-green-400', failed: 'bg-red-500/10 text-red-400', cancelled: 'bg-muted text-muted-foreground' };

function generateRef() {
  return 'NZB' + Date.now().toString(36).toUpperCase();
}

function CountdownTimer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);
  useState(() => {
    const t = setInterval(() => setLeft(l => { if (l <= 1) { clearInterval(t); onExpire?.(); return 0; } return l - 1; }), 1000);
    return () => clearInterval(t);
  });
  const pct = (left / seconds) * 100;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 36}`}
            strokeDashoffset={`${2 * Math.PI * 36 * (1 - pct / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">{left}s</span>
      </div>
      <p className="text-xs text-muted-foreground">Expiration dans {left}s</p>
    </div>
  );
}

export default function MobileMoneyHub() {
  const qc = useQueryClient();
  const [step, setStep] = useState(0); // 0=dashboard, 1=provider, 2=details, 3=confirm, 4=success
  const [provider, setProvider] = useState(null);
  const [amountMode, setAmountMode] = useState('USD');
  const [amountVal, setAmountVal] = useState('');
  const [phone, setPhone] = useState('+243');
  const [note, setNote] = useState('');
  const [txRef, setTxRef] = useState('');
  const [txRecord, setTxRecord] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const rate = user?.exchange_rate || 2500;

  const amountCents = amountMode === 'USD'
    ? usdToCents(amountVal)
    : cdfToCents(amountVal, rate);

  const { data: txs = [] } = useQuery({
    queryKey: ['momoTx'],
    queryFn: () => base44.entities.MobileMoneyTransaction.list('-created_date', 50),
  });

  const createTx = useMutation({
    mutationFn: (data) => base44.entities.MobileMoneyTransaction.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['momoTx'] }),
  });

  const updateTx = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MobileMoneyTransaction.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['momoTx'] }),
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTxs = txs.filter(t => t.created_date?.startsWith(todayStr));
  const todayCents = todayTxs.filter(t => t.status === 'confirmed').reduce((s, t) => s + (t.amount_usd_cents || 0), 0);
  const pendingCount = txs.filter(t => t.status === 'pending').length;

  const pieData = PROVIDERS.map(p => ({
    name: p.label,
    value: txs.filter(t => t.provider === p.key && t.status === 'confirmed').reduce((s, t) => s + (t.amount_usd_cents || 0), 0) / 100,
    color: PIE_COLORS[p.key],
  })).filter(d => d.value > 0);

  const handleSendSTK = async () => {
    const ref = generateRef();
    setTxRef(ref);
    const rec = await createTx.mutateAsync({
      provider: provider.key,
      phone_number: phone,
      amount_usd_cents: amountCents,
      amount_cdf: Math.round((amountCents / 100) * rate),
      exchange_rate_used: rate,
      transaction_reference: ref,
      status: 'pending',
      note,
    });
    setTxRecord(rec);
    setStep(3);
  };

  const handleConfirm = async () => {
    if (txRecord?.id) {
      await updateTx.mutateAsync({ id: txRecord.id, data: { status: 'confirmed' } });
    }
    setStep(4);
  };

  const handleCancel = async () => {
    if (txRecord?.id) {
      await updateTx.mutateAsync({ id: txRecord.id, data: { status: 'cancelled' } });
    }
    resetFlow();
  };

  const resetFlow = () => {
    setStep(0); setProvider(null); setAmountVal(''); setPhone('+243'); setNote(''); setTxRef(''); setTxRecord(null);
  };

  const waReceipt = () => {
    const prov = PROVIDERS.find(p => p.key === provider?.key);
    const msg = encodeURIComponent(
      `🧾 *Reçu - ${user?.full_name || 'Nzimbu'}*\n━━━━━━━━━━━━━━\nMontant: ${formatUSD(amountCents)} / ${formatCDF(amountCents, rate)}\nPaiement: ${prov?.label} ✅\nRéf: ${txRef}\nDate: ${new Date().toLocaleDateString('fr-FR')}\n━━━━━━━━━━━━━━\nMerci de votre confiance! 🙏\n*Nzimbu*`
    );
    window.open(`https://wa.me/${phone.replace(/\s+/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">💳 Mobile Money</h1>
          <p className="text-xs text-muted-foreground">Ba Mbongo ya Téléphone</p>
        </div>
        <Button size="sm" className="bg-primary border-0" onClick={() => setStep(1)}>
          + Nouveau paiement
        </Button>
      </div>

      {/* Dashboard */}
      {step === 0 && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Collecté aujourd'hui</p>
              <p className="font-bold text-green-400 font-mono">{formatUSD(todayCents)}</p>
              <p className="text-xs text-muted-foreground">{formatCDF(todayCents, rate)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">En attente</p>
              <p className={`font-bold font-mono text-2xl ${pendingCount > 0 ? 'text-yellow-400' : 'text-muted-foreground'}`}>{pendingCount}</p>
              {pendingCount > 0 && <p className="text-xs text-yellow-400">⚠️ Non confirmés</p>}
            </div>
          </div>

          {/* Pie chart */}
          {pieData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Par opérateur</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent transactions */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Transactions récentes</p>
              {pendingCount > 0 && <Badge className="bg-yellow-500/10 text-yellow-400">{pendingCount} en attente</Badge>}
            </div>
            {txs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Aucune transaction</div>
            ) : (
              <div className="divide-y divide-border">
                {txs.slice(0, 20).map(tx => {
                  const prov = PROVIDERS.find(p => p.key === tx.provider);
                  return (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-xl">{prov?.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.phone_number}</p>
                        <p className="text-xs text-muted-foreground">{tx.transaction_reference} · {prov?.label}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono text-foreground">{formatUSD(tx.amount_usd_cents)}</p>
                        <Badge className={`text-[10px] ${STATUS_COLORS[tx.status]}`}>{tx.status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* STEP 1 — Select Provider */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground px-1">Choisissez l'opérateur / Pona opérateur</p>
          {PROVIDERS.map(p => (
            <button key={p.key} onClick={() => { setProvider(p); setStep(2); }}
              className={`w-full border rounded-xl p-5 text-left flex items-center gap-4 hover:border-primary/50 transition-colors ${p.bg}`}>
              <span className="text-4xl">{p.emoji}</span>
              <div>
                <p className="font-bold text-lg">{p.label}</p>
                <p className="text-sm text-muted-foreground">{p.sub}</p>
              </div>
            </button>
          ))}
          <Button variant="outline" className="w-full" onClick={resetFlow}>Annuler</Button>
        </div>
      )}

      {/* STEP 2 — Enter Details */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm font-semibold mb-1">{provider?.emoji} {provider?.label}</p>
            <p className="text-xs text-muted-foreground">Entrez les détails du paiement</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            {/* Amount */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Montant</label>
              <div className="flex gap-2 mb-2">
                {['USD', 'CDF'].map(m => (
                  <button key={m} onClick={() => setAmountMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${amountMode === m ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  {amountMode === 'USD' ? '$' : 'FC'}
                </span>
                <input type="number" inputMode="decimal" value={amountVal} onChange={e => setAmountVal(e.target.value)} placeholder="0"
                  className="w-full bg-muted border border-border rounded-lg pl-8 pr-3 py-3 text-lg font-bold font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-12" />
              </div>
              {amountCents > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  = {amountMode === 'USD' ? formatCDF(amountCents, rate) : formatUSD(amountCents)}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Numéro de téléphone (+243)</label>
              <input type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+243 81 XXX XXXX"
                className="w-full bg-muted border border-border rounded-lg px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-12" />
            </div>

            {/* Note */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Note / Référence (optionnel)</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Paiement facture #..."
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none h-12" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Retour</Button>
            <Button className="flex-1 bg-primary border-0" disabled={amountCents <= 0 || phone.length < 9}
              onClick={handleSendSTK}>
              Envoyer →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 — STK Push confirmation */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
            <div className="text-6xl animate-pulse">{provider?.emoji}</div>
            <div>
              <p className="font-semibold">Message {provider?.label} envoyé au</p>
              <p className="text-primary font-bold text-lg">{phone}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-sm text-muted-foreground">
              Demandez au client de confirmer son paiement sur son téléphone.
              Appuyez <strong>"✅ Confirmé"</strong> après validation.
            </div>
            <CountdownTimer seconds={120} onExpire={() => {}} />
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Réf: {txRef}</p>
              <p className="font-bold font-mono">{formatDual(amountCents, rate)}</p>
            </div>
          </div>
          <Button className="w-full bg-green-500 hover:bg-green-600 border-0 h-12 text-white font-bold text-base" onClick={handleConfirm}>
            ✅ Paiement Confirmé
          </Button>
          <Button variant="outline" className="w-full h-12 text-red-400 border-red-400/30 hover:bg-red-500/10" onClick={handleCancel}>
            ❌ Annuler
          </Button>
        </div>
      )}

      {/* STEP 4 — Success */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <p className="font-bold text-xl text-green-400">Paiement confirmé!</p>
              <p className="text-sm text-muted-foreground">{provider?.label} · {phone}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Montant reçu</p>
              <p className="text-2xl font-bold font-mono">{formatUSD(amountCents)}</p>
              <p className="text-sm text-muted-foreground">{formatCDF(amountCents, rate)}</p>
              <p className="text-xs text-muted-foreground mt-2">Réf: {txRef}</p>
            </div>
          </div>
          <Button className="w-full bg-[#25D366] hover:bg-[#20b558] border-0 h-12 text-white font-bold" onClick={waReceipt}>
            📱 Envoyer reçu WhatsApp
          </Button>
          <Button variant="outline" className="w-full h-12" onClick={resetFlow}>
            + Nouvelle transaction
          </Button>
        </div>
      )}
    </div>
  );
}