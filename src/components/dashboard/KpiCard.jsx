import React from 'react';

export default function KpiCard({ icon, value, label, trend, trendColor }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors">
      <div className="text-2xl">{icon}</div>
      <p className={`text-xl font-bold ${trendColor || 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      {trend && (
        <p className={`text-xs font-medium ${trend.startsWith('+') || trend.startsWith('↗') ? 'text-green-400' : 'text-red-400'}`}>
          {trend}
        </p>
      )}
    </div>
  );
}