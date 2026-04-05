import React from 'react';

const COMMUNES = [
  'Gombe', 'Barumbu', 'Kinshasa', 'Lingwala', 'Kintambo', 'Ngaliema',
  'Mont-Ngafula', 'Selembao', 'Bumbu', 'Makala', 'Kalamu', 'Bandalungwa',
  'Ngiri-Ngiri', 'Kasa-Vubu', 'Matonge (Kalamu)', 'Limete', 'Matete',
  'Lemba', 'Ngaba', 'Kisenso', 'Masina', "N'Djili", 'Ndjili', 'Nsele',
  'Maluku', 'Lubumbashi', 'Goma', 'Bukavu', 'Autre ville',
];

export default function KinshasaCommunePicker({ value, onChange, className = '', placeholder = 'Sélectionnez une commune' }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className={`w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-12 ${className}`}
    >
      <option value="">{placeholder}</option>
      {COMMUNES.map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}