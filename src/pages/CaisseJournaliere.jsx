import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatUSD, formatCDF, usdToCents } from '@/utils/currency';
import { Button } from '@/components/ui/button';

const today = () => new Date().toISOString().split('T')[0];
const nowTime = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const STORAGE_KEY = 'nzimbu_caisse_' + today();

function loadCaisse() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}
function saveCaisse(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function CaisseJournaliere() {
  const [caisse, setCaisse] = useState(loadCaisse());
  const [openUSD, setOpenUSD] = useState('');
  const [openCDF, setOpenCDF] = useState('');
  const [entreeLabel, setEntreeLabel] = useState('');
  const [entreeAmt, setEntreeAmt] = useState('');
  const [sortieLabel, setSortieLabel] = useState('');
  const [sortieAmt, setSortieAmt] = useState('');
  const [closingUSD, setClosingUSD] = useState('');
  const [closingCDF, setClosingCDF] = useState('');
  const [closed, setClosed] = useState(false);
  const [summary, setSummary] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const rate = user?.exchange_rate || 2500;

  useEffect(() => {
    if (caisse) {
      saveCaisse(caisse);
    }
  }, [caisse]);

  const openCaisse = () => {
    const data = {
      openedAt: nowTime(),
      openUSD: parseFloat(openUSD) || 0,
      openCDF: parseFloat(openCDF) || 0,
      entrees: [],
      sorties: [],
    };
    setCaisse(data);
    saveCaisse(data);
  };

  const addEntree = () => {
    if (!entreeLabel || !entreeAmt) return;
    const updated = { ...caisse, entrees: [...caisse.entrees, { label: entreeLabel, amt: parseFloat(entreeAmt), time: nowTime() }] };
    setCaisse(updated);
    setEntreeLabel(''); setEntreeAmt('');
  };

  const addSortie = () => {
    if (!sortieLabel || !sortieAmt) return;
    const updated = { ...caisse, sorties: [...caisse.sorties, { label: sortieLabel, amt: parseFloat(sortieAmt), time: nowTime() }] };
    setCaisse(updated);
    setSortieLabel(''); setSortieAmt('');
  };

  const totalEntrees = (caisse?.entrees || []).reduce((s, e) => s + e.amt, 0);
  const totalSorties = (caisse?.sorties || []).reduce((s, e) => s + e.amt, 0);
  const expectedUSD = (caisse?.openUSD || 0) + totalEntrees - totalSorties;
  const expectedCents = usdToCents(expectedUSD);

  const closeCaisse = () => {
    const actUSD = parseFloat(closingUSD) || 0;
    const actCDF = parseFloat(closingCDF) || 0;
    const ecartUSD = actUSD - expectedUSD;
    const ecartCDF = actCDF - (caisse?.openCDF || 0);
    const sum = {
      date: today(),
      openedAt: caisse?.openedAt,
      closedAt: nowTime(),
      openUSD: caisse?.openUSD,
      openCDF: caisse?.openCDF,
      entrees: caisse?.entrees,
      sorties: caisse?.sorties,
      expectedUSD,
      actualUSD: actUSD,
      actualCDF: actCDF,
      ecartUSD,
      ecartCDF,
    };
    setSummary(sum);
    setClosed(true);
  };

  const buildWAReport = () => {
    if (!summary) return '';
    const lines = [
      `📒 *Rapport de Caisse — ${summary.date}*`,
      `━━━━━━━━━━━━━━`,
      `Ouverture: ${summary.openedAt} | Fermeture: ${summary.closedAt}`,
      `Caisse début: $${summary.openUSD} / ${(summary.openCDF || 0).toLocaleString('fr-FR')} FC`,
      ``,
      `📥 Entrées (${summary.entrees.length}):`,
      ...(summary.entrees.map(e => `  + $${e.amt} — ${e.label}`)),
      `📤 Sorties (${summary.sorties.length}):`,
      ...(summary.sorties.map(e => `  - $${e.amt} — ${e.label}`)),
      ``,
      `Attendu: $${summary.expectedUSD.toFixed(2)}`,
      `Réel USD: $${summary.actualUSD.toFixed(2)}`,
      `Écart: ${summary.ecartUSD >= 0 ? '+' : ''}$${summary.ecartUSD.toFixed(2)}${Math.abs(summary.ecartUSD) > 5 ? ' ⚠️' : ' ✅'}`,
      `━━━━━━━━━━━━━━`,
      `*Nzimbu* 🇨🇩`,
    ].join('\n');
    return encodeURIComponent(lines);
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="bg-card border border-border rounded-xl p-4">
        <h1 className="text-lg font-bold">📒 Caisse Journalière</h1>
        <p className="text-xs text-muted-foreground">{today()} · Mbongo ya Lelo</p>
      </div>

      {/* Opening */}
      {!caisse && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <p className="font-semibold">🌅 Ouverture de caisse</p>
          <p className="text-xs text-muted-foreground">Entrez le solde initial</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Caisse USD $</label>
              <input type="number" inputMode="decimal" value={openUSD} onChange={e => setOpenUSD(e.target.value)} placeholder="0.00"
                className="w-full bg-muted border border-border rounded-lg px-3 py-3 text-sm font-mono text-foreground focus:outline-none h-12" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Caisse FC</label>
              <input type="number" inputMode="numeric" value={openCDF} onChange={e => setOpenCDF(e.target.value)} placeholder="0"
                className="w-full bg-muted border border-border rounded-lg px-3 py-3 text-sm font-mono text-foreground focus:outline-none h-12" />
            </div>
          </div>
          <Button className="w-full bg-primary border-0 h-12" onClick={openCaisse}>
            ✅ Ouvrir la caisse — {nowTime()}
          </Button>
        </div>
      )}

      {/* Active caisse */}
      {caisse && !closed && (
        <>
          {/* Balance card */}
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Solde estimé en temps réel</p>
            <p className="text-3xl font-bold font-mono">${expectedUSD.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">{formatCDF(expectedCents, rate)}</p>
            <p className="text-xs text-muted-foreground mt-1">Ouvert à {caisse.openedAt}</p>
          </div>

          {/* Entrées */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="font-semibold text-green-400">📥 Entrées (Cash)</p>
            {caisse.entrees.map((e, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{e.time} · {e.label}</span>
                <span className="font-mono text-green-400">+${e.amt.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={entreeLabel} onChange={e => setEntreeLabel(e.target.value)} placeholder="Description"
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
              <input type="number" inputMode="decimal" value={entreeAmt} onChange={e => setEntreeAmt(e.target.value)} placeholder="$"
                className="w-20 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none" />
              <Button size="sm" className="bg-green-500 hover:bg-green-600 border-0" onClick={addEntree}>+</Button>
            </div>
          </div>

          {/* Sorties */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="font-semibold text-red-400">📤 Sorties (Dépenses)</p>
            {caisse.sorties.map((e, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{e.time} · {e.label}</span>
                <span className="font-mono text-red-400">-${e.amt.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={sortieLabel} onChange={e => setSortieLabel(e.target.value)} placeholder="Description"
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
              <input type="number" inputMode="decimal" value={sortieAmt} onChange={e => setSortieAmt(e.target.value)} placeholder="$"
                className="w-20 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none" />
              <Button size="sm" className="bg-red-500 hover:bg-red-600 border-0" onClick={addSortie}>−</Button>
            </div>
          </div>

          {/* Closing */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="font-semibold">🌙 Fermeture de caisse</p>
            <p className="text-xs text-muted-foreground">Comptez la caisse et entrez le montant réel</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Réel USD $</label>
                <input type="number" inputMode="decimal" value={closingUSD} onChange={e => setClosingUSD(e.target.value)} placeholder="0.00"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-3 text-sm font-mono focus:outline-none h-12" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Réel FC</label>
                <input type="number" inputMode="numeric" value={closingCDF} onChange={e => setClosingCDF(e.target.value)} placeholder="0"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-3 text-sm font-mono focus:outline-none h-12" />
              </div>
            </div>
            <Button className="w-full bg-primary border-0 h-12" onClick={closeCaisse} disabled={!closingUSD}>
              🔒 Fermer la caisse
            </Button>
          </div>
        </>
      )}

      {/* Closed summary */}
      {closed && summary && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <p className="font-bold text-lg">📊 Bilan de caisse — {summary.date}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Ouverture</p>
                <p className="font-mono font-bold">${summary.openUSD.toFixed(2)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Entrées</p>
                <p className="font-mono font-bold text-green-400">+${totalEntrees.toFixed(2)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Sorties</p>
                <p className="font-mono font-bold text-red-400">-${totalSorties.toFixed(2)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Attendu</p>
                <p className="font-mono font-bold">${summary.expectedUSD.toFixed(2)}</p>
              </div>
            </div>
            <div className={`rounded-xl p-4 ${Math.abs(summary.ecartUSD) > 5 ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
              <p className="text-xs text-muted-foreground">Écart de caisse</p>
              <p className={`text-xl font-bold font-mono ${Math.abs(summary.ecartUSD) > 5 ? 'text-red-400' : 'text-green-400'}`}>
                {summary.ecartUSD >= 0 ? '+' : ''}${summary.ecartUSD.toFixed(2)}
                {Math.abs(summary.ecartUSD) > 5 ? ' ⚠️ ÉCART IMPORTANT' : ' ✅ OK'}
              </p>
            </div>
          </div>
          <Button className="w-full bg-[#25D366] hover:bg-[#20b558] border-0 h-12 text-white font-bold"
            onClick={() => window.open(`https://wa.me/?text=${buildWAReport()}`, '_blank')}>
            📱 Partager le rapport WhatsApp
          </Button>
          <Button variant="outline" className="w-full" onClick={() => { setCaisse(null); setClosed(false); setSummary(null); localStorage.removeItem(STORAGE_KEY); }}>
            🔄 Nouvelle journée
          </Button>
        </div>
      )}
    </div>
  );
}