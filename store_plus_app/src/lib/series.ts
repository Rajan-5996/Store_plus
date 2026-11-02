/** Deterministic wavy series used to fake trend data for the demo. */
export const wobble = (n: number, base: number, amp: number, trend = 0, seed = 1): number[] =>
  Array.from(
    { length: n },
    (_, i) => base + trend * i + Math.sin(i * 0.9 + seed) * amp + Math.sin(i * 0.37 + seed * 2) * amp * 0.6,
  )

export interface Candle {
  open: number
  close: number
  low: number
  high: number
}

/** Deterministic open/high/low/close candles (each period opens at the previous close). */
export const candles = (n: number, base: number, amp: number, trend = 0, seed = 1): Candle[] => {
  const closes = wobble(n, base, amp, trend, seed).map(Math.round)
  return closes.map((close, i) => {
    const open = i === 0 ? Math.round(base - amp * 0.4) : closes[i - 1]
    const reach = Math.round(amp * (0.45 + 0.35 * Math.abs(Math.sin(i * 1.7 + seed))))
    return {
      open,
      close,
      high: Math.max(open, close) + reach,
      low: Math.min(open, close) - Math.round(reach * 0.8),
    }
  })
}
