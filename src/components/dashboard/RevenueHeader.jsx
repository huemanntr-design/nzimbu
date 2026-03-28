import React from 'react';
import { Progress } from '@/components/ui/progress';

export default function RevenueHeader({ revenue, goal, businessName }) {
  const percentage = goal > 0 ? Math.min((revenue / goal) * 100, 100) : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Revenus Totaux</p>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">${revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</h2>
          <p className="text-sm text-muted-foreground mt-1">Objectif: ${goal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} · {businessName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">↗ +18.4%</span>
        </div>
      </div>
      <Progress value={percentage} className="mt-4 h-2" />
      <div className="flex justify-between mt-2">
        <p className="text-xs text-muted-foreground">${revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} sur ${goal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
        <p className="text-xs text-green-400">+ {percentage.toFixed(0)}%</p>
      </div>
    </div>
  );
}