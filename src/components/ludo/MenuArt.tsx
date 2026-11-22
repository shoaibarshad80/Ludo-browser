// ============================================================
// Lobby tile artworks — original SVG illustrations for the
// four play-mode tiles and the mode-sheet headers.
// Extracted from MenuScreen for clarity (presentational only).
// ============================================================

/** Big "2" + tokens + dice — 2 PLAYER tile. */
export function Art2P() {
  return (
    <svg viewBox="0 0 120 84" className="h-full w-full">
      <ellipse cx="60" cy="70" rx="44" ry="9" fill="rgba(120,60,0,0.25)" />
      <rect x="18" y="44" width="84" height="26" rx="7" fill="#fdf6e6" opacity="0.92" />
      <rect x="18" y="44" width="22" height="26" rx="6" fill="#e5453c" />
      <rect x="80" y="44" width="22" height="26" rx="6" fill="#2a8ee0" />
      <rect x="40" y="44" width="40" height="26" fill="#fdf6e6" />
      <circle cx="34" cy="57" r="7" fill="#b02820" stroke="#fff" strokeWidth="2" />
      <circle cx="86" cy="57" r="7" fill="#1d5c9e" stroke="#fff" strokeWidth="2" />
      <g transform="rotate(-12 74 30)">
        <rect x="62" y="18" width="24" height="24" rx="6" fill="#fff" stroke="#d9cbb0" strokeWidth="1.5" />
        <circle cx="68" cy="24" r="2.4" fill="#303a4e" />
        <circle cx="80" cy="36" r="2.4" fill="#303a4e" />
        <circle cx="74" cy="30" r="2.4" fill="#e5453c" />
      </g>
      <text x="34" y="42" textAnchor="middle" fontFamily="var(--font-lilita), Arial Rounded MT Bold, sans-serif" fontSize="44" fontWeight="900" fill="#e5453c" stroke="#fff" strokeWidth="5" paintOrder="stroke">2</text>
    </svg>
  )
}

/** Heart + tokens — PRIVATE TABLE tile. */
export function ArtPrivate() {
  return (
    <svg viewBox="0 0 120 84" className="h-full w-full">
      <ellipse cx="60" cy="72" rx="42" ry="8" fill="rgba(20,5,50,0.35)" />
      <rect x="24" y="40" width="72" height="24" rx="7" fill="#fdf6e6" opacity="0.92" />
      <rect x="24" y="40" width="20" height="24" rx="6" fill="#46a848" />
      <rect x="76" y="40" width="20" height="24" rx="6" fill="#2a8ee0" />
      <circle cx="36" cy="52" r="6.5" fill="#2f7c33" stroke="#fff" strokeWidth="2" />
      <circle cx="84" cy="52" r="6.5" fill="#1d5c9e" stroke="#fff" strokeWidth="2" />
      <path d="M60 16c5-8 16-8 20 0 4 8-2 14-9 19l-2 1.6-2-1.6c-7-5-13-11-9-19 4-8 15-8 20 0" fill="#e5453c" stroke="#fff" strokeWidth="3" transform="translate(-8 0) scale(1.06)" />
    </svg>
  )
}

/** Robot + board strip — OFFLINE tile. */
export function ArtOffline() {
  return (
    <svg viewBox="0 0 120 84" className="h-full w-full">
      <ellipse cx="60" cy="72" rx="42" ry="8" fill="rgba(8,40,20,0.4)" />
      <rect x="20" y="42" width="80" height="24" rx="7" fill="#fdf6e6" opacity="0.92" />
      <rect x="20" y="42" width="20" height="24" rx="6" fill="#e5453c" />
      <rect x="80" y="42" width="20" height="24" rx="6" fill="#46a848" />
      <circle cx="32" cy="54" r="6.5" fill="#b02820" stroke="#fff" strokeWidth="2" />
      <circle cx="88" cy="54" r="6.5" fill="#2f7c33" stroke="#fff" strokeWidth="2" />
      <g>
        <line x1="60" y1="13" x2="60" y2="20" stroke="#a7f3d0" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="60" cy="11.5" r="3" fill="#6ee7b7" stroke="#fff" strokeWidth="1.4" />
        <rect x="44" y="20" width="32" height="24" rx="8" fill="url(#off-g)" stroke="#fff" strokeWidth="2.4" />
        <circle cx="54" cy="30.5" r="3.4" fill="#0e3a55" stroke="#fff" strokeWidth="1.6" />
        <circle cx="66" cy="30.5" r="3.4" fill="#0e3a55" stroke="#fff" strokeWidth="1.6" />
        <rect x="55" y="37" width="10" height="2.6" rx="1.3" fill="#0e3a55" opacity="0.8" />
      </g>
      <defs>
        <linearGradient id="off-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d1fae5" />
          <stop offset="1" stopColor="#5eead4" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** "4" + tokens — 4 PLAYER tile. */
export function Art4P() {
  return (
    <svg viewBox="0 0 100 62" className="h-full w-full">
      <text x="30" y="46" textAnchor="middle" fontFamily="var(--font-lilita), Arial Rounded MT Bold, sans-serif" fontSize="40" fontWeight="900" fill="#f7c331" stroke="#fff" strokeWidth="4" paintOrder="stroke">4</text>
      <circle cx="58" cy="20" r="8.5" fill="#e5453c" stroke="#fff" strokeWidth="2.2" />
      <circle cx="74" cy="20" r="8.5" fill="#46a848" stroke="#fff" strokeWidth="2.2" />
      <circle cx="58" cy="38" r="8.5" fill="#2a8ee0" stroke="#fff" strokeWidth="2.2" />
      <circle cx="74" cy="38" r="8.5" fill="#f7c331" stroke="#fff" strokeWidth="2.2" />
    </svg>
  )
}
