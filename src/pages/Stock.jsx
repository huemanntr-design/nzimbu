import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Stock() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', type: 'Autre', price_usd: 0, cost_price: 0, stock_qty: 0, reorder_point: 10 });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const lowStock = products.filter(p => (p.stock_qty || p.stock || 0) <= (p.reorder_point || p.alert_threshold || 10));
  const totalValue = products.reduce((s, p) => s + ((p.stock_qty || p.stock || 0) * (p.price_usd || p.price || 0)), 0);

  const adjustStock = (p, delta) => {
    const current = p.stock_qty ?? p.stock ?? 0;
    updateMutation.mutate({ id: p.id, data: { stock_qty: Math.max(0, current + delta) } });
  };

  return (
    <div>
      <PageHeader
        title="Stock"
        subtitle={`${products.length} produits · Valeur $${totalValue.toFixed(2)}`}
        action={
          <Button size="sm" className="bg-primary hover:bg-primary/90 border-0 h-8" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Ajouter
          </Button>
        }
      />

      {lowStock.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">{lowStock.length} produit(s) en rupture ou stock bas</p>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <h3 className="font-semibold text-sm">Nouveau Produit</h3>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Nom *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground col-span-2 focus:outline-none" />
            <input placeholder="SKU" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
              {['Boisson', 'Alimentaire', 'Hygiène', 'Autre'].map(t => <option key={t}>{t}</option>)}
            </select>
            <input type="number" placeholder="Prix vente (USD)" value={form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: +e.target.value }))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
            <input type="number" placeholder="Coût achat (USD)" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: +e.target.value }))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
            <input type="number" placeholder="Stock initial" value={form.stock_qty} onChange={e => setForm(f => ({ ...f, stock_qty: +e.target.value }))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
            <input type="number" placeholder="Seuil alerte" value={form.reorder_point} onChange={e => setForm(f => ({ ...f, reorder_point: +e.target.value }))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 border-0" onClick={() => form.name && createMutation.mutate(form)} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Création…' : 'Créer'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {isLoading ? <LoadingSkeleton rows={4} /> : products.length === 0 ? (
        <EmptyState icon="📦" title="Aucun produit" description="Ajoutez votre premier produit." />
      ) : (
        <div className="space-y-2">
          {products.map(p => {
            const stock = p.stock_qty ?? p.stock ?? 0;
            const threshold = p.reorder_point ?? p.alert_threshold ?? 10;
            const isLow = stock <= threshold;
            return (
              <motion.div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{p.name}</p>
                    {isLow && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">Stock bas</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.type} {p.sku ? `· ${p.sku}` : ''}</p>
                  <p className="text-xs text-green-400 font-medium">${(p.price_usd || p.price || 0).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustStock(p, -1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-secondary">
                    <Minus size={12} />
                  </button>
                  <span className={`text-sm font-bold w-8 text-center ${isLow ? 'text-amber-400' : 'text-foreground'}`}>{stock}</span>
                  <button onClick={() => adjustStock(p, 1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-secondary">
                    <Plus size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}