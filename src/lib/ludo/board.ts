// ============================================================
// Ludo Board Geometry
// 15x15 classic cross board, clockwise loop of 52 cells.
// Colors: red top-left, green top-right, yellow bottom-right,
// blue bottom-left (same arrangement as Ludo Star).
// ============================================================

import type { Color } from './types'

export const BOARD_SIZE = 15

export interface Cell {
  r: number
  c: number
}

/** The 52-cell clockwise main track. Index 0 = (6,0). */
export const TRACK: Cell[] = [
  // Q1: left arm top row -> top-left column -> top middle (idx 0-12)
  { r: 6, c: 0 }, { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
  { r: 0, c: 7 },
  // Q2: top-right column -> right arm top row -> right middle (idx 13-25)
  { r: 0, c: 8 }, { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
  { r: 7, c: 14 },
  // Q3: right arm bottom row -> bottom-right column -> bottom middle (idx 26-38)
  { r: 8, c: 14 }, { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
  { r: 14, c: 7 },
  // Q4: bottom-left column -> left arm bottom row -> left middle (idx 39-51)
  { r: 14, c: 6 }, { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
  { r: 7, c: 0 },
]

export const PLAYERS_ORDER: Color[] = ['red', 'green', 'yellow', 'blue']

/** Absolute loop index of each color's start cell. Evenly spaced by 13. */
export const START_IDX: Record<Color, number> = {
  red: 1,    // (6,1)
  green: 14, // (1,8)
  yellow: 27, // (8,13)
  blue: 40,  // (13,6)
}

/** Star (safe) cells: exactly 8 steps ahead of each start. */
export const STAR_IDX: number[] = [9, 22, 35, 48]

export const SAFE_IDX: Set<number> = new Set([...Object.values(START_IDX), ...STAR_IDX])

/** Last track cell of each color before entering its home column. */
export const LAST_TRACK_IDX: Record<Color, number> = {
  red: 51,    // (7,0)
  green: 12,  // (0,7)
  yellow: 25, // (7,14)
  blue: 38,   // (14,7)
}

/** Home column cells (5) per color, in travel order. */
export const HOME_PATH: Record<Color, Cell[]> = {
  red: [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }],
  green: [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }],
  yellow: [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }],
  blue: [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }],
}

/** Total pips needed from start cell to finish: 50 track + 5 home = 55 steps, finish at 56. */
export const FINISH_PROGRESS = 56

/** Yard base positions (top-left corner cell of the 6x6 yard) per color. */
export const YARD_BASE: Record<Color, Cell> = {
  red: { r: 0, c: 0 },
  green: { r: 0, c: 9 },
  yellow: { r: 9, c: 9 },
  blue: { r: 9, c: 0 },
}

/** Token resting slots inside each yard (cell centers, cell units). */
export const YARD_SLOTS: Array<{ r: number; c: number }> = [
  { r: 1.6, c: 1.6 },
  { r: 1.6, c: 3.4 },
  { r: 3.4, c: 1.6 },
  { r: 3.4, c: 3.4 },
]

/** Finished-token slots inside the center triangle per color (cell units). */
export const FINISH_SLOTS: Record<Color, Array<{ r: number; c: number }>> = {
  red: [
    { r: 7.5, c: 6.42 }, { r: 6.9, c: 6.75 }, { r: 8.1, c: 6.75 }, { r: 7.5, c: 6.95 },
  ],
  green: [
    { r: 6.42, c: 7.5 }, { r: 6.75, c: 6.9 }, { r: 6.75, c: 8.1 }, { r: 6.95, c: 7.5 },
  ],
  yellow: [
    { r: 7.5, c: 8.58 }, { r: 6.9, c: 8.25 }, { r: 8.1, c: 8.25 }, { r: 6.95, c: 7.5 },
  ].reverse(),
  blue: [
    { r: 8.58, c: 7.5 }, { r: 8.25, c: 6.9 }, { r: 8.25, c: 8.1 }, { r: 7.5, c: 7.05 },
  ].reverse(),
}

/**
 * Visual pawn size (cell units) for a cell holding `n` stacked tokens.
 * Fewer tokens → full-size pawns; crowded cells shrink every pawn so
 * the fan stays readable and nothing hides its neighbours.
 */
export function stackPawnSize(n: number): number {
  if (n >= 5) return 0.55
  if (n === 4) return 0.7
  if (n === 3) return 0.78
  if (n === 2) return 0.9
  return 1.06
}

/**
 * Direction of travel on the cell a stack occupies: 'h' = lane runs
 * left→right, 'v' = lane runs top→bottom. Stacks fan out ALONG the
 * lane (pairs stand side-by-side, exactly like Ludo Star).
 */
function laneAxis(location: string, color: Color, trackIdx: number, homeStep: number): 'h' | 'v' {
  if (location === 'home') {
    return color === 'red' || color === 'yellow' ? 'h' : 'v'
  }
  const idx = ((trackIdx % 52) + 52) % 52
  const prev = TRACK[(idx + 51) % 52]
  const cur = TRACK[idx]
  return prev.r === cur.r ? 'h' : 'v'
}

/** Convert a track index into the absolute index for a color. */
export function trackIdxFor(color: Color, progressFromStart: number): number {
  return (START_IDX[color] + progressFromStart) % 52
}

/** Screen position (percent of board) for a token given its location. */
export function tokenScreenPos(
  color: Color,
  tokenId: number,
  location: string,
  trackIdx: number,
  homeStep: number,
  /** index of this token within tokens sharing the cell (-1 if not stacked) */
  stackIndex: number = -1,
  /** how many tokens share the cell */
  stackSize: number = 1
): { x: number; y: number } {
  let pos: { r: number; c: number }
  if (location === 'yard') {
    const base = YARD_BASE[color]
    const slot = YARD_SLOTS[tokenId % 4]
    pos = { r: base.r + slot.r, c: base.c + slot.c }
  } else if (location === 'track') {
    const cell = TRACK[trackIdx]
    pos = { r: cell.r + 0.5, c: cell.c + 0.5 }
  } else if (location === 'home') {
    const cell = HOME_PATH[color][Math.min(homeStep, 5) - 1]
    pos = { r: cell.r + 0.5, c: cell.c + 0.5 }
  } else {
    const slots = FINISH_SLOTS[color]
    const slot = slots[tokenId % slots.length]
    pos = slot
  }
  // stacking offset: fan tokens sharing one cell ALONG the lane so
  // every pawn keeps clear space around it (Ludo Star pairing).
  //   2 → side-by-side pair   3 → triangle   4 → 2x2 grid   5+ → ring
  if (stackSize > 1 && (location === 'track' || location === 'home')) {
    const i = Math.max(0, stackIndex)
    const n = stackSize
    const axis = laneAxis(location, color, trackIdx, homeStep)
    // unit offsets in (primary=lane direction, secondary=cross direction)
    let dp = 0
    let ds = 0
    if (n === 2) {
      dp = i === 0 ? -0.23 : 0.23
    } else if (n === 3) {
      // triangle: two along the lane, one centered behind
      if (i === 0) dp = -0.27
      else if (i === 1) dp = 0.27
      else ds = 0.29
    } else if (n === 4) {
      const x = i % 2
      const y = i < 2 ? 0 : 1
      dp = x === 0 ? -0.19 : 0.19
      ds = y === 0 ? -0.19 : 0.19
    } else {
      const angle = (i / n) * Math.PI * 2
      dp = 0.3 * Math.cos(angle)
      ds = 0.3 * Math.sin(angle)
    }
    pos =
      axis === 'h'
        ? { r: pos.r + ds, c: pos.c + dp }
        : { r: pos.r + dp, c: pos.c + ds }
  }
  return {
    x: ((pos.c + 0) / BOARD_SIZE) * 100,
    y: ((pos.r + 0) / BOARD_SIZE) * 100,
  }
}

export const COLOR_HEX: Record<Color, { main: string; dark: string; light: string; glow: string }> = {
  red: { main: '#e5453c', dark: '#a5231d', light: '#ff9d92', glow: 'rgba(229,69,60,0.6)' },
  green: { main: '#46a848', dark: '#2b6e2f', light: '#a4dd9f', glow: 'rgba(70,168,72,0.6)' },
  yellow: { main: '#f7c331', dark: '#b7850f', light: '#ffefad', glow: 'rgba(247,195,49,0.6)' },
  blue: { main: '#2a8ee0', dark: '#155a9c', light: '#9ecdf7', glow: 'rgba(42,142,224,0.6)' },
}
