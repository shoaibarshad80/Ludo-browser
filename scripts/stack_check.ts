// Verify stacking fan geometry: no two pawn BASES visually overlap.
// Visible base width ≈ 0.49 × pawn box (svg base rx 15.6/64 of viewBox).
import { tokenScreenPos, stackPawnSize } from '../src/lib/ludo/board'

const BASE_W = 0.49
let fail = 0
for (const n of [2, 3, 4, 5] as const) {
  const w = stackPawnSize(n)
  const half = (BASE_W * w) / 2
  const pts = Array.from({ length: n }, (_, i) =>
    tokenScreenPos('red', i, 'track', 1, 0, i, n)
  )
  let min = Infinity
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      const dx = pts[a].x - pts[b].x
      const dy = pts[a].y - pts[b].y
      // percent of board → cell units (15 cells)
      const d = (Math.sqrt(dx * dx + dy * dy) / 100) * 15
      min = Math.min(min, d)
    }
  }
  const ok = min >= 2 * half
  if (!ok) fail++
  console.log(
    `n=${n} size=${w.toFixed(2)} minCenterDist=${min.toFixed(3)} needed=${(2 * half).toFixed(3)} ${ok ? 'OK' : 'OVERLAP'}`
  )
}
// home lane: two same-color pawns on one home cell (vertical lane, green)
const h = Array.from({ length: 2 }, (_, i) =>
  tokenScreenPos('green', i, 'home', 0, 3, i, 2)
)
const hd = (Math.hypot(h[0].x - h[1].x, h[0].y - h[1].y) / 100) * 15
const hw = stackPawnSize(2)
console.log(
  `home-pair dist=${hd.toFixed(3)} needed=${BASE_W * hw} ${hd >= BASE_W * hw ? 'OK' : 'OVERLAP'}`
)
process.exit(fail)
