# Inventory intelligence — diagnosis playbook

## 1. Stock-out root-cause tree

For each category or SKU with high lost sales, test in this order:

```
High OOS / lost sales
├── Vendor fill rate < contracted − 5 pts (and same vendor short in other stores) → SUPPLIER SHORTFALL
├── Forecast bias < 0.9 for the category ........................................ UNDER-FORECAST
│     (often self-reinforcing: stock-outs cut sales → forecast learns lower demand)
├── OOS starts mid-afternoon/evening while morning stock was fine ............... SLOT / INTRA-DAY GAP
│     (perishables replenished once or twice a day run dry before the evening peak)
├── Spike days coincide with promotions or festivals ............................ DEMAND SPIKE NOT PLANNED
├── Small daily demand but large case packs, or long vendor lead time ............ COVER / LEAD-TIME SETTING
└── None of the above ............................................................. RANDOM / ONE-OFF
```

Check the vendor before the forecast: a supplier shortfall also produces stock-outs, but forecast bias
stays near 1.0.

## 2. Wastage root-cause tree

```
High wastage % (vs network median for that category)
├── reason = Cold chain breach ........ EQUIPMENT → cold-chain hours, sensor gaps, chiller power trend
├── reason = Expired dominant ......... OVER-ORDERING → forecast bias > 1.2 or cover > shelf life
├── reason = Quality rejection high ... FRESH HANDLING / OVERSTOCK (fresh rots while sitting)
└── reason = Damaged high ............. HANDLING / PICKING process → operational-efficiency
```

High wastage with high OOS in the same category means poor rotation or wrong slot timing, not simply
"too much stock".

## 3. Signatures

| Root cause | What you see | Fix |
|---|---|---|
| Under-forecast | bias 0.7–0.9, OOS high, little wastage | Correct forecast (+% for category), stop learning from censored sales |
| Supplier shortfall | fill rate well below contract across stores, zero-fill lines up | Escalate vendor, dual-source, raise safety stock temporarily |
| Intra-day gap | OOS minutes concentrated late in day | Add or move a replenishment slot before the evening peak |
| Demand spike | OOS on promo/festival dates only | Feed promo and festival calendar into the forecast |
| Over-ordering | bias > 1.2, expiry wastage, high cover | Lower cover days, shorter review cycle |
| Fresh overstock | quality rejection high, cover > 2 days on fresh | Cut fresh cover, split deliveries |
| Cold chain | breach hours, cold-chain wastage spikes, chiller power up | Repair or replace equipment, alarm escalation |
| Assortment noise | many ranged SKUs with near-zero demand | Hand to product-mix for range review |

## 4. Severity and confidence

Severity rules live in SKILL.md. Confidence:

| Evidence | Confidence |
|---|---|
| Cause visible in two independent tables (e.g. low fill rate in POs AND OOS in inventory) | 0.85–0.95 |
| One table, ≥ 30 days | 0.7–0.8 |
| Few days or few SKUs | ≤ 0.6 |

## 5. Quantifying impact

| Problem | Impact metric |
|---|---|
| Stock-outs | Lost sales ₹/day = lost units × selling price; lost margin = lost units × (price − cost) |
| Abandoned baskets | orders_abandoned_oos/day (from store-utilisation / sessions) × average order margin |
| Wastage | ₹/day at cost |
| Overstock | stock value at cost locked above target cover |
| Supplier | lost sales on that vendor's SKUs across all affected stores |

## 6. Recommendation library

| Cause | Recommendation | Show |
|---|---|---|
| Under-forecast | Uplift category forecast by (1 ÷ bias − 1) and re-baseline on demand (sold + lost) | Bias before/after target |
| Supplier shortfall | Vendor escalation with fill-rate evidence; temporary safety-stock increase; alternate supplier | Fill vs contract, affected stores |
| Intra-day gap | Add an afternoon/evening top-up for the affected categories | OOS minutes by time window |
| Demand spike | Pre-build stock for listed promotions/festivals | Upcoming events, expected uplift |
| Over-ordering / fresh overstock | Reduce target cover to category norm; enforce FIFO | Cover now vs target, ₹ saved |
| Cold chain | Equipment inspection/replacement; breach alerting | Breach hours, ₹ spoiled |
| Imbalance | Inter-store transfer for listed non-perishables | Units movable, both stores |

## 7. Writing the explanation

1. Status — "Dairy was out of stock on X% of SKU-days at store #000 versus a network median of Y%."
2. Cause with proof — "The forecast covers only Z% of real demand, while supplier fill rate is normal."
3. Impact — "≈ ₹N/day of lost sales and K abandoned baskets."
4. Fix — top recommendation with its expected effect.

## 8. Traps

- Low sales ≠ low demand when the SKU was out of stock — always add lost demand.
- One store's shortfall from a vendor that serves others normally is a store ordering issue.
- Festive spikes (Raksha Bandhan sweets, Diwali dry fruits/cleaning) are not forecast failures unless unplanned.
- Fresh produce always has some quality rejection; compare to the category's network median.
- Blank sensor readings are gaps, not "OK".
- Do not recommend transfers of perishables between stores.
