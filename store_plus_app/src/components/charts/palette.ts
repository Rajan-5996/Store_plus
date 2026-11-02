/**
 * Complementary chart colours: Swiggy-style orange and its opposite on the colour wheel, a vivid blue.
 * Tints of each are used when more than two shades are needed.
 */
export const BLUE = '#1F6FEB'
export const ORANGE = '#FF5200'
export const INK = '#1E293B'
export const MUTED = '#94A3B8'

export const CHART_COLORS = [BLUE, ORANGE, '#4C8DF0', '#FF7A33', '#79A9F4', '#FF9A66', '#A5C4F8', '#FFB892']

/** Highlight / alert colour (the orange half of the pair). */
export const ALERT = ORANGE
export const BASE = BLUE

/** Maps legacy theme-variable colours used by callers to the complementary chart colours. */
export const resolveColor = (c?: string): string => {
  if (!c) return BLUE
  if (c.includes('--loss')) return ORANGE
  if (c.includes('--ink')) return BLUE
  if (c.includes('--line') || c.includes('--muted')) return MUTED
  if (c.includes('--gain')) return '#10B981'
  return c
}

export const tooltipStyle = {
  contentStyle: {
    borderRadius: 10,
    border: '1px solid rgba(0,0,0,.08)',
    boxShadow: '0 6px 20px rgba(0,0,0,.12)',
    fontSize: 12,
    fontWeight: 600,
  },
  cursor: { fill: 'rgba(100,116,139,.12)' },
} as const
