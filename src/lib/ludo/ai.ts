// ============================================================
// Ludo AI Bot — Ludo Star "Computer" style with PERSONALITIES.
// Every bot hashes its own name into a stable play style, so
// different bots genuinely play differently across games:
//   aggressive — hunts captures, builds threats
//   defensive  — hugs safe cells, opens fast, avoids risk
//   runner     — races its leading tokens home
//   balanced   — middle ground with a bit of spice
// Priorities (weighted per style): finish > capture > escape
// danger (scaled by progress) > open > threat > safe > progress
// ============================================================

import type { GameState, Move, Token } from './types'
import { legalMoves, tokenProgress } from './engine'
import { SAFE_IDX, START_IDX } from './board'

export type BotStyle = 'aggressive' | 'defensive' | 'runner' | 'balanced'

/** per-style decision weights (tuned so styles feel distinct) */
const STYLE_W: Record<BotStyle, {
  capture: number; threat: number; escape: number; safe: number;
  open: number; finish: number; enterHome: number; progress: number;
  danger: number; stuck: number; jitter: number
}> = {
  aggressive: { capture: 96, threat: 26, escape: 10, safe: 8,  open: 52, finish: 128, enterHome: 26, progress: 3, danger: 15, stuck: 30, jitter: 16 },
  defensive:  { capture: 58, threat: 7,  escape: 24, safe: 28, open: 84, finish: 118, enterHome: 42, progress: 2, danger: 32, stuck: 34, jitter: 7 },
  runner:     { capture: 54, threat: 10, escape: 15, safe: 12, open: 44, finish: 148, enterHome: 38, progress: 9, danger: 18, stuck: 26, jitter: 10 },
  balanced:   { capture: 74, threat: 15, escape: 17, safe: 17, open: 66, finish: 124, enterHome: 34, progress: 5, danger: 23, stuck: 30, jitter: 10 },
}

/** stable per-bot style: hashed from the player's display name */
function styleFor(state: GameState): BotStyle {
  const name = (state.players[state.turn]?.name ?? '').toLowerCase()
  let h = 2166136261
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  const styles: BotStyle[] = ['aggressive', 'defensive', 'runner', 'balanced']
  return styles[h % styles.length]
}

/**
 * How exposed is a cell to being captured? Counts enemy tokens that
 * can reach `trackIdx` within 1..6 steps from behind.
 */
function dangerAt(state: GameState, color: Token['color'], trackIdx: number): number {
  if (SAFE_IDX.has(trackIdx)) return 0
  let danger = 0
  for (const p of state.players) {
    if (p.color === color) continue
    for (const t of p.tokens) {
      if (t.location !== 'track') continue
      const start = START_IDX[p.color]
      const myProgress = (trackIdx - start + 52) % 52 // if enemy stood on this cell
      for (let d = 1; d <= 6; d++) {
        const from = (myProgress - d + 52) % 52
        const enemyProgress = (t.trackIdx - start + 52) % 52
        if (enemyProgress === from) {
          danger += 1
          break
        }
      }
    }
  }
  return danger
}

/**
 * Threat creation: how many enemy tokens could THIS bot capture from
 * its landing cell within the next 1..6 pips (pure aggression score)?
 * Only counts reachable cells on the open track (not past the home
 * turn-off) and never safe cells.
 */
function threatsFrom(state: GameState, color: Token['color'], trackIdx: number): number {
  if (SAFE_IDX.has(trackIdx)) return 0
  const start = START_IDX[color]
  const landProgress = (trackIdx - start + 52) % 52
  let threat = 0
  for (const p of state.players) {
    if (p.color === color) continue
    for (const t of p.tokens) {
      if (t.location !== 'track' || SAFE_IDX.has(t.trackIdx)) continue
      // their cell measured along MY loop
      const cellForMe = (t.trackIdx - start + 52) % 52
      const gap = (cellForMe - landProgress + 52) % 52
      if (gap >= 1 && gap <= 6 && landProgress + gap <= 50) threat += 1
    }
  }
  return threat
}

function moveScore(state: GameState, move: Move): number {
  const player = state.players[state.turn]
  const w = STYLE_W[styleFor(state)]
  let score = 0

  // 1. finishing a token is huge
  if (move.finishes) score += w.finish

  // 2. capturing: value the victim by how far it had traveled
  if (move.captures.length > 0) {
    for (const p of state.players) {
      if (p.color === player.color) continue
      for (const t of p.tokens) {
        if (t.location === 'track' && move.captures.includes(t.id)) {
          score += w.capture + t.progress * 0.55
        }
      }
    }
  }

  // 3. opening a new token when few are on the board
  if (move.opens) {
    const onBoard = player.tokens.filter((t) => t.location === 'track' || t.location === 'home').length
    score += w.open * (onBoard === 0 ? 1 : onBoard === 1 ? 0.62 : onBoard === 2 ? 0.3 : 0.1)
  }

  // 4. entering the home lane (safety + closeness to done)
  if (move.entersHome) score += w.enterHome

  // 5. escaping danger — worth more the further this token has traveled
  if (move.from.location === 'track') {
    const fromDanger = dangerAt(state, player.color, move.from.trackIdx)
    const prog = move.from.trackIdx >= 0 ? ((move.from.trackIdx - START_IDX[player.color] + 52) % 52) : 0
    score += fromDanger * w.escape * (0.55 + (prog / 50) * 0.9)
  }

  // 6. landing on a safe cell
  if (move.landsSafe && move.to.location === 'track') score += w.safe

  // 7. avoid landing in danger (recapture risk after a capture too)
  if (move.to.location === 'track') {
    const toDanger = dangerAt(state, player.color, move.to.trackIdx)
    score -= toDanger * w.danger
    // 8. aggression: create capture threats for NEXT roll
    score += threatsFrom(state, player.color, move.to.trackIdx) * w.threat
  }

  // 9. prefer advancing the leading token, small bonus for progress
  if (move.to.location === 'track' || move.entersHome) {
    score += move.to.location === 'home' ? move.to.homeStep * w.progress * 1.4 : w.progress
  }

  // 10. unstick yard-heavy bots: penalty for staying crowded in yard
  if (move.opens) {
    const inYard = player.tokens.filter((t) => t.location === 'yard').length
    score += (4 - inYard) * w.stuck * 0.12
  }

  // 11. personality jitter — same board, different bots, different choices
  score += Math.random() * w.jitter

  return score
}

/** Pick the best move for the current player (assumes phase === 'move'). */
export function botChooseMove(state: GameState): Move | null {
  const moves = legalMoves(state)
  if (moves.length === 0) return null

  // group by die so master mode uses both dice naturally
  let best: Move | null = null
  let bestScore = -Infinity
  for (const m of moves) {
    const s = moveScore(state, m)
    if (s > bestScore) {
      bestScore = s
      best = m
    }
  }
  return best
}

/** Path cells (loop indices) a color still has to walk — used for hints. */
export function remainingSteps(state: GameState, color: Token['color']): number {
  const p = state.players.find((pl) => pl.color === color)
  if (!p) return 0
  let total = 0
  for (const t of p.tokens) {
    const prog = tokenProgress(t)
    total += prog < 0 ? 63 : 56 - prog
  }
  return total
}

/** Expose the current bot's style (debug/hint UIs). */
export function botStyleOf(state: GameState): BotStyle {
  return styleFor(state)
}
