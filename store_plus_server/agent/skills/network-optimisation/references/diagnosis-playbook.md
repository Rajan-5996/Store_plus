# Network optimisation — diagnosis playbook

## 1. Is an overlap good or bad?

For each pair from `find_overlaps` with an overlap share ≥ 20% for either store:

| Question | Source | Points to |
|---|---|---|
| Is either store in busy mode / losing orders? | store-utilisation | YES → overlap may be **useful relief** |
| Are both stores below break-even? | store-profitability | YES → **harmful duplication** |
| Did combined orders of the pair grow when the second store opened, or just split? | fact_orders by store and period | Split → **cannibalisation** |
| How far apart are they? | km_apart | < 1.5 km → near-duplicate locations |
| Does the overlap add speed (shorter distance) for customers? | get_delivery_footprint | Only meaningful if far-order share fell |

Verdict rules:

| Pattern | Verdict |
|---|---|
| One store constrained, partner has spare capacity, overlap lets partner take overflow | Useful overlap — keep, possibly route overflow deliberately |
| Both stores healthy (≥ break-even), overlap share < 30% | Acceptable — low priority |
| Both weak, overlap share ≥ 30%, < 1.5 km apart | Harmful duplication — candidate for catchment redesign or consolidation review |
| One weak, one healthy, heavy overlap | Weak store is cannibalised — review its catchment or role |

## 2. Unserved demand — ranking expansion candidates

Score each pocket from `get_unserved_demand`:

```
score = sessions_per_day × (affluence / 4) × min(1, km_to_nearest_store / 4)
```

| Signal | Interpretation |
|---|---|
| High sessions, far (> 3.5 km) from any store | Expansion candidate (white space) |
| High sessions, 2.5–3.5 km from a store with spare capacity | Radius extension candidate (cheaper than a store) |
| High sessions near a constrained store | New store or capacity add at that neighbour |
| Low sessions | Ignore |

For a new-store candidate, ask store-profitability for break-even orders of the format you would open and
compare with `est_potential_orders_per_day_upper_bound` (state it is an upper bound).

## 3. Relocation signals

A store is a relocation/redesign candidate when **all** hold:
1. Below break-even (store-profitability) with volume as the main driver.
2. Its catchment overlaps heavily with a neighbour, **or** its own catchment has weak demand while an
   unserved pocket sits 2–4 km away.
3. It is not still ramping (age ≥ 120 days).

Recommend "relocation review" with the pocket and partner store named — never a closure decision.

## 4. Delivery footprint problems

| Pattern | Meaning | Recommendation |
|---|---|---|
| > 15% of orders beyond 3 km | Catchment too wide or poorly placed store | Tighten radius or hand far hexes to a nearer store |
| Rider payout high and on-time low in far bands | Cost and service penalty of distance | Quantify ₹/day saved by shifting those hexes |
| Far orders concentrated in specific hexes | Coverage boundary issue | List hexes for redraw |

## 5. Competitive pressure

| Pattern | Meaning |
|---|---|
| ≥ 6 rival stores within 3 km | Saturated micro-market — growth via share, not white space |
| Rival opened within 2 km during period and store orders dipped after | Demand loss to competition; flag to experiment-analysis as a confounder |
| Rival-free pocket with high unserved sessions | First-mover expansion opportunity |

## 6. Severity and confidence

Severity rules are in SKILL.md. Confidence:

| Evidence | Confidence |
|---|---|
| Overlap share + both P&Ls + km apart all consistent | 0.85–0.95 |
| Geography only, no profitability/utilisation input yet | 0.6–0.7 (mark `is_hypothesis`) |
| Unserved demand estimates | ≤ 0.7 — sessions are a proxy |

## 7. Recommendation library

| Situation | Recommendation |
|---|---|
| Harmful duplication | Catchment redesign (each hex to nearest store) and consolidation review |
| Useful overlap | Keep; formalise overflow routing at peaks |
| Cannibalised weak store | Re-scope its catchment; consider relocating toward unserved demand |
| White space | Shortlist pocket for a new store; size with break-even |
| Near-edge demand | Extend radius of a store with spare capacity |
| Wide catchment | Tighten radius; reassign far hexes |
| Saturated market | Compete on availability/speed; avoid adding stores |

## 8. Writing the explanation

1. Status — "Stores #000 and #001 are 0.7 km apart and share 40 of their hexes."
2. Impact — "X% of #000's orders come from shared hexes; both stores are below break-even."
3. Verdict — "This overlap duplicates cost rather than adding capacity."
4. Action — redesign / review with the expected effect.

## 9. Traps

- Overlap measured on hexes ≠ overlap in orders — always weigh by orders.
- Use one coverage period at a time; coverage changes on launch, closure and redraw dates.
- New stores show low orders and heavy overlap while ramping — judge after ~120 days.
- Straight-line vs road distance: don't mix them in one comparison.
- Session counts from unserved areas are proxies for intent, not committed demand.
