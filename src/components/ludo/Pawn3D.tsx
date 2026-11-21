'use client'

// ============================================================
// Pawn3D — premium 3D ludo pawn pieces (Ludo Star quality).
// Classic pawn silhouette: wide beveled circular base, curved
// body flaring from a narrow neck, glossy dome head, gold crown
// emblem. Gem materials per color:
//   red    → ruby crystal     green → emerald crystal
//   blue   → sapphire crystal yellow → polished gold
// Layered SVG gradients fake the 3D shading: cylindrical body
// gradient, domed head radial, beveled base, facet overlays,
// specular highlights, soft ground shadow. Same props/behavior
// as the previous flat token (glow ring + tappable bob kept).
// ============================================================

import { motion } from 'framer-motion'
import type { Color } from '@/lib/ludo/types'
import { COLOR_HEX } from '@/lib/ludo/board'

interface Skin {
  /** head dome: highlight → light → main → deep */
  head: [string, string, string, string]
  /** cylindrical body (horizontal bands, left→right) */
  body: Array<[number, string]>
  /** base top surface: center light → rim dark */
  baseTop: [string, string, string]
  /** base side wall: bottom → mid → top */
  baseSide: [string, string, string]
  /** true = metallic gold (banded speculars), false = crystal (facets) */
  metal: boolean
}

const SKIN: Record<Color, Skin> = {
  red: {
    head: ['#ffc9c0', '#ff8f80', '#e5453c', '#6e0e09'],
    body: [
      [0, '#5e0b06'], [0.16, '#e5453c'], [0.4, '#ff9d8e'],
      [0.58, '#f06a5c'], [0.84, '#a5231d'], [1, '#4a0703'],
    ],
    baseTop: ['#ff9d8e', '#e5453c', '#8c1a14'],
    baseSide: ['#4a0703', '#b02820', '#e5453c'],
    metal: false,
  },
  green: {
    head: ['#d2f8d4', '#8fe89a', '#3ba848', '#0b4a1c'],
    body: [
      [0, '#083a17'], [0.16, '#3ba848'], [0.4, '#9fe8a4'],
      [0.58, '#5cc266'], [0.84, '#2b6e2f'], [1, '#052d10'],
    ],
    baseTop: ['#9fe8a4', '#3ba848', '#1e5e26'],
    baseSide: ['#052d10', '#2b6e2f', '#3ba848'],
    metal: false,
  },
  blue: {
    head: ['#d6ecff', '#8cc8ff', '#2a8ee0', '#083a68'],
    body: [
      [0, '#052c50'], [0.16, '#2a8ee0'], [0.4, '#a5d2ff'],
      [0.58, '#4fa5ec'], [0.84, '#155a9c'], [1, '#032138'],
    ],
    baseTop: ['#a5d2ff', '#2a8ee0', '#124a80'],
    baseSide: ['#032138', '#155a9c', '#2a8ee0'],
    metal: false,
  },
  yellow: {
    head: ['#fff8d8', '#ffe08a', '#f2b52e', '#7c520a'],
    body: [
      [0, '#6b4408'], [0.15, '#f7cf6b'], [0.3, '#fff3c0'],
      [0.46, '#e9a92c'], [0.62, '#ffe08a'], [0.82, '#b97f14'], [1, '#593904'],
    ],
    baseTop: ['#ffe08a', '#f2b52e', '#a36d07'],
    baseSide: ['#593904', '#c98a12', '#f2b52e'],
    metal: true,
  },
}

const GOLD_CROWN: Array<[number, string]> = [
  [0, '#fff6c9'], [0.45, '#f6c453'], [1, '#c98a12'],
]

export interface PawnProps {
  color: Color
  /** glowing ring = this token may move now (turn player only) */
  glow: boolean
  /** tappable on this device (implies glow) */
  tap: boolean
  onClick: () => void
  tokenId: number
  uid: string
}

export default function Pawn3D({ color, glow, tap, onClick, tokenId, uid }: PawnProps) {
  const c = COLOR_HEX[color]
  const s = SKIN[color]
  const g = (name: string) => `${name}-${uid}`

  const svg = (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id={g('sh')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(6,8,24,0.55)" />
          <stop offset="0.7" stopColor="rgba(6,8,24,0.28)" />
          <stop offset="1" stopColor="rgba(6,8,24,0)" />
        </radialGradient>
        {/* colored contact halo — makes the pawn pop on any cell */}
        <radialGradient id={g('halo')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={c.main} stopOpacity="0.40" />
          <stop offset="0.62" stopColor={c.main} stopOpacity="0.16" />
          <stop offset="1" stopColor={c.main} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g('body')} x1="0" y1="0" x2="1" y2="0">
          {s.body.map(([o, col], i) => (
            <stop key={i} offset={o} stopColor={col} />
          ))}
        </linearGradient>
        <radialGradient id={g('head')} cx="0.34" cy="0.26" r="1.1">
          <stop offset="0" stopColor={s.head[0]} />
          <stop offset="0.42" stopColor={s.head[1]} />
          <stop offset="0.78" stopColor={s.head[2]} />
          <stop offset="1" stopColor={s.head[3]} />
        </radialGradient>
        <radialGradient id={g('btop')} cx="0.38" cy="0.36" r="0.85">
          <stop offset="0" stopColor={s.baseTop[0]} />
          <stop offset="0.62" stopColor={s.baseTop[1]} />
          <stop offset="1" stopColor={s.baseTop[2]} />
        </radialGradient>
        <linearGradient id={g('bside')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s.baseSide[2]} />
          <stop offset="0.55" stopColor={s.baseSide[1]} />
          <stop offset="1" stopColor={s.baseSide[0]} />
        </linearGradient>
        <linearGradient id={g('crown')} x1="0" y1="0" x2="0" y2="1">
          {GOLD_CROWN.map(([o, col], i) => (
            <stop key={i} offset={o} stopColor={col} />
          ))}
        </linearGradient>
      </defs>

      {/* colored glow halo + soft ground shadow */}
      <ellipse cx="32" cy="53.2" rx="19.5" ry="6.6" fill={`url(#${g('halo')})`} />
      <ellipse cx="32" cy="56.6" rx="16.5" ry="4.6" fill={`url(#${g('sh')})`} />

      {/* --- wide circular base (beveled, 3D) --- */}
      {/* bottom rim */}
      <ellipse cx="32" cy="49.6" rx="15.6" ry="5.4" fill={s.baseSide[0]} />
      {/* side wall */}
      <path
        d="M 16.4 45.6 L 16.4 48.6 A 15.6 5.4 0 0 0 47.6 48.6 L 47.6 45.6 A 15.6 5.4 0 0 1 16.4 45.6 Z"
        fill={`url(#${g('bside')})`}
      />
      {/* top surface */}
      <ellipse cx="32" cy="45.6" rx="15.6" ry="5.4" fill={`url(#${g('btop')})`} />
      {/* engraved inner ring on the base plate */}
      <ellipse cx="32" cy="45.6" rx="11.6" ry="3.9" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
      <ellipse cx="32" cy="45.3" rx="11.6" ry="3.9" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="0.8" />
      {/* front bevel light */}
      <path
        d="M 19 47.9 A 13.6 4.4 0 0 0 45 47.9"
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* back rim light */}
      <path
        d="M 20 44 A 13.4 4.6 0 0 1 44 44"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* --- curved body: narrow neck flaring into the base --- */}
      <path
        d="M 20.6 46.4
           C 22.4 40.6, 26.4 36.4, 27.7 29.2
           C 28.2 26.6, 28.5 24.2, 28.8 22
           L 35.2 22
           C 35.5 24.2, 35.8 26.6, 36.3 29.2
           C 37.6 36.4, 41.6 40.6, 43.4 46.4
           C 39.2 48.8, 24.8 48.8, 20.6 46.4 Z"
        fill={`url(#${g('body')})`}
      />
      {/* body edge shading (contact with base) */}
      <path
        d="M 20.6 46.4 C 24.8 48.8, 39.2 48.8, 43.4 46.4 C 42.2 47.6, 39 48.6, 32 48.6 C 25 48.6, 21.8 47.6, 20.6 46.4 Z"
        fill="rgba(0,0,0,0.28)"
      />
      {/* left rim light + right shade along the body curve (stronger 3D) */}
      <path
        d="M 22.7 44.6 C 24.5 39.8, 27.3 36.2, 28.6 28.2"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 41.3 44.6 C 39.5 39.8, 36.7 36.2, 35.4 28.2"
        fill="none"
        stroke="rgba(0,0,0,0.24)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      {/* neck collar ring */}
      <ellipse cx="32" cy="21.9" rx="7.1" ry="2.5" fill={s.head[3]} opacity="0.92" />
      <ellipse cx="32" cy="21.2" rx="6.2" ry="1.7" fill={s.head[1]} opacity="0.75" />

      {/* --- glossy dome head --- */}
      <circle cx="32" cy="13.4" r="8.6" fill={`url(#${g('head')})`} />
      <circle cx="32" cy="13.4" r="8.6" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      {/* reflected light along the head's lower rim */}
      <path
        d="M 26.2 18.2 A 8.4 8.4 0 0 0 37.8 18.2"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* --- crown emblem (gold) --- */}
      <path
        d="M 26.7 15.4 L 27.6 10.2 L 30.2 12.4 L 32 9 L 33.8 12.4 L 36.4 10.2 L 37.3 15.4 Z"
        fill={`url(#${g('crown')})`}
        stroke="#7c520a"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <rect x="26.7" y="14.9" width="10.6" height="1.8" rx="0.9" fill="#e9b53e" stroke="#7c520a" strokeWidth="0.5" />
      {/* crown gems — tinted per token color with white glints */}
      <circle cx="27.6" cy="10" r="0.85" fill={s.head[1]} stroke="#7c520a" strokeWidth="0.4" />
      <circle cx="27.35" cy="9.75" r="0.26" fill="#ffffff" opacity="0.9" />
      <circle cx="32" cy="8.8" r="0.95" fill={s.head[1]} stroke="#7c520a" strokeWidth="0.4" />
      <circle cx="31.7" cy="8.5" r="0.3" fill="#ffffff" opacity="0.9" />
      <circle cx="36.4" cy="10" r="0.85" fill={s.head[1]} stroke="#7c520a" strokeWidth="0.4" />
      <circle cx="36.15" cy="9.75" r="0.26" fill="#ffffff" opacity="0.9" />

      {/* --- crystal facets / metal speculars --- */}
      {s.metal ? (
        <>
          <path d="M 24.6 27 L 27.6 26 L 26.2 44 L 23 42.4 Z" fill="rgba(255,255,255,0.34)" />
          <path d="M 36.6 25 L 38.6 27.4 L 42.4 41.4 L 40.2 43.4 Z" fill="rgba(255,246,200,0.3)" />
          <ellipse cx="28.2" cy="10.2" rx="3.4" ry="2.1" fill="rgba(255,255,255,0.85)" transform="rotate(-24 28.2 10.2)" />
        </>
      ) : (
        <>
          {/* top facet */}
          <path d="M 24.4 9.6 L 32 6.4 L 39.6 9.6 L 36.8 13.8 L 27.2 13.8 Z" fill="rgba(255,255,255,0.24)" />
          {/* left body facet */}
          <path d="M 26.3 24.4 L 29.6 23.2 L 27.4 44 L 22.6 42.2 Z" fill="rgba(255,255,255,0.2)" />
          {/* right edge facet streak */}
          <path d="M 36.9 24 L 38.8 27.6 L 42.2 42.6 L 40.4 44.2 L 37.4 30 Z" fill="rgba(255,255,255,0.14)" />
          {/* head specular */}
          <ellipse cx="27.8" cy="9.8" rx="3.1" ry="1.9" fill="rgba(255,255,255,0.9)" transform="rotate(-24 27.8 9.8)" />
          <circle cx="35.8" cy="12.6" r="1.1" fill="rgba(255,255,255,0.55)" />
        </>
      )}

      {/* --- gem sparkles (4-point stars, both materials) --- */}
      <path
        d="M 24.9 6.9 Q 25.5 8.3 26.9 8.9 Q 25.5 9.5 24.9 10.9 Q 24.3 9.5 22.9 8.9 Q 24.3 8.3 24.9 6.9 Z"
        fill="#ffffff"
        opacity="0.95"
      />
      <path
        d="M 37.6 14.6 Q 38 15.5 38.9 15.9 Q 38 16.3 37.6 17.2 Q 37.2 16.3 36.3 15.9 Q 37.2 15.5 37.6 14.6 Z"
        fill="#ffffff"
        opacity="0.7"
 />
    </svg>
  )

  if (tap) {
    return (
      <motion.button
        data-token={`${color}-${tokenId}`}
        onClick={onClick}
        whileTap={{ scale: 0.82 }}
        whileHover={{ scale: 1.09 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 0.85, ease: 'easeInOut' }}
        className="absolute inset-0 z-20 cursor-pointer"
        aria-label={`${color} token ${tokenId} (movable)`}
      >
        {svg}
        <motion.span
          className="absolute inset-[-10%] rounded-full"
          style={{ border: '2.5px dashed #ffd977' }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'linear' }}
        />
        <span
          className="absolute inset-[-12%] rounded-full"
          style={{ boxShadow: `0 0 18px 4px ${c.glow}` }}
        />
      </motion.button>
    )
  }

  if (glow) {
    // bot / remote-human display glow — no pointer, but clearly highlighted
    return (
      <div className="absolute inset-0 z-10" aria-hidden>
        {svg}
        <motion.span
          className="absolute inset-[-10%] rounded-full"
          style={{ border: '2.5px dashed rgba(255,217,119,0.85)' }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'linear' }}
        />
        <span
          className="absolute inset-[-12%] rounded-full"
          style={{ boxShadow: `0 0 15px 3px ${c.glow}` }}
        />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-10" aria-hidden>
      {svg}
    </div>
  )
}
