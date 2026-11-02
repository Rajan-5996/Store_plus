import { RiShoppingBasketLine, RiLayoutGridLine, RiPriceTag3Line, RiLightbulbFlashLine } from '@remixicon/react'
import Box from '../components/ui/Box'
import KpiGrid from '../components/ui/KpiGrid'
import ScreenData from '../components/ui/ScreenData'
import ScreenHeader from '../components/ui/ScreenHeader'
import { ScoreBars } from '../components/ui/ScoreBar'
import SimpleTable from '../components/ui/SimpleTable'
import { fmt, pct, rupee } from '../lib/format'
import type { ProductMixData } from '../types/api'

function ProductMixBody({ d }: { d: ProductMixData }) {
  const top = Math.max(...d.categoryProfile.map((c) => c.marginPct), 1)
  return (
    <>
      <KpiGrid
        icons={[RiShoppingBasketLine, RiLayoutGridLine, RiPriceTag3Line, RiLightbulbFlashLine]}
        items={[
          { label: 'Average basket value', value: rupee(d.kpis.avgBasketValue) },
          { label: 'Categories analysed', value: fmt(d.kpis.categoriesAnalysed) },
          { label: 'Low-contribution SKUs', value: fmt(d.kpis.lowContributionSkus) },
          { label: 'Assortment opportunities', value: fmt(d.kpis.assortmentOpportunities) },
        ]}
      />
      <div className="grid g2 mt">
        <Box title="Category contribution profile (product margin %)">
          <ScoreBars
            rows={d.categoryProfile.map((c) => ({
              label: c.label,
              pct: (c.marginPct / top) * 100,
              value: pct(c.marginPct, 1),
              hot: c.marginPct < 8,
            }))}
          />
        </Box>
        <Box title="Assortment recommendations">
          <ul>
            <li>Identify products with strong demand and positive contribution.</li>
            <li>Review discounts that increase volume but reduce contribution.</li>
            <li>Find basket-complement products and category gaps by neighbourhood.</li>
            <li>Separate margin improvement from price increases that may harm conversion.</li>
          </ul>
        </Box>
      </div>
      <Box className="mt scroll" title="SKU and category opportunities">
        <SimpleTable
          head={['Category', 'Sales trend', 'Contribution trend', 'Availability', 'Opportunity', 'Decision']}
          rows={d.table.map((r) => [r.category, r.sales, r.contribution, r.availability, r.opportunity, r.decision])}
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
        sub="Understand which categories and SKUs contribute to healthy basket economics, and where assortment changes can improve customer value and margin."
      />
      <ScreenData name="productmix">{(d) => <ProductMixBody d={d} />}</ScreenData>
    </section>
  )
}
