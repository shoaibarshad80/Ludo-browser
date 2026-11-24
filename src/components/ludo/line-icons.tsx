'use client'

// ============================================================
// LINE ICON SET — the ONE icon style for the whole lobby.
// Every icon: 24px grid, 1.8px stroke, round caps + joins.
// Sourced from lucide-react (already round-capped) and wrapped
// so stroke width / size can never drift between screens.
// ============================================================

import {
  Bot, Camera, Check, ChevronRight, Copy, Dices, Flag, Gem, Gift, Globe, Home,
  KeyRound, Loader2, MessageCircle, Play, Plus, Send, Settings, ShoppingBag, Star,
  Trash2, Trophy, User, Users, Zap,
} from 'lucide-react'

type P = { size?: number; className?: string; strokeWidth?: number; fill?: string }

function base({ size = 24, strokeWidth = 1.8 }: P) {
  return {
    width: size,
    height: size,
    strokeWidth,
    'aria-hidden': true,
  } as const
}

// ---------- currency ----------

/** Win star — gold-filled star, 1.8 stroke. */
export function LnStar({ size = 24, className, strokeWidth = 1.8, fill = '#FFC94D' }: P) {
  return <Star {...base({ size, strokeWidth })} className={className} fill={fill} />
}

/** Coin — double-disc coin, reads at 16px. */
export function LnCoin({ size = 24, className, strokeWidth = 1.8 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="8.4" fill="#FFC94D" fillOpacity="0.18" />
      <circle cx="12" cy="12" r="4.6" />
    </svg>
  )
}

/** Gem — lucide gem (faceted diamond), 1.8 stroke. */
export function LnGem({ size = 24, className, strokeWidth = 1.8 }: P) {
  return <Gem {...base({ size, strokeWidth })} className={className} />
}

// ---------- chrome ----------

export const LnSettings = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Settings {...base({ size, strokeWidth })} className={className} />
)
export const LnTrophy = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Trophy {...base({ size, strokeWidth })} className={className} />
)
export const LnPlus = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Plus {...base({ size, strokeWidth })} className={className} />
)
export const LnGift = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Gift {...base({ size, strokeWidth })} className={className} />
)
export const LnCheck = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Check {...base({ size, strokeWidth })} className={className} />
)
export const LnDices = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Dices {...base({ size, strokeWidth })} className={className} />
)
export const LnZap = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Zap {...base({ size, strokeWidth })} className={className} />
)
export const LnChevron = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <ChevronRight {...base({ size, strokeWidth })} className={className} />
)
export const LnCopy = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Copy {...base({ size, strokeWidth })} className={className} />
)
export const LnCamera = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Camera {...base({ size, strokeWidth })} className={className} />
)
export const LnTrash = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Trash2 {...base({ size, strokeWidth })} className={className} />
)
export const LnGlobe = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Globe {...base({ size, strokeWidth })} className={className} />
)
export const LnSend = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Send {...base({ size, strokeWidth })} className={className} />
)
export const LnSpinner = ({ size = 24, className }: P) => (
  <Loader2 {...base({ size, strokeWidth: 1.8 })} className={className} />
)
export const LnBot = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Bot {...base({ size, strokeWidth })} className={className} />
)
export const LnFlag = ({ size = 24, className, strokeWidth = 1.8, fill = 'currentColor' }: P) => (
  <Flag {...base({ size, strokeWidth })} className={className} fill={fill} />
)
export const LnKey = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <KeyRound {...base({ size, strokeWidth })} className={className} />
)
/** Play — filled triangle inside a disc handled by the caller. */
export const LnPlayFill = ({ size = 24, className }: P) => (
  <Play {...base({ size, strokeWidth: 1.8 })} className={className} fill="currentColor" />
)

// ---------- bottom nav ----------

export const LnShop = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <ShoppingBag {...base({ size, strokeWidth })} className={className} />
)
export const LnFriends = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Users {...base({ size, strokeWidth })} className={className} />
)
export const LnHome = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <Home {...base({ size, strokeWidth })} className={className} />
)
export const LnProfile = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <User {...base({ size, strokeWidth })} className={className} />
)
export const LnChat = ({ size = 24, className, strokeWidth = 1.8 }: P) => (
  <MessageCircle {...base({ size, strokeWidth })} className={className} />
)
