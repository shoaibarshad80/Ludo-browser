'use client'

// ============================================================
// PREMIUM ICON SET — glossy, gradient, game-grade icons.
// Each icon: gradient plate + white glyph + top gloss + rim.
// Rendered as inline SVG so no asset loading is required.
// ============================================================

type IconProps = { size?: number; className?: string }

const svgShadow = 'drop-shadow(0 3px 5px rgba(24,4,44,0.5))'

function Plate({
  id,
  from,
  via,
  to,
  children,
  size,
  className,
  rim = 'rgba(255,255,255,0.6)',
}: {
  id: string
  from: string
  via?: string
  to: string
  children: React.ReactNode
  size?: number
  className?: string
  rim?: string
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      style={{ filter: svgShadow }}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {via ? <stop offset="0" stopColor={from} /> : <stop offset="0" stopColor={from} />}
          {via && <stop offset="0.5" stopColor={via} />}
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21.5" fill={`url(#${id})`} />
      <circle cx="24" cy="24" r="21.5" fill="none" stroke={rim} strokeWidth="1.8" />
      <ellipse cx="16.5" cy="11.5" rx="11" ry="6" fill="rgba(255,255,255,0.34)" />
      {children}
    </svg>
  )
}

// ---------- bottom nav ----------

/** Shop — glossy shopping bag on gold plate. */
export function NavShop({ size = 22, className }: IconProps) {
  return (
    <Plate id="pi-shop" from="#ffd75e" via="#f2b23a" to="#e0900c" size={size} className={className}>
      <path d="M18.7 20.6v-4.4a5.3 5.3 0 0 1 10.6 0v4.4" fill="none" stroke="#fff" strokeWidth="2.7" strokeLinecap="round" />
      <path d="M14.4 19.6h19.2l-2.3 13.2a3.6 3.6 0 0 1-3.5 3h-7.6a3.6 3.6 0 0 1-3.5-3z" fill="#fff" />
      <circle cx="24" cy="26.4" r="2.5" fill="#e0900c" />
    </Plate>
  )
}

/** Friends — two players on blue plate. */
export function NavFriends({ size = 22, className }: IconProps) {
  return (
    <Plate id="pi-friends" from="#6cb9f2" via="#3a8be0" to="#2166c9" size={size} className={className}>
      <circle cx="31.2" cy="17.8" r="4.4" fill="#fff" opacity="0.9" />
      <path d="M25.4 33.4v-1.2c0-3.8 2.3-6.4 5.8-6.4 3 0 5 2.1 5 5.8v1.8h-10.8z" fill="#fff" opacity="0.9" />
      <circle cx="18.4" cy="19.4" r="5.2" fill="#fff" />
      <path d="M9.6 33.4v-1.6c0-5 3.8-8 8.8-8s8.8 3 8.8 8v1.6h-17.6z" fill="#fff" />
    </Plate>
  )
}

/** Home glyph — white house with punched door (for plates / raised nav). */
export function HomeGlyph({ size = 24, className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M24 10.8 39.2 23.4h-4v10.6a2.8 2.8 0 0 1-2.8 2.8H15.6a2.8 2.8 0 0 1-2.8-2.8V23.4h-4zM20.6 28.2v8.6h6.8v-8.6z"
        fill="#fff"
      />
    </svg>
  )
}

/** Home — red/pink plate for the nav. */
export function NavHome({ size = 24, className }: IconProps) {
  return (
    <Plate id="pi-home" from="#ff8d7e" via="#ee4a56" to="#cf2b44" size={size} className={className}>
      <g transform="translate(0 0.6) scale(1)">
        <path
          fillRule="evenodd"
          d="M24 12.6 36.4 23h-3.2v9.8a2.4 2.4 0 0 1-2.4 2.4h-13.6a2.4 2.4 0 0 1-2.4-2.4V23h-3.2zM21 27.6v7.6h6v-7.6z"
          fill="#fff"
        />
      </g>
    </Plate>
  )
}

/** Collections — card grid on violet plate with a gold star card. */
export function NavCollections({ size = 22, className }: IconProps) {
  return (
    <Plate id="pi-col" from="#b683f2" via="#8d4be0" to="#6423bd" size={size} className={className}>
      <defs>
        <linearGradient id="pi-col-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#eda912" />
        </linearGradient>
      </defs>
      <rect x="12.6" y="12.6" width="10" height="10" rx="2.6" fill="#fff" />
      <rect x="25.4" y="12.6" width="10" height="10" rx="2.6" fill="#fff" opacity="0.92" />
      <rect x="12.6" y="25.4" width="10" height="10" rx="2.6" fill="#fff" opacity="0.92" />
      <rect x="25.4" y="25.4" width="10" height="10" rx="2.6" fill="url(#pi-col-gold)" />
      <path d="M30.4 27.9l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" fill="#a56d08" />
    </Plate>
  )
}

/** Chest — treasure chest on bronze plate. */
export function NavChest({ size = 22, className }: IconProps) {
  return (
    <Plate id="pi-chest" from="#e2b06a" via="#c1853c" to="#8f5420" size={size} className={className}>
      <path d="M12.4 20.4a8.4 8.4 0 0 1 8.4-8.4h6.4a8.4 8.4 0 0 1 8.4 8.4z" fill="#fff" />
      <rect x="12.4" y="20.4" width="23.2" height="13.4" rx="2.8" fill="#fff" />
      <rect x="20.6" y="18.6" width="6.8" height="7.6" rx="1.8" fill="#8f5420" />
      <circle cx="24" cy="22" r="1.7" fill="#ffe08a" />
    </Plate>
  )
}

// ---------- left rail ----------

/** Events — film strip on pink plate. */
export function RailEvents({ size = 24, className }: IconProps) {
  return (
    <Plate id="pi-ev" from="#ff85b8" via="#ea4f9a" to="#c22878" size={size} className={className}>
      <rect x="11.4" y="14" width="25.2" height="20" rx="3.2" fill="#fff" />
      <g fill="#c93184">
        <rect x="13.6" y="16.6" width="3" height="3" rx="0.8" />
        <rect x="13.6" y="22.5" width="3" height="3" rx="0.8" />
        <rect x="13.6" y="28.4" width="3" height="3" rx="0.8" />
        <rect x="31.4" y="16.6" width="3" height="3" rx="0.8" />
        <rect x="31.4" y="22.5" width="3" height="3" rx="0.8" />
        <rect x="31.4" y="28.4" width="3" height="3" rx="0.8" />
      </g>
      <path d="M21.6 20.2l7 3.8-7 3.8z" fill="#c93184" />
    </Plate>
  )
}

/** Trophy — gold cup with star. */
export function RailTrophy({ size = 24, className }: IconProps) {
  return (
    <Plate id="pi-tro" from="#ffe08a" via="#f2b23a" to="#dd8f10" size={size} className={className}>
      <path d="M16.8 15.4h-3.6a4.2 4.2 0 0 0 3.9 6.6M31.2 15.4h3.6a4.2 4.2 0 0 1-3.9 6.6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16.6 12.8h14.8v7.4a7.4 7.4 0 0 1-14.8 0z" fill="#fff" />
      <rect x="22.3" y="26.6" width="3.4" height="4.8" fill="#fff" />
      <rect x="18.2" y="31.4" width="11.6" height="3.4" rx="1.6" fill="#fff" />
      <path d="M24 16.2l1.2 2.3 2.5.4-1.8 1.75.4 2.5-2.3-1.2-2.3 1.2.4-2.5-1.8-1.75 2.5-.4z" fill="#dd8f10" />
    </Plate>
  )
}

/** Clubs — group of players on purple plate. */
export function RailClubs({ size = 24, className }: IconProps) {
  return (
    <Plate id="pi-club" from="#a86cf0" via="#8130dd" to="#5b1fa8" size={size} className={className}>
      <g fill="#fff" opacity="0.88">
        <circle cx="13.6" cy="20.2" r="3.6" />
        <path d="M7.6 32.2v-1c0-3.6 2.6-5.8 6-5.8 1 0 1.9.2 2.7.5a8.8 8.8 0 0 0-2.2 5.6v.7z" />
        <circle cx="34.4" cy="20.2" r="3.6" />
        <path d="M40.4 32.2v-1c0-3.6-2.6-5.8-6-5.8-1 0-1.9.2-2.7.5a8.8 8.8 0 0 1 2.2 5.6v.7z" />
      </g>
      <circle cx="24" cy="18" r="4.8" fill="#fff" />
      <path d="M16.6 33v-1.6c0-4.6 3.4-7.4 7.4-7.4s7.4 2.8 7.4 7.4V33h-14.8z" fill="#fff" />
    </Plate>
  )
}

// ---------- utility ----------

/** Settings — white cog on dark slate plate. */
export function IconGear({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} style={{ filter: svgShadow }} aria-hidden>
      <defs>
        <linearGradient id="pi-gear-p" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5c6588" />
          <stop offset="1" stopColor="#2c3352" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21.5" fill="url(#pi-gear-p)" />
      <circle cx="24" cy="24" r="21.5" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" />
      <ellipse cx="16.5" cy="11.5" rx="11" ry="6" fill="rgba(255,255,255,0.22)" />
      <g transform="translate(12 12)" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </g>
    </svg>
  )
}

/** Gold padlock (no plate) — lock overlays on tiles. */
export function IconLockGold({ size = 12, className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} style={{ filter: 'drop-shadow(0 2px 3px rgba(40,10,60,0.5))' }} aria-hidden>
      <defs>
        <linearGradient id="pi-lock-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#e09b1a" />
        </linearGradient>
      </defs>
      <path d="M17 22v-6a7 7 0 0 1 14 0v6" fill="none" stroke="#ffe9ad" strokeWidth="5" strokeLinecap="round" />
      <rect x="11" y="21.4" width="26" height="19" rx="5.4" fill="url(#pi-lock-b)" stroke="#fff3c4" strokeWidth="1.8" />
      <circle cx="24" cy="29" r="3.3" fill="#7a4a06" />
      <rect x="22.5" y="30.2" width="3" height="5.6" rx="1.5" fill="#7a4a06" />
    </svg>
  )
}

/** Gold star (no plate) — currency chip. */
export function IconStarGold({ size = 15, className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} style={{ filter: 'drop-shadow(0 2px 3px rgba(40,10,60,0.45))' }} aria-hidden>
      <defs>
        <linearGradient id="pi-star-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.5" stopColor="#ffd75e" />
          <stop offset="1" stopColor="#eda912" />
        </linearGradient>
      </defs>
      <path
        d="M24 5.4l5.9 11.9 13.1 1.9-9.5 9.3 2.2 13-11.7-6.2-11.7 6.2 2.2-13-9.5-9.3 13.1-1.9z"
        fill="url(#pi-star-g)"
        stroke="#a56d08"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Premium crown (watermark / decorations). */
export function CrownArt({ size = 40, className, opacity = 1 }: IconProps & { opacity?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} style={{ opacity }} aria-hidden>
      <defs>
        <linearGradient id="pi-crown-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.55" stopColor="#ffd75e" />
          <stop offset="1" stopColor="#eda912" />
        </linearGradient>
      </defs>
      <path d="M9.4 31 6.6 15.8l10 6.6L24 10.2l7.4 12.2 10-6.6L38.6 31z" fill="url(#pi-crown-g)" stroke="#fff8dc" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="9.4" y="31" width="29.2" height="5.6" rx="2.6" fill="url(#pi-crown-g)" stroke="#fff8dc" strokeWidth="1.4" />
      <circle cx="6.8" cy="15.4" r="2.8" fill="#ffe08a" stroke="#a56d08" strokeWidth="1.2" />
      <circle cx="24" cy="9.6" r="2.8" fill="#ffe08a" stroke="#a56d08" strokeWidth="1.2" />
      <circle cx="41.2" cy="15.4" r="2.8" fill="#ffe08a" stroke="#a56d08" strokeWidth="1.2" />
      <circle cx="24" cy="25.4" r="2.6" fill="#e5453c" stroke="#fff" strokeWidth="1.1" />
    </svg>
  )
}

// ---------- decorations ----------

const DECO_COLORS: Record<string, { main: string; light: string; dark: string }> = {
  red: { main: '#e5453c', light: '#ff8d7e', dark: '#a82820' },
  green: { main: '#46a848', light: '#8fd691', dark: '#2f7c33' },
  yellow: { main: '#f7c331', light: '#ffe08a', dark: '#c48f16' },
  blue: { main: '#2a8ee0', light: '#8ec7f5', dark: '#1d5c9e' },
}

/** Glossy ludo pawn — lobby decoration. */
export function DecoToken({ color = 'red', size = 26, className }: { color?: keyof typeof DECO_COLORS; size?: number; className?: string }) {
  const c = DECO_COLORS[color] ?? DECO_COLORS.red
  const gid = `pi-tok-${color}`
  return (
    <svg viewBox="0 0 24 26" width={size} height={(size * 26) / 24} className={className} style={{ filter: 'drop-shadow(0 3px 5px rgba(24,4,44,0.45))' }} aria-hidden>
      <defs>
        <radialGradient id={`${gid}-h`} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor={c.light} />
          <stop offset="1" stopColor={c.dark} />
        </radialGradient>
        <linearGradient id={`${gid}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.main} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
      </defs>
      <ellipse cx="12" cy="22.4" rx="7.6" ry="3.2" fill={`url(#${gid}-b)`} stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" />
      <path d="M12 8.6c-3.6 2.8-5.3 6.4-5.6 10.2h11.2c-.3-3.8-2-7.4-5.6-10.2z" fill={`url(#${gid}-b)`} stroke="rgba(255,255,255,0.75)" strokeWidth="1" />
      <circle cx="12" cy="6.4" r="4.6" fill={`url(#${gid}-h)`} stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />
      <ellipse cx="10.4" cy="4.9" rx="1.7" ry="1.1" fill="rgba(255,255,255,0.55)" />
    </svg>
  )
}

const DECO_PIPS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 26], [70, 26], [30, 50], [70, 50], [30, 74], [70, 74]],
}

/** Glossy ivory die — lobby decoration. */
export function DecoDie({ value = 5, size = 34, className, tilt = 0 }: { value?: number; size?: number; className?: string; tilt?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      style={{ filter: 'drop-shadow(0 4px 7px rgba(24,4,44,0.5))', transform: tilt ? `rotate(${tilt}deg)` : undefined }}
      aria-hidden
    >
      <defs>
        <linearGradient id="pi-die-f" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6ebfa" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="10" fill="url(#pi-die-f)" stroke="#c3caee" strokeWidth="1.6" />
      <rect x="8" y="7" width="30" height="12" rx="7" fill="rgba(255,255,255,0.65)" />
      {(DECO_PIPS[value] ?? DECO_PIPS[5]).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#2a3352" />
      ))}
    </svg>
  )
}

/** Big glossy chest with coins (Chest tab hero). */
export function ChestArt({ size = 96, className }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} className={className} style={{ filter: 'drop-shadow(0 6px 12px rgba(24,4,44,0.5))' }} aria-hidden>
      <defs>
        <linearGradient id="pi-chest-lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0b868" />
          <stop offset="1" stopColor="#b06f2a" />
        </linearGradient>
        <linearGradient id="pi-chest-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d29549" />
          <stop offset="1" stopColor="#8a5420" />
        </linearGradient>
        <linearGradient id="pi-chest-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#e09b1a" />
        </linearGradient>
      </defs>
      <ellipse cx="48" cy="82" rx="34" ry="5.4" fill="rgba(20,5,30,0.4)" />
      <path d="M16 44a22 22 0 0 1 22-22h20a22 22 0 0 1 22 22z" fill="url(#pi-chest-lid)" stroke="#7a4a18" strokeWidth="2.4" />
      <rect x="16" y="44" width="64" height="34" rx="7" fill="url(#pi-chest-body)" stroke="#7a4a18" strokeWidth="2.4" />
      <rect x="14" y="42" width="68" height="8" rx="4" fill="url(#pi-chest-gold)" stroke="#a56d08" strokeWidth="1.6" />
      <rect x="40" y="40" width="16" height="17" rx="4" fill="url(#pi-chest-gold)" stroke="#a56d08" strokeWidth="2" />
      <circle cx="48" cy="48.5" r="3.4" fill="#7a4a06" />
      <path d="M48 50v6" stroke="#7a4a06" strokeWidth="3" strokeLinecap="round" />
      <g stroke="#a56d08" strokeWidth="1.6">
        <circle cx="30" cy="14" r="8" fill="url(#pi-chest-gold)" />
        <circle cx="62" cy="11" r="7" fill="url(#pi-chest-gold)" />
        <circle cx="48" cy="8" r="6" fill="url(#pi-chest-gold)" />
      </g>
    </svg>
  )
}

// ---------- brand emblem + profile nav ----------

/**
 * Custom Ludo emblem — crisp vector board badge (no image asset).
 * Glossy rounded-square rim, four colored home quadrants, white cross
 * paths with cell hints and a red-star center home.
 */
export function LudoBadge({ size = 120, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      style={{ filter: 'drop-shadow(0 10px 22px rgba(8,2,24,0.55))' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="lb-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a6178" />
          <stop offset="0.5" stopColor="#333950" />
          <stop offset="1" stopColor="#181c2c" />
        </linearGradient>
        <radialGradient id="lb-red" cx="0.32" cy="0.28" r="1">
          <stop offset="0" stopColor="#ff7d6e" />
          <stop offset="0.55" stopColor="#e5453c" />
          <stop offset="1" stopColor="#a82820" />
        </radialGradient>
        <radialGradient id="lb-green" cx="0.32" cy="0.28" r="1">
          <stop offset="0" stopColor="#8fd691" />
          <stop offset="0.55" stopColor="#46a848" />
          <stop offset="1" stopColor="#2f7c33" />
        </radialGradient>
        <radialGradient id="lb-yellow" cx="0.32" cy="0.28" r="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="0.55" stopColor="#f7c331" />
          <stop offset="1" stopColor="#c48f16" />
        </radialGradient>
        <radialGradient id="lb-blue" cx="0.32" cy="0.28" r="1">
          <stop offset="0" stopColor="#8ec7f5" />
          <stop offset="0.55" stopColor="#2a8ee0" />
          <stop offset="1" stopColor="#1d5c9e" />
        </radialGradient>
        <radialGradient id="lb-plate" cx="0.5" cy="0.4" r="0.8">
          <stop offset="0" stopColor="#fbf8f2" />
          <stop offset="0.75" stopColor="#f4f1ea" />
          <stop offset="1" stopColor="#e4dfd0" />
        </radialGradient>
        <radialGradient id="lb-vign" cx="0.5" cy="0.42" r="0.78">
          <stop offset="0.55" stopColor="rgba(31,41,66,0)" />
          <stop offset="1" stopColor="rgba(31,41,66,0.14)" />
        </radialGradient>
        <linearGradient id="lb-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.34)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
        <radialGradient id="lb-home" cx="0.5" cy="0.36" r="0.9">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f6f3ea" />
          <stop offset="1" stopColor="#e2dccb" />
        </radialGradient>
        <radialGradient id="lb-star" cx="0.35" cy="0.3" r="1">
          <stop offset="0" stopColor="#ff9d8e" />
          <stop offset="0.5" stopColor="#e5453c" />
          <stop offset="1" stopColor="#a82820" />
        </radialGradient>
      </defs>

      {/* outer rim + bevel */}
      <rect x="4" y="4" width="112" height="112" rx="28" fill="url(#lb-rim)" />
      <rect x="5" y="5" width="110" height="110" rx="27" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" />

      {/* cream board plate with soft vignette */}
      <rect x="12" y="12" width="96" height="96" rx="21" fill="url(#lb-plate)" />
      <rect x="12" y="12" width="96" height="96" rx="21" fill="url(#lb-vign)" />
      <rect x="12.6" y="12.6" width="94.8" height="94.8" rx="20.4" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.4" />

      {/* four home quadrants */}
      <path d="M18 33a15 15 0 0 1 15-15h15v44H18z" fill="url(#lb-red)" />
      <path d="M57 18h15a15 15 0 0 1 15 15v29H57z" fill="url(#lb-green)" />
      <path d="M18 57h30v44H33a15 15 0 0 1-15-15z" fill="url(#lb-yellow)" />
      <path d="M57 57h30v29a15 15 0 0 1-15 15H57z" fill="url(#lb-blue)" />

      {/* home circles in each quadrant */}
      <g fill="#ffffff" opacity="0.9">
        <circle cx="28.2" cy="28.2" r="4.6" /><circle cx="39.4" cy="28.2" r="4.6" />
        <circle cx="28.2" cy="39.4" r="4.6" /><circle cx="39.4" cy="39.4" r="4.6" />
        <circle cx="80.6" cy="28.2" r="4.6" /><circle cx="91.8" cy="28.2" r="4.6" />
        <circle cx="80.6" cy="39.4" r="4.6" /><circle cx="91.8" cy="39.4" r="4.6" />
        <circle cx="28.2" cy="80.6" r="4.6" /><circle cx="39.4" cy="80.6" r="4.6" />
        <circle cx="28.2" cy="91.8" r="4.6" /><circle cx="39.4" cy="91.8" r="4.6" />
        <circle cx="80.6" cy="80.6" r="4.6" /><circle cx="91.8" cy="80.6" r="4.6" />
        <circle cx="80.6" cy="91.8" r="4.6" /><circle cx="91.8" cy="91.8" r="4.6" />
      </g>
      <g fill="none" strokeWidth="1.1" opacity="0.75">
        <g stroke="#c23b33">
          <circle cx="28.2" cy="28.2" r="4.6" /><circle cx="39.4" cy="28.2" r="4.6" />
          <circle cx="28.2" cy="39.4" r="4.6" /><circle cx="39.4" cy="39.4" r="4.6" />
        </g>
        <g stroke="#3d9440">
          <circle cx="80.6" cy="28.2" r="4.6" /><circle cx="91.8" cy="28.2" r="4.6" />
          <circle cx="80.6" cy="39.4" r="4.6" /><circle cx="91.8" cy="39.4" r="4.6" />
        </g>
        <g stroke="#c9a016">
          <circle cx="28.2" cy="80.6" r="4.6" /><circle cx="39.4" cy="80.6" r="4.6" />
          <circle cx="28.2" cy="91.8" r="4.6" /><circle cx="39.4" cy="91.8" r="4.6" />
        </g>
        <g stroke="#2774b8">
          <circle cx="80.6" cy="80.6" r="4.6" /><circle cx="91.8" cy="80.6" r="4.6" />
          <circle cx="80.6" cy="91.8" r="4.6" /><circle cx="91.8" cy="91.8" r="4.6" />
        </g>
      </g>

      {/* white cross paths (soft drop for depth) */}
      <path d="M18 58h30v6H18zM72 58h30v6H72zM57 19h6v30h-6zM57 73h6v30h-6z" fill="rgba(31,41,66,0.16)" />
      <path d="M18 57h30v6H18zM72 57h30v6H72zM57 18h6v30h-6zM57 72h6v30h-6z" fill="#f7f4ed" />
      {/* path cell hints */}
      <g fill="rgba(31,41,66,0.14)">
        <rect x="29" y="57.8" width="5.4" height="5.4" rx="1.5" />
        <rect x="41.5" y="57.8" width="5.4" height="5.4" rx="1.5" />
        <rect x="84.5" y="57.8" width="5.4" height="5.4" rx="1.5" />
        <rect x="97" y="57.8" width="5" height="5.4" rx="1.5" />
        <rect x="56.8" y="29" width="5.4" height="5.4" rx="1.5" />
        <rect x="56.8" y="41.5" width="5.4" height="5.4" rx="1.5" />
        <rect x="56.8" y="84.5" width="5.4" height="5.4" rx="1.5" />
        <rect x="56.8" y="97" width="5.4" height="5" rx="1.5" />
      </g>

      {/* center home with glossy red star */}
      <circle cx="60" cy="60" r="14.5" fill="url(#lb-home)" stroke="rgba(0,0,0,0.16)" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="10.4" fill="none" stroke="#ddd6c4" strokeWidth="1.4" />
      <path
        d="M60 49.6l3.2 6.4 7 .9-5.1 4.9 1.3 6.9-6.4-3.4-6.4 3.4 1.3-6.9-5.1-4.9 7-.9z"
        fill="url(#lb-star)"
        stroke="#9c231c"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <ellipse cx="57.4" cy="54.4" rx="1.9" ry="1.3" fill="rgba(255,255,255,0.85)" transform="rotate(-24 57.4 54.4)" />

      {/* glass gloss dome + sparkle */}
      <rect x="12" y="12" width="96" height="40" rx="20" fill="url(#lb-gloss)" />
      <path d="M93.4 23.2l1.5 3.2 3.2 1.5-3.2 1.5-1.5 3.2-1.5-3.2-3.2-1.5 3.2-1.5z" fill="rgba(255,255,255,0.7)" />
    </svg>
  )
}

/** Profile — single player on teal plate (bottom nav). */
export function NavProfile({ size = 22, className }: IconProps) {
  return (
    <Plate id="pi-prof" from="#7dd8c8" via="#2fb9a4" to="#1a8b7c" size={size} className={className}>
      <circle cx="24" cy="18.4" r="6.4" fill="#fff" />
      <path d="M12.4 34.8v-1.6c0-5.7 4.8-9.2 11.6-9.2s11.6 3.5 11.6 9.2v1.6z" fill="#fff" />
    </Plate>
  )
}
