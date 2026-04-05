import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ExchangeRateWidget({ rate, onRateChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const startEdit = () => {
    setDraft(String(rate));
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = async () => {
    const newRate = parseInt(draft);
    if (!newRate || newRate < 100) return;
    setSaving(true);
    try {
      await base44.auth.updateMe({ exchange_rate: newRate });
      onRateChange?.(newRate);
      setUpdatedAt(new Date());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const timeAgo = updatedAt
    ? `Taux mis à jour: ${updatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : 'Taux actuel';

  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
      <span className="text-xl">💱</span>
      <div className="flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">1 USD =</span>
            <input
              type="number"
              inputMode="numeric"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="w-24 bg-muted border border-border rounded-lg px-2 py-1 text-sm font-bold text-[#FFCD00] focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && save()}
            />
            <span className="text-xs text-muted-foreground">FC</span>
            <button onClick={save} disabled={saving} className="text-green-400 hover:text-green-300">
              <Check size={14} />
            </button>
            <button onClick={cancel} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: '#FFCD00' }}>
              1 USD = {(rate || 2500).toLocaleString('fr-FR')} FC
            </span>
            <button onClick={startEdit} className="text-muted-foreground hover:text-foreground transition-colors">
              <Pencil size={12} />
            </button>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo}</p>
      </div>
    </div>
  );
}