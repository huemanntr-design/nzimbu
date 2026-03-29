import { useState } from 'react';
import { X, Upload, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const TYPE_EMOJI = { Boisson: '💧', Alimentaire: '🌾', Hygiène: '🧴', Autre: '📦' };

function margin(p) {
  const price = p.price_usd || p.price || 0;
  const cost = p.cost_price || p.cost || 0;
  return price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
}
function stock(p) { return p.stock_qty ?? p.stock ?? 0; }

export default function ProductDetailModal({ product, onClose }) {
  const qc = useQueryClient();
  const [stockInput, setStockInput] = useState(stock(product));
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: product.name || '',
    price_usd: product.price_usd || product.price || 0,
    cost_price: product.cost_price || product.cost || 0,
    type: product.type || 'Autre',
    reorder_point: product.reorder_point || product.alert_threshold || 10,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.update(product.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Product.delete(product.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); onClose(); },
  });

  const handleSaveStock = () => {
    updateMutation.mutate({ stock_qty: Number(stockInput) });
  };

  const handleSaveAll = () => {
    updateMutation.mutate({ ...editForm, stock_qty: Number(stockInput) });
    setEditMode(false);
  };

  const price = product.price_usd || product.price || 0;
  const cost = product.cost_price || product.cost || 0;
  const m = margin(product);
  const s = stock(product);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg">{TYPE_EMOJI[product.type] || '📦'} {product.name}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image section */}
          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center text-4xl shrink-0">
              {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-2xl" /> : TYPE_EMOJI[product.type] || '📦'}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Image Produit</p>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 border-0">
                  <Upload size={10} /> Uploader
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Camera size={10} /> Capturer
                </Button>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          {!editMode ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 border border-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Prix Vente</p>
                <p className="text-xl font-bold text-primary">${price.toFixed(2)}</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Coût</p>
                <p className="text-xl font-bold text-red-400">${cost.toFixed(2)}</p>
              </div>
              <div className="bg-muted/50 border border-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Marge</p>
                <p className="text-xl font-bold text-green-400">{m}%</p>
              </div>
              <div className="bg-muted/50 border border-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Stock</p>
                <p className="text-xl font-bold text-green-400">{s}u</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nom" className="col-span-2 bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <input type="number" value={editForm.price_usd} onChange={e => setEditForm(f => ({ ...f, price_usd: +e.target.value }))}
                placeholder="Prix vente" className="bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <input type="number" value={editForm.cost_price} onChange={e => setEditForm(f => ({ ...f, cost_price: +e.target.value }))}
                placeholder="Coût" className="bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                className="bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none">
                {['Boisson', 'Alimentaire', 'Hygiène', 'Autre'].map(t => <option key={t}>{t}</option>)}
              </select>
              <input type="number" value={editForm.reorder_point} onChange={e => setEditForm(f => ({ ...f, reorder_point: +e.target.value }))}
                placeholder="Seuil alerte" className="bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>
          )}

          {/* Stock adjust */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Ajuster Stock</p>
            <div className="flex gap-2">
              <input type="number" value={stockInput} onChange={e => setStockInput(e.target.value)}
                className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <Button onClick={handleSaveStock} disabled={updateMutation.isPending}
                className="bg-primary hover:bg-primary/90 border-0 px-5">
                {updateMutation.isPending ? '…' : 'Sauvegarder'}
              </Button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {editMode ? (
              <>
                <Button onClick={handleSaveAll} className="flex-1 bg-primary hover:bg-primary/90 border-0">✅ Sauvegarder tout</Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>Annuler</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setEditMode(true)} className="flex-1 bg-secondary hover:bg-secondary/80 border-0 text-foreground">
                  ✏️ Modifier tout
                </Button>
                <Button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 border-0 px-5">
                  🗑 Supprimer
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}