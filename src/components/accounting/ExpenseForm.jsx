import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ExpenseForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ description: '', category: 'Autre', amount: '', date: new Date().toISOString().split('T')[0], status: 'pending' });

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold mb-4">Nouvelle Dépense</h3>
      <form onSubmit={e => { e.preventDefault(); onSave({ ...form, amount: Number(form.amount) }); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-secondary" /></div>
        <div>
          <Label>Catégorie</Label>
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
            <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Immobilier', 'Transport', 'RH', 'Utilités', 'Communication', 'Matériel', 'Autre'].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Montant ($)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="bg-secondary" /></div>
        <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-secondary" /></div>
        <div className="md:col-span-2 flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
          <Button type="submit" className="bg-red-500 hover:bg-red-600">Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}