'use client'

// ============================================================
// Shared UI atoms for Ludo Royale: currency icons, logo,
// mode illustrations, avatar rings, progress bars, badges.
// ============================================================

import { motion } from 'framer-motion'
import { COLOR_HEX } from '@/lib/ludo/board'
import type { Color } from '@/lib/ludo/types'

// ---------- currency ----------

export function CoinIcon({ size = 20, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <motion.span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
      animate={animated ? { y: [0, -2.5, 0] } : undefined}
      transition={animated ? { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } : undefined}
    >
      <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]">
        <circle cx="20" cy="21.5" r="16" fill="#9a6a08" />
        <circle cx="20" cy="19.5" r="16" fill="url(#coin-g)" stroke="#8a5a08" strokeWidth="1.6" />
        <circle cx="20" cy="19.5" r="11.5" fill="none" stroke="#e0a51e" strokeWidth="1.6" opacity="0.85" />
        <path
          d="M20 12.4l2.2 4.7 5.1.7-3.7 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.7-3.5 5.1-.7z"
          fill="#8a5a08"
        />
        <defs>
          <linearGradient id="coin-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe98f" />
            <stop offset="0.55" stopColor="#f6c453" />
            <stop offset="1" stopColor="#e0a51e" />
          </linearGradient>
        </defs>
      </svg>
    </motion.span>
  )
}

export function GemIcon({ size = 20, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <motion.span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
      animate={animated ? { y: [0, -2.5, 0] } : undefined}
      transition={animated ? { repeat: Infinity, duration: 1.9, ease: 'easeInOut' } : undefined}
    >
      <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]">
        <path d="M12 8h16l8 10-16 18L4 18z" fill="url(#gem-g)" stroke="#2dd4bf" strokeWidth="1.4" />
        <path d="M12 8l8 10 8-10" fill="none" stroke="#ccfbf1" strokeWidth="1.6" opacity="0.9" />
        <path d="M4 18h32M20 18v18" fill="none" stroke="#99f6e4" strokeWidth="1.2" opacity="0.65" />
        <path d="M14 9.5l3 3-5 5" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.75" strokeLinecap="round" />
        <defs>
          <linearGradient id="gem-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5eead4" />
            <stop offset="0.5" stopColor="#2dd4bf" />
            <stop offset="1" stopColor="#0d9488" />
          </linearGradient>
        </defs>
      </svg>
    </motion.span>
  )
}

// ---------- brand ----------

export function LudoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <motion.svg
        viewBox="0 0 48 48"
        className={compact ? 'h-9 w-9' : 'h-12 w-12'}
        animate={compact ? undefined : { rotate: [0, -4, 4, 0] }}
        transition={compact ? undefined : { repeat: Infinity, duration: 5, ease: 'easeInOut' }}
      >
        <rect x="5" y="5" width="38" height="38" rx="11" fill="url(#logo-dice)" stroke="#c4b5fd" strokeWidth="2" />
        <circle cx="16" cy="16" r="3.6" fill="#f8f6ff" />
        <circle cx="32" cy="32" r="3.6" fill="#f8f6ff" />
        <circle cx="32" cy="16" r="3.6" fill="#f8f6ff" />
        <circle cx="16" cy="32" r="3.6" fill="#f8f6ff" />
        <circle cx="24" cy="24" r="3.6" fill="#ffd75e" />
        <defs>
          <linearGradient id="logo-dice" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#5b21b6" />
          </linearGradient>
        </defs>
      </motion.svg>
      <div className="leading-none">
        <span className={`ls-font ls-logo-ludo block ${compact ? 'text-xl' : 'text-2xl'}`}>LUDO</span>
        <span className={`ls-font ls-logo-star block ${compact ? 'text-[11px]' : 'text-sm'}`}>ROYALE</span>
      </div>
    </div>
  )
}

// ---------- avatar ----------

export function AvatarRing({
  avatar,
  color,
  size = 44,
  active = false,
  fontSize,
}: {
  avatar: string
  color?: Color
  size?: number
  active?: boolean
  fontSize?: number
}) {
  const c = color ? COLOR_HEX[color] : null
  return (
    <motion.span
      className="relative grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        fontSize: fontSize ?? size * 0.5,
        background: c
          ? `radial-gradient(circle at 30% 30%, ${c.light}, ${c.main} 68%, ${c.dark})`
          : 'radial-gradient(circle at 30% 30%, #312e81, #1e1b4b)',
        border: `2.5px solid ${active ? '#fff' : c ? c.main : 'rgba(167,139,250,0.7)'}`,
        boxShadow: active ? `0 0 16px ${c?.glow ?? 'rgba(167,139,250,0.6)'}` : '0 3px 8px rgba(2,4,16,0.5)',
      }}
      animate={active ? { scale: [1, 1.07, 1] } : undefined}
      transition={active ? { repeat: Infinity, duration: 1.4 } : undefined}
    >
      {avatar.startsWith('data:') ? (
        <img
          src={avatar}
          alt=""
          draggable={false}
          className="h-[74%] w-[74%] rounded-full object-cover"
          style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.35)' }}
        />
      ) : (
        <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">{avatar}</span>
      )}
    </motion.span>
  )
}

// ---------- progress / badges ----------

export function XPBar({ pct, className = '' }: { pct: number; className?: string }) {
  const clamped = Math.round(Math.min(100, Math.max(0, pct)))
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-indigo-950/80 ring-1 ring-inset ring-white/10 ${className}`}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: 'linear-gradient(90deg, #34d399, #a3e635, #f6c453)' }}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
    </div>
  )
}

export function LevelBadge({ level, size = 26 }: { level: number; size?: number }) {
  return (
    <span
      className="ls-font absolute -bottom-1 -right-1.5 z-10 grid place-items-center rounded-full text-[10px]"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(180deg,#ffe08a,#e09b1a)',
        color: '#4a2c00',
        boxShadow: '0 2px 5px rgba(0,0,0,0.45), 0 0 0 2.5px #0b0f26',
        textShadow: 'none',
      }}
      aria-label={`Level ${level}`}
    >
      {level}
    </span>
  )
}

export function Tag({
  children,
  tone = 'violet',
}: {
  children: React.ReactNode
  tone?: 'violet' | 'gold' | 'green' | 'red' | 'slate'
}) {
  const tones: Record<string, string> = {
    violet: 'bg-violet-500/20 text-violet-200 ring-violet-400/40',
    gold: 'bg-amber-400/15 text-amber-200 ring-amber-300/40',
    green: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/40',
    red: 'bg-rose-500/15 text-rose-200 ring-rose-400/40',
    slate: 'bg-slate-500/15 text-slate-300 ring-slate-400/30',
  }
  return (
    <span className={`ls-font inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ring-1 ${tones[tone]}`}>
      {children}
    </span>
  )
}

// ---------- mode illustrations ----------

export type ModeArt =
  | 'classic'
  | 'quick'
  | 'master'
  | 'duel'
  | 'party'
  | 'team'
  | 'practice'
  | 'private'

const R = '#e5453c'
const G = '#46a848'
const Y = '#f7c331'
const B = '#2a8ee0'

export function ModeIllustration({ kind, size = 96 }: { kind: ModeArt; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="drop-shadow-[0_6px_14px_rgba(2,4,16,0.5)]">
      <defs>
        <linearGradient id="mi-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1c2246" />
          <stop offset="1" stopColor="#0d0a24" />
        </linearGradient>
        <linearGradient id="mi-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#e09b1a" />
        </linearGradient>
      </defs>

      {kind === 'classic' && (
        <g>
          <rect x="8" y="8" width="84" height="84" rx="14" fill="url(#mi-bg)" stroke="rgba(148,163,255,0.3)" strokeWidth="2" />
          <rect x="16" y="16" width="24" height="24" rx="5" fill={R} />
          <rect x="60" y="16" width="24" height="24" rx="5" fill={G} />
          <rect x="60" y="60" width="24" height="24" rx="5" fill={Y} />
          <rect x="16" y="60" width="24" height="24" rx="5" fill={B} />
          <rect x="44" y="16" width="12" height="10" rx="2" fill="#f1f5f9" opacity="0.9" />
          <rect x="74" y="44" width="10" height="12" rx="2" fill="#f1f5f9" opacity="0.9" />
          <rect x="44" y="74" width="12" height="10" rx="2" fill="#f1f5f9" opacity="0.9" />
          <rect x="16" y="44" width="10" height="12" rx="2" fill="#f1f5f9" opacity="0.9" />
          <rect x="40" y="40" width="20" height="20" rx="4" fill="url(#mi-gold)" />
          <path d="M50 44l1.8 3.8 4.2.6-3 2.9.7 4.1-3.7-2-3.7 2 .7-4.1-3-2.9 4.2-.6z" fill="#8a5a08" />
        </g>
      )}

      {kind === 'quick' && (
        <g>
          <rect x="8" y="8" width="84" height="84" rx="14" fill="url(#mi-bg)" stroke="rgba(148,163,255,0.3)" strokeWidth="2" />
          <path d="M56 14L34 52h14l-6 32 26-40H52z" fill="url(#mi-gold)" stroke="#b7850f" strokeWidth="1.5" />
          <circle cx="26" cy="26" r="8" fill={R} />
          <circle cx="26" cy="74" r="8" fill={B} />
          <circle cx="74" cy="26" r="8" fill={G} />
          <circle cx="74" cy="74" r="8" fill={Y} />
        </g>
      )}

      {kind === 'master' && (
        <g>
          <rect x="8" y="8" width="84" height="84" rx="14" fill="url(#mi-bg)" stroke="rgba(148,163,255,0.3)" strokeWidth="2" />
          <rect x="18" y="34" width="30" height="30" rx="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" transform="rotate(-10 33 49)" />
          <rect x="52" y="36" width="30" height="30" rx="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" transform="rotate(9 67 51)" />
          <circle cx="26" cy="44" r="3.4" fill="#1d2433" />
          <circle cx="40" cy="57" r="3.4" fill="#1d2433" />
          <circle cx="33" cy="50" r="3.4" fill="#1d2433" />
          <circle cx="60" cy="45" r="3.4" fill="#1d2433" />
          <circle cx="74" cy="58" r="3.4" fill="#1d2433" />
          <circle cx="67" cy="51" r="3.4" fill="#1d2433" />
          <path d="M50 14l2 4.6 5 .6-3.6 3.4.9 4.9-4.3-2.3-4.3 2.3.9-4.9-3.6-3.4 5-.6z" fill="url(#mi-gold)" />
          <circle cx="24" cy="80" r="5.5" fill={R} />
          <circle cx="76" cy="80" r="5.5" fill={B} />
        </g>
      )}

      {kind === 'duel' && (
        <g>
          <rect x="8" y="8" width="84" height="84" rx="14" fill="url(#mi-bg)" stroke="rgba(148,163,255,0.3)" strokeWidth="2" />
          <circle cx="34" cy="42" r="15" fill={R} stroke="#ff9d92" strokeWidth="2.5" />
          <circle cx="66" cy="58" r="15" fill={B} stroke="#9ecdf7" strokeWidth="2.5" />
          <path d="M46 22l2.5 5.8 6.3.8-4.6 4.3 1.2 6.2-5.4-3-5.4 3 1.2-6.2-4.6-4.3 6.3-.8z" fill="url(#mi-gold)" />
          <rect x="30" y="76" width="40" height="8" rx="4" fill="rgba(246,196,83,0.35)" />
        </g>
      )}

      {kind === 'party' && (
        <g>
          <rect x="8" y="8" width="84" height="84" rx="14" fill="url(#mi-bg)" stroke="rgba(148,163,255,0.3)" strokeWidth="2" />
          <circle cx="34" cy="32" r="12" fill={R} stroke="#ff9d92" strokeWidth="2.5" />
          <circle cx="66" cy="32" r="12" fill={G} stroke="#a4dd9f" strokeWidth="2.5" />
          <circle cx="34" cy="64" r="12" fill={B} stroke="#9ecdf7" strokeWidth="2.5" />
          <circle cx="66" cy="64" r="12" fill={Y} stroke="#ffefad" strokeWidth="2.5" />
          <circle cx="50" cy="48" r="10" fill="url(#mi-gold)" />
          <path d="M50 43.5l1.6 3.3 3.6.5-2.6 2.5.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.6-2.5 3.6-.5z" fill="#8a5a08" />
        </g>
      )}

      {kind === 'team' && (
        <g>
          <rect x="8" y="8" width="84" height="84" rx="14" fill="url(#mi-bg)" stroke="rgba(148,163,255,0.3)" strokeWidth="2" />
          <circle cx="30" cy="30" r="11" fill={R} stroke="#ff9d92" strokeWidth="2.5" />
          <circle cx="48" cy="30" r="11" fill={Y} stroke="#ffefad" strokeWidth="2.5" />
          <circle cx="52" cy="66" r="11" fill={G} stroke="#a4dd9f" strokeWidth="2.5" />
          <circle cx="70" cy="66" r="11" fill={B} stroke="#9ecdf7" strokeWidth="2.5" />
          <path d="M30 44v8M48 44v8M52 52v8M70 52v8" stroke="rgba(196,181,253,0.8)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M38 52h16M38 52l4-4M38 52l4 4" stroke="url(#mi-gold)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}

      {kind === 'practice' && (
        <g>
          <rect x="8" y="8" width="84" height="84" rx="14" fill="url(#mi-bg)" stroke="rgba(148,163,255,0.3)" strokeWidth="2" />
          <rect x="22" y="26" width="34" height="34" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="31" cy="35" r="3.6" fill="#1d2433" />
          <circle cx="47" cy="51" r="3.6" fill="#1d2433" />
          <circle cx="31" cy="51" r="3.6" fill="#1d2433" />
          <circle cx="47" cy="35" r="3.6" fill="#1d2433" />
          <g>
            <circle cx="72" cy="66" r="11" fill="#475569" stroke="#94a3b8" strokeWidth="2.5" />
            <rect x="66.5" y="61" width="11" height="8" rx="2" fill="none" stroke="#f8fafc" strokeWidth="2.2" />
            <path d="M69 61v-2.5a3 3 0 016 0V61" fill="none" stroke="#f8fafc" strokeWidth="2.2" />
          </g>
          <path d="M50 14l2 4.6 5 .6-3.6 3.4.9 4.9-4.3-2.3-4.3 2.3.9-4.9-3.6-3.4 5-.6z" fill="url(#mi-gold)" />
        </g>
      )}

      {kind === 'private' && (
        <g>
          <rect x="8" y="8" width="84" height="84" rx="14" fill="url(#mi-bg)" stroke="rgba(148,163,255,0.3)" strokeWidth="2" />
          <rect x="26" y="40" width="48" height="34" rx="9" fill="url(#mi-gold)" stroke="#b7850f" strokeWidth="2" />
          <path d="M36 40v-7a14 14 0 0128 0v7" fill="none" stroke="url(#mi-gold)" strokeWidth="6" />
          <circle cx="50" cy="54" r="5" fill="#8a5a08" />
          <rect x="48" y="56" width="4" height="9" rx="2" fill="#8a5a08" />
        </g>
      )}
    </svg>
  )
}
