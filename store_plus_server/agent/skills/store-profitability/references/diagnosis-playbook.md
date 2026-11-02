# Store profitability — diagnosis playbook

How to turn P&L numbers into a root cause, a severity and recommendations.

## 1. Root-cause tree

Work top-down; stop at the first branch the evidence clearly supports, but report secondary drivers.

```
Contribution < 0
├── CBO per order ≤ 0 ............................ UNIT ECONOMICS (loses money on every order)
│     → check margin_po, rider_po, coupons_po, refunds_po, wastage_po vs format median
├── CBO per order > 0 but orders/day < break-even
│     ├── opex/day within ±15% of format median .. VOLUME problem
│     │     → store-utilisation: low demand or throttled demand?
│     ├── rent_po or staff_po ≥ 1.5 × format median FIXED-COST problem
│     │     → rent: location/lease; staff: roster vs demand (operational-efficiency)
│     └── store age < 120 days ................... MATURITY (ramp-up) — judge the trend
└── Mixed ......................................... report the top two drivers by ₹/day
```

Quantify each driver as **₹ per day gap versus format median**:

```
driver_gap_per_day = (store_line_po − format_median_po) × store_orders_per_day
```

The largest positive gap (cost) or negative gap (income) is the primary driver.

## 2. Driver signatures

| Driver | Signature in the numbers | Typical cause | Ask / hand off |
|---|---|---|---|
| Low volume | orders/day ≪ break-even; opex normal | Weak catchment, new store, overlap, throttling | store-utilisation, network-optimisation |
| High rent | rent_po ≫ peers, often large format | Oversized or premium-location lease | network-optimisation (relocation), lease renegotiation |
| High staff cost | staff_po ≫ peers at similar orders | Roster not matched to demand | operational-efficiency |
| High last mile | rider_po ≫ peers | Long delivery distance, rain incentives | network-optimisation (catchment), operational-efficiency |
| Low margin mix | margin_po ≪ peers at similar AOV | Basket skewed to milk/staples, deep discounts | product-mix |
| Coupon heavy | coupons_po ≫ peers | Local marketing push | experiment-analysis (was it worth it?) |
| Wastage | wastage_po ≫ peers | Over-ordering, expiry, cold-chain failure | inventory-intelligence |
| Refunds | refunds_po ≫ peers | Missing/damaged items, late deliveries | operational-efficiency |
| Lost sales | orders lost to busy mode or stock-outs | Capacity or availability gaps | store-utilisation, inventory-intelligence |

"≫" means at least 1.5× the format median, or above the format's 90th percentile.

## 3. Severity and confidence

Severity rules are in SKILL.md. Confidence guidance:

| Situation | Confidence |
|---|---|
| ≥ 60 days of data, driver gap ≥ 2× next driver | 0.85–0.95 |
| 30–60 days, or two drivers of similar size | 0.65–0.80 |
| < 30 days (new/closed store), or a key table missing | ≤ 0.6 and list the gap |

Set `is_hypothesis = true` for any cause that depends on another agent's domain (e.g. "evening demand is
being throttled") until that agent confirms it.

## 4. Recommendation library

Pick only those the evidence supports. Every recommendation needs an expected ₹/day impact from
`run_sensitivity` or the driver gap.

| Driver | Recommendation | How to size it |
|---|---|---|
| Low volume | Investigate demand capture: busy-mode losses, stock-out abandonment, catchment overlap | orders needed to break even |
| Low volume (mature, overlap) | Evaluate catchment redesign or merger with nearby store | network-optimisation estimate |
| High rent | Renegotiate lease or evaluate right-sizing / relocation at lease end | rent reduction to break even |
| High staff | Rebalance roster to the hourly demand curve | staff_po gap × orders |
| High last mile | Tighten serviceable radius, review rain incentive policy | rider_po gap × orders |
| Low margin | Shift mix toward higher-margin categories; review discount depth | ₹/order needed |
| Coupons | Stop or retarget campaigns with negative ROI | coupons_po gap × orders |
| Wastage | Fix replenishment cover or cold chain | wastage_po gap × orders |
| Maturity | Track weekly trend vs ramp curve of earlier launches; set a review date | weeks to break even at current slope |

Never recommend store closure from P&L alone. If a store is structurally negative (CBO ≤ 0 or rent alone
exceeds CBO at peer-level volume), say "candidate for network review" and hand off to network-optimisation.

## 5. Writing the explanation

Use this shape, 2–4 sentences:

1. **Status** — "Store #000 lost ₹X/day (−Y% of GOV) over the period."
2. **Main driver with comparison** — "Rent is ₹A per order versus a format median of ₹B, which alone
   accounts for ₹C/day."
3. **Volume context** — "It needs N orders/day to break even and does M."
4. **What would fix it** — the top quantified lever.

Avoid jargon such as CBO in user-facing text; say "profit per order before store running costs".

## 6. Common traps

- Comparing a megapod with standard stores — always compare within `store_format`.
- Reading a festival week (Raksha Bandhan, Ganesh Chaturthi, Dussehra, Diwali build-up) as a trend change.
- Treating one-off capex or a marketing launch day as run-rate cost.
- Dividing by 92 days for stores that opened or closed mid-period.
- Calling a store "unprofitable" when contribution is within ±0.3% of zero — call it "at break-even".
- Mixing store-level contribution with company-level margins reported by Swiggy; they are not the same.

## 7. Network-level questions

For "which stores are below break-even?" or "network loss":

1. Run `get_store_pnl` for all stores.
2. Count stores with contribution < 0; sum their losses (₹/day).
3. Group by format and city; list the five worst with their primary driver (one line each).
4. Return one output object per flagged store plus a `network_summary` object:

```json
{"agent": "store_profitability", "network_summary": {
  "stores_analysed": 34, "stores_below_break_even": 0, "daily_loss_from_loss_makers_inr": 0,
  "network_contribution_pct": 0.0, "worst_stores": [{"store_code": "#000", "primary_driver": "rent"}]}}
```
