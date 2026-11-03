export interface BrandStyle {
  /** Short tag printed on the pin. */
  tag: string
  bg: string
  fg: string
}

/** Rival quick-commerce brands on the Network map, in their own brand colours. */
export const BRANDS: Record<string, BrandStyle> = {
  Blinkit: { tag: 'B', bg: '#F8CB46', fg: '#0C831F' },
  Zepto: { tag: 'Z', bg: '#5A189A', fg: '#FFF4EC' },
  'Flipkart Minutes': { tag: 'F', bg: '#2874F0', fg: '#FFE11B' },
  'BigBasket BB Now': { tag: 'BB', bg: '#84C225', fg: '#1B1612' },
  'Amazon Now': { tag: 'A', bg: '#232F3E', fg: '#FF9900' },
}

/** Neutral charcoal: pins of an unlisted brand and the links from a selected store to its rivals. */
export const RIVAL_COLOR = '#2A2118'

export const brandStyle = (brand: string): BrandStyle =>
  BRANDS[brand] ?? { tag: brand.charAt(0).toUpperCase(), bg: RIVAL_COLOR, fg: '#FFF4EC' }

/** Distance (km) within which a rival competes for the same customers; matches the backend's RIVAL_KM. */
export const RIVAL_KM = 3
