export const FX_DEFAULT = 2800;

export const fmtUSD = (v) =>
  `$${(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtCDF = (v) =>
  `${Math.round(v || 0).toLocaleString('fr-CD')} FC`;

export const fmtDate = (v) => {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return v;
  }
};

export const today = () => new Date().toISOString().slice(0, 10);