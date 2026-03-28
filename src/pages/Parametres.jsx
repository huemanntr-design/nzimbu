import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Save, Globe, Bell, Smartphone, User } from 'lucide-react';

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'ln', label: 'Lingala' },
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Swahili' },
];

export default function Parametres() {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const [lang, setLang] = useState('fr');
  const [notifs, setNotifs] = useState({ invoices: true, payments: true, lowStock: true, quietStart: '22:00', quietEnd: '07:00' });
  const [profile, setProfile] = useState({ business_name: 'Mon Commerce', wa_number: '', rccm: '', nif: '' });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ToggleRow = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <p className="text-sm text-foreground">{label}</p>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-primary' : 'bg-muted'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${value ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div>
      <PageHeader title="Paramètres" />

      {/* Profile */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <User size={16} className="text-primary" />
          <p className="text-sm font-semibold text-foreground">Profil Commercial</p>
        </div>
        <div className="space-y-3">
          {[
            { k: 'business_name', label: 'Nom de l\'entreprise' },
            { k: 'wa_number', label: 'Numéro WhatsApp Business' },
            { k: 'rccm', label: 'RCCM' },
            { k: 'nif', label: 'NIF' },
          ].map(({ k, label }) => (
            <div key={k}>
              <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
              <input
                value={profile[k]}
                onChange={e => setProfile(p => ({ ...p, [k]: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={16} className="text-primary" />
          <p className="text-sm font-semibold text-foreground">Langue</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${lang === l.code ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-secondary/50'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-primary" />
          <p className="text-sm font-semibold text-foreground">Notifications</p>
        </div>
        <ToggleRow label="Nouvelles factures" value={notifs.invoices} onChange={v => setNotifs(n => ({ ...n, invoices: v }))} />
        <ToggleRow label="Paiements reçus" value={notifs.payments} onChange={v => setNotifs(n => ({ ...n, payments: v }))} />
        <ToggleRow label="Ruptures de stock" value={notifs.lowStock} onChange={v => setNotifs(n => ({ ...n, lowStock: v }))} />
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Heure calme (début)</label>
            <input type="time" value={notifs.quietStart} onChange={e => setNotifs(n => ({ ...n, quietStart: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Heure calme (fin)</label>
            <input type="time" value={notifs.quietEnd} onChange={e => setNotifs(n => ({ ...n, quietEnd: e.target.value }))}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
          </div>
        </div>
      </div>

      {/* WhatsApp API */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone size={16} className="text-green-400" />
          <p className="text-sm font-semibold text-foreground">WhatsApp API</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Connectez Twilio ou Meta Cloud API pour l'envoi automatique.</p>
        <div className="grid grid-cols-2 gap-2">
          {['Twilio', 'Meta Cloud API'].map(provider => (
            <button key={provider} className="bg-muted border border-border rounded-lg py-3 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
              {provider}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">Configuration via les variables d'environnement</p>
      </div>

      {/* User info */}
      {user && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Compte connecté</p>
          <p className="text-sm font-semibold text-foreground">{user.full_name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      )}

      <Button onClick={handleSave} className={`w-full border-0 ${saved ? 'bg-green-600' : 'gradient-primary'}`}>
        <Save size={16} /> {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
      </Button>
    </div>
  );
}