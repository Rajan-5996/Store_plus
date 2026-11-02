# Store utilisation — diagnosis playbook

## 1. Classification

Apply in order; a store can carry one primary and one secondary label.

| Label | Test (compute against live medians) | Meaning |
|---|---|---|
| Ramping | age < 120 days | Low load expected; judge weekly trend |
| Capacity-constrained | busy min/day ≥ 1.5 × network median AND busy mode present in ≥ 6 hours | Demand regularly exceeds what the floor can process |
| Peak-constrained | busy mode concentrated in ≤ 5 consecutive hours that hold ≥ 70% of busy minutes | One window (often evening) is short of capacity |
| Weather-constrained | busy spikes coincide with rain ≥ 15 mm and city peers spike the same days; rider-bound | City-wide rider shortage, not a store problem |
| Under-utilised | design utilisation in bottom quartile of format AND busy min/day below network median | Building is bigger than its demand |
| Balanced | none of the above | |

## 2. Diagnostic questions per label

**Capacity-constrained / Peak-constrained**
1. Which hours? (`get_hourly_profile`)
2. Which resource? (`get_binding_constraint`) — pickers vs riders.
3. Is it roster or attendance? Compare pickers_on_floor in busy hours with the store's own off-peak
   pickers per 100 orders; hand roster questions to operational-efficiency.
4. How many orders are lost per day, and what are they worth? (lost orders × profit per order).
5. Weekday vs weekend difference — a weekend-only problem needs a different roster than a daily one.

**Under-utilised**
1. Is demand low (few sessions) or is conversion low (sessions but few orders)?
   - Low sessions → catchment / location → network-optimisation.
   - Low conversion or high abandonment → availability / assortment → inventory-intelligence, product-mix.
2. Is the store new? Compare its weekly slope with the network's.
3. Is the format right? A megapod at standard-store volume is an oversizing signal → store-profitability
   (rent) and network-optimisation.

**Weather-constrained**
1. Confirm with 2+ stores in the same city showing busy spikes on the same rainy dates.
2. Recommend city-level rider surge planning rather than store changes.

## 3. Sizing the opportunity

| Situation | Metric to report | Formula |
|---|---|---|
| Constrained | Orders recoverable/day | Σ lost orders in binding hours ÷ days |
| Constrained | Staff needed (estimate) | extra pickers ≈ recoverable orders per peak hour ÷ orders per picker-hour off-peak |
| Under-utilised | Headroom orders/day | design capacity × 20 − accepted orders/day |
| Under-utilised | Orders to break even | from store-profitability `get_break_even` |

Label staffing estimates as hypotheses — operational-efficiency validates them.

## 4. Recommendation library

| Label | Recommendation | Evidence required |
|---|---|---|
| Peak-constrained (picker-bound) | Add or shift picker shifts into the identified hours; test with a time-boxed roster change | Pick queue elevated in those hours |
| Peak-constrained (rider-bound) | Raise rider supply / incentives for those hours | Rider wait elevated; not explained by rain alone |
| Capacity-constrained | Review end-to-end capacity: roster, layout, packing stations; consider demand redistribution to neighbour stores | Busy mode across most hours |
| Weather-constrained | City-level rain playbook (surge incentives, pre-positioned riders) | City peers affected same days |
| Under-utilised | Investigate demand capture (catchment, conversion, assortment) before cutting cost; consider right-sizing at lease end | Low sessions or low conversion |
| Under-utilised, near overloaded neighbour | Shift serviceable area from the overloaded neighbour | Neighbour constrained, catchments adjacent |
| Ramping | Track weekly ramp vs earlier launches; set review checkpoint | Age < 120 days |

Every recommendation should carry: action, hours or days affected, expected orders/day impact, and which
agent must confirm.

## 5. Writing the explanation

1. Status — "Store #000 runs at X% of its design capacity and spends Y minutes/day in busy mode
   (network median Z)."
2. Where — "Busy mode is concentrated 18:00–23:00, where about N orders/day are lost."
3. Why — "Orders wait K× longer for a picker in those hours, so picking is the limit."
4. What to do — the top recommendation with sized impact.

## 6. Traps

- Daily averages hide peaks — always look at the hourly profile before concluding "under-utilised".
- High staffed utilisation alone is not a problem; it is efficient until busy mode appears.
- Busy mode in Mumbai-like monsoon periods is often rider supply city-wide — check peers and weather.
- Festival days (Raksha Bandhan, Ganesh Chaturthi, Dussehra, Diwali build-up) create one-off peaks.
- Design capacity is a ceiling, not a target; never promise demand to fill it.
- A store that closed or opened mid-period has partial data — say so.
