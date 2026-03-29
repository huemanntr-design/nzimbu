import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Minus, AlertTriangle, Search, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';

const TYPE_EMOJI = { Boisson: '💧', Alimentaire: '🌾', Hygiène: '🧴', Autre: '📦' };
const COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#a855f7', '#06b6d4'];

function margin(p) {
  const price = p.price_usd || p.price || 0;
  const cost = p.cost_price || p.cost || 0;
  return price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
}
function stock(p) { return p.stock_qty ?? p.stock ?? 0; }
function threshold(p) { return p.reorder_point ?? p.alert_threshold ?? 10; }
function revenue(p, sales = []) {
  return sales.filter(s => s.product_id === p.id || s.product_name === p.name).reduce((s, x) => s + (x.total || 0), 0);
}

const TABS = ['Catalogue', 'Stock', 'Analytics'];

export default function Stock() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('Catalogue');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', type: 'Autre', price_usd: 0, cost_price: 0, stock_qty: 0, reorder_point: 10 });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });
  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setShowForm(false); setForm({ name: '', sku: '', type: 'Autre', price_usd: 0, cost_price: 0, stock_qty: 0, reorder_point: 10 }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const adjustStock = (p, delta) => {
    updateMutation.mutate({ id: p.id, data: { stock_qty: Math.max(0, stock(p) + delta) } });
  };

  const totalValue = products.reduce((s, p) => s + stock(p) * (p.price_usd || p.price || 0), 0);
  const totalUnits = products.reduce((s, p) => s + stock(p), 0);
  const lowStockCount = products.filter(p => stock(p) <= threshold(p)).length;
  const avgMargin = products.length ? Math.round(products.reduce((s, p) => s + margin(p), 0) / products.length) : 0;
  const normalCount = products.filter(p => stock(p) > threshold(p)).length;
  const normalPct = products.length ? Math.round((normalCount / products.length) * 100) : 0;
  const categories = [...new Set(products.map(p => p.type || 'Autre'))].length;

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  // Analytics data
  const pieData = products.map(p => ({ name: p.name, value: stock(p) })).filter(d => d.value > 0);
  const revenueData = products
    .map(p => ({ name: p.name?.split(' ')[0], rev: revenue(p, sales) }))
    .filter(d => d.rev > 0)
    .sort((a, b) => b.rev - a.rev)
    .slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Valeur Totale du Stock</p>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-4xl font-bold text-foreground">${totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground mt-1">{products.length} produits · {categories} catégories</p>
          </div>
          <span className="text-3xl">📦</span>
        </div>
        <div className="mt-3">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${normalPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>{normalCount}/{products.length} produits en stock normal</span>
            <span className="text-primary font-medium">● {normalPct}%</span>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">⚠️</p>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-400' : 'text-green-400'}`}>{lowStockCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Stock Bas</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">📊</p>
          <p className="text-2xl font-bold text-amber-400">{avgMargin}%</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Marge Moy.</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">📈</p>
          <p className="text-2xl font-bold text-green-400">{totalUnits}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Unités</p>
        </div>
      </div>

      {/* Title + New button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">⊡ Produits &amp; Stock</h2>
        <Button size="sm" className="bg-primary hover:bg-primary/90 border-0 h-8" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Nouveau Produit
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${tab === t ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'Catalogue' ? '🛍 ' : t === 'Stock' ? '📋 ' : '📊 '}{t}
          </button>
        ))}
      </div>

      {/* New product form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm">Nouveau Produit</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Nom *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground col-span-2 focus:outline-none focus:ring-1 focus:ring-primary" />
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

      {/* CATALOGUE TAB */}
      {tab === 'Catalogue' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Rechercher produit…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(p => {
              const m = margin(p);
              const s = stock(p);
              const th = threshold(p);
              const isLow = s <= th;
              const stockPct = th > 0 ? Math.min(100, Math.round((s / (th * 3)) * 100)) : 50;
              const price = p.price_usd || p.price || 0;
              return (
                <motion.div key={p.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors">
                  <div className="text-4xl mb-3 text-center">{TYPE_EMOJI[p.type] || '📦'}</div>
                  <h3 className="font-bold text-sm">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{p.type}</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold text-primary">${price.toFixed(2)}</span>
                    <span className="text-xs text-green-400 font-medium">{m}% marge</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                    <div className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${stockPct}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    {isLow && <span className="text-[10px] text-amber-400 flex items-center gap-1"><AlertTriangle size={10} /> Stock bas!</span>}
                    {!isLow && <span />}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLow ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'}`}>{s}u</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* STOCK TAB */}
      {tab === 'Stock' && (
        <div className="space-y-2">
          {products.map(p => {
            const s = stock(p);
            const th = threshold(p);
            const isLow = s <= th;
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">{TYPE_EMOJI[p.type] || '📦'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{p.name}</p>
                    {isLow && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">Stock bas</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.type}{p.sku ? ` · ${p.sku}` : ''} · ${(p.price_usd || p.price || 0).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustStock(p, -1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-secondary transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className={`text-sm font-bold w-8 text-center ${isLow ? 'text-amber-400' : 'text-foreground'}`}>{s}</span>
                  <button onClick={() => adjustStock(p, 1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-secondary transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tab === 'Analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Distribution pie */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-semibold mb-3">📦 Distribution Stock</p>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <PieChart width={100} height={100}>
                    <Pie data={pieData} cx={45} cy={45} innerRadius={28} outerRadius={48} dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm font-bold leading-tight">{totalUnits}</p>
                      <p className="text-[9px] text-muted-foreground">unités</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 flex-1">
                  {pieData.slice(0, 6).map((d, i) => (
                    <div key={d.name} className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground truncate max-w-[60px]">{d.name?.split(' ')[0]}</span>
                      </div>
                      <span className="font-medium text-foreground">{d.value}u</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Margin comparison */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-semibold mb-3">📋 Comparaison Marges</p>
              <div className="flex items-end gap-1 h-16 mb-2">
                {products.slice(0, 7).map((p, i) => {
                  const m = margin(p);
                  return (
                    <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold" style={{ color: COLORS[i % COLORS.length] }}>{m}%</span>
                      <div className="w-full rounded-sm" style={{ height: `${Math.max(4, m * 0.6)}px`, background: COLORS[i % COLORS.length], opacity: 0.85 }} />
                      <span className="text-[8px]">{TYPE_EMOJI[p.type] || '📦'}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground">Marge moyenne: <span className="text-foreground font-medium">{avgMargin}%</span></p>
            </div>

            {/* Revenue per product */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-semibold mb-3">💰 Revenus par Produit</p>
              <div className="space-y-2">
                {revenueData.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune vente enregistrée</p>
                ) : revenueData.map((d, i) => (
                  <div key={d.name}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <div className="flex items-center gap-1">
                        <span>{TYPE_EMOJI[products.find(p => p.name?.startsWith(d.name))?.type] || '📦'}</span>
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="text-primary font-bold">${d.rev.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((d.rev / revenueData[0].rev) * 100)}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product detail cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {products.map((p, i) => {
              const m = margin(p);
              const s = stock(p);
              const rev = revenue(p, sales);
              const soldUnits = sales.filter(x => x.product_id === p.id || x.product_name === p.name).reduce((sum, x) => sum + (x.quantity || 0), 0);
              return (
                <div key={p.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{TYPE_EMOJI[p.type] || '📦'}</span>
                      <div>
                        <p className="text-sm font-bold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.type}</p>
                      </div>
                    </div>
                    {/* Circular margin indicator */}
                    <div className="relative w-12 h-12">
                      <svg width="48" height="48" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="18" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                        <circle cx="24" cy="24" r="18" fill="none"
                          stroke={m > 40 ? '#22c55e' : m > 20 ? '#3b82f6' : '#ef4444'}
                          strokeWidth="4" strokeDasharray={`${(m / 100) * 113} 113`}
                          strokeLinecap="round" transform="rotate(-90 24 24)" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">{m}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 rounded-xl p-2.5">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Vendus</p>
                      <p className="text-sm font-bold text-primary">{soldUnits}u</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-2.5">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Revenus</p>
                      <p className="text-sm font-bold text-green-400">${rev.toFixed(2)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-2.5">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Stock</p>
                      <p className={`text-sm font-bold ${s <= threshold(p) ? 'text-amber-400' : 'text-foreground'}`}>{s}u</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-2.5">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Marge</p>
                      <p className="text-sm font-bold text-blue-400">{m}%</p>
                    </div>
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