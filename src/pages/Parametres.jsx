import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Save, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const today = () => new Date().toISOString().split('T')[0];

export default function Parametres() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({ company: '', phone: '', address: '', rccm: '', idnat: '' });
  const [notifications, setNotifications] = useState({ lowStock: true, overdueInvoice: true, newPayment: true, newClient: false, lowMargin: false, highCredit: true, dailySummary: true, frequency: 'realtime' });
  const [showTauxForm, setShowTauxForm] = useState(false);
  const [tauxForm, setTauxForm] = useState({ date: today(), rate_cdf_per_usd: '', buying: '', selling: '', source: 'manuel' });
  const { t } = useLang();

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
        title={t('settings_title')}
        subtitle={t('settings_subtitle')}
        action={
          <Button size="sm" className="bg-primary hover:bg-primary/90 border-0 h-8" onClick={handleSave}>
            <Save size={14} /> {saved ? t('saved') : t('save_changes')}
          </Button>
        }
      />

      <div className="space-y-4">
        {user && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">{t('account')}</p>
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
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{t('company_profile')}</p>
          {[
            { key: 'company', label: t('business_name'), placeholder: 'Ma Boutique SARL' },
            { key: 'phone', label: t('phone_label'), placeholder: '+243 8X XXX XXXX' },
            { key: 'address', label: t('address'), placeholder: 'Kinshasa, Gombe' },
            { key: 'rccm', label: 'RCCM', placeholder: 'CD/KIN/RCCM/...' },
            { key: 'idnat', label: 'ID National', placeholder: '01-...' },
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
          {/* Currency */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('currency')}</label>
            <select className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="USD">$ USD — Dollar américain</option>
              <option value="CDF">FC — Franc Congolais (CDF)</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{t('notifications')}</p>
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-xs font-semibold mb-2">🔔 {t('notif_frequency')}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'realtime', label: t('realtime'), icon: '⚡' },
                { val: 'daily', label: t('daily'), icon: '📅' },
                { val: 'weekly', label: t('weekly'), icon: '📆' },
              ].map(f => (
                <button key={f.val} onClick={() => setNotifications(n => ({ ...n, frequency: f.val }))}
                  className={`py-2 rounded-xl text-xs font-medium transition-colors ${notifications.frequency === f.val ? 'bg-primary text-white' : 'bg-muted text-m