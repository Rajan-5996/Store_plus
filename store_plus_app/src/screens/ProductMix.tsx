import Box from '../components/ui/Box'
import { RiShoppingBasketLine, RiLayoutGridLine, RiPriceTag3Line, RiLightbulbFlashLine } from '@remixicon/react'
import KpiGrid from '../components/ui/KpiGrid'
import ScreenHeader from '../components/ui/ScreenHeader'
import { ScoreBars } from '../components/ui/ScoreBar'
import SimpleTable from '../components/ui/SimpleTable'

export default function ProductMix() {
  return (
    <section>
      <ScreenHeader
        title="Product mix intelligence"
        sub="Understand which categories and SKUs contribute to healthy basket economics, and where assortment changes can improve customer value and margin."
      />
      <KpiGrid
        icons={[RiShoppingBasketLine, RiLayoutGridLine, RiPriceTag3Line, RiLightbulbFlashLine]}
        items={[
          { label: 'Average basket value', value: '₹731' },
          { label: 'Categories analysed', value: '12' },
          { label: 'Low-contribution SKUs', value: '84' },
          { label: 'Assortment opportunities', value: '23' },
        ]}
      />
      <div className="grid g2 mt">
        <Box title="Category contribution profile">
          <ScoreBars
            rows={[
              { label: 'Staples', pct: 72, value: 72 },
              { label: 'Fruits & veg', pct: 48, value: 48 },
              { label: 'Snacks', pct: 84, value: 84 },
              { label: 'Personal care', pct: 91, value: 91 },
            ]}
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
          rows={[
            ['Snacks & drinks', 'Growing', 'Strong', 'Good', 'Expand relevant assortment', 'Test selected SKUs'],
            ['Fruits & vegetables', 'Growing', 'Under pressure', 'Variable', 'Review sourcing and wastage', 'Analyse SKU economics'],
            ['Staples', 'Stable', 'Low per unit', 'Good', 'Basket attachment', 'Bundle / cross-sell test'],
          ]}
        />
      </Box>
    </section>
  )
}
