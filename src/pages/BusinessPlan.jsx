import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

export default function BusinessPlan() {
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState('');

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => base44.entities.Product.list() });
  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: () => base44.entities.Sale.list('-created_date', 50) });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });

  const totalRevenue = sales.reduce((s, r) => s + (r.total || 0), 0);
  const avgMargin = products.length > 0 ? Math.round(products.reduce((s, p) => s + ((p.price && p.cost) ? ((p.price - p.cost) / p.price) * 100 : 0), 0) / products.length) : 0;

  const generate = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Génère un business plan professionnel en français basé sur ces données réelles:
      - ${products.length} produits en catalogue
      - Revenus totaux: $${totalRevenue}
      - ${clients.length} clients
      - Marge moyenne: ${avgMargin}%
      - Top produits: ${products.slice(0, 3).map(p => p.name).join(', ')}
      
      Structure: Résumé exécutif, Analyse du marché, Stratégie commerciale, Plan financier, Projections à 12 mois.
      Sois détaillé et professionnel. Utilise des données chiffrées.`,
    });
    setPlan(result);
    setGenerating(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center py-8">
        <p className="text-4xl mb-4">📋</p>
        <h1 className="text-2xl font-bold mb-3">Créateur de Business Plan</h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Générez un plan d'affaires professionnel et complet basé sur vos <span className="text-primary">données réelles</span> — produits, ventes, clients, et finances. L'IA analyse votre activité et crée un document prêt pour investisseurs.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-2xl mb-2">📊</p>
          <h3 className="font-semibold text-sm">Données Réelles</h3>
          <p className="text-xs text-muted-foreground mt-1">Utilise vos ventes, produits et finances existants</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-2xl mb-2">🧠</p>
          <h3 className="font-semibold text-sm">Analyse IA</h3>
          <p className="text-xs text-muted-foreground mt-1">L'IA structure un plan professionnel avec projections</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-2xl mb-2">📄</p>
          <h3 className="font-semibold text-sm">Export PDF</h3>
          <p className="text-xs text-muted-foreground mt-1">Document prêt pour banques et investisseurs</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h4 className="font-semibold mb-4">📊 Données disponibles pour votre plan</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-secondary rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-blue-400">{products.length}</p>
            <p className="text-xs text-muted-foreground">Produits</p>
          </div>
          <div className="bg-secondary rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-green-400">${totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">Revenus</p>
          </div>
          <div className="bg-secondary rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-purple-400">{clients.length}</p>
            <p className="text-xs text-muted-foreground">Clients</p>
          </div>
          <div className="bg-secondary rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-yellow-400">{avgMargin}%</p>
            <p className="text-xs text-muted-foreground">Marge Moy</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button onClick={generate} disabled={generating} className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg">
          {generating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Génération en cours...
            </>
          ) : '🚀 Commencer'}
        </Button>
      </div>

      {plan && (
        <div className="bg-card border border-border rounded-xl p-8">
          <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{plan}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}