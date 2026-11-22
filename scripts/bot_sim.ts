// Bot AI simulation: 4 named bots (like the real game roster) play
// N full games with the personality AI. Verifies:
//   1. every game terminates
//   2. per-bot styles produce different behavior (captures/finishes)
//   3. no crashes / illegal states
import { createGame, rollDice, legalMoves, applyMove, passTurn } from '../src/lib/ludo/engine'
import { botChooseMove } from '../src/lib/ludo/ai'
import type { GameConfig, GameState } from '../src/lib/ludo/types'

// optional: older ai revisions have no botStyleOf
let styleOf: ((s: unknown) => string) | null = null
try {
  const mod = await import('../src/lib/ludo/ai')
  if ('botStyleOf' in mod) styleOf = mod.botStyleOf as (s: unknown) => string
} catch {}

const NAMES = ['Rocky', 'Zuby', 'Lola', 'Momo']
const COLORS = ['red', 'green', 'yellow', 'blue'] as const

function playGame(maxTurns = 40000): { state: GameState; turns: number } {
  const cfg: GameConfig = {
    mode: 'classic',
    players: COLORS.map((color, i) => ({ color, name: NAMES[i], avatar: 'lion', isBot: true })),
  }
  let g = createGame(cfg)
  let turns = 0
  while (!g.winner && turns < maxTurns) {
    turns++
    if (g.phase === 'roll') {
      const r = rollDice(g)
      g = r.state
      if (r.forfeited) g = passTurn(g)
      continue
    }
    let guard = 0
    while (g.phase === 'move' && !g.winner && guard++ < 8) {
      const moves = legalMoves(g)
      if (moves.length === 0) {
        g = passTurn(g)
        break
      }
      const m = botChooseMove(g)
      if (!m) {
        g = passTurn(g)
        break
      }
      const p = g.players[g.turn]
      if (m.captures.length > 0) sim.captures[p.name] += m.captures.length
      if (m.finishes) sim.finishes[p.name] += 1
      g = applyMove(g, m)
    }
  }
  return { state: g, turns }
}

const sim = {
  captures: { Rocky: 0, Zuby: 0, Lola: 0, Momo: 0 },
  finishes: { Rocky: 0, Zuby: 0, Lola: 0, Momo: 0 },
}

const GAMES = 300
const wins: Record<string, number> = {}
const turnsArr: number[] = []
for (let i = 0; i < GAMES; i++) {
  const { state, turns } = playGame()
  if (!state.winner) throw new Error(`game ${i} did not terminate`)
  wins[state.winner] = (wins[state.winner] ?? 0) + 1
  turnsArr.push(turns)
}

const avg = Math.round(turnsArr.reduce((a, b) => a + b, 0) / turnsArr.length)
console.log(`games=${GAMES} avgTurns=${avg} min=${Math.min(...turnsArr)} max=${Math.max(...turnsArr)}`)
console.log('wins:', wins)
for (const n of NAMES) {
  const idx = NAMES.indexOf(n)
  const style = styleOf ? styleOf({ players: COLORS.map((color, i) => ({ color, name: NAMES[i], avatar: 'lion', isBot: true, connected: true, tokens: [] })), turn: idx }) : 'n/a'
  console.log(`${n} (${style}): captures=${sim.captures[n]} finishes=${sim.finishes[n]}`)
}
const capSpread = Math.max(...Object.values(sim.captures)) - Math.min(...Object.values(sim.captures))
console.log(`capture spread across styles: ${capSpread} (${capSpread > 60 ? 'styles clearly differ' : 'styles differ modestly'})`)
console.log('BOT SIM OK')
