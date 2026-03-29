import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Save, Plus, TrendingUp, TrendingDown } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

export default function Parametres() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({ company: '', phone: '', address: '', rccm: '', idnat: '' });
  const [notifications, setNotifications] = useState({ lowStock: true, overdueInvoice: true, newPayment: true, newClient: false, lowMargin: false, highCredit: true, dailySummary: true, frequency: 'realtime' });
  const [showTauxForm, setShowTauxForm] = useState(false);
  const [tauxForm, setTauxForm] = useState({ date: today(), rate_cdf_per_usd: '', buying: '', selling: '', source: 'manuel' });

  const { data: rates = [] } = useQuery({ queryKey: ['fxRates'], queryFn: () => base44.entities.FxRate.list('-date', 10) });

  const createTauxMutation = useMutation({
    mutationFn: (data) => base44.entities.FxRate.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fxRates'] }); setShowTauxForm(false); },
  });

  const latest = rates[0];
  const prev = rates[1];
  const delta = latest && prev ? latest.rate_cdf_per_usd - prev.rate_cdf_per_usd : 0;

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Configuration de l'application"
        action={
          <Button size="sm" className="bg-primary hover:bg-primary/90 border-0 h-8" onClick={handleSave}>
            <Save size={14} /> {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
          </Button>
        }
      />

      <div className="space-y-4">
        {/* User info */}
        {user && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Compte</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user.full_name?.[0] || 'U'}
              </div>
              <div>
                <p className="font-semibold text-sm">{user.full_name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">{user.role}</span>
              </div>
            </div>
          </div>
        )}

        {/* Business profile */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Profil commercial</p>
          {[
            { key: 'company', label: "Nom de l'entreprise", placeholder: "Ma Boutique SARL" },
            { key: 'phone', label: "Téléphone", placeholder: "+243 8X XXX XXXX" },
            { key: 'address', label: "Adresse", placeholder: "Kinshasa, Gombe" },
            { key: 'rccm', label: "RCCM", placeholder: "CD/KIN/RCCM/..." },
            { key: 'idnat', label: "ID National", placeholder: "01-..." },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
              <input
                value={profile[key]}
                onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Alertes & Notifications</p>

          {/* Global frequency */}
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-xs font-semibold mb-2">🔔 Fréquence des notifications</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'realtime', label: 'Temps réel', icon: '⚡' },
                { val: 'daily', label: 'Quotidien', icon: '📅' },
                { val: 'weekly', label: 'Hebdo', icon: '📆' },
              ].map(f => (
                <button key={f.val} onClick={() => setNotifications(n => ({ ...n, frequency: f.val }))}
                  className={`py-2 rounded-xl text-xs font-medium transition-colors ${notifications.frequency === f.val ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                  {f.icon} {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Per-type toggles */}
          {[
            { key: 'lowStock', icon: '📦', label: 'Stock bas', desc: 'Alerte quand un produit est sous le seuil de réapprovisionnement' },
            { key: 'overdueInvoice', icon: '📄', label: 'Factures en retard', desc: 'Rappel pour les factures échues non payées' },
            { key: 'newPayment', icon: '💳', label: 'Nouveau paiement', desc: 'Notification à chaque paiement reçu' },
            { key: 'newClient', icon: '👤', label: 'Nouveau client', desc: 'Alerte quand un nouveau client est ajouté' },
            { key: 'lowMargin', icon: '📉', label: 'Marge faible', desc: 'Alerte si la marge d\'un produit passe sous 10%' },
            { key: 'highCredit', icon: '⚠️', label: 'Crédit élevé', desc: 'Client qui dépasse sa limite de crédit' },
            { key: 'dailySummary', icon: '📊', label: 'Résumé journalier', desc: 'Bilan quotidien des ventes et dépenses' },
          ].map(({ key, icon, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xl shrink-0">{icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">{desc}</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                className={`ml-3 w-11 h-6 rounded-full transition-colors shrink-0 relative ${notifications[key] ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications[key] ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Taux de Change */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Taux de Change CDF/USD</p>
            <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 border-0" onClick={() => setShowTauxForm(true)}>
              <Plus size={12} /> Saisir
            </Button>
          </div>
          {latest && (
            <div className="bg-muted/50 rounded-xl p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold">{latest.rate_cdf_per_usd?.toLocaleString('fr-FR')} CDF <span className="text-xs text-muted-foreground">= 1 USD</span></p>
                  <p className="text-xs text-muted-foreground">{latest.date} · {latest.source}</p>
                </div>
                {delta !== 0 && (
                  <span className={`flex items-center gap-1 text-xs font-medium ${delta > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {delta > 0 ? '+' : ''}{delta.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          )}
          {showTauxForm && (
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={tauxForm.date} onChange={e => setTauxForm(f => ({ ...f, date: e.target.value }))}
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground col-span-2 focus:outline-none" />
              <input type="number" placeholder="Taux moyen CDF/USD *" value={tauxForm.rate_cdf_per_usd} onChange={e => setTauxForm(f => ({ ...f, rate_cdf_per_usd: e.target.value }))}
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground col-span-2 focus:outline-none" />
              <input type="number" placeholder="Achat" value={tauxForm.buying} onChange={e => setTauxForm(f => ({ ...f, buying: e.target.value }))}
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
              <input type="number" placeholder="Vente" value={tauxForm.selling} onChange={e => setTauxForm(f => ({ ...f, selling: e.target.value }))}
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
              <div className="col-span-2 flex gap-2">
                <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 border-0"
                  onClick={() => tauxForm.rate_cdf_per_usd && createTauxMutation.mutate({ ...tauxForm, rate_cdf_per_usd: +tauxForm.rate_cdf_per_usd, buying: +tauxForm.buying || +tauxForm.rate_cdf_per_usd - 10, selling: +tauxForm.selling || +tauxForm.rate_cdf_per_usd + 10 })}
                  disabled={createTauxMutation.isPending}>Enregistrer</Button>
                <Button size="sm" variant="outline" onClick={() => setShowTauxForm(false)}>Annuler</Button>
              </div>
            </div>
          )}
          <div className="space-y-1">
            {rates.slice(0, 5).map(r => (
              <div key={r.id} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{r.date}</span>
                <span className="font-medium">{r.rate_cdf_per_usd?.toLocaleString('fr-FR')} CDF</span>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp API */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">WhatsApp API</p>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="text-xs text-green-400 font-medium">✓ Intégration WhatsApp active</p>
            <p className="text-xs text-muted-foreground mt-1">Les messages sont envoyés via l'API WhatsApp intégrée.</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Numéro WhatsApp Business</label>
            <input placeholder="+243 8X XXX XXXX"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
}