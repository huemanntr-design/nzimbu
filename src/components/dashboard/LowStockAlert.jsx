import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function LowStockAlert({ products }) {
  const lowStock = products.filter(p => (p.stock_qty ?? p.stock ?? 0) <= (p.reorder_point ?? p.alert_threshold ?? 10));

  if (lowStock.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400" />
        Alertes Stock Bas
      </h3>
      <div className="space-y-3">
        {lowStock.slice(0, 5).map(p => (
          <div key={p.id} className="flex justify-between items-center">
            <span className="text-sm text-foreground">{p.name}</span>
            <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full">
              {p.stock_qty ?? p.stock ?? 0} restant{(p.stock_qty ?? p.stock ?? 0) > 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}