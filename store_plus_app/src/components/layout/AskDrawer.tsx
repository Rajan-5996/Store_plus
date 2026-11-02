import { useUI } from '../../context/UIContext'

const chips = ['Which stores have evening stock-outs?', 'What if we merge #412 and #415?']

export default function AskDrawer() {
  const { drawerOpen, closeDrawer } = useUI()
  return (
    <aside className={`drawer ${drawerOpen ? 'open' : ''}`} aria-label="Pulse AI">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Pulse AI</h2>
        <button className="btn ghost" type="button" onClick={closeDrawer}>Close</button>
      </div>
      <div className="msgs">
        <div className="msg me">Why is #412 worse than #389?</div>
        <div className="msg">
          Both stores are the same size with similar demand. The difference is evening operations: #412’s pick time
          rises to 9.5 min between 7 and 9 p.m., versus 4.1 min at #389, so #412 pauses orders for about 85 min a day.
          <div className="ph" style={{ marginTop: 8, minHeight: 60 }}>
            <span>Mini chart: pick time by hour, both stores</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>
            Data: operations table, 1–28 Oct
          </div>
        </div>
      </div>
      <div className="chips">
        {chips.map((c) => (
          <button key={c} className="chip" type="button">{c}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="ctl" style={{ flex: 1 }} placeholder="Ask about any store" aria-label="Question" />
        <button className="btn solid" type="button">Ask</button>
      </div>
    </aside>
  )
}
