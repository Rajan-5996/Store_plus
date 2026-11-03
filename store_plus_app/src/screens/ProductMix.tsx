import type { CSSProperties } from 'react'
import { RiShoppingBasketLine, RiLayoutGridLine, RiPriceTag3Line, RiLightbulbFlashLine } from '@remixicon/react'
import AiInsights from '../components/insights/AiInsights'
import Box from '../components/ui/Box'
import KpiGrid from '../components/ui/KpiGrid'
import Pill, { type PillVariant } from '../components/ui/Pill'
import ScreenData from '../components/ui/ScreenData'
import ScreenHeader from '../components/ui/ScreenHeader'
import { ScoreBars } from '../components/ui/ScoreBar'
import SimpleTable from '../components/ui/SimpleTable'
import { fmt, pct, rupee } from '../lib/format'
import type { ProductMixData } from '../types/api'

const TONE: Record<string, PillVariant> = {
  Growing: 'green',
  Stable: '',
  Declining: 'red',
  Strong: 'green',
  Moderate: 'blue',
  'Low per unit': 'warn',
  'Under pressure': 'red',
  Good: 'green',
  Variable: 'warn',
}
const pill = (v: string) => <Pill variant={TONE[v] ?? ''}>{v}</Pill>

function ProductMixBody({ d }: { d: ProductMixData }) {
  const top = Math.max(...d.categoryProfile.map((c) => c.marginPct), 1)
  return (
    <>
      <KpiGrid
        icons={[RiShoppingBasketLine, RiLayoutGridLine, RiPriceTag3Line, RiLightbulbFlashLine]}
        items={[
          { label: 'Average basket value', value: rupee(d.kpis.avgBasketValue), delta: 'Per delivered order' },
          { label: 'Categories analysed', value: fmt(d.kpis.categoriesAnalysed), delta: 'Sub-categories with sales' },
          { label: 'Low-contribution SKUs', value: fmt(d.kpis.lowContributionSkus), delta: 'Under 8% product margin' },
          { label: 'Assortment opportunities', value: fmt(d.kpis.assortmentOpportunities), delta: 'Searched for, not stocked' },
        ]}
      />
      <AiInsights scope="productmix" title="Assortment actions for margin and basket value" />
      <Box
        className="mt"
        title="Category contribution profile"
        sub="Product margin % of the eight largest categories by revenue. Orange is below 8%."
        hint="(Selling price − cost) ÷ selling price, summed over delivered order lines in each category."
      >
        <div className="bars-2" style={{ '--rows': Math.ceil(d.categoryProfile.length / 2) } as CSSProperties}>
          <ScoreBars
            rows={d.categoryProfile.map((c) => ({
              label: c.label,
              pct: (c.marginPct / top) * 100,
              value: pct(c.marginPct, 1),
              hot: c.marginPct < 8,
            }))}
          />
        </div>
      </Box>
      <Box className="mt scroll" title="SKU and category opportunities" sub="Top six sub-categories by revenue, compared with the previous period of the same length.">
        <SimpleTable
          head={['Category', 'Sales trend', 'Contribution trend', 'Availability', 'Opportunity', 'Decision']}
          rows={d.table.map((r) => [<b key="c">{r.category}</b>, pill(r.sales), pill(r.contribution), pill(r.availability), r.opportunity, <b key="d">{r.decision}</b>])}
        />
      </Box>
    </>
  )
}

export default function ProductMix() {
  return (
    <section>
      <ScreenHeader
        title="Product mix intelligence"
        sub="Which categories and SKUs contribute to healthy basket economics, and where assortment changes can improve customer value and margin."
      />
      <ScreenData name="productmix">{(d) => <ProductMixBody d={d} />}</ScreenData>
    </section>
  )
}
