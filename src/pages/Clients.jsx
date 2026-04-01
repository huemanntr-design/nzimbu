import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Phone, MessageCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import ClientForm from '../components/clients/ClientForm';
import { useLang } from '@/lib/LanguageContext';

export default function Clients() {
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useLang();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setShowForm(false); },
  });

  const filtered = clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));
  const vipCount = clients.filter(c => c.status === 'vip').length;
  const activeCount = clients.filter(c => c.status === 'actif').length;
  const leadCount = clients.filter(c => c.status === 'lead').length;
  const totalCredit = clients.reduce((s, c) => s + (c.credit_due || 0), 0);
  const totalRevenue = clients.reduce((s, c) => s + (c.total_revenue || 0), 0);

  const statusColors = { lead: 'bg-purple-500/10 text-purple-400', actif: 'bg-green-500/10 text-green-400', vip: 'bg-yellow-500/10 text-yellow-400', inactif: 'bg-gray-500/10 text-gray-400' };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{t('client_revenue')}</p>
        <h2 className="text-3xl font-bold">${totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</h2>
        <p className="text-sm text-muted-foreground mt-1">{clients.length} {t('clients')} · {vipCount} VIP</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-2xl">👑</p>
          <p className="text-xl font-bold text-yellow-400">{vipCount}</p>
          <p className="text-xs text-muted-foreground uppercase">VIP</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-2xl">🟢</p>
          <p className="text-xl font-bold text-green-400">{activeCount}</p>
          <p className="text-xs text-muted-foreground uppercase">{t('active')}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-2xl">💳</p>
          <p className="text-xl font-bold text-red-400">${totalCredit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground uppercase">{t('credit_due')}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-2xl">🎯</p>
          <p className="text-xl font-bold text-purple-400">{leadCount}</p>
          <p className="text-xs text-muted-foreground uppercase">{t('leads')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">⊙ {t('clients')}</h2>
        <Button onClick={() => setShowForm(true)} className="bg-green-500 hover:bg-green-600 text-white">
          <Plus className="w-4 h-4 mr-2" /> {t('add_client')}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="list">👤 {t('list')}</TabsTrigger>
          <TabsTrigger value="crm">📊 {t('crm')}</TabsTrigger>
          <TabsTrigger value="credits">💳 {t('credits')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {showForm && <ClientForm onSave={d => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t('search_client')} value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
      </div>

      {tab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-5">
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
                <Badge className={statusColors[c.status] || statusColors.actif}>
                  {c.status?.toUpperCase() || 'ACTIF'}
                </Badge>
              </div>
              <div className="flex gap-4 text-xs mb-3">
                <div><span className="text-muted-foreground">{t('total_revenue_client')}</span><br/><span className="text-green-400 font-bold">${(c.total_revenue || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span></div>
                <div><span className="text-muted-foreground">{t('credit_due')}</span><br/><span className="text-red-400 font-bold">${(c.credit_due || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span></div>
                <div><span className="text-muted-foreground">{t('credit_limit')}</span><br/><span className="font-bold">${(c.credit_limit || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span></div>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${c.phone}`} className="flex-1 bg-secondary text-foreground text-xs py-2 rounded-lg text-center flex items-center justify-center gap-1 hover:bg-secondary/80">
                  <Phone className="w-3 h-3" /> {t('call')}
                </a>
                <a href={`https://wa.me/${c.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-500 text-white text-xs py-2 rounded-lg text-center flex items-center justify-center gap-1 hover:bg-green-600">
                  <MessageCircle className="w-3 h-3" /> WA
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'crm' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['lead', 'actif', 'vip', 'inactif'].map(status => {
            const group = clients.filter(c => c.status === status);
            return (
              <div key={status} className="bg-card border border-border rounded-xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-sm capitalize flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status === 'vip' ? 'bg-yellow-400' : status === 'actif' ? 'bg-green-400' : status === 'lead' ? 'bg-purple-400' : 'bg-gray-400'}`} />
                    {status === 'vip' ? 'VIPs' : status.charAt(0).toUpperCase() + status.slice(1) + 's'}
                  </h3>
                  <span className="text-xs text-muted-foreground">{group.length}</span>
                </div>
                <div className="space-y-2">
                  {group.map(c => (
                    <div key={c.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                          {c.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span>{c.name}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">${(c.total_revenue || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  {group.length === 0 && <p className="text-xs text-muted-foreground">{t('no_client')}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'credits' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="text-left px-4 py-3">{t('client')}</th>
                <th className="text-left px-4 py-3">{t('credit_due')}</th>
                <th className="text-left px-4 py-3">{t('credit_limit')}</th>
                <th className="text-left px-4 py-3">{t('usage')}</th>
                <th className="text-left px-4 py-3">{t('status')}</th>
                <th className="text-left px-4 py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const usage = c.credit_limit > 0 ? Math.round(((c.credit_due || 0) / c.credit_limit) * 100) : 0;
                return (
                  <tr key={c.id} className="border-b border-border">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                        {c.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-sm">{c.name}</span>
                    </td>
                    <td className="px-4 py-3 text-red-400 font-medium">${(c.credit_due || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm">${(c.credit_limit || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={usage} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground">{usage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={statusColors[c.status] || statusColors.actif}>{c.status?.toUpperCase()}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {(c.credit_due || 0) > 0 && (
                        <a href={`https://wa.me/${c.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white text-xs px-3 py-1 rounded-lg">{t('reminder')}</a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}