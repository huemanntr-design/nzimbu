import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ProductForm({ product, onSave, onCancel }) {
  const [form, setForm] = useState(product || { name: '', type: 'Autre', price: '', cost: '', stock: '', alert_threshold: 10 });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      price: Number(form.price),
      cost: Number(form.cost),
      stock: Number(form.stock),
      alert_threshold: Number(form.alert_threshold),
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold mb-4">{product ? 'Modifier Produit' : 'Nouveau Produit'}</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nom</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom du produit" className="bg-secondary" />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
            <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Boisson">Boisson</SelectItem>
              <SelectItem value="Alimentaire">Alimentaire</SelectItem>
              <SelectItem value="Hygiène">Hygiène</SelectItem>
              <SelectItem value="Autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Prix de Vente ($)</Label>
          <Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="bg-secondary" />
        </div>
        <div>
          <Label>Coût d'Achat ($)</Label>
          <Input type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="bg-secondary" />
        </div>
        <div>
          <Label>Stock</Label>
          <Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="bg-secondary" />
        </div>
        <div>
          <Label>Seuil d'Alerte</Label>
          <Input type="number" value={form.alert_threshold} onChange={e => setForm({ ...form, alert_threshold: e.target.value })} className="bg-secondary" />
        </div>
        <div className="md:col-span-2 flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
          <Button type="submit" className="bg-green-500 hover:bg-green-600">Sauvegarder</Button>
        </div>
      </form>
    </div>
  );
}