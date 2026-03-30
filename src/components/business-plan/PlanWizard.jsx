import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
  {
    id: 'identity',
    title: "Votre entreprise",
    emoji: "🏢",
    questions: [
      { key: 'company_name', label: "Nom de votre entreprise", placeholder: "Ex: Boutique Mama Grace", type: 'text' },
      { key: 'sector', label: "Secteur d'activité", placeholder: "Ex: Commerce de détail alimentaire", type: 'text' },
      { key: 'location', label: "Ville / Localisation", placeholder: "Ex: Kinshasa, Gombe", type: 'text' },
      { key: 'years_active', label: "Depuis combien d'années êtes-vous en activité?", placeholder: "Ex: 2", type: 'number' },
    ],
  },
  {
    id: 'offering',
    title: "Vos produits & services",
    emoji: "📦",
    questions: [
      { key: 'main_products', label: "Quels sont vos 3 produits/services phares?", placeholder: "Ex: Jus de fruits, Eau minérale, Biscuits", type: 'textarea' },
      { key: 'unique_value', label: "Qu'est-ce qui vous différencie de la concurrence?", placeholder: "Ex: Livraison rapide, prix compétitifs, qualité garantie", type: 'textarea' },
      { key: 'target_customers', label: "Qui sont vos clients cibles?", placeholder: "Ex: Familles, restaurants, épiceries du quartier", type: 'text' },
    ],
  },
  {
    id: 'finance',
    title: "Votre situation financière",
    emoji: "💰",
    questions: [
      { key: 'monthly_revenue', label: "Chiffre d'affaires mensuel moyen (USD)", placeholder: "Ex: 1500", type: 'number' },
      { key: 'monthly_expenses', label: "Dépenses mensuelles (USD)", placeholder: "Ex: 800", type: 'number' },
      { key: 'employees', label: "Nombre d'employés", placeholder: "Ex: 3", type: 'number' },
      { key: 'funding_needed', label: "Montant de financement recherché (USD, si applicable)", placeholder: "Ex: 5000", type: 'number' },
    ],
  },
  {
    id: 'goals',
    title: "Vos objectifs",
    emoji: "🎯",
    questions: [
      { key: 'goal_1year', label: "Quel est votre objectif principal dans 1 an?", placeholder: "Ex: Doubler mon chiffre d'affaires, ouvrir une 2ème boutique", type: 'textarea' },
      { key: 'goal_3year', label: "Et dans 3 ans?", placeholder: "Ex: Franchiser le concept, exporter vers d'autres villes", type: 'textarea' },
      { key: 'main_challenge', label: "Quel est votre plus grand défi actuel?", placeholder: "Ex: Manque de financement, concurrence, approvisionnement", type: 'text' },
    ],
  },
];

export default function PlanWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const setAnswer = (key, value) => setAnswers(a => ({ ...a, [key]: value }));

  const canNext = current.questions.filter(q => !['funding_needed'].includes(q.key)).every(q => (answers[q.key] || '').toString().trim() !== '');

  const handleNext = () => {
    if (isLast) {
      onComplete(answers);
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Étape {step + 1} sur {STEPS.length}</span>
          <span>{Math.round(progress)}% complété</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-3">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`flex flex-col items-center gap-1 ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < step ? 'bg-primary text-white' : i === step ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-muted text-muted-foreground'}`}>
                {i < step ? '✓' : s.emoji}
              </div>
              <span className="text-[10px] hidden md:block">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div>
          <p className="text-3xl mb-2">{current.emoji}</p>
          <h2 className="text-xl font-bold">{current.title}</h2>
          <p className="text-sm text-muted-foreground">Répondez aux questions ci-dessous pour personnaliser votre plan</p>
        </div>

        <div className="space-y-4">
          {current.questions.map(q => (
            <div key={q.key}>
              <label className="block text-sm font-medium mb-1.5">
                {q.label}
                {!['funding_needed'].includes(q.key) && <span className="text-red-400 ml-1">*</span>}
              </label>
              {q.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={answers[q.key] || ''}
                  onChange={e => setAnswer(q.key, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              ) : (
                <input
                  type={q.type}
                  value={answers[q.key] || ''}
                  onChange={e => setAnswer(q.key, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex items-center gap-2">
              <ChevronLeft size={16} /> Retour
            </Button>
          )}
          <Button onClick={handleNext} disabled={!canNext} className="flex-1 bg-primary hover:bg-primary/90 flex items-center justify-center gap-2">
            {isLast ? '🚀 Générer mon Business Plan' : (<>Suivant <ChevronRight size={16} /></>)}
          </Button>
        </div>
      </div>
    </div>
  );
}