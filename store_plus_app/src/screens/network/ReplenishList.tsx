import { RiLoader4Line, RiTruckLine } from '@remixicon/react'
import { useReplenishment } from '@/hooks/useReplenishment'
import Emphasis from '../../components/ui/Emphasis'

/** Which products to top up, on which delivery and by when, ahead of the demand peak that empties the shelf. */
export default function ReplenishList({ code }: { code: string }) {
  const entry = useReplenishment(code)
  const items = (entry?.data?.items ?? []).filter((x) => x.plan).slice(0, 3)
  return (
    <section aria-label="Replenishment timing" className="mt-5">
      <h4 className="rec-section">Replenish: when and how much</h4>
      {!entry?.data && entry?.status !== 'error' && (
        <p className="flex items-center gap-2 text-[13px] text-muted" role="status">
          <RiLoader4Line className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> Working out delivery times…
        </p>
      )}
      {entry?.data && items.length === 0 && <p className="text-[13px] text-muted">No product is running out here, so no extra delivery is needed.</p>}
      <ul className="m-0 flex list-none flex-col gap-3 !p-0">
        {items.map((it) => (
          <li key={it.sku} className="box kpi kpi-c kpi-c4 rec-kcard">
            <div className="kpi-head">
              <div className="label">Replenish by {it.plan?.arrives}</div>
              <span className="kpi-ico">
                <RiTruckLine />
              </span>
            </div>
            <div className="val">
              +{it.plan?.extraUnits} units · {it.sku}
            </div>
            <div className="delta">
              <Emphasis
                text={`Add them to the ${it.plan?.slot} delivery. The shelf runs empty around ${it.runsOutAt}, when the ${it.peak.fromLabel} to ${it.peak.toLabel} rush (${it.peak.sharePct}% of its sales) is on. It is out of stock on ${it.outDays} of ${it.days} days.`}
              />
            </div>
            {it.events[0]?.extraUnits && (
              <div className="delta !mt-1.5">
                <Emphasis text={`${it.events[0].label}: ${it.events[0].upliftPct}% more demand, so add ${it.events[0].extraUnits} units.`} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
