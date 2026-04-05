// All monetary values stored as USD cents (integer)
// Exchange rate: CDF per 1 USD

export const DEFAULT_RATE = 2500;

export function formatUSD(cents) {
  if (cents == null) return '$0.00';
  return `$${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCDF(cents, rate = DEFAULT_RATE) {
  if (cents == null) return '0 FC';
  const cdf = Math.round((cents / 100) * rate);
  return `${cdf.toLocaleString('fr-FR')} FC`;
}

export function formatDual(cents, rate = DEFAULT_RATE) {
  return `${formatUSD(cents)} / ${formatCDF(cents, rate)}`;
}

// Convert a USD dollar amount to cents
export function usdToCents(usd) {
  return Math.round(parseFloat(usd || 0) * 100);
}

// Convert CDF amount to USD cents
export function cdfToCents(cdf, rate = DEFAULT_RATE) {
  return Math.round((parseFloat(cdf || 0) / rate) * 100);
}

// Convert USD cents to CDF
export function centsToCAF(cents, rate = DEFAULT_RATE) {
  return Math.round((cents / 100) * rate);
}

// Convert USD dollars (float) to CDF
export function usdToCDF(usd, rate = DEFAULT_RATE) {
  return Math.round(parseFloat(usd || 0) * rate);
}

// Format a raw USD float (not cents) in dual currency
export function formatUSDFloat(usd, rate = DEFAULT_RATE) {
  return formatDual(usdToCents(usd), rate);
}