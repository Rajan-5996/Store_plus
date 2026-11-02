# Product mix — diagnosis playbook

## 1. Reading the margin quadrant

| Quadrant | Typical members | Role | Action |
|---|---|---|---|
| Stars (high sales, high margin) | Snacks, personal care, fresh fruit, non-grocery | Profit engines | Protect availability, prime placement, avoid needless discounting |
| Traffic builders (high sales, low margin) | Milk, bread, eggs, staples, oils | Bring customers in, anchor baskets | Keep in stock and competitively priced; judge by penetration, not margin |
| Niche profit (low sales, high margin) | Electronics, home & kitchen, premium skin care | Lift AOV and margin | Improve visibility, cross-sell with related missions |
| Review (low sales, low margin) | Long-tail packaged goods | Space and capital users | Check OOS first; then rationalise or swap |

## 2. Diagnostic questions

1. **Is the mix earning?** Store margin % vs format median. If lower, which categories' share is out of line
   (assortment index) — too much traffic-builder share, too little stars?
2. **Is low performance real?** For every weak SKU/category check OOS rate and lost units. Low sales + high
   OOS = availability problem → inventory-intelligence.
3. **Does the store fit its location?** Under-indexed categories vs city, and null searches for local
   favourites (regional dairy, local batters, regional beverages and staples).
4. **What sells together?** Top lift pairs → placement and bundles.
5. **Is price a barrier?** Categories where we are dearer than rivals on many KVIs, especially traffic builders.

## 3. Signatures

| Finding | Evidence | Meaning |
|---|---|---|
| Ranging gap | Null searches for a term at this store ≫ city peers, `any_match = true` | Peers stock it; this store doesn't |
| Sourcing gap | Searches city-wide with `any_match = false` | Product not in catalogue at all |
| Availability, not demand | Low sales SKU with OOS rate > 20% | Fix stock before judging |
| Low-margin skew | Traffic-builder share of sales well above format, margin % below format | Mix depresses contribution |
| Discount dependency | High discount vs MRP in a category, margin thin | Check promo ROI with experiment-analysis |
| Price disadvantage | Dearer than ≥ 1 rival on ≥ 40% of KVIs in a category | Risk of losing price-sensitive baskets |
| Dead stock | Near-zero demand while in stock, stock value tied up | Rationalise |

## 4. Quantifying impact

| Action | Size it as |
|---|---|
| Range a missing local favourite | searches/day × assumed conversion (state it, e.g. 30–50%) × category average price × margin % |
| Fix low-margin skew | (format margin % − store margin %) × store sales/day |
| Delist dead stock | stock value at cost released; shelf slots freed |
| Bundle a high-lift pair | orders with A but not B × confidence uplift assumption (label as hypothesis; test it) |
| Reprice KVIs | margin given up per day vs expected volume gain — send to experiment-analysis to test |

## 5. Recommendation library

| Finding | Recommendation |
|---|---|
| Ranging gap | Add the specific products (city-available SKUs only) and stock them in line with peers |
| Sourcing gap | Flag to category team as a sourcing opportunity with search volume |
| Low-margin skew | Promote stars and niche-profit items in high-traffic missions; review discount depth |
| Strong affinity pair | Co-locate on app shelves, "frequently bought together", bundle offers |
| Under-indexed category | Check range breadth and availability vs peers; then visibility |
| Dead stock | Delist or replace with locally searched items |
| Price disadvantage on traffic builders | Test targeted price match on a small KVI set (never blanket) |
| Private label | Where private label exists in a category with high branded sales, test placement — margins are higher |

## 6. Writing the explanation

1. Status — "Store #000 earns X% margin on sales versus Y% for similar stores."
2. Driver — "Traffic builders make up A% of sales here versus B% across the city."
3. Location fit — "Customers searched for '…' N times per 1,000 orders; other stores in the city stock it."
4. Action — specific products/categories with sized impact.

## 7. Traps

- Judging milk/bread by margin — they exist to bring baskets.
- Delisting items that were simply out of stock.
- Recommending a regional brand in a city where it is not available.
- Lift from tiny counts — require support and ≥ 200 co-occurring orders.
- Festival-season mix (sweets, dry fruits, puja items) is temporary — compare like-for-like periods.
- The dataset carries a representative catalogue (~600 SKUs); avoid claims about full-range breadth.
