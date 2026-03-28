import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ClientForm({ client, onSave, onCancel }) {
  const [form, setForm] = useState(client || { name: '', phone: '', location: '', status: 'actif', credit_limit: 0 });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, credit_limit: Number(form.credit_limit) });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold mb-4">{client ? 'Modifier Client' : 'Nouveau Client'}</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Nom</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary" /></div>
        <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+243..." className="bg-secondary" /></div>
        <div><Label>Localisation</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="bg-secondary" /></div>
        <div>
          <Label>Statut</Label>
          <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
            <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="inactif">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Limite de Crédit ($)</Label><Input type="number" value={form.credit_limit} onChange={e => setForm({ ...form, credit_limit: e.target.value })} className="bg-secondary" /></div>
        <div className="md:col-span-2 flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
          <Button type="submit" className="bg-green-500 hover:bg-green-600">Sauvegarder</Button>
        </div>
      </form>
    </div>
  );
}