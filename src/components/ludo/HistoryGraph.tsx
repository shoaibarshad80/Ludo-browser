// ============================================================
// HistoryGraph — timestamped timeline graph of recent games
// (coin balance curve + W/L dots) shown on the profile tab.
// Extracted from MenuScreen for clarity (presentational only).
// ============================================================

import { GameHistoryEntry } from '@/stores/ludoStore'

/** Timestamped timeline graph of recent games (coin balance + W/L dots). */
export default function HistoryGraph({
  history,
  coins,
  title = 'RECENT GAMES TIMELINE',
  empty = 'Finish a game — your win/loss timeline graph appears here.',
  onPlay,
}: {
  history: GameHistoryEntry[]
  coins: number
  title?: string
  empty?: string
  onPlay?: () => void
}) {
  const pts = history.slice(-14)
  const W = 300
  const H = 116
  const PAD_X = 14
  const PAD_TOP = 10
  const PAD_BOTTOM = 22

  // walk backwards from the current balance to get the balance after each game
  const balances: number[] = new Array(pts.length)
  let bal = coins
  for (let i = pts.length - 1; i >= 0; i--) {
    balances[i] = bal
    bal -= pts[i].delta
  }
  const startBal = bal
  const all = pts.length > 0 ? [...balances, startBal] : [coins]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const span = Math.max(1, max - min)

  const x = (i: number) => (pts.length <= 1 ? W / 2 : PAD_X + (i / (pts.length - 1)) * (W - PAD_X * 2))
  const y = (v: number) => PAD_TOP + (1 - (v - min) / span) * (H - PAD_TOP - PAD_BOTTOM)

  const fmtT = (t: number) => {
    const d = new Date(t)
    const sameDay = new Date().toDateString() === d.toDateString()
    return sameDay
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { day: 'numeric', month: 'short' })
  }
  const fmtC = (v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`)

  return (
    <div className="ls-panel rounded-2xl p-3.5">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="ls-font text-xs text-amber-200">{title}</p>
        <span className="text-[9px] text-fuchsia-100/50">{history.length} recorded</span>
      </div>
      {pts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <span className="text-2xl" aria-hidden>🎲</span>
          <p className="max-w-[220px] text-center text-[11px] leading-relaxed text-fuchsia-100/50">{empty}</p>
          {onPlay && (
            <button
              onClick={onPlay}
              className="ls-btn ls-btn-gold ls-font mt-0.5 rounded-xl px-4 py-1.5 text-[11px] text-white"
            >
              PLAY NOW
            </button>
          )}
        </div>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Coin balance over recent games">
            <defs>
              <linearGradient id="hg-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgba(196,181,253,0.32)" />
                <stop offset="1" stopColor="rgba(196,181,253,0)" />
              </linearGradient>
            </defs>
            {/* soft area fill under the balance curve */}
            <polygon
              points={[
                ...balances.map((v, i) => `${x(i)},${y(v)}`),
                `${x(pts.length - 1)},${H - PAD_BOTTOM}`,
                `${x(0)},${H - PAD_BOTTOM}`,
              ].join(' ')}
              fill="url(#hg-area)"
            />
            {/* grid lines */}
            {[0.25, 0.5, 0.75].map((f) => {
              const gy = PAD_TOP + f * (H - PAD_TOP - PAD_BOTTOM)
              return <line key={f} x1={PAD_X} x2={W - PAD_X} y1={gy} y2={gy} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            })}
            {/* starting balance baseline */}
            <line
              x1={PAD_X}
              x2={W - PAD_X}
              y1={y(startBal)}
              y2={y(startBal)}
              stroke="rgba(246,196,83,0.4)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            {/* balance line */}
            <polyline
              points={balances.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
              fill="none"
              stroke="#c4b5fd"
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* dots: green win / red loss */}
            {balances.map((v, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(v)}
                r={pts[i].won ? 4 : 3}
                fill={pts[i].won ? '#34d399' : '#f87171'}
                stroke="rgba(10,6,30,0.7)"
                strokeWidth="1.2"
              />
            ))}
            {/* time labels: first & last */}
            <text x={PAD_X} y={H - 6} fill="rgba(243,232,255,0.6)" fontSize="9" textAnchor="start">
              {fmtT(pts[0].t)}
            </text>
            <text x={W - PAD_X} y={H - 6} fill="rgba(243,232,255,0.6)" fontSize="9" textAnchor="end">
              {fmtT(pts[pts.length - 1].t)}
            </text>
            {/* min/max value labels */}
            <text x={W - PAD_X} y={y(max) + 9} fill="rgba(255,224,138,0.85)" fontSize="9" textAnchor="end">
              {fmtC(max)}
            </text>
            <text x={W - PAD_X} y={y(min) - 3} fill="rgba(243,232,255,0.55)" fontSize="9" textAnchor="end">
              {fmtC(min)}
            </text>
          </svg>
          {/* W/L streak row */}
          <div className="mt-2 flex items-center gap-1.5 border-t border-white/10 pt-2">
            <span className="text-[9px] uppercase tracking-wide text-fuchsia-100/50">W/L</span>
            {pts.map((p, i) => (
              <span
                key={i}
                title={fmtT(p.t)}
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: p.won ? '#34d399' : '#f87171' }}
              />
            ))}
            <span className="ls-font ml-auto text-[10px] text-fuchsia-100/70">
              {pts.filter((p) => p.won).length}/{pts.length} won
            </span>
          </div>
        </>
      )}
    </div>
  )
}
