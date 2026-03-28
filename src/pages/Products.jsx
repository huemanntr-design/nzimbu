import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Pencil } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import ProductForm from '../components/products/ProductForm';

export default function Products() {
  const [tab, setTab] = useState('catalogue');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setShowForm(false); setEditing(null); },
  });

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
  const avgMargin = products.length > 0 ? Math.round(products.reduce((s, p) => s + ((p.price && p.cost) ? ((p.price - p.cost) / p.price) * 100 : 0), 0) / products.length) : 0;
  const lowStockCount = products.filter(p => p.stock <= (p.alert_threshold || 10)).length;
  const stockOk = products.length > 0 ? Math.round(((products.length - lowStockCount) / products.length) * 100) : 100;

  const handleSave = (data) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Stock health bar */}
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Valeur Totale du Stock</p>
        <h2 className="text-3xl font-bold">${products.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</h2>
        <p className="text-sm text-muted-foreground mt-1">{products.length} produits · {new Set(products.map(p => p.type)).size} catégories</p>
        <Progress value={stockOk} className="mt-3 h-2" />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-muted-foreground">{products.length - lowStockCount}/{products.length} produits en stock normal</p>
          <p className="text-xs text-green-400">+ {stockOk}%</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-2xl">⚠️</p>
          <p className="text-xl font-bold text-yellow-400">{lowStockCount}</p>
          <p className="text-xs text-muted-foreground uppercase">Stock Bas</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-2xl">📊</p>
          <p className="text-xl font-bold text-green-400">{avgMargin}%</p>
          <p className="text-xs text-muted-foreground uppercase">Marge Moy.</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-2xl">📦</p>
          <p className="text-xl font-bold text-blue-400">{totalStock}</p>
          <p className="text-xs text-muted-foreground uppercase">Unités</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">◻ Produits & Stock</h2>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-green-500 hover:bg-green-600 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nouveau Produit
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="catalogue">🟢 Catalogue</TabsTrigger>
          <TabsTrigger value="stock">📦 Stock</TabsTrigger>
        </TabsList>
      </Tabs>

      {showForm && (
        <ProductForm product={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher produit..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
      </div>

      {tab === 'catalogue' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(p => {
            const margin = p.price && p.cost ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
                <div className="text-center mb-3">
                  <div className="text-4xl mb-2">{p.type === 'Boisson' ? '💧' : p.type === 'Alimentaire' ? '🍚' : p.type === 'Hygiène' ? '🧼' : '📦'}</div>
                  <h3 className="font-semibold text-sm">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.type || 'Autre'}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary font-bold">${p.price?.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">{margin}% marge</span>
                </div>
                <Progress value={Math.min(((p.stock || 0) / Math.max(p.alert_threshold || 50, 1)) * 100, 100)} className="mt-2 h-1" />
                <div className="flex justify-between mt-1">
                  <span className={`text-xs ${(p.stock || 0) <= (p.alert_threshold || 10) ? 'text-red-400' : 'text-green-400'}`}>
                    {p.stock || 0}u
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="text-left px-4 py-3">Produit</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Alerte</th>
                <th className="text-left px-4 py-3">Prix Vente</th>
                <th className="text-left px-4 py-3">Coût</th>
                <th className="text-left px-4 py-3">Marge</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const margin = p.price && p.cost ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
                const isLow = (p.stock || 0) <= (p.alert_threshold || 10);
                return (
                  <tr key={p.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="px-4 py-3 font-medium text-sm">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.type}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${isLow ? 'text-red-400' : 'text-green-400'}`}>{p.stock || 0}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.alert_threshold || 10}</td>
                    <td className="px-4 py-3 text-sm text-primary">${p.price?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">${p.cost?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-3 text-sm">{margin}%</td>
                    <td className="px-4 py-3">
                      <Badge className={isLow ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}>
                        {isLow ? '⚠ Bas' : '✅ OK'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setEditing(p); setShowForm(true); }} className="text-primary hover:text-primary/80">
                        <Pencil className="w-4 h-4" />
                      </button>
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