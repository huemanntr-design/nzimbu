import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Phone, MessageCircle, X, TrendingUp, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import ClientForm from '../components/clients/ClientForm';
import { useLang } from '@/lib/LanguageContext';

export default function Clients() {
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const queryClient = useQueryClient();
  const { t } = useLang();

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: () => base44.entities.Sale.list() });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setShowForm(false); },
  });

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );
  const vipCount = clients.filter(c => c.status === 'vip').length;
  const activeCount = clients.filter(c => c.status === 'actif').length;
  const leadCount = clients.filter(c => c.status === 'lead').length;
  const totalCredit = clients.reduce((s, c) => s + (c.credit_due || 0), 0);
  const totalRevenue = clients.reduce((s, c) => s + (c.total_revenue || 0), 0);
  const overCreditLimit = clients.filter(c => c.credit_limit > 0 && (c.credit_due || 0) > c.credit_limit);

  const statusColors = {
    lead: 'bg-purple-500/10 text-purple-400',
    actif: 'bg-green-500/10 text-green-400',
    vip: 'bg-yellow-500/10 text-yellow-400',
    inactif: 'bg-gray-500/10 text-gray-400',
  };

  // KPI click state
  const [kpiModal, setKpiModal] = useState(null);

  const kpiCards = [
    {
      key: 'vip', icon: '👑', value: vipCount, label: 'VIP', color: 'text-yellow-400',
      details: clients.filter(c => c.status === 'vip').map(c => ({ name: c.name, revenue: c.total_revenue || 0 })),
    },
    {
      key: 'actif', icon: '🟢', value: activeCount, label: t('active'), color: 'text-green-400',
      details: clients.filter(c => c.status === 'actif').map(c => ({ name: c.name, revenue: c.total_revenue || 0 })),
    },
    {
      key: 'credit', icon: '💳', value: `$${totalCredit.toFixed(2)}`, label: t('credit_due'), color: 'text-red-400',
      details: clients.filter(c => (c.credit_due || 0) > 0).map(c => ({ name: c.name, revenue: c.credit_due || 0 })),
    },
    {
      key: 'leads', icon: '🎯', value: leadCount, label: t('leads'), color: 'text-purple-400',
      details: clients.filter(c => c.status === 'lead').map(c => ({ name: c.name, revenue: c.total_revenue || 0 })),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{t('client_revenue')}</p>
        <h2 className="text-3xl font-bold">${totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</h2>
        <p className="text-sm text-muted-foreground mt-1">{clients.length} {t('clients')} · {vipCount} VIP</p>
      </div>

      {/* Alert */}
      {overCreditLimit.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">
            <strong>{overCreditLimit.length} client(s)</strong> ont dépassé leur limite de crédit: {overCreditLimit.map(c => c.name).join(', ')}
          </p>
        </div>
      )}

      {/* Clickable KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <button key={card.key} onClick={() => setKpiModal(kpiModal === card.key ? null : card.key)}
            className="bg-card border border-border rounded-xl p-5 text-center hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer">
            <p className="text-2xl">{card.icon}</p>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground uppercase">{card.label}</p>
            <p className="text-[10px] text-primary/60 mt-1">Voir détails →</p>
          </button>
        ))}
      </div>

      {/* KPI Modal */}
      {kpiModal && (() => {
        const card = kpiCards.find(c => c.key === kpiModal);
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setKpiModal(null)}>
            <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{card.icon}</span>
                  <h3 className="font-bold">{card.label}</h3>
                  <span className={`text-lg font-bold ${card.color}`}>{card.value}</span>
                </div>
                <button onClick={() => setKpiModal(null)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
              </div>
              <div className="p-4 max-h-72 overflow-y-auto">
                {card.details.length === 0
                  ? <p className="text-xs text-muted-foreground text-center py-4">Aucun client dans cette catégorie</p>
                  : card.details.map((c, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                          {c.name?.[0]}
                        </div>
                        <span className="text-sm">{c.name}</span>
                      </div>
                      <span className={`text-xs font-semibold ${card.color}`}>${c.revenue.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">⊙ {t('clients')}</h2>
        <Button onClick={() => setShowForm(true)} className="bg-green-500 hover:bg-green-600 text-white">
          <Plus className="w-4 h-4 mr-2" /> {t('add_client')}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="list">👤 {t('list')}</TabsTrigger>
          <TabsTrigger value="credits">💳 {t('credits')}</TabsTrigger>
          <TabsTrigger value="crm">📊 CRM</TabsTrigger>
        </TabsList>
      </Tabs>

      {showForm && <ClientForm onSave={d => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t('search_client')} value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
      </div>

      {/* ── List ── */}
      {tab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setSelectedClient(selectedClient?.id === c.id ? null : c)}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {c.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                    {c.location && <p className="text-xs text-muted-foreground">📍 {c.location}</p>}
                  </div>
                </div>
                <Badge className={statusColors[c.status] || statusColors.actif}>{c.status?.toUpperCase() || 'ACTIF'}</Badge>
              </div>
              <div className="flex gap-4 text-xs mb-3">
                <div><span className="text-muted-foreground">{t('total_revenue_client')}</span><br/><span className="text-green-400 font-bold">${(c.total_revenue || 0).toFixed(2)}</span></div>
                <div><span className="text-muted-foreground">{t('credit_due')}</span><br/><span className="text-red-400 font-bold">${(c.credit_due || 0).toFixed(2)}</span></div>
                <div><span className="text-muted-foreground">{t('credit_limit')}</span><br/><span className="font-bold">${(c.credit_limit_usd || c.credit_limit || 0).toFixed(2)}</span></div>
              </div>

              {/* Expanded detail */}
              {selectedClient?.id === c.id && (
                <div className="border-t border-border pt-3 mt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-secondary rounded-lg p-2">
                      <p className="text-muted-foreground">Score confiance</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={c.trust_score || 50} className="h-1.5 flex-1" />
                        <span className="font-bold">{c.trust_score || 50}%</span>
                      </div>
                    </div>
                    <div className="bg-secondary rounded-lg p-2">
                      <p className="text-muted-foreground">Segment</p>
                      <p className="font-bold text-lg">{c.segment || 'B'}</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-2">
                      <p className="text-muted-foreground">Mois client</p>
                      <p className="font-bold">{c.relationship_months || 0} mois</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-2">
                      <p className="text-muted-foreground">Historique ventes</p>
                      <p className="font-bold">{sales.filter(s => s.client_id === c.id).length} ventes</p>
                    </div>
                  </div>
                  {c.notes && <p className="text-xs text-muted-foreground bg-secondary rounded-lg p-2">📝 {c.notes}</p>}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()}
                  className="flex-1 bg-secondary text-foreground text-xs py-2 rounded-lg text-center flex items-center justify-center gap-1 hover:bg-secondary/80">
                  <Phone className="w-3 h-3" /> {t('call')}
                </a>
                <a href={`https://wa.me/${c.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  className="flex-1 bg-green-500 text-white text-xs py-2 rounded-lg text-center flex items-center justify-center gap-1 hover:bg-green-600">
                  <MessageCircle className="w-3 h-3" /> WA
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Credits ── */}
      {tab === 'credits' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Total crédits en cours</p>
              <p className="text-xl font-bold text-red-400">${totalCredit.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{clients.filter(c => (c.credit_due || 0) > 0).length} clients débiteurs</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Dépassements limite</p>
              <p className="text-xl font-bold text-amber-400">{overCreditLimit.length}</p>
              <p className="text-xs text-muted-foreground">clients à risque</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="text-left px-4 py-3">{t('client')}</th>
                  <th className="text-left px-4 py-3">{t('credit_due')}</th>
                  <th className="text-left px-4 py-3">{t('credit_limit')}</th>
                  <th className="text-left px-4 py-3">{t('usage')}</th>
                  <th className="text-left px-4 py-3">{t('status')}</th>
                  <th className="text-left px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .sort((a, b) => (b.credit_due || 0) - (a.credit_due || 0))
                  .map(c => {
                    const limit = c.credit_limit_usd || c.credit_limit || 0;
                    const due = c.credit_due || 0;
                    const usage = limit > 0 ? Math.round((due / limit) * 100) : 0;
                    const isOver = limit > 0 && due > limit;
                    return (
                      <tr key={c.id} className={`border-b border-border ${isOver ? 'bg-red-500/5' : ''}`}>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                            {c.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{c.name}</p>
                            {isOver && <p className="text-[10px] text-red-400">⚠️ Limite dépassée</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-red-400 font-medium">${due.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">${limit.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(usage, 100)} className="h-1.5 w-16" />
                            <span className={`text-xs ${isOver ? 'text-red-400 font-bold' : 'text-muted-foreground'}`}>{usage}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[c.status] || statusColors.actif}>{c.status?.toUpperCase()}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {due > 0 && (
                            <a href={`https://wa.me/${c.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${c.name}, votre solde en cours est de $${due.toFixed(2)}. Merci de régulariser. 🙏`)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="bg-green-500 text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap">
                              📲 Relancer
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CRM ── */}
      {tab === 'crm' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['lead', 'actif', 'vip', 'inactif'].map(status => {
              const group = clients.filter(c => c.status === status);
              const groupRevenue = group.reduce((s, c) => s + (c.total_revenue || 0), 0);
              return (
                <div key={status} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-sm capitalize flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${status === 'vip' ? 'bg-yellow-400' : status === 'actif' ? 'bg-green-400' : status === 'lead' ? 'bg-purple-400' : 'bg-gray-400'}`} />
                      {status === 'vip' ? 'VIPs' : status.charAt(0).toUpperCase() + status.slice(1) + 's'}
                    </h3>
                    <div className="text-right">
                      <p className="text-xs font-bold">{group.length} clients</p>
                      <p className="text-[10px] text-green-400">${groupRevenue.toFixed(0)} revenus</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {group.map(c => (
                      <div key={c.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                            {c.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <span className="text-sm">{c.name}</span>
                            {(c.credit_due || 0) > 0 && <p className="text-[10px] text-red-400">Crédit: ${c.credit_due.toFixed(2)}</p>}
                          </div>
                        </div>
                        <span className="text-muted-foreground text-xs">${(c.total_revenue || 0).toFixed(2)}</span>
                      </div>
                    ))}
                    {group.length === 0 && <p className="text-xs text-muted-foreground">{t('no_client')}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}