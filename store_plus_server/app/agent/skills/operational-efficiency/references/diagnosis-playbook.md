# Operational efficiency — diagnosis playbook

## 1. Find the bottleneck

1. Compute each stage's gap to the **format median in minutes**: `gap = store_stage − format_median_stage`.
2. The stage with the largest positive gap is the bottleneck. Travel is usually the longest stage but is
   only a bottleneck if it is *longer than peers*.
3. Check whether the gap is all-day or hour-specific (`get_stage_times_by_hour`).

## 2. Cause tree by stage

```
pick (long all day, queue normal)
├── per-line pick time high for most pickers ........ LAYOUT / SLOTTING (fast movers far from packing)
├── a few pickers ≥ 1.25× store median per line .... SKILL / TRAINING gap for those pickers
└── megapod vs standard comparison ................. FORMAT effect — compare within format first

pick_queue (long at specific hours)
├── orders per picker-hour high in those hours ...... UNDER-ROSTERED hours
├── attendance rate low on those shifts ............. ABSENTEEISM
└── busy mode + demand spike (festival/rain) ........ TEMPORARY SURGE

rider_wait (long)
├── rainy days ≫ dry days, and city peers same ...... WEATHER — city-level rider supply
├── specific hours every day ......................... RIDER ROSTER gap in those hours
└── all day ......................................... STRUCTURAL rider shortage for the store

travel (long)
├── distance_km ≫ format median ..................... CATCHMENT too wide / overlap → network-optimisation
├── speed_kmph low only on rain days ................ WEATHER
└── speed low at evening peak hours ................. TRAFFIC — adjust promised ETA, not ops

pack (long) ........................................... packing stations / packers short at peaks
```

## 3. Signatures

| Cause | Evidence pattern |
|---|---|
| Layout / slotting | Pick per line high across most pickers and all hours; queue normal |
| Picker skill | Distribution of per-line pick time has a long right tail of named pickers |
| Under-rostered peak | Queue and busy mode rise together in a fixed window; pickers on floor flat while orders climb |
| Absenteeism | Attendance rate < 90% on a shift; queue rises on high-absence days |
| Rider shortage | Rider wait up; cancellations "Rider unavailable" up |
| Weather | All metrics worse on rain ≥ 10 mm days, city-wide |
| Wide catchment | Distance and rider payout high; on-time low on far orders |

## 4. Quantifying impact

| Fix | Impact estimate |
|---|---|
| Reduce pick time | minutes saved per order × orders/day; recovers capacity ≈ saved minutes ÷ pick cycle |
| Add pickers at peak | recovers lost orders in those hours (ask store-utilisation for count) |
| Fix rider wait | minutes saved and fewer rider-unavailable cancellations |
| Improve on-time | fewer late complaints and refunds (₹/day from `get_cancellations_and_complaints`) |

## 5. Recommendation library

| Cause | Recommendation |
|---|---|
| Layout / slotting | Re-slot top-velocity SKUs into golden-zone racks nearest packing; trial and measure |
| Picker skill | Pair slow pickers with top performers; refresher training; review device/route issues |
| Under-rostered | Shift or add picker hours into the identified window (e.g. split-shift into evening) |
| Absenteeism | Standby/agency pool for the affected shift; review shift timing |
| Rider shortage | Hour-specific rider incentives; city rain playbook if weather-driven |
| Wide catchment | Tighten serviceable radius or rebalance with neighbour store (network-optimisation) |
| Packing | Add packer or station at peaks |
| Replicate best practice | Name the best similar-format store and the stage where it is faster |

## 6. Writing the explanation

1. Status — "Orders at store #000 take a median 15.2 min door-to-door; X% arrive late (network Y%)."
2. Bottleneck — "Picking takes 3.1 min per order versus 2.3 at similar stores, all day long."
3. Cause — "Most pickers are slow, not a few, which points to rack layout rather than people."
4. Fix + impact.

## 7. Traps

- Means hide tails: use median and p90.
- Do not penalise pickers for big baskets — use per-line time.
- A store with long travel but normal in-store stages is a network question, not an ops one.
- Festival and rain days inflate everything; compare against city peers on the same dates.
- Small-sample pickers (< 200 orders) should not be flagged.
- Orders with blank picking timestamps are data gaps — exclude from stage maths, mention the count.
