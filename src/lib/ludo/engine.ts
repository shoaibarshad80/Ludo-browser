// ============================================================
// Ludo Game Engine - Pure TypeScript, no dependencies.
// Same code runs on: web client, socket server, bots,
// and later the Expo mobile app.
// ============================================================

import type {
  GameConfig,
  GameState,
  Move,
  Player,
  Token,
} from './types'
import {
  FINISH_PROGRESS,
  SAFE_IDX,
  START_IDX,
  trackIdxFor,
} from './board'

export const DICE_MIN = 1
export const DICE_MAX = 6

// ---------- setup ----------

function makeTokens(count: number, color: Token['color']): Token[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    color,
    location: 'yard' as const,
    trackIdx: -1,
    homeStep: 0,
    progress: 0,
  }))
}

export function tokensPerPlayerFor(mode: GameState['mode']): number {
  return mode === 'quick' ? 2 : 4
}

export function createGame(config: GameConfig): GameState {
  const tpp = tokensPerPlayerFor(config.mode)
  const players: Player[] = config.players.map((p) => ({
    color: p.color,
    name: p.name,
    avatar: p.avatar,
    isBot: p.isBot,
    connected: true,
    tokens: makeTokens(tpp, p.color),
  }))
  return {
    players,
    turn: 0,
    dice: [],
    usedDice: [],
    phase: 'roll',
    sixStreak: 0,
    lastRoll: [],
    rollCaptured: false,
    rollFinished: false,
    forfeited: false,
    winner: null,
    mode: config.mode,
    tokensPerPlayer: tpp,
    movesThisTurn: 0,
    version: 1,
  }
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      tokens: p.tokens.map((t) => ({ ...t })),
    })),
    dice: [...state.dice],
    usedDice: [...state.usedDice],
    lastRoll: [...state.lastRoll],
  }
}

export function currentPlayer(state: GameState): Player {
  return state.players[state.turn]
}

/** Numeric progress: -1 yard, 0..50 track, 51..55 home lane, 56 finished. */
export function tokenProgress(t: Token): number {
  if (t.location === 'yard') return -1
  if (t.location === 'finished') return FINISH_PROGRESS
  if (t.location === 'home') return 50 + t.homeStep
  return t.progress
}

function progressOf(loc: Move['from'], playerColor: Token['color']): number {
  void playerColor
  switch (loc.location) {
    case 'yard':
      return 0
    case 'home':
      return 50 + loc.homeStep
    case 'finished':
      return FINISH_PROGRESS
    default:
      return progressFromTrackIdx(playerColor, loc.trackIdx)
  }
}

function progressFromTrackIdx(color: Token['color'], trackIdx: number): number {
  // invert trackIdxFor: progress such that (START + progress) % 52 === trackIdx
  const start = START_IDX[color]
  return (trackIdx - start + 52) % 52
}

function computeTarget(color: Token['color'], die: number, t: Token) {
  const from = t.location === 'yard' ? 0 : tokenProgress(t)
  const to = from + die
  if (t.location !== 'yard' && to > FINISH_PROGRESS) return null // exact roll to finish
  if (to <= 50) {
    return { location: 'track' as const, trackIdx: trackIdxFor(color, to), homeStep: 0, progress: to }
  }
  if (to === FINISH_PROGRESS) {
    return { location: 'finished' as const, trackIdx: -1, homeStep: 0, progress: to }
  }
  return { location: 'home' as const, trackIdx: -1, homeStep: to - 50, progress: to }
}

// ---------- legal moves ----------

export function legalMovesForDie(state: GameState, dieIndex: number): Move[] {
  const moves: Move[] = []
  if (state.usedDice.includes(dieIndex)) return moves
  const die = state.dice[dieIndex]
  if (!die) return moves
  const player = currentPlayer(state)

  for (const t of player.tokens) {
    if (t.location === 'finished') continue

    if (t.location === 'yard') {
      if (die !== 6) continue // need a six to open
      const startIdx = START_IDX[player.color]
      // an opponent's locked pair sitting on my start cell blocks the entry
      const entryBlocker = blockColorAt(state, startIdx)
      if (entryBlocker && entryBlocker !== player.color) continue
      const captures = capturesAt(state, player.color, startIdx)
      moves.push({
        tokenId: t.id,
        dieIndex,
        from: { location: t.location, trackIdx: t.trackIdx, homeStep: t.homeStep },
        to: { location: 'track', trackIdx: startIdx, homeStep: 0 },
        captures,
        opens: true,
        finishes: false,
        entersHome: false,
        landsSafe: true,
      })
      continue
    }

    const target = computeTarget(player.color, die, t)
    if (!target) continue
    // opponents' locked pairs cannot be landed on or passed through
    if (pathBlockedByPair(state, player.color, tokenProgress(t), target.progress)) continue
    const captures = target.location === 'track' ? capturesAt(state, player.color, target.trackIdx) : []
    const landsSafe = target.location !== 'track' || SAFE_IDX.has(target.trackIdx)
    moves.push({
      tokenId: t.id,
      dieIndex,
      from: { location: t.location, trackIdx: t.trackIdx, homeStep: t.homeStep },
      to: { location: target.location, trackIdx: target.trackIdx, homeStep: target.homeStep },
      captures,
      opens: false,
      finishes: target.location === 'finished',
      entersHome: target.location === 'home',
      landsSafe,
    })
  }
  return moves
}

/** Opponent tokens sitting on a track cell. Safe cells protect everyone. */
function capturesAt(state: GameState, moverColor: Token['color'], trackIdx: number): number[] {
  if (SAFE_IDX.has(trackIdx)) return []
  const captured: number[] = []
  for (const p of state.players) {
    if (p.color === moverColor) continue
    for (const t of p.tokens) {
      if (t.location === 'track' && t.trackIdx === trackIdx) captured.push(t.id)
    }
  }
  return captured
}

// ---------- locked pairs (blocks) ----------

/**
 * Classic Ludo "block": 2+ tokens of ONE color sharing a track cell form
 * a LOCKED PAIR. Opponents may neither land on it nor pass through it;
 * the owning color moves across its own pair freely.
 * Returns the owning color, or null when the cell is not locked.
 */
export function blockColorAt(state: GameState, trackIdx: number): Token['color'] | null {
  if (trackIdx < 0 || trackIdx > 51) return null
  for (const p of state.players) {
    let n = 0
    for (const t of p.tokens) {
      if (t.location === 'track' && t.trackIdx === trackIdx) n++
    }
    if (n >= 2) return p.color
  }
  return null
}

/**
 * True when the mover's path (each track cell of progress from+1 .. min(to,50))
 * crosses a cell locked by an OPPONENT pair — landing on a locked cell is
 * also blocked. Own-color locks never block the mover.
 */
function pathBlockedByPair(
  state: GameState,
  moverColor: Token['color'],
  fromProgress: number,
  toProgress: number
): boolean {
  const last = Math.min(toProgress, 50)
  for (let p = fromProgress + 1; p <= last; p++) {
    const idx = trackIdxFor(moverColor, p)
    const blocker = blockColorAt(state, idx)
    if (blocker && blocker !== moverColor) return true
  }
  return false
}

export function legalMoves(state: GameState): Move[] {
  const all: Move[] = []
  for (let i = 0; i < state.dice.length; i++) {
    if (state.usedDice.includes(i)) continue
    all.push(...legalMovesForDie(state, i))
  }
  return all
}

// ---------- dice ----------

export function rollDice(
  state: GameState,
  rand: () => number = Math.random
): { state: GameState; rolled: number[]; forfeited: boolean } {
  const s = cloneState(state)

  if (s.mode === 'master') {
    const d1 = DICE_MIN + Math.floor(rand() * 6)
    const d2 = DICE_MIN + Math.floor(rand() * 6)
    s.dice = [d1, d2]
    s.lastRoll = [d1, d2]
    s.usedDice = []
    s.rollCaptured = false
    s.rollFinished = false
    s.forfeited = false
    s.movesThisTurn = 0
    s.phase = 'move'
    s.version += 1
    return { state: s, rolled: [d1, d2], forfeited: false }
  }

  const die = DICE_MIN + Math.floor(rand() * 6)
  s.dice = [die]
  s.lastRoll = [die]
  s.usedDice = []
  s.rollCaptured = false
  s.rollFinished = false
  s.movesThisTurn = 0
  s.phase = 'move'

  let forfeited = false
  if (die === 6) {
    s.sixStreak += 1
    if (s.sixStreak >= 3) {
      s.forfeited = true
      forfeited = true
    }
  } else {
    s.sixStreak = 0
  }
  s.version += 1
  return { state: s, rolled: [die], forfeited }
}

// ---------- applying moves ----------

export function applyMove(state: GameState, move: Move): GameState {
  const s = cloneState(state)
  const player = s.players[s.turn]
  const token = player.tokens[move.tokenId]
  const die = s.dice[move.dieIndex]

  token.location = move.to.location
  token.trackIdx = move.to.trackIdx
  token.homeStep = move.to.homeStep
  token.progress = progressOf(move.to, player.color)

  // captures
  if (move.captures.length > 0 && move.to.location === 'track') {
    s.rollCaptured = true
    for (const p of s.players) {
      if (p.color === player.color) continue
      for (const t of p.tokens) {
        if (
          t.location === 'track' &&
          t.trackIdx === move.to.trackIdx &&
          move.captures.includes(t.id)
        ) {
          t.location = 'yard'
          t.trackIdx = -1
          t.homeStep = 0
          t.progress = 0
        }
      }
    }
  }

  if (move.finishes) s.rollFinished = true

  s.usedDice.push(move.dieIndex)
  s.movesThisTurn += 1

  // winner?
  const allFinished = player.tokens.every((t) => t.location === 'finished')
  if (allFinished) {
    s.winner = player.color
    s.phase = 'gameover'
    s.version += 1
    return s
  }

  // more dice to use (master mode)?
  const hasUnusedDie = s.dice.some((_, i) => !s.usedDice.includes(i))
  if (hasUnusedDie) {
    const remaining = legalMoves(s)
    if (remaining.length > 0) {
      s.version += 1
      return s
    }
  }

  return endTurn(s, die)
}

function endTurn(s: GameState, lastDie: number): GameState {
  let extra = false
  if (s.mode === 'master') {
    const [d1, d2] = s.lastRoll
    extra = d1 === d2 || s.rollCaptured || s.rollFinished
  } else {
    extra = lastDie === 6 || s.rollCaptured || s.rollFinished
  }

  if (extra && !s.winner) {
    s.phase = 'roll'
    s.dice = []
    s.usedDice = []
    s.rollCaptured = false
    s.rollFinished = false
    s.movesThisTurn = 0
    s.forfeited = false
    s.version += 1
    return s
  }
  return passTurn(s)
}

/** Advance to the next player with unfinished tokens. */
export function passTurn(state: GameState): GameState {
  const s = cloneState(state)
  s.sixStreak = 0
  s.dice = []
  s.usedDice = []
  s.rollCaptured = false
  s.rollFinished = false
  s.forfeited = false
  s.movesThisTurn = 0
  s.turn = nextAliveIdx(s, s.turn)
  s.phase = 'roll'
  s.version += 1
  return s
}

function nextAliveIdx(s: GameState, from: number): number {
  for (let i = 1; i <= s.players.length; i++) {
    const idx = (from + i) % s.players.length
    if (!s.players[idx].tokens.every((t) => t.location === 'finished')) return idx
  }
  return from
}

export function isPlayerDone(state: GameState, idx: number): boolean {
  return state.players[idx].tokens.every((t) => t.location === 'finished')
}
