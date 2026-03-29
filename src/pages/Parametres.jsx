import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function Parametres() {
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({ company: '', phone: '', address: '', rccm: '', idnat: '' });
  const [notifications, setNotifications] = useState({ lowStock: true, overdueInvoice: true, newPayment: true });

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
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Alertes & Notifications</p>
          {[
            { key: 'lowStock', label: 'Stock bas', desc: 'Alerte quand un produit est sous le seuil' },
            { key: 'overdueInvoice', label: 'Factures en retard', desc: 'Rappel pour les factures échues' },
            { key: 'newPayment', label: 'Nouveau paiement', desc: 'Notification de paiement reçu' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button
                onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                className={`w-11 h-6 rounded-full transition-colors ${notifications[key] ? 'bg-primary' : 'bg-muted'} relative`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications[key] ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
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