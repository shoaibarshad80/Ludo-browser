'use client'

// ============================================================
// HOME LOBBY — Ludo STAR style
// Fixed-size (fills viewport, NO page scroll), phone-format
// column identical on desktop. Magenta/purple play-first theme.
// Focused play area — ONLY the four playable modes are shown:
//   2 PLAYER · 4 PLAYER · PRIVATE TABLE · OFFLINE
// Chrome: top currency bar, player row, a centered LUDO hero
// emblem and a slim Shop·Friends·Home·Collections·Chest nav.
// Fluff icons (bell, connection dot, left rail, tile badges)
// were removed — their features stay reachable via the tabs
// and chips they mirrored. All motion is transform-only CSS
// (composited, no JS loop) so the lobby stays smooth on low-end
// phones. Every existing action is preserved (modes, stakes,
// practice, daily reward, friends, leaderboard, sound, rooms).
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot, Camera, Check, ChevronRight, Copy, Flag, Gift, Globe,
  KeyRound, Loader2, Play, Send, Settings, Trash2, Trophy,
  Users, Zap,
} from 'lucide-react'
import {
  IconStarGold, LudoBadge,
  DecoDie, DecoToken, ChestArt,
} from '@/components/ludo/icons'
import { LnShop, LnFriends, LnHome, LnProfile, LnChest } from '@/components/ludo/line-icons'
import { Art2P, Art4P, ArtPrivate, ArtOffline } from '@/components/ludo/MenuArt'
import {
  Coin3D, Gem3D, Pawn2x3D, Pawn4x3D, Robot3D, Crown3D,
} from '@/components/ludo/art3d'
import HistoryGraph from '@/components/ludo/HistoryGraph'
import { useLudo, DAILY_REWARDS } from '@/stores/ludoStore'
import { AVATARS, FREE_REFILL, STAKES } from '@/lib/ludo/constants'
import { ACHIEVEMENTS, BOT_FRIENDS, LEADERBOARD_SEED, levelFromWins, rankTitle } from '@/lib/ludo/social'
import { LANGS, t, type Lang } from '@/lib/ludo/i18n'
import { sfx } from '@/lib/ludo/sounds'
import { AvatarRing, CoinIcon, GemIcon, LudoLogo, ModeIllustration } from '@/components/ludo/ui'
import type { GameMode } from '@/lib/ludo/types'

type LobbyTab = 'home' | 'friends' | 'profile' | 'chest' | 'shop'
type SheetKind = null | 'table2' | 'table4' | 'private' | 'offline' | 'ranks'

// ---------- shared atoms ----------

function CurrencyChip({
  value,
  icon,
  onClick,
  label,
  valueClass,
}: {
  value: string
  icon: React.ReactNode
  onClick?: () => void
  label: string
  valueClass?: string
}) {
  return (
    <motion.button
      whileTap={onClick ? { scale: 0.94 } : undefined}
      onClick={onClick}
      className="ls-lobby-chip flex items-center gap-1 rounded-full py-[3px] pl-1.5 pr-1"
      aria-label={label}
      title={label}
    >
      {icon}
      <span className={`ls-font text-[11px] leading-none ${valueClass ?? 'text-amber-100'}`}>{value}</span>
      {onClick && (
        <span
          className="grid h-4 w-4 place-items-center rounded-full text-[11px] font-black leading-none text-white"
          style={{ background: 'linear-gradient(180deg,#6cc257,#327c25)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
        >
          +
        </span>
      )}
    </motion.button>
  )
}

function PlayChip() {
  return (
    <span
      aria-hidden
      className="absolute bottom-0.5 right-0.5 grid h-7 w-7 place-items-center rounded-full"
      style={{
        background: 'linear-gradient(180deg,#ffe08a,#f0a10c)',
        boxShadow: '0 2px 6px rgba(60,25,0,0.55), inset 0 1px 0 rgba(255,255,255,0.65)',
      }}
    >
      <Play size={13} fill="#fff" className="translate-x-[1px] text-white" />
    </span>
  )
}

// ---------- main screen ----------

export default function MenuScreen() {
  const profile = useLudo((s) => s.profile)
  const hydrated = useLudo((s) => s.hydrated)
  const updateProfile = useLudo((s) => s.updateProfile)
  const refillCoins = useLudo((s) => s.refillCoins)
  const claimDaily = useLudo((s) => s.claimDaily)
  const daily = useLudo((s) => s.daily)
  const startLocalGame = useLudo((s) => s.startLocalGame)
  const onlineConnect = useLudo((s) => s.onlineConnect)
  const onlineError = useLudo((s) => s.onlineError)
  const onlineQuick = useLudo((s) => s.onlineQuick)
  const onlineCreate = useLudo((s) => s.onlineCreate)
  const onlineJoin = useLudo((s) => s.onlineJoin)
  const soundOn = useLudo((s) => s.soundOn)
  const toggleSound = useLudo((s) => s.toggleSound)
  const sfxOn = useLudo((s) => s.sfxOn)
  const setSfxOn = useLudo((s) => s.setSfxOn)
  const fileRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<LobbyTab>('home')
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [sheetMode, setSheetMode] = useState<GameMode>('classic')
  const [stake, setStake] = useState<number>(100)
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [offlineSeats, setOfflineSeats] = useState<2 | 4>(4)

  // pre-warm online connection so quick match feels instant
  useEffect(() => {
    onlineConnect()
  }, [onlineConnect])

  const lvl = levelFromWins(profile.wins)
  const lang = profile.lang
  const tr = (k: string) => t(lang, k)
  const dailyClaimable = daily?.lastClaim !== new Date().toLocaleDateString('en-CA')
  const onlineFriends = BOT_FRIENDS.filter((f) => f.status !== 'offline').length
  const unlockedAchievements = ACHIEVEMENTS.filter(
    (a) => a.progress({ wins: profile.wins, losses: profile.losses, coins: profile.coins, gems: profile.gems }) >= a.goal
  ).length

  const totalGames = profile.wins + profile.losses
  const winRate = totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0

  /** longest run of consecutive wins in recorded history */
  let run = 0
  const bestStreak = profile.history.reduce((best, h) => {
    run = h.won ? run + 1 : 0
    return Math.max(best, run)
  }, 0)

  function startVsComputer(gameMode: GameMode, playerCount: 2 | 4, useStake: number) {
    const botAvatars = AVATARS.filter((a) => a !== profile.avatar)
    const botNames = ['Rocky', 'Zuby', 'Lola', 'Kiki']
    const bots = playerCount === 2 ? 1 : 3
    const players = [{ name: profile.name, avatar: profile.avatar, isBot: false }]
    for (let i = 0; i < bots; i++) {
      players.push({ name: botNames[i], avatar: botAvatars[(i * 5) % botAvatars.length], isBot: true })
    }
    startLocalGame({ mode: gameMode, stake: useStake, players })
    setSheet(null)
  }

  function startPass(gameMode: GameMode, playerCount: 2 | 4, useStake: number) {
    const names = ['Player 2', 'Player 3', 'Player 4']
    const players = [
      { name: profile.name, avatar: profile.avatar, isBot: false },
      ...Array.from({ length: playerCount - 1 }, (_, i) => ({
        name: names[i],
        avatar: AVATARS[(i * 4 + 2) % AVATARS.length],
        isBot: false,
      })),
    ]
    startLocalGame({ mode: gameMode, stake: useStake, players })
    setSheet(null)
  }

  /** Play online from a mode sheet. 2 seats = dedicated room (share code / add bot); 4 seats = quick match. */
  function playOnlineFromSheet() {
    if (busy) return
    setBusy(true)
    if (sheet === 'table2') {
      onlineCreate({ stake, mode: sheetMode, seats: 2, botFill: false })
    } else {
      onlineQuick(stake, sheetMode)
    }
    setTimeout(() => setBusy(false), 2500)
    setSheet(null)
  }

  function copyInvite(code: string) {
    if (!code) return
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    }).catch(() => undefined)
  }

  /** pick a photo, center-crop it to a small square and use it as avatar */
  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f || !f.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const S = 96
        const canvas = document.createElement('canvas')
        canvas.width = S
        canvas.height = S
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const side = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S)
        try {
          updateProfile({ avatar: canvas.toDataURL('image/jpeg', 0.82) })
        } catch {
          /* storage full — ignore */
        }
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(f)
  }

  const hasPhoto = profile.avatar.startsWith('data:')

  const canPlay = profile.coins >= stake
  const seats: 2 | 4 = sheet === 'table2' ? 2 : 4

  if (!hydrated) {
    return (
      <div className="ls-bg-lobby fixed inset-0 grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <LudoLogo />
          <Loader2 className="h-6 w-6 animate-spin text-fuchsia-200" />
        </div>
      </div>
    )
  }

  return (
    <div className="ls-bg-lobby fixed inset-0 z-0 overflow-hidden">
      {/* desktop ambience outside the phone column */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 55% at 50% 42%, rgba(255,255,255,0.10) 0%, transparent 60%)' }} />

      <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col">

        {/* ============ TOP BAR (currency + settings) ============ */}
        <div className="flex items-center gap-1.5 px-2.5 pt-2.5">
          <CurrencyChip
            value={`${Math.min(profile.wins, 50)}/50`}
            icon={<IconStarGold size={16} />}
            onClick={() => setSheet('ranks')}
            label={`${tr('winStars')} ${profile.wins}/50 — ${tr('tapForLeaderboard')}`}
          />
          <CurrencyChip
            value={profile.coins.toLocaleString()}
            icon={<Coin3D size={24} />}
            onClick={refillCoins}
            label={`${tr('coins')} ${profile.coins.toLocaleString()} — ${tr('tapForRefill')}`}
          />
          <CurrencyChip
            value={profile.gems.toLocaleString()}
            icon={<Gem3D size={22} />}
            onClick={() => setTab('shop')}
            label={`${tr('gems')} ${profile.gems} — ${tr('tapForShop')}`}
            valueClass="text-teal-100"
          />
          <div className="ml-auto flex items-center gap-1.5">
            {/* settings */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setSettingsOpen((o) => !o); sfx.click() }}
                className="ls-lobby-chip grid h-9 w-9 place-items-center rounded-full text-fuchsia-100"
                aria-label={tr('settings')}
              >
                <Settings size={20} />
              </motion.button>
              <AnimatePresence>
                {settingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="ls-sheet absolute right-0 top-10 z-50 w-56 rounded-2xl p-2"
                  >
                    <p className="ls-font px-2 pb-1 pt-0.5 text-[10px] tracking-wide text-amber-200">{tr('language')}</p>
                    <div className="grid grid-cols-3 gap-1 px-1">
                      {LANGS.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => { updateProfile({ lang: l.id as Lang }); sfx.click() }}
                          className="ls-option ls-font rounded-lg py-1.5 text-[11px] text-white"
                          data-active={lang === l.id}
                        >
                          {l.native}
                        </button>
                      ))}
                    </div>
                    <div className="mx-2 my-1.5 border-t border-white/10" />
                    <button
                      onClick={() => { toggleSound(); sfx.click() }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-fuchsia-50 transition hover:bg-white/10"
                    >
                      {tr('sound')}
                      <span className={`ls-switch ${soundOn ? 'ls-switch-on' : ''}`}>
                        <span className="ls-switch-dot" />
                      </span>
                    </button>
                    <button
                      onClick={() => { setSfxOn(!sfxOn); sfx.click() }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-fuchsia-50 transition hover:bg-white/10"
                    >
                      {tr('soundEffects')}
                      <span className={`ls-switch ${sfxOn ? 'ls-switch-on' : ''}`}>
                        <span className="ls-switch-dot" />
                      </span>
                    </button>
                    <div className="mx-2 my-1.5 border-t border-white/10" />
                    <button
                      onClick={() => { setTab('profile'); setSettingsOpen(false); sfx.click() }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-fuchsia-50 transition hover:bg-white/10"
                    >
                      {tr('editProfile')} <ChevronRight size={14} className="text-fuchsia-200" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ============ PLAYER ROW (avatar + level) ============ */}
        <div className="flex items-center gap-2.5 px-2.5 pt-2">
          <button onClick={() => { setTab('profile'); sfx.click() }} className="relative shrink-0" aria-label={tr('profile')}>
            <AvatarRing avatar={profile.avatar} size={46} />
            <span
              className="ls-font absolute -bottom-1 -right-1.5 grid h-[22px] min-w-[22px] place-items-center rounded-full px-1 text-[10px] text-white"
              style={{ background: 'linear-gradient(180deg,#ff9d3c,#e8720c)', boxShadow: '0 2px 5px rgba(0,0,0,0.45), 0 0 0 2.5px rgba(90,15,80,0.9)' }}
            >
              {lvl.level}
            </span>
          </button>
          <div className="min-w-0">
            <p className="ls-font truncate text-sm leading-tight text-white">{profile.name}</p>
            <span
              className="ls-font mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-[2px] text-[9px] leading-none text-white"
              style={{ background: 'linear-gradient(180deg,#ff9d3c,#e8720c)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }}
            >
              <Flag size={9} fill="#fff" /> {tr('level')} {lvl.level}
            </span>
            <div
              className="mt-1.5 h-[5px] w-[112px] overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.14)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.35)' }}
              title={`XP ${lvl.xpNow}/${lvl.xpNeed} to level ${lvl.level + 1}`}
            >
              <div
                className="ls-xp-fill h-full rounded-full"
                style={{
                  width: `${Math.max(6, lvl.pct)}%`,
                  background: 'linear-gradient(90deg,#ffd76e,#ff9d3c)',
                  boxShadow: '0 0 6px rgba(255,180,60,0.7)',
                }}
              />
            </div>
          </div>

          <span
            className="ls-lobby-chip ls-font ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] leading-none text-amber-100"
            title={tr('totalWins')}
          >
            <Trophy size={11} className="text-amber-300" /> {profile.wins} {tr('winsShort').toUpperCase()}
          </span>
        </div>

        {/* ============ MAIN (LUDO hero + play tiles) ============ */}
        <main className="relative flex min-h-0 flex-1 flex-col px-3">
          {/* LUDO hero — emblem + wordmark (transform-only float), centered with equal top/bottom space */}
          <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center">
            <div className="ls-hero-float relative">
              <span aria-hidden className="ls-hero-halo absolute -inset-4 rounded-[34%]" />
              <div className="aspect-square h-[min(20vh,92px)]">
                <LudoBadge size={92} className="h-full w-full" />
              </div>
            </div>
            <h1 className="ls-font ls-hero-word mt-2">LUDO</h1>
            <p className="ls-font ls-hero-star">STAR</p>
          </div>

          {/* ============ DAILY REWARD strip — tap left for chest details, pill claims instantly ============ */}
          <div className="ls-panel ls-panel-gold relative z-10 mb-2.5 mt-2.5 flex shrink-0 items-center gap-2 rounded-2xl p-2">
            <button
              onClick={() => { setTab('chest'); sfx.click() }}
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              aria-label={`${tr('dailyReward')} — ${tr('chest')}`}
            >
              <span className={`shrink-0 ${dailyClaimable ? 'ls-chest-wiggle' : ''}`}>
                <ChestArt size={34} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="ls-font block truncate text-[12.5px] leading-tight text-white">
                  {dailyClaimable ? `${tr('dailyReward')} · ${tr('day')} ${(daily?.streak ?? 0) + 1}` : tr('claimedBack')}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-100/90">
                  <CoinIcon size={11} />
                  {DAILY_REWARDS[daily ? Math.min(6, daily.streak) : 0].toLocaleString()} {tr('coinsShort')}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-[3px]" aria-hidden>
                {DAILY_REWARDS.map((r, i) => {
                  const reached = (daily?.streak ?? 0) > i || (dailyClaimable && (daily?.streak ?? 0) === i)
                  return <span key={i} className={`h-[7px] w-[7px] rounded-full ${reached ? 'bg-amber-300' : 'bg-white/20'}`} />
                })}
              </span>
            </button>
            {dailyClaimable ? (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => { claimDaily(); sfx.click() }}
                className="ls-font min-h-[42px] shrink-0 rounded-full px-3.5 text-[11px] font-semibold tracking-wide text-[#3A1D00]"
                style={{
                  background: 'linear-gradient(180deg,#ffe08a 0%,#f4ad38 55%,#df8f0b 100%)',
                  boxShadow: '0 3px 0 #8a5a06, 0 6px 14px rgba(12,2,28,0.45), inset 0 2px 0 rgba(255,255,255,0.6)',
                }}
                aria-label={`${tr('claim')} ${tr('dailyReward')}`}
              >
                {tr('claim')}
              </motion.button>
            ) : (
              <span
                className="ls-font grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full text-[15px] text-emerald-300"
                style={{ background: 'rgba(16,185,129,0.16)', boxShadow: 'inset 0 0 0 1.5px rgba(52,211,153,0.45)' }}
                aria-hidden
              >
                ✓
              </span>
            )}
          </div>

          {/* two CSS-only floaters (composited transform, no JS loop) */}
          <div className="ls-float-a pointer-events-none absolute left-5 top-[20%] z-0" aria-hidden>
            <DecoDie value={5} size={30} tilt={14} />
          </div>
          <div className="ls-float-b pointer-events-none absolute right-6 top-[62%] z-0" aria-hidden>
            <DecoToken color="blue" size={20} />
          </div>

          {/* first row — 2 PLAYER + PRIVATE TABLE */}
          <div className="relative z-10 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => { setSheet('table2'); setSheetMode('classic'); sfx.click() }}
              className="ls-tile-gold ls-shine ls-rise relative flex h-[min(36vw,20vh,148px)] flex-col overflow-hidden rounded-2xl p-1.5"
              style={{ '--d': '60ms' } as React.CSSProperties}
              aria-label="Play 2 player"
            >
              <div className="relative min-h-0 flex-1">
                <div className="grid h-full place-items-center pb-0.5"><Pawn2x3D size={70} /></div>
                <PlayChip />
              </div>
              <span className="ls-font pb-1 text-center text-[15px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(150,80,0,0.7)' }}>{tr('twoPlayer')}</span>
            </button>

            <button
              onClick={() => { setSheet('private'); sfx.click() }}
              className="ls-tile-purple ls-shine ls-rise relative flex h-[min(36vw,20vh,148px)] flex-col overflow-hidden rounded-2xl p-1.5"
              style={{ '--d': '140ms' } as React.CSSProperties}
              aria-label="Open private table"
            >
              <div className="relative min-h-0 flex-1">
                <div className="grid h-full place-items-center pb-0.5"><Crown3D size={62} /></div>
                <PlayChip />
              </div>
              <span className="ls-font pb-1 text-center text-[13px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(40,10,90,0.7)' }}>{tr('privateTable')}</span>
            </button>
          </div>

          {/* second row — 4 PLAYER + OFFLINE */}
          <div className="relative z-10 mt-2.5 grid grid-cols-2 gap-2.5 pb-1.5">
            <button
              onClick={() => { setSheet('table4'); setSheetMode('classic'); sfx.click() }}
              className="ls-tile-purple ls-shine ls-rise relative flex h-[min(30vw,16vh,124px)] flex-col overflow-hidden rounded-2xl p-1.5"
              style={{ '--d': '220ms' } as React.CSSProperties}
              aria-label="Play 4 player"
            >
              <div className="relative min-h-0 flex-1">
                <div className="grid h-full place-items-center pb-0.5"><Pawn4x3D size={62} /></div>
                <PlayChip />
              </div>
              <span className="ls-font pb-1 text-center text-[13px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(40,10,90,0.7)' }}>{tr('fourPlayer')}</span>
            </button>

            <button
              onClick={() => { setSheet('offline'); setSheetMode('classic'); sfx.click() }}
              className="ls-tile-green ls-shine ls-rise relative flex h-[min(30vw,16vh,124px)] flex-col overflow-hidden rounded-2xl p-1.5"
              style={{ '--d': '300ms' } as React.CSSProperties}
              aria-label="Play offline — bots or pass and play"
            >
              <div className="relative min-h-0 flex-1">
                <div className="grid h-full place-items-center pb-0.5"><Robot3D size={56} /></div>
                <PlayChip />
              </div>
              <span className="ls-font pb-1 text-center text-[13px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(10,60,30,0.7)' }}>{tr('offline')}</span>
            </button>
          </div>
        </main>

        {/* ============ BOTTOM NAV — floating rounded bar, line icons, amber pill ============ */}
        <nav className="relative z-40 shrink-0 px-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}>
          <div className="ls-nav-v2 mx-auto grid h-[64px] w-full max-w-[430px] grid-cols-5">
            {([
              { id: 'shop', icon: <LnShop size={22} />, label: tr('shop'), badge: 0 },
              { id: 'friends', icon: <LnFriends size={22} />, label: tr('friends'), badge: 0 },
              { id: 'home', icon: <LnHome size={22} />, label: tr('home'), badge: 0 },
              { id: 'profile', icon: <LnProfile size={22} />, label: tr('profile'), badge: unlockedAchievements },
              { id: 'chest', icon: <LnChest size={22} />, label: tr('chest'), badge: dailyClaimable ? 1 : 0 },
            ] as Array<{ id: LobbyTab; icon: React.ReactNode; label: string; badge?: number }>).map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); sfx.click() }}
                  className="ls-nav-item flex min-w-0 items-center justify-center"
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <span className={`flex flex-col items-center gap-[3px] rounded-[18px] px-3 py-[7px] transition-colors duration-150 ${active ? 'ls-nav-pill' : ''}`}>
                    <span className={`relative ${active ? 'ls-nav-pill-ico' : 'text-white/80'}`}>
                      {item.icon}
                      {item.badge ? (
                        <span
                          className="ls-font ls-badge-pulse absolute -right-2 -top-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[9px] font-bold leading-none text-[#3A1D00]"
                          style={{
                            background: 'linear-gradient(180deg,#ffc94d 0%,#f5a623 58%,#ef8f0d 100%)',
                            boxShadow: '0 0 0 2px rgba(14,5,30,0.95), 0 2px 5px rgba(0,0,0,0.4)',
                          }}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className={`ls-font max-w-[68px] truncate text-[10px] leading-none ${active ? 'font-semibold text-[#3A1D00]' : 'text-white/70'}`}>
                      {item.label}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* ============ NON-HOME TAB PANELS (inside fixed frame) ============ */}
      <AnimatePresence>
        {tab !== 'home' && (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-30 mx-auto flex w-full max-w-[430px] flex-col px-3 pb-[102px] pt-[104px]"
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="ls-font text-lg text-white">
                {tab === 'shop' && tr('shop').toUpperCase()}
                {tab === 'friends' && tr('friends').toUpperCase()}
                {tab === 'profile' && tr('myProfile')}
                {tab === 'chest' && tr('chest').toUpperCase()}
              </h2>
              <button onClick={() => setTab('home')} className="ls-lobby-chip grid h-8 w-8 place-items-center rounded-full text-white" aria-label="Close">
                <ChevronRight size={16} className="rotate-90" />
              </button>
            </div>
            <div className="ls-scroll ls-sheet min-h-0 flex-1 overflow-y-auto rounded-3xl p-3">

              {/* ---- SHOP ---- */}
              {tab === 'shop' && (
                <div className="space-y-2.5">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={refillCoins}
                    className="ls-tile-gold flex w-full items-center gap-3 rounded-2xl p-3 text-left"
                  >
                    <CoinIcon size={38} animated />
                    <div className="flex-1">
                      <p className="ls-font text-sm text-white">{tr('freeRefill')}</p>
                      <p className="text-[10px] text-amber-100/80">{tr('tapAnytime')} +{FREE_REFILL.toLocaleString()} {tr('coins')}</p>
                    </div>
                    <span className="ls-font rounded-xl bg-black/25 px-3 py-1.5 text-xs text-white">+{FREE_REFILL.toLocaleString()}</span>
                  </motion.button>

                  <div className="ls-tile-purple flex items-center gap-3 rounded-2xl p-3">
                    <GemIcon size={34} animated />
                    <div className="flex-1">
                      <p className="ls-font text-sm text-white">{tr('gems')}</p>
                      <p className="text-[10px] text-fuchsia-100/75">{tr('earnGems')}</p>
                    </div>
                    <span className="ls-font text-sm text-teal-100">{profile.gems.toLocaleString()}</span>
                  </div>

                  <div className="ls-panel rounded-2xl p-3">
                    <p className="ls-font text-xs text-amber-200">{tr('moreWays')}</p>
                    <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-fuchsia-50/80">
                      <li className="flex items-center gap-2"><Gift size={12} className="text-amber-200" /> {tr('dailyChestLine')}</li>
                      <li className="flex items-center gap-2"><Trophy size={12} className="text-amber-200" /> {tr('winOnlineLine')}</li>
                      <li className="flex items-center gap-2"><IconStarGold size={13} /> {tr('streakStarsLine')}</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ---- FRIENDS ---- */}
              {tab === 'friends' && (
                <div>
                  <p className="mb-2 text-[11px] text-fuchsia-100/70">{onlineFriends} {tr('friendsOnlineNow')}</p>
                  <div className="space-y-2">
                    {BOT_FRIENDS.map((f) => {
                      const statusColor = f.status === 'online' ? '#4ade80' : f.status === 'in-game' ? '#f6c453' : '#64748b'
                      return (
                        <div key={f.name} className="ls-panel flex items-center gap-2.5 rounded-2xl px-2.5 py-2">
                          <div className="relative">
                            <AvatarRing avatar={f.avatar} size={36} />
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#1b0630]" style={{ background: statusColor }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="ls-font truncate text-xs text-white">{f.name}</p>
                            <p className="text-[9px] text-fuchsia-100/60">
                              {f.status === 'in-game' ? `${tr('playingAt')} ${f.table}` : f.status === 'online' ? `${tr('level')} ${f.level} · ${tr('online')}` : tr('offline')}
                            </p>
                          </div>
                          {f.status !== 'offline' && (
                            <button
                              onClick={() => startVsComputer('classic', 4, 0)}
                              className="ls-btn ls-btn-green ls-font flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] text-white"
                            >
                              <Zap size={10} /> {tr('play')}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[10px] leading-relaxed text-fuchsia-100/60">
                    {tr('inviteNote')}
                  </p>
                </div>
              )}

              {/* ---- COLLECTIONS (profile + achievements) ---- */}
              {tab === 'profile' && (
                <div className="space-y-3">
                  <div className="ls-panel rounded-2xl p-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <AvatarRing avatar={profile.avatar} size={64} />
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="absolute -bottom-1.5 -right-1.5 grid h-8 w-8 place-items-center rounded-full text-white"
                          style={{ background: 'linear-gradient(180deg,#a05ce8,#5b1fa8)', border: '2px solid rgba(255,255,255,0.85)', boxShadow: '0 3px 8px rgba(10,2,30,0.5)' }}
                          aria-label={tr('changePhoto')}
                          title={tr('changePhoto')}
                        >
                          <Camera size={14} />
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <input
                          value={profile.name}
                          onChange={(e) => updateProfile({ name: e.target.value.slice(0, 14) })}
                          className="ls-glass-input ls-font w-full rounded-xl px-3 py-2 text-sm font-bold text-white"
                          aria-label={tr('yourName')}
                          maxLength={14}
                          placeholder={tr('yourName')}
                        />
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <p className="ls-font text-[10px] text-amber-200/85">LV {lvl.level} · {rankTitle(lvl.level)}</p>
                          {hasPhoto && (
                            <button
                              onClick={() => { updateProfile({ avatar: AVATARS[0] }); sfx.click() }}
                              className="ls-font ml-auto inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[8.5px] text-fuchsia-100/80 ring-1 ring-white/15"
                            >
                              <Trash2 size={9} /> {tr('removePhoto')}
                            </button>
                          )}
                        </div>
                        <p className="mt-0.5 text-[9px] text-fuchsia-100/60">{lvl.xpNow}/{lvl.xpNeed} {tr('toLevel')} {lvl.level + 1}</p>
                      </div>
                    </div>
                  </div>

                  <div className="ls-panel rounded-2xl p-3.5">
                    <p className="ls-font mb-2 text-xs text-amber-200">{tr('stats')}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {([
                        { label: tr('gamesPlayed'), value: totalGames, tone: 'text-white' },
                        { label: tr('wins'), value: profile.wins, tone: 'text-emerald-300' },
                        { label: tr('losses'), value: profile.losses, tone: 'text-rose-300' },
                        { label: tr('winRate'), value: `${winRate}%`, tone: 'text-amber-200' },
                        { label: tr('bestStreak'), value: bestStreak, tone: 'text-orange-300' },
                        { label: tr('level'), value: lvl.level, tone: 'text-violet-300' },
                      ] as Array<{ label: string; value: React.ReactNode; tone: string }>).map((s) => (
                        <div key={s.label} className="ls-panel rounded-xl py-2">
                          <p className={`ls-font text-base ${s.tone}`}>{s.value}</p>
                          <p className="text-[8px] uppercase tracking-wide text-fuchsia-100/50">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <HistoryGraph
                    history={profile.history}
                    coins={profile.coins}
                    title={tr('recentTimeline')}
                    empty={tr('playToSeeTimeline')}
                    onPlay={() => { setSheet('table4'); setSheetMode('classic'); sfx.click() }}
                  />

                  <div className="ls-panel rounded-2xl p-3.5">
                    <p className="ls-font mb-2 text-xs text-amber-200">{tr('chooseAvatar')}</p>
                    <div className="flex flex-wrap gap-2">
                      {AVATARS.map((a) => (
                        <motion.button
                          key={a}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { updateProfile({ avatar: a }); sfx.click() }}
                          className="grid h-10 w-10 place-items-center rounded-full text-xl"
                          style={
                            profile.avatar === a
                              ? { background: 'rgba(246,196,83,0.22)', boxShadow: '0 0 0 2.5px #f6c453' }
                              : { background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.2)' }
                          }
                          aria-label={`Choose avatar ${a}`}
                        >
                          {a}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="ls-panel rounded-2xl p-3.5">
                    <p className="ls-font mb-2 text-xs text-amber-200">{tr('achievements')}</p>
                    <div className="space-y-2">
                      {ACHIEVEMENTS.map((a) => {
                        const val = a.progress({ wins: profile.wins, losses: profile.losses, coins: profile.coins, gems: profile.gems })
                        const done = val >= a.goal
                        return (
                          <div key={a.id} className="flex items-center gap-2.5">
                            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg ${done ? 'bg-amber-400/20 ring-1 ring-amber-300/50' : 'bg-white/5 ring-1 ring-white/10'}`}>{a.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="ls-font truncate text-[11px] text-white">{a.name}</p>
                                {done && <Check size={13} className="shrink-0 text-emerald-400" />}
                              </div>
                              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/30">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (val / a.goal) * 100)}%`, background: 'linear-gradient(90deg,#34d399,#f6c453)' }} />
                              </div>
                            </div>
                            <span className="text-[8px] text-fuchsia-100/50">{Math.min(val, a.goal).toLocaleString()}/{a.goal.toLocaleString()}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ---- CHEST (daily reward) ---- */}
              {tab === 'chest' && (
                <div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={claimDaily}
                    disabled={!dailyClaimable}
                    className="ls-tile-gold relative flex w-full flex-col items-center gap-1.5 overflow-hidden rounded-3xl py-6"
                  >
                    <motion.span
                      animate={dailyClaimable ? { rotate: [0, -7, 7, 0], scale: [1, 1.06, 1] } : undefined}
                      transition={{ repeat: Infinity, duration: 2.2 }}
                    >
                      <ChestArt size={92} />
                    </motion.span>
                    <span className="ls-font text-lg text-white" style={{ textShadow: '0 2px 0 rgba(150,80,0,0.7)' }}>
                      {dailyClaimable ? `${tr('day')} ${(daily?.streak ?? 0) + 1} — ${tr('claim')}` : tr('claimedBack')}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-100/85">
                      <CoinIcon size={13} />
                      {DAILY_REWARDS[daily ? Math.min(6, daily.streak) : 0].toLocaleString()} {tr('coinsShort')}
                    </span>
                  </motion.button>

                  <div className="ls-panel mt-3 rounded-2xl p-3">
                    <p className="ls-font mb-2 text-xs text-amber-200">{tr('streakStars')}</p>
                    <div className="grid grid-cols-7 gap-1">
                      {DAILY_REWARDS.map((r, i) => {
                        const reached = (daily?.streak ?? 0) > i || (dailyClaimable && (daily?.streak ?? 0) === i)
                        return (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <span
                              className={`grid h-9 w-full place-items-center rounded-lg text-[9px] ls-font ${reached ? 'text-amber-100' : 'text-fuchsia-100/40'}`}
                              style={{
                                background: reached ? 'linear-gradient(180deg,#a94b12,#7c1f6e)' : 'rgba(0,0,0,0.28)',
                                boxShadow: reached ? 'inset 0 0 0 1.5px rgba(255,224,138,0.55)' : 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                              }}
                            >
                              {r >= 1000 ? `${r / 1000}k` : r}
                            </span>
                            <span className="text-[7px] uppercase text-fuchsia-100/50">D{i + 1}</span>
                          </div>
                        )
                      })}
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-fuchsia-100/60">{tr('chestNote')}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ SHEETS (table setup / private / ranks) ============ */}
      <AnimatePresence>
        {sheet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50">
            <div className="absolute inset-0 bg-black/55" onClick={() => setSheet(null)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px]"
            >
              <div className="ls-sheet ls-scroll max-h-[72vh] overflow-y-auto rounded-t-3xl p-4 pb-6">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" />

                {/* ---- TABLE SHEET (2 / 4 player) ---- */}
                {(sheet === 'table2' || sheet === 'table4') && (
                  <div>
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="h-11 w-11">{sheet === 'table2' ? <Art2P /> : <Art4P />}</div>
                      <div>
                        <h3 className="ls-font text-lg leading-tight text-white">{sheet === 'table2' ? tr('twoPlayer') : tr('fourPlayer')}</h3>
                        <p className="text-[10px] text-fuchsia-100/60">
                          {sheet === 'table2' ? tr('oneVOne') : tr('fourSeats')}
                        </p>
                      </div>
                    </div>

                    <p className="ls-font mb-1.5 text-[10px] tracking-wide text-amber-200">{tr('gameType')}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['classic', 'quick', 'master'] as GameMode[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setSheetMode(m)}
                          data-active={sheetMode === m}
                          className="ls-option ls-font flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] text-white"
                        >
                          <ModeIllustration kind={m} size={30} />
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <p className="ls-font mb-1.5 mt-3 text-[10px] tracking-wide text-amber-200">{tr('entryStake')}</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[...STAKES].map((s) => {
                        const afford = profile.coins >= s
                        return (
                          <button
                            key={s}
                            onClick={() => afford && setStake(s)}
                            disabled={!afford}
                            data-active={stake === s}
                            className={`ls-option ls-font flex items-center justify-center gap-1 rounded-xl py-2 text-[11px] text-white ${!afford ? 'opacity-35' : ''}`}
                          >
                            <CoinIcon size={12} /> {s.toLocaleString()}
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-3.5 grid grid-cols-1 gap-2">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={playOnlineFromSheet}
                        disabled={!canPlay || busy}
                        className="ls-btn ls-btn-gold ls-font flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base text-white"
                      >
                        {busy ? (
                          <span className="inline-flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> {tr('findingTable')}</span>
                        ) : (
                          <>
                            <Globe size={17} /> {tr('playOnline')}
                          </>
                        )}
                      </motion.button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => startVsComputer(sheetMode, seats, stake)}
                          className="ls-btn ls-btn-green ls-font flex items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-[11px] text-white"
                        >
                          <Bot size={13} /> {tr('vsBot')}
                        </button>
                        <button
                          onClick={() => startPass(sheetMode, seats, stake)}
                          className="ls-btn ls-font flex items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-[11px] text-white"
                        >
                          <Users size={13} /> {tr('passNPlay')}
                        </button>
                      </div>
                    </div>

                    {!canPlay && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-950/50 px-3 py-2">
                        <span className="text-[11px] text-rose-200">{tr('notEnoughCoins')}</span>
                        <button onClick={refillCoins} className="ls-font ml-auto rounded-full px-3 py-1 text-[10px] text-[#4a2c00]" style={{ background: 'linear-gradient(180deg,#ffe08a,#e09b1a)' }}>
                          {tr('freeRefillBtn')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ---- PRIVATE TABLE SHEET ---- */}
                {sheet === 'private' && (
                  <div>
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="h-11 w-11"><ArtPrivate /></div>
                      <div>
                        <h3 className="ls-font text-lg leading-tight text-white">{tr('privateTable')}</h3>
                        <p className="text-[10px] text-fuchsia-100/60">{tr('roomWithFriends')}</p>
                      </div>
                    </div>

                    <p className="ls-font mb-1.5 text-[10px] tracking-wide text-amber-200">{tr('entryStake')}</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[...STAKES].map((s) => {
                        const afford = profile.coins >= s
                        return (
                          <button
                            key={s}
                            onClick={() => afford && setStake(s)}
                            disabled={!afford}
                            data-active={stake === s}
                            className={`ls-option ls-font flex items-center justify-center gap-1 rounded-xl py-2 text-[11px] text-white ${!afford ? 'opacity-35' : ''}`}
                          >
                            <CoinIcon size={12} /> {s.toLocaleString()}
                          </button>
                        )
                      })}
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (!canPlay || busy) return
                        setBusy(true)
                        onlineCreate({ stake, mode: 'classic', seats: 4, botFill: true })
                        setTimeout(() => setBusy(false), 2500)
                        setSheet(null)
                      }}
                      disabled={!canPlay || busy}
                      className="ls-btn ls-btn-gold ls-font mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base text-white"
                    >
                      {busy ? (
                        <span className="inline-flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> {tr('creating')}</span>
                      ) : (
                        <>
                          <KeyRound size={17} /> {tr('createRoom')}
                        </>
                      )}
                    </motion.button>

                    <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                      <input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                        placeholder={tr('roomCode')}
                        className="ls-glass-input min-w-0 flex-1 rounded-xl px-3 py-2.5 text-center text-sm font-black tracking-[0.25em] text-white placeholder:tracking-normal placeholder:text-fuchsia-100/40"
                        aria-label="Room code"
                      />
                      <button
                        onClick={() => canPlay && joinCode.length >= 3 && onlineJoin(joinCode, stake, 'classic')}
                        disabled={!canPlay || joinCode.length < 3}
                        className="ls-btn ls-btn-green ls-font flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm text-white disabled:opacity-40"
                      >
                        <Send size={13} /> {tr('join')}
                      </button>
                    </div>

                    {!canPlay && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-950/50 px-3 py-2">
                        <span className="text-[11px] text-rose-200">{tr('notEnoughCoins')}</span>
                        <button onClick={refillCoins} className="ls-font ml-auto rounded-full px-3 py-1 text-[10px] text-[#4a2c00]" style={{ background: 'linear-gradient(180deg,#ffe08a,#e09b1a)' }}>
                          {tr('freeRefillBtn')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ---- OFFLINE SHEET ---- */}
                {sheet === 'offline' && (
                  <div>
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="h-11 w-11"><ArtOffline /></div>
                      <div>
                        <h3 className="ls-font text-lg leading-tight text-white">{tr('offline')}</h3>
                        <p className="text-[10px] text-fuchsia-100/60">{tr('playInstant')}</p>
                      </div>
                    </div>

                    <p className="ls-font mb-1.5 text-[10px] tracking-wide text-amber-200">{tr('gameType')}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['classic', 'quick', 'master'] as GameMode[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setSheetMode(m)}
                          data-active={sheetMode === m}
                          className="ls-option ls-font flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] text-white"
                        >
                          <ModeIllustration kind={m} size={30} />
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <p className="ls-font mb-1.5 mt-3 text-[10px] tracking-wide text-amber-200">{tr('players')}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([2, 4] as Array<2 | 4>).map((n) => (
                        <button
                          key={n}
                          onClick={() => setOfflineSeats(n)}
                          data-active={offlineSeats === n}
                          className="ls-option ls-font flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] text-white"
                        >
                          <Users size={13} /> {n} {tr('players')}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3.5 grid grid-cols-1 gap-2">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => startVsComputer(sheetMode, offlineSeats, 0)}
                        className="ls-btn ls-btn-gold ls-font flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base text-white"
                      >
                        <Bot size={18} /> {tr('vsComputer')}
                      </motion.button>
                      <button
                        onClick={() => startPass(sheetMode, offlineSeats, 0)}
                        className="ls-btn ls-btn-green ls-font flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] text-white"
                      >
                        <Users size={14} /> {tr('passNPlay')}
                      </button>
                    </div>
                  </div>
                )}

                {/* ---- RANKS SHEET ---- */}
                {sheet === 'ranks' && (
                  <div>
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl text-amber-200" style={{ background: 'rgba(246,196,83,0.15)', boxShadow: 'inset 0 0 0 1.5px rgba(246,196,83,0.4)' }}>
                        <Trophy size={22} />
                      </span>
                      <div>
                        <h3 className="ls-font text-lg leading-tight text-white">{tr('leaderboard')}</h3>
                        <p className="text-[10px] text-fuchsia-100/60">{tr('season')}</p>
                      </div>
                    </div>
                    <div className="ls-panel overflow-hidden rounded-2xl">
                      {(() => {
                        const rows = [...LEADERBOARD_SEED, { name: profile.name, avatar: profile.avatar, wins: profile.wins, trophies: Math.floor(profile.wins / 3), isYou: true }]
                          .sort((a, b) => b.wins - a.wins)
                        return rows.map((r, i) => (
                          <div key={r.name + i} className={`flex items-center gap-2.5 border-b border-white/5 px-3 py-2 last:border-0 ${'isYou' in r && r.isYou ? 'bg-amber-400/10' : ''}`}>
                            <span
                              className="ls-font grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs"
                              style={{
                                background: i === 0 ? 'linear-gradient(180deg,#ffe08a,#e09b1a)' : i === 1 ? 'linear-gradient(180deg,#e2e8f0,#94a3b8)' : i === 2 ? 'linear-gradient(180deg,#d97706,#92400e)' : 'rgba(255,255,255,0.08)',
                                color: i < 3 ? '#3b2200' : '#f3e8ff',
                              }}
                            >
                              {i + 1}
                            </span>
                            <AvatarRing avatar={r.avatar} size={30} />
                            <span className={`ls-font min-w-0 flex-1 truncate text-xs ${'isYou' in r && r.isYou ? 'text-amber-200' : 'text-white'}`}>
                              {r.name}{'isYou' in r && r.isYou ? ` ${tr('you')}` : ''}
                            </span>
                            <span className="text-[10px] text-fuchsia-100/60">{r.trophies} 🏆</span>
                            <span className="ls-font w-12 text-right text-[11px] text-amber-100">{r.wins} {tr('winsShort')}</span>
                          </div>
                        ))
                      })()}
                    </div>
                    <p className="mt-2 text-[10px] text-fuchsia-100/50">{tr('winsFromAll')}</p>
                  </div>
                )}

                {onlineError && (
                  <p className="mt-2.5 rounded-lg border border-rose-400/30 bg-rose-950/50 px-3 py-1.5 text-[11px] text-rose-200">{onlineError}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* copied toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="ls-sheet fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs text-white"
          >
            <Copy size={13} className="text-emerald-300" /> {tr('copied')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
