import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PlanWizard from '@/components/business-plan/PlanWizard';
import PlanDisplay from '@/components/business-plan/PlanDisplay';

export default function BusinessPlan() {
  const [stage, setStage] = useState('intro'); // intro | wizard | generating | plan
  const [answers, setAnswers] = useState(null);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => base44.entities.Product.list() });
  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: () => base44.entities.Sale.list('-created_date', 50) });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });

  const totalRevenue = sales.reduce((s, r) => s + (r.total || 0), 0);
  const avgMargin = products.length > 0
    ? Math.round(products.reduce((s, p) => {
        const price = p.price_usd || p.price || 0;
        const cost = p.cost_price || p.cost || 0;
        return s + (price > 0 ? ((price - cost) / price) * 100 : 0);
      }, 0) / products.length)
    : 0;

  const appData = { totalRevenue, avgMargin, productCount: products.length, clientCount: clients.length };

  const handleWizardComplete = async (wizardAnswers) => {
    setAnswers(wizardAnswers);
    setStage('generating');
    setError('');

    const prompt = `Tu es un consultant en stratégie d'entreprise expert. Génère un business plan professionnel complet en français pour cette entreprise.

DONNÉES DE L'ENTREPRISE:
- Nom: ${wizardAnswers.company_name}
- Secteur: ${wizardAnswers.sector}
- Localisation: ${wizardAnswers.location}
- Années d'activité: ${wizardAnswers.years_active}
- Produits/services phares: ${wizardAnswers.main_products}
- Valeur unique: ${wizardAnswers.unique_value}
- Clients cibles: ${wizardAnswers.target_customers}
- CA mensuel: $${wizardAnswers.monthly_revenue}
- Dépenses mensuelles: $${wizardAnswers.monthly_expenses}
- Employés: ${wizardAnswers.employees}
- Financement recherché: $${wizardAnswers.funding_needed || 0}
- Objectif 1 an: ${wizardAnswers.goal_1year}
- Objectif 3 ans: ${wizardAnswers.goal_3year}
- Défi principal: ${wizardAnswers.main_challenge}

DONNÉES APP RÉELLES:
- Ventes enregistrées: ${appData.productCount} produits, ${appData.clientCount} clients actifs
- Revenus historiques: $${appData.totalRevenue.toFixed(2)}
- Marge moyenne: ${appData.avgMargin}%

Génère un JSON structuré avec les sections suivantes (en Markdown riche dans chaque section):
{
  "executive_summary": "...",
  "market_analysis": "...",
  "swot_strengths": "...",
  "swot_weaknesses": "...",
  "swot_opportunities": "...",
  "swot_threats": "...",
  "strategy": "...",
  "roadmap_6m": "...",
  "roadmap_1y": "...",
  "roadmap_3y": "...",
  "conclusion": "..."
}

Instructions pour chaque section:
- executive_summary: 3-4 paragraphes sur la vision, le modèle économique, les chiffres clés et la proposition de valeur
- market_analysis: Analyse du marché local (${wizardAnswers.location}), tendances, taille du marché, concurrence pour le secteur ${wizardAnswers.sector}
- swot_strengths/weaknesses/opportunities/threats: 3-5 points en liste Markdown chacun
- strategy: Plan d'action concret avec des actions spécifiques (marketing, ventes, opérations)
- roadmap_6m/1y/3y: Objectifs SMART mesurables et réalistes
- conclusion: Synthèse et recommandations clés

Sois très spécifique, professionnel et orienté résultats. Inclus des chiffres et métriques concrets. Réponds UNIQUEMENT en JSON valide.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            executive_summary: { type: 'string' },
            market_analysis: { type: 'string' },
            swot_strengths: { type: 'string' },
            swot_weaknesses: { type: 'string' },
            swot_opportunities: { type: 'string' },
            swot_threats: { type: 'string' },
            strategy: { type: 'string' },
            roadmap_6m: { type: 'string' },
            roadmap_1y: { type: 'string' },
            roadmap_3y: { type: 'string' },
            conclusion: { type: 'string' },
          },
        },
      });
      setPlan({ sections: result });
      setStage('plan');
    } catch (e) {
      setError("Une erreur est survenue lors de la génération. Veuillez réessayer.");
      setStage('wizard');
    }
  };

  const handleReset = () => {
    setStage('intro');
    setAnswers(null);
    setPlan(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      {stage === 'intro' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center py-8">
            <p className="text-5xl mb-4">📋</p>
            <h1 className="text-2xl font-bold mb-3">Créateur de Business Plan</h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Répondez à quelques questions simples pour obtenir un plan d'affaires professionnel complet avec graphiques, projections financières et analyse SWOT — prêt pour vos investisseurs et partenaires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { emoji: '❓', title: '4 étapes simples', desc: 'Répondez à 14 questions faciles en 5 minutes' },
              { emoji: '🧠', title: 'Analyse IA', desc: 'Plan complet: SWOT, stratégie, projections 12 mois' },
              { emoji: '📊', title: 'Graphiques inclus', desc: 'Visualisations financières professionnelles' },
            ].map(f => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-5 text-center">
                <p className="text-3xl mb-2">{f.emoji}</p>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Données détectées dans votre app</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Produits', value: appData.productCount, color: 'text-blue-400' },
                { label: 'Clients', value: appData.clientCount, color: 'text-purple-400' },
                { label: 'CA Total', value: `$${appData.totalRevenue.toFixed(0)}`, color: 'text-green-400' },
                { label: 'Marge Moy.', value: `${appData.avgMargin}%`, color: 'text-yellow-400' },
              ].map(d => (
                <div key={d.label} className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className={`text-lg font-bold ${d.color}`}>{d.value}</p>
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setStage('wizard')}
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm"
            >
              🚀 Commencer — 5 minutes
            </button>
          </div>
        </div>
      )}

      {stage === 'wizard' && (
        <div>
          {error && (
            <div className="max-w-2xl mx-auto mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400 text-center">
              {error}
            </div>
          )}
          <PlanWizard onComplete={handleWizardComplete} />
        </div>
      )}

      {stage === 'generating' && (
        <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
          <div className="text-6xl animate-bounce">🧠</div>
          <h2 className="text-xl font-bold">Génération de votre business plan…</h2>
          <p className="text-sm text-muted-foreground">L'IA analyse vos données et rédige un document professionnel complet. Cela peut prendre 20–40 secondes.</p>
          <div className="flex justify-center gap-2 mt-4">
            {['Analyse du marché…', 'SWOT…', 'Projections financières…', 'Stratégie…'].map((s, i) => (
              <div key={s} className="text-xs text-muted-foreground animate-pulse" style={{ animationDelay: `${i * 0.4}s` }}>
                {s}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-6">
            <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      )}

      {stage === 'plan' && plan && (
        <PlanDisplay plan={plan} answers={answers} appData={appData} onReset={handleReset} />
      )}
    </div>
  );
}