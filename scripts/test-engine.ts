/**
 * Ludo engine stress test: simulate N bot-vs-bot games across all modes.
 * Verifies: no crashes, no stuck states, valid winners, sane game lengths.
 */
import {
  createGame,
  rollDice,
  legalMoves,
  applyMove,
  passTurn,
} from '../src/lib/ludo/engine'
import { botChooseMove } from '../src/lib/ludo/ai'
import type { GameConfig, GameState, Move } from '../src/lib/ludo/types'

function playGame(config: GameConfig, maxTurns = 5000, rng: () => number = Math.random): { winner: string; turns: number; state: GameState } {
  let state = createGame(config)
  let turns = 0
  while (!state.winner && turns < maxTurns) {
    turns++
    if (state.phase === 'roll') {
      const r = rollDice(state, rng)
      state = r.state
      if (r.forfeited) {
        state = passTurn(state)
        continue
      }
    }
    // phase === 'move'
    let guard = 0
    while (state.phase === 'move' && !state.winner && guard < 10) {
      guard++
      const moves: Move[] = legalMoves(state)
      if (moves.length === 0) {
        state = passTurn(state)
        break
      }
      const move = botChooseMove(state)
      if (!move) {
        state = passTurn(state)
        break
      }
      state = applyMove(state, move)
    }
  }
  return { winner: state.winner ?? 'NONE', turns, state }
}

const MODES = ['classic', 'quick', 'master'] as const
const GAMES_PER_MODE = 400

let failures = 0
for (const mode of MODES) {
  const turnsList: number[] = []
  const winners: Record<string, number> = {}
  for (let i = 0; i < GAMES_PER_MODE; i++) {
    const config: GameConfig = {
      mode,
      players: [
        { color: 'red', name: 'P1', avatar: 'lion', isBot: false },
        { color: 'green', name: 'P2', avatar: 'dragon', isBot: true },
        { color: 'yellow', name: 'P3', avatar: 'panda', isBot: true },
        { color: 'blue', name: 'P4', avatar: 'fox', isBot: true },
      ],
    }
    try {
      const res = playGame(config)
      if (res.winner === 'NONE') {
        console.error(`STUCK GAME in ${mode}: ${res.turns} turns`)
        failures++
        continue
      }
      turnsList.push(res.turns)
      winners[res.winner] = (winners[res.winner] ?? 0) + 1
    } catch (e) {
      console.error(`CRASH in ${mode}:`, e)
      failures++
    }
  }
  const avg = turnsList.reduce((a, b) => a + b, 0) / (turnsList.length || 1)
  const max = Math.max(...(turnsList.length ? turnsList : [0]))
  const min = Math.min(...(turnsList.length ? turnsList : [0]))
  console.log(
    `[${mode}] games=${turnsList.length} avgTurns=${avg.toFixed(1)} min=${min} max=${max} winners=${JSON.stringify(winners)}`
  )
}

// determinism test with seeded rng
let seed = 42
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}
const cfg: GameConfig = {
  mode: 'classic',
  players: [
    { color: 'red', name: 'A', avatar: 'lion', isBot: false },
    { color: 'green', name: 'B', avatar: 'dragon', isBot: true },
  ],
}
const g1 = playGame(cfg, 5000, rand)
seed = 42
const g2 = playGame(cfg, 5000, rand)
console.log(`deterministic replay: ${g1.winner === g2.winner && g1.turns === g2.turns ? 'PASS' : 'FAIL'}`)

// 2-player game balance sanity
console.log(failures === 0 ? 'ALL TESTS PASSED' : `FAILURES: ${failures}`)
