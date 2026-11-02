export const fmt = (n: number): string => n.toLocaleString('en-IN')

export const rupee = (n: number): string =>
  (n < 0 ? '–₹' : '₹') + fmt(Math.abs(Math.round(n)))
