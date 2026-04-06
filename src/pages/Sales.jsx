import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import { useLang } from '@/lib/LanguageContext';

export default function Sales() {
  const [tab, setTab] = useState('pos');
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const queryClient = useQueryClient();
  const { t } = useLang();

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => base44.entities.Product.list() });
  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: () => base44.entities.Sale.list('-created_date', 50) });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });

  const createSaleMutation = useMutation({
    mutationFn: (data) => base44.entities.Sale.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales'] }),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const totalRevenue = sales.reduce((s, r) => s + (r.total || 0), 0);
  const totalProfit = sales.reduce((s, r) => s + (r.profit || 0), 0);
  const cartTotal = cart.reduce((s, item) => s + item.price * item.qty, 0);

  const addToCart = (product) => {
    const existing = cart.find(c => c.id === product.id);
    if (existing) {
      setCart(cart.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.price_usd || product.price || 0, cost: product.cost_price || product.cost || 0, qty: 1, stock: product.stock_qty ?? product.stock ?? 0 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  };

  const removeFromCart = (id) => setCart(cart.filter(c => c.id !== id));

  const completeSale = async () => {
    for (const item of cart) {
      const saleData = {
        product_id: item.id,
        product_name: item.name,
        client_id: clients.find(c => c.name === selectedClient)?.id || '',
        client_name: selectedClient || t('anonymous_client'),
        quantity: item.qty,
        unit_price: item.price,
        total: item.price * item.qty,
        profit: (item.price - item.cost) * item.qty,
        payment_method: paymentMethod,
        date: new Date().toISOString().split('T')[0],
      };
      await createSaleMutation.mutateAsync(saleData);
      const product = products.find(p => p.id === item.id);
      if (product) {
        const currentStock = product.stock_qty ?? product.stock ?? 0;
        await updateProductMutation.mutateAsync({ id: product.id, data: { stock_qty: Math.max(0, currentStock - item.qty) } });
      }
    }
    setCart([]);
    setSelectedClient('');
  };

  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{t('daily_objective')}</p>
        <h2 className="text-3xl font-bold">${totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="✨" value={`$${totalProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`} label={t('profit')} trend="↗ +23%" trendColor="text-green-400"
          details={[
            { label: 'Profit total', value: `$${totalProfit.toFixed(2)}`, color: 'text-green-400' },
            { label: 'Marge brute', value: `${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%` },
            { label: 'Revenus total', value: `$${totalRevenue.toFixed(2)}` },
          ]} />
        <KpiCard icon="📦" value={sales.length} label={t('sales')}
          details={[
            { label: 'Total ventes', value: sales.length },
            { label: 'Cash', value: sales.filter(s => s.payment_method === 'cash').length },
            { label: 'Mobile Money', value: sales.filter(s => ['mpesa', 'airtel', 'orange', 'mobile_money'].includes(s.payment_method)).length },
            { label: 'Crédit', value: sales.filter(s => s.payment_method === 'credit').length, color: 'text-yellow-400' },
          ]} />
        <KpiCard icon="📱" value={sales.filter(s => ['mpesa','airtel','orange','mobile_money'].includes(s.payment_method)).length} label={t('mobile_money')}
          details={[
            { label: 'M-Pesa', value: sales.filter(s => s.payment_method === 'mpesa').length },
            { label: 'Airtel Money', value: sales.filter(s => s.payment_method === 'airtel').length },
            { label: 'Orange Money', value: sales.filter(s => s.payment_method === 'orange').length },
            { label: 'Mobile Money', value: sales.filter(s => s.payment_method === 'mobile_money').length },
          ]} />
        <KpiCard icon="💳" value={`$${sales.filter(s => s.payment_method === 'credit').reduce((s, r) => s + (r.total || 0), 0).toFixed(2)}`} label={t('credit')} trendColor="text-yellow-400"
          details={[
            { label: 'Total crédit', value: `$${sales.filter(s => s.payment_method === 'credit').reduce((s, r) => s + (r.total || 0), 0).toFixed(2)}`, color: 'text-yellow-400' },
            { label: 'Nb transactions', value: sales.filter(s => s.payment_method === 'credit').length },
            { label: 'Attention', value: 'Relancer les clients', color: 'text-muted-foreground' },
          ]} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">◆ {t('ventes_pos')}</h2>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="pos">🖥 {t('pos')}</TabsTrigger>
          <TabsTrigger value="history">📋 {t('history')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t('search_product')} value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProducts.map(p => (
                <button key={p.id} onClick={() => addToCart(p)} className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-colors">
                  <div className="text-2xl mb-2">{p.type === 'Boisson' ? '💧' : p.type === 'Alimentaire' ? '🍚' : p.type === 'Hygiène' ? '🧼' : '📦'}</div>
                  <h3 className="font-medium text-sm">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.type}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-primary font-bold text-sm">${(p.price_usd || p.price || 0).toFixed(2)}</span>
                    <Badge className={`text-xs ${(p.stock_qty ?? p.stock ?? 0) <= (p.reorder_point ?? p.alert_threshold ?? 10) ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                      {p.stock_qty ?? p.stock ?? 0}u
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> {t('cart')} ({cart.length})</h3>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t('no_items')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2 bg-secondary rounded-lg p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} × {item.qty}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-background flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm w-6 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-background flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                      <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded text-red-400 flex items-center justify-center"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    <span className="font-bold text-sm">${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('total')}</span>
                    <span className="text-green-400">${cartTotal.toFixed(2)}</span>
                  </div>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-secondary border border-border rounded-lg p-2 text-sm">
                    <option value="cash">💵 {t('cash')}</option>
                    <option value="mpesa">💚 M-Pesa</option>
                    <option value="airtel">❤️ Airtel Money</option>
                    <option value="orange">🟠 Orange Money</option>
                    <option value="mobile_money">📱 {t('mobile_money')}</option>
                    <option value="credit">💳 {t('credit')}</option>
                    <option value="bank">🏦 {t('bank')}</option>
                  </select>
                  <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="w-full bg-secondary border border-border rounded-lg p-2 text-sm">
                    <option value="">{t('anonymous_client')}</option>
                    {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <Button onClick={completeSale} disabled={cart.length === 0} className="w-full bg-green-500 hover:bg-green-600 text-white">
                    ✅ {t('complete_sale')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="text-left px-4 py-3">{t('product')}</th>
                <th className="text-left px-4 py-3">{t('client')}</th>
                <th className="text-left px-4 py-3">{t('quantity')}</th>
                <th className="text-left px-4 py-3">{t('amount')}</th>
                <th className="text-left px-4 py-3">{t('profit')}</th>
                <th className="text-left px-4 py-3">{t('payment_method')}</th>
                <th className="text-left px-4 py-3">{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id} className="border-b border-border">
                  <td className="px-4 py-3 text-sm font-medium">{s.product_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.client_name || '-'}</td>
                  <td className="px-4 py-3 text-sm">{s.quantity}</td>
                  <td className="px-4 py-3 text-green-400 font-medium">${(s.total || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-green-400 text-sm">${(s.profit || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{s.payment_method === 'cash' ? '💵' : s.payment_method === 'mpesa' ? '💚' : s.payment_method === 'airtel' ? '❤️' : s.payment_method === 'orange' ? '🟠' : s.payment_method === 'mobile_money' ? '📱' : s.payment_method === 'credit' ? '💳' : '🏦'}</span>
                    <span className="ml-1 text-muted-foreground text-xs">{s.payment_method}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.date || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}