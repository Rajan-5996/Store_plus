/** Placeholder shaped like a dashboard page (KPI row, chart + side card, table) while its data loads. */
export default function PageSkeleton() {
  const line = (w: string, h = 12) => <div className="skel" style={{ width: w, height: h }} />
  return (
    <div aria-busy="true" aria-label="Loading data" role="status">
      <div className="grid g4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="box flex flex-col gap-3">
            {line('55%')}
            {line('35%', 28)}
            {line('70%', 10)}
          </div>
        ))}
      </div>
      <div className="grid g21 mt">
        <div className="box flex flex-col gap-3">
          {line('40%', 14)}
          {line('100%', 220)}
        </div>
        <div className="box flex flex-col gap-3">
          {line('60%', 14)}
          {line('100%', 64)}
          {line('100%', 64)}
          {line('100%', 64)}
        </div>
      </div>
      <div className="box mt flex flex-col gap-3">
        {line('30%', 14)}
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i}>{line('100%', 18)}</div>
        ))}
      </div>
      <span className="sr-only">Reading the latest numbers from the store database.</span>
    </div>
  )
}
