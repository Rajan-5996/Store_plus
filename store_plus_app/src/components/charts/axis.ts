import { MUTED } from './palette'

/** Shared look for chart axes: small muted labels, no axis lines. */
export const tick = { fontSize: 11, fill: MUTED }
export const gridStroke = 'rgba(100,116,139,.18)'
export const shortDate = (iso: string): string => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
