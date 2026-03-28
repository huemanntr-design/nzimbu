import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

const days = ['Lun', 'Mar', 'Mer', 'Jou', 'Ven', 'Sam', 'Dim'];

export default function WeeklyChart({ sales }) {
  const data = days.map((day, i) => {
    const daySales = sales.filter(s => {
      const d = new Date(s.created_date || s.date);
      return d.getDay() === (i + 1) % 7;
    });
    const total = daySales.reduce((sum, s) => sum + (s.total || 0), 0);
    return { day, total };
  });

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-foreground">📊 Revenus Hebdomadaires</h3>
        <span className="text-xs text-muted-foreground">7 derniers jours</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} />
          <YAxis hide />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={index === todayIndex ? '#22c55e' : 'hsl(222 35% 22%)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}