import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';

function useNotifications() {
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => base44.entities.Product.list() });
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: () => base44.entities.Invoice.list() });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });

  const alerts = [];

  products.forEach(p => {
    const s = p.stock_qty ?? p.stock ?? 0;
    const th = p.reorder_point ?? p.alert_threshold ?? 10;
    if (s <= th) alerts.push({ id: `stock-${p.id}`, icon: '📦', text: `Stock bas: ${p.name} (${s}u restants)`, color: 'text-amber-400', bg: 'bg-amber-500/10' });
  });

  const today = new Date().toISOString().split('T')[0];
  invoices.filter(i => i.status !== 'paid' && i.due_date && i.due_date < today).forEach(inv => {
    alerts.push({ id: `inv-${inv.id}`, icon: '📄', text: `Facture en retard: ${inv.client_name}`, color: 'text-red-400', bg: 'bg-red-500/10' });
  });

  clients.filter(c => c.credit_due > c.credit_limit_usd && c.credit_limit_usd > 0).forEach(c => {
    alerts.push({ id: `credit-${c.id}`, icon: '⚠️', text: `Crédit dépassé: ${c.name}`, color: 'text-orange-400', bg: 'bg-orange-500/10' });
  });

  return alerts;
}

export default function NotificationBell({ collapsed }) {
  const [open, setOpen] = useState(false);
  const alerts = useNotifications();

  return (
    <div className="relative px-2 mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all relative"
        title={collapsed ? `Notifications (${alerts.length})` : undefined}
      >
        <div className="relative shrink-0">
          <Bell className="w-5 h-5" />
          {alerts.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {alerts.length > 9 ? '9+' : alerts.length}
            </span>
          )}
        </div>
        {!collapsed && <span className="text-sm font-medium">Notifications</span>}
        {!collapsed && alerts.length > 0 && (
          <span className="ml-auto text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">{alerts.length}</span>
        )}
      </button>

      {open && !collapsed && (
        <div className="absolute left-2 right-2 bottom-full mb-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex justify-between items-center">
            <p className="text-xs font-semibold">Notifications</p>
            <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>
          {alerts.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">✅ Tout est en ordre!</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {alerts.map(a => (
                <div key={a.id} className={`flex items-start gap-2 px-3 py-2.5 border-b border-border last:border-0 ${a.bg}`}>
                  <span className="text-sm shrink-0">{a.icon}</span>
                  <p className={`text-xs ${a.color} leading-snug`}>{a.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}