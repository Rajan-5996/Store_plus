import { fmt, rupeeShort } from '@/lib/format'
import type { StoreDetail } from '@/types/store'

/** One plain sentence on how the store is doing, built from its own numbers. */
export function verdict(d: StoreDetail): string {
  const { kpis: k, ops } = d
  const lost = ops.lostOrdersDay ?? 0
  const out = [k.pnlDay < 0 ? `Losing ${rupeeShort(-k.pnlDay)} a day.` : `Earning ${rupeeShort(k.pnlDay)} a day.`]
  if (k.pnlDay < 0 && k.gapOrders && k.gapOrders > 0) {
    out.push(`Needs ${fmt(k.gapOrders)} more orders a day to break even. Main cause: ${d.cause.label.toLowerCase()}.`)
  }
  if (lost >= 3) out.push(`${fmt(lost)} orders a day are lost at busy hours.`)
  return out.join(' ')
}
