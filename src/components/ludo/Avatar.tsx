'use client'

// ============================================================
// Avatar — hand-drawn SVG cartoon faces (Ludo Star style busts).
// One face per seat color, like the reference table:
//   red   = brown-haired boy        (Player137 look)
//   green = long-haired girl        (Zara look)
//   blue  = boy with black shades   (Shoaib look)
//   yellow= girl with round glasses(Ayesha look)
// Pure presentation — no game logic.
// ============================================================

import type { Color } from '@/lib/ludo/types'

function RedBoy() {
  return (
    <>
      <defs>
        <linearGradient id="av-red-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd3a6" />
          <stop offset="1" stopColor="#eda36c" />
        </linearGradient>
        <linearGradient id="av-red-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d5228" />
          <stop offset="1" stopColor="#54320f" />
        </linearGradient>
        <linearGradient id="av-red-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#33406b" />
          <stop offset="1" stopColor="#1e2745" />
        </linearGradient>
      </defs>
      {/* shoulders / hoodie */}
      <path d="M8 66 C9 51 21 45 32 45 C43 45 55 51 56 66 Z" fill="url(#av-red-top)" />
      <path d="M26 45 L32 52 L38 45" fill="none" stroke="#141a30" strokeWidth="1.6" strokeLinecap="round" />
      {/* neck */}
      <path d="M27 38 h10 v8 q-5 3 -10 0 Z" fill="#e2925a" />
      {/* ears */}
      <circle cx="17" cy="30" r="3.4" fill="url(#av-red-skin)" />
      <circle cx="47" cy="30" r="3.4" fill="url(#av-red-skin)" />
      {/* head */}
      <ellipse cx="32" cy="29" rx="15.5" ry="16.5" fill="url(#av-red-skin)" />
      {/* hair: swept spiky top */}
      <path
        d="M16.5 28 C14 12 24 5.5 32 6 C41 5.5 50 12 47.5 28 C47 19 42 13.5 32 13.5 C22 13.5 17.5 19 16.5 28 Z"
        fill="url(#av-red-hair)"
      />
      <path d="M32 6 C36 3 42 4 44.5 8 C41 6.5 37 6.5 34.5 8.2 Z" fill="#54320f" />
      {/* brows */}
      <path d="M23.5 25.5 q3 -2 6 0" fill="none" stroke="#5a3a1a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M34.5 25.5 q3 -2 6 0" fill="none" stroke="#5a3a1a" strokeWidth="1.5" strokeLinecap="round" />
      {/* eyes */}
      <ellipse cx="26.2" cy="30.5" rx="2.3" ry="3" fill="#241207" />
      <ellipse cx="37.8" cy="30.5" rx="2.3" ry="3" fill="#241207" />
      <circle cx="25.4" cy="29.4" r="0.9" fill="#fff" />
      <circle cx="37" cy="29.4" r="0.9" fill="#fff" />
      {/* blush */}
      <ellipse cx="21.5" cy="35" rx="2.6" ry="1.6" fill="#f0906c" opacity="0.4" />
      <ellipse cx="42.5" cy="35" rx="2.6" ry="1.6" fill="#f0906c" opacity="0.4" />
      {/* smile */}
      <path d="M27 38.5 Q32 43 37 38.5" fill="none" stroke="#a4562e" strokeWidth="1.7" strokeLinecap="round" />
    </>
  )
}

function GreenGirl() {
  return (
    <>
      <defs>
        <linearGradient id="av-green-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffdab8" />
          <stop offset="1" stopColor="#efab7d" />
        </linearGradient>
        <linearGradient id="av-green-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a2f1c" />
          <stop offset="1" stopColor="#2c1a0e" />
        </linearGradient>
        <linearGradient id="av-green-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f980b6" />
          <stop offset="1" stopColor="#c74483" />
        </linearGradient>
      </defs>
      {/* long hair behind shoulders */}
      <path
        d="M12 64 C10 42 13 26 20 15 C26 7 38 7 44 15 C51 26 54 42 52 64 L43 64 C45 48 44 36 41 30 L23 30 C20 36 19 48 21 64 Z"
        fill="url(#av-green-hair)"
      />
      {/* shoulders / hoodie */}
      <path d="M10 66 C11 52 22 46 32 46 C42 46 53 52 54 66 Z" fill="url(#av-green-top)" />
      <path d="M28.5 47 q3.5 3 7 0" fill="none" stroke="#9c2f66" strokeWidth="1.5" strokeLinecap="round" />
      {/* neck */}
      <path d="M27.5 39 h9 v7.5 q-4.5 3 -9 0 Z" fill="#e09b6c" />
      {/* head */}
      <ellipse cx="32" cy="29.5" rx="14.5" ry="15.5" fill="url(#av-green-skin)" />
      {/* fringe / bangs */}
      <path
        d="M17.5 27 C15 14 24 7.5 32 7.5 C40 7.5 49 14 46.5 27 C45 20 40 15.5 34 16.5 C28 17.5 19 19 17.5 27 Z"
        fill="url(#av-green-hair)"
      />
      <path d="M18 26 C20 18 26 15.5 32 15.5 C26.5 17 22.5 20 20.5 27 Z" fill="#1f130a" opacity="0.75" />
      {/* eyes with lashes */}
      <ellipse cx="26.5" cy="31" rx="2.4" ry="3.1" fill="#1d0f06" />
      <ellipse cx="37.5" cy="31" rx="2.4" ry="3.1" fill="#1d0f06" />
      <circle cx="25.6" cy="29.8" r="0.95" fill="#fff" />
      <circle cx="36.6" cy="29.8" r="0.95" fill="#fff" />
      <path d="M23.5 27.8 q2.4 -1.6 5 -0.8" fill="none" stroke="#1d0f06" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M35.5 27 q2.6 -0.8 5 0.8" fill="none" stroke="#1d0f06" strokeWidth="1.2" strokeLinecap="round" />
      {/* blush */}
      <ellipse cx="21.8" cy="35.5" rx="2.6" ry="1.6" fill="#ef8f9a" opacity="0.45" />
      <ellipse cx="42.2" cy="35.5" rx="2.6" ry="1.6" fill="#ef8f9a" opacity="0.45" />
      {/* smile */}
      <path d="M27.5 38.5 Q32 42.5 36.5 38.5" fill="none" stroke="#b35a38" strokeWidth="1.7" strokeLinecap="round" />
    </>
  )
}

function BlueBoy() {
  return (
    <>
      <defs>
        <linearGradient id="av-blue-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7c393" />
          <stop offset="1" stopColor="#dd9a62" />
        </linearGradient>
        <linearGradient id="av-blue-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2320" />
          <stop offset="1" stopColor="#171110" />
        </linearGradient>
        <linearGradient id="av-blue-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#262f4e" />
          <stop offset="1" stopColor="#131a30" />
        </linearGradient>
        <linearGradient id="av-blue-shades" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a3f52" />
          <stop offset="0.45" stopColor="#0c0e16" />
          <stop offset="1" stopColor="#23283a" />
        </linearGradient>
      </defs>
      {/* shoulders */}
      <path d="M8 66 C9 51 21 45 32 45 C43 45 55 51 56 66 Z" fill="url(#av-blue-top)" />
      <path d="M26 45 L32 52 L38 45" fill="none" stroke="#0a0f20" strokeWidth="1.6" strokeLinecap="round" />
      {/* neck */}
      <path d="M27 38 h10 v8 q-5 3 -10 0 Z" fill="#c9854f" />
      {/* ears */}
      <circle cx="17" cy="30" r="3.4" fill="url(#av-blue-skin)" />
      <circle cx="47" cy="30" r="3.4" fill="url(#av-blue-skin)" />
      {/* head */}
      <ellipse cx="32" cy="29" rx="15.5" ry="16.5" fill="url(#av-blue-skin)" />
      {/* hair — sharp fade */}
      <path
        d="M16.5 28 C14 11 24 5.5 32 6 C40 5.5 50 11 47.5 28 C47.5 22 45 18 41 16.5 C36 14.5 24 14.5 19.5 19 C17.5 21.5 16.8 24.5 16.5 28 Z"
        fill="url(#av-blue-hair)"
      />
      {/* sunglasses */}
      <rect x="19.5" y="25.5" width="11.5" height="8.5" rx="3.4" fill="url(#av-blue-shades)" stroke="#05070c" strokeWidth="1" />
      <rect x="33" y="25.5" width="11.5" height="8.5" rx="3.4" fill="url(#av-blue-shades)" stroke="#05070c" strokeWidth="1" />
      <path d="M31 28.5 h2" stroke="#05070c" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M21.5 27.5 l3 -1.2 M35 27.5 l3 -1.2" stroke="#8f9bb8" strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
      {/* smirk */}
      <path d="M27 39 Q32 42.6 37.5 38.6" fill="none" stroke="#a4562e" strokeWidth="1.7" strokeLinecap="round" />
    </>
  )
}

function YellowGirl() {
  return (
    <>
      <defs>
        <linearGradient id="av-yellow-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffddbc" />
          <stop offset="1" stopColor="#f0b184" />
        </linearGradient>
        <linearGradient id="av-yellow-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b3a22" />
          <stop offset="1" stopColor="#3a2312" />
        </linearGradient>
        <linearGradient id="av-yellow-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd95e" />
          <stop offset="1" stopColor="#dfa30e" />
        </linearGradient>
      </defs>
      {/* hair falling behind */}
      <path
        d="M13.5 64 C12 44 14 28 21 16 C27 8 37 8 43 16 C50 28 52 44 50.5 64 L42 64 C44 50 43.5 40 41 34 L23 34 C20.5 40 20 50 22 64 Z"
        fill="url(#av-yellow-hair)"
      />
      {/* top bun */}
      <circle cx="32" cy="8.5" r="5" fill="url(#av-yellow-hair)" />
      <circle cx="32" cy="8.5" r="5" fill="none" stroke="#2a180b" strokeWidth="0.8" opacity="0.6" />
      {/* shoulders */}
      <path d="M10 66 C11 52 22 46 32 46 C42 46 53 52 54 66 Z" fill="url(#av-yellow-top)" />
      <path d="M26 46 L32 53 L38 46" fill="none" stroke="#b07c08" strokeWidth="1.5" strokeLinecap="round" />
      {/* neck */}
      <path d="M27.5 39 h9 v7.5 q-4.5 3 -9 0 Z" fill="#dd9a67" />
      {/* head */}
      <ellipse cx="32" cy="29.5" rx="14.5" ry="15.5" fill="url(#av-yellow-skin)" />
      {/* fringe */}
      <path
        d="M17.5 26 C16 13 25 7.5 32 7.5 C39 7.5 48 13 46.5 26 C44 19 39 15 32 15 C25 15 20 19 17.5 26 Z"
        fill="url(#av-yellow-hair)"
      />
      {/* round glasses */}
      <circle cx="26.3" cy="31" r="5" fill="rgba(255,255,255,0.20)" />
      <circle cx="26.3" cy="31" r="5" fill="none" stroke="#4a3218" strokeWidth="1.6" />
      <circle cx="37.7" cy="31" r="5" fill="rgba(255,255,255,0.20)" stroke="#4a3218" strokeWidth="1.6" />
      <path d="M31.3 30.5 q0.7 -0.8 1.4 0" fill="none" stroke="#4a3218" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M21.3 30.2 l-3.4 -1.2 M42.7 30.2 l3.4 -1.2" stroke="#4a3218" strokeWidth="1.3" strokeLinecap="round" />
      {/* eyes behind lenses */}
      <ellipse cx="26.3" cy="31" rx="2" ry="2.6" fill="#201007" />
      <ellipse cx="37.7" cy="31" rx="2" ry="2.6" fill="#201007" />
      <circle cx="25.6" cy="30" r="0.75" fill="#fff" />
      <circle cx="37" cy="30" r="0.75" fill="#fff" />
      {/* blush */}
      <ellipse cx="21.5" cy="36" rx="2.4" ry="1.5" fill="#ef9a8a" opacity="0.45" />
      <ellipse cx="42.5" cy="36" rx="2.4" ry="1.5" fill="#ef9a8a" opacity="0.45" />
      {/* smile */}
      <path d="M27.5 38.5 Q32 42.5 36.5 38.5" fill="none" stroke="#b35a38" strokeWidth="1.7" strokeLinecap="round" />
    </>
  )
}

const FACES: Record<Color, React.ReactNode> = {
  red: <RedBoy />,
  green: <GreenGirl />,
  blue: <BlueBoy />,
  yellow: <YellowGirl />,
}

export default function Avatar({
  color,
  className,
  style,
}: {
  color: Color
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg viewBox="0 0 64 66" className={className} style={style} aria-hidden>
      {FACES[color]}
    </svg>
  )
}
