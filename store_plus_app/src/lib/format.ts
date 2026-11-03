export const fmt = (n: number): string => Math.round(n).toLocaleString('en-IN')

export const rupee = (n: number): string => (n < 0 ? '–₹' : '₹') + fmt(Math.abs(n))

/** Compact rupees: ₹3.8L, ₹12K, ₹1.2Cr. */
export const rupeeShort = (n: number): string => {
  const a = Math.abs(n)
  const sign = n < 0 ? '–' : ''
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(1)}Cr`
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(1)}L`
  if (a >= 1e3) return `${sign}₹${(a / 1e3).toFixed(0)}K`
  return `${sign}₹${Math.round(a)}`
}

/** Percentage with a fixed number of decimals; the input is already a percent (e.g. 41.3). */
export const pct = (n: number, d = 0): string => `${n.toFixed(d)}%`

/** Fraction (0..1) as a percent string. */
export const frac = (n: number, d = 0): string => pct(n * 100, d)

export const num1 = (n: number | null | undefined): string => (n == null ? '–' : n.toFixed(1))

/** ISO date to "31 Oct 2026". */
export const longDate = (iso: string): string => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/** 24h hour to "7 PM". */
export const hourLabel = (h: number): string => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`
