import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function KpiCard({ icon, value, label, trend, trendColor, details }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => details && setOpen(true)}
        className={`glass-card p-5 flex flex-col items-center gap-2 transition-all w-full text-left
          ${details ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default hover:bg-white/5'}`}
      >
        <div className="text-2xl">{icon}</div>
        <p className={`text-xl font-bold ${trendColor || 'text-foreground'}`}>{value}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wider text-center">{label}</p>
        {trend && (
          <p className={`text-xs font-medium ${trend.startsWith('+') || trend.startsWith('↗') ? 'text-green-400' : 'text-red-400'}`}>
            {trend}
          </p>
        )}
        {details && <p className="text-[10px] text-primary/70 mt-1">Appuyer pour détails →</p>}
      </button>

      {open && details && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="glass rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/08">
              <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <h3 className="font-bold text-sm">{label}</h3>
              </div>
              <button onClick={() => setOpen(false)} className="glass-btn w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-center">
                <p className={`text-3xl font-bold ${trendColor || 'text-foreground'}`}>{value}</p>
                {trend && <p className={`text-sm mt-1 ${trend.startsWith('↗') ? 'text-green-400' : 'text-red-400'}`}>{trend}</p>}
              </div>
              <div className="space-y-2 pt-2">
                {details.map((d, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-xs text-muted-foreground">{d.label}</span>
                    <span className={`text-xs font-semibold ${d.color || 'text-foreground'}`}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}