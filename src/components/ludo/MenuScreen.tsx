'use client'

// ============================================================
// HOME LOBBY — Ludo STAR style
// Fixed-size (fills viewport, NO page scroll), phone-format
// column identical on desktop. Magenta/purple play-first theme.
// Focused play area — ONLY the four playable modes are shown:
//   2 PLAYER · 4 PLAYER · PRIVATE TABLE · OFFLINE
// Chrome kept from the reference: top currency bar, player row,
// left rail, watermark, Shop·Friends·Home·Collections·Chest nav.
// Every existing action is preserved (modes, stakes, practice,
// daily reward, friends, leaderboard, profile, sound, rooms).
// ============================================================

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell, Bot, CalendarDays, Check, ChevronRight, Copy, Flag, Gift, Globe,
  KeyRound, Loader2, Play, Send, Settings, Trophy,
  Users, Volume2, VolumeX, Zap,
} from 'lucide-react'
import {
  NavShop, NavFriends, NavHome, NavCollections,
  RailEvents, RailClubs,
  IconStarGold, HomeGlyph,
  CrownArt, DecoDie, DecoToken, ChestArt,
} from '@/components/ludo/icons'
import { Art2P, Art4P, ArtPrivate, ArtOffline } from '@/components/ludo/MenuArt'
import {
  Coin3D, Gem3D, Chest3D, Trophy3D, Dice3D, Pawn2x3D, Pawn4x3D, Robot3D, Crown3D, Gift3D,
} from '@/components/ludo/art3d'
import HistoryGraph from '@/components/ludo/HistoryGraph'
import { useLudo } from '@/stores/ludoStore'
import { AVATARS, FREE_REFILL, STAKES } from '@/lib/ludo/constants'
import { ACHIEVEMENTS, BOT_FRIENDS, LEADERBOARD_SEED, levelFromWins, rankTitle } from '@/lib/ludo/social'
import { DAILY_REWARDS } from '@/stores/ludoStore'
import { AvatarRing, CoinIcon, GemIcon, LudoLogo, ModeIllustration } from '@/components/ludo/ui'
import type { GameMode } from '@/lib/ludo/types'

type LobbyTab = 'home' | 'friends' | 'collections' | 'chest' | 'shop'
type SheetKind = null | 'table2' | 'table4' | 'private' | 'offline' | 'ranks'

const EVENTS = [
  { icon: <Gem3D size={20} />, title: 'Season 1 is live', text: 'Climb the leaderboard and collect gems for every win.' },
  { icon: <Gift3D size={20} />, title: 'Daily login streak', text: 'Claim growing coin rewards every single day.' },
  { icon: <Crown3D size={22} />, title: 'Weekend tables', text: 'Bigger pots on Master mode every Saturday & Sunday.' },
]

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
  const onlineStatus = useLudo((s) => s.onlineStatus)
  const onlineError = useLudo((s) => s.onlineError)
  const onlineQuick = useLudo((s) => s.onlineQuick)
  const onlineCreate = useLudo((s) => s.onlineCreate)
  const onlineJoin = useLudo((s) => s.onlineJoin)
  const soundOn = useLudo((s) => s.soundOn)
  const toggleSound = useLudo((s) => s.toggleSound)

  const [tab, setTab] = useState<LobbyTab>('home')
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [sheetMode, setSheetMode] = useState<GameMode>('classic')
  const [stake, setStake] = useState<number>(100)
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [eventsOpen, setEventsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [offlineSeats, setOfflineSeats] = useState<2 | 4>(4)

  // pre-warm online connection so quick match feels instant
  useEffect(() => {
    onlineConnect()
  }, [onlineConnect])

  const lvl = levelFromWins(profile.wins)
  const dailyClaimable = daily?.lastClaim !== new Date().toLocaleDateString('en-CA')
  const onlineFriends = BOT_FRIENDS.filter((f) => f.status !== 'offline').length
  const unlockedAchievements = ACHIEVEMENTS.filter(
    (a) => a.progress({ wins: profile.wins, losses: profile.losses, coins: profile.coins, gems: profile.gems }) >= a.goal
  ).length

  const totalGames = profile.wins + profile.losses
  const winRate = totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0

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
            label={`Win stars ${profile.wins}/50 — tap for leaderboard`}
          />
          <CurrencyChip
            value={profile.coins.toLocaleString()}
            icon={<Coin3D size={24} />}
            onClick={refillCoins}
            label={`Coins ${profile.coins} — tap for free refill`}
          />
          <CurrencyChip
            value={profile.gems.toLocaleString()}
            icon={<Gem3D size={22} />}
            onClick={() => setTab('shop')}
            label={`Gems ${profile.gems} — tap for the shop`}
            valueClass="text-teal-100"
          />
          <div className="ml-auto flex items-center gap-1.5">
            {/* connection dot */}
            <span
              className="h-2 w-2 rounded-full ring-2 ring-white/20"
              style={{ background: onlineStatus === 'connected' || onlineStatus === 'idle' || onlineStatus === 'lobby' ? '#4ade80' : '#f6c453' }}
              title={onlineStatus === 'connected' ? 'Server online' : 'Connecting...'}
            />
            {/* notifications — same events panel as the rail button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setEventsOpen((o) => !o); setSettingsOpen(false) }}
              className="ls-lobby-chip relative grid h-9 w-9 place-items-center rounded-full text-fuchsia-100"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[8px] text-white ring-2 ring-[#2b0a4a]">6</span>
            </motion.button>
            {/* settings */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setSettingsOpen((o) => !o); setEventsOpen(false) }}
                className="ls-lobby-chip grid h-9 w-9 place-items-center rounded-full text-fuchsia-100"
                aria-label="Settings"
              >
                <Settings size={20} />
              </motion.button>
              <AnimatePresence>
                {settingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="ls-sheet absolute right-0 top-10 z-50 w-52 rounded-2xl p-2"
                  >
                    <button
                      onClick={toggleSound}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-fuchsia-50 transition hover:bg-white/10"
                    >
                      Sound effects
                      {soundOn ? <Volume2 size={15} className="text-emerald-300" /> : <VolumeX size={15} className="text-slate-400" />}
                    </button>
                    <button
                      onClick={() => { setTab('collections'); setSettingsOpen(false) }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-fuchsia-50 transition hover:bg-white/10"
                    >
                      Edit profile <ChevronRight size={14} className="text-fuchsia-200" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ============ PLAYER ROW (avatar + level) ============ */}
        <div className="flex items-center gap-2.5 px-2.5 pt-2">
          <button onClick={() => setTab('collections')} className="relative shrink-0" aria-label="Open profile">
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
              <Flag size={9} fill="#fff" /> Level {lvl.level}
            </span>
            <div
              className="mt-1.5 h-[5px] w-[112px] overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.14)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.35)' }}
              title={`XP ${lvl.xpNow}/${lvl.xpNeed} to level ${lvl.level + 1}`}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(6, lvl.pct)}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.25 }}
                style={{ background: 'linear-gradient(90deg,#ffd76e,#ff9d3c)', boxShadow: '0 0 6px rgba(255,180,60,0.7)' }}
              />
            </div>
          </div>

          <span
            className="ls-lobby-chip ls-font ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] leading-none text-amber-100"
            title="Your total wins"
          >
            <Trophy size={11} className="text-amber-300" /> {profile.wins} WINS
          </span>
        </div>

        {/* ============ LEFT RAIL (events / ranks / clubs) ============ */}
        <div className="absolute left-1.5 top-[132px] z-30 flex flex-col items-center gap-2.5">
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setEventsOpen((o) => !o); setSettingsOpen(false) }}
              className="grid h-11 w-11 place-items-center rounded-full"
              aria-label="Events"
            >
              <RailEvents size={34} />
              <span className="ls-font absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[9px] text-white ring-2 ring-[#7c1f6e] shadow-lg">6</span>
            </motion.button>
            <AnimatePresence>
              {eventsOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="ls-sheet absolute left-12 top-0 z-50 w-64 rounded-2xl p-2.5"
                >
                  <p className="ls-font mb-1.5 text-xs text-amber-200">EVENTS</p>
                  {EVENTS.map((e) => (
                    <div key={e.title} className="flex items-start gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-sm">{e.icon}</span>
                      <div>
                        <p className="ls-font text-[11px] text-white">{e.title}</p>
                        <p className="text-[9px] leading-snug text-fuchsia-100/60">{e.text}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSheet('ranks')}
            className="grid h-11 w-11 place-items-center rounded-full"
            aria-label="Leaderboard"
          >
            <Trophy3D size={30} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setTab('friends')}
            className="flex flex-col items-center gap-0.5"
            aria-label="Clubs and friends"
          >
            <span className="relative grid h-12 w-12 place-items-center rounded-full">
              <RailClubs size={38} />
              {onlineFriends > 0 && (
                <span className="ls-font absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[9px] text-white ring-2 ring-[#7c1f6e] shadow-lg">{onlineFriends}</span>
              )}
            </span>
            <span className="ls-font text-[8px] tracking-widest text-fuchsia-100/80">CLUBS</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setTab('chest')}
            className="flex flex-col items-center gap-0.5"
            aria-label="Daily rewards"
          >
            <span
              className="grid h-11 w-11 place-items-center rounded-full"
              style={{
                background: 'linear-gradient(180deg,#7a2b6f,#4c1450)',
                border: '2px solid rgba(255,255,255,0.28)',
                boxShadow: '0 3px 8px rgba(20,4,45,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              <CalendarDays size={18} className="text-amber-200" />
            </span>
            <span className="ls-font text-[8px] tracking-widest text-fuchsia-100/80">DAILY</span>
          </motion.button>
        </div>

        {/* ============ MAIN (watermark + play tiles) ============ */}
        <main className="relative flex min-h-0 flex-1 flex-col px-3">
          {/* watermark */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
            <div className="flex -translate-y-9 select-none flex-col items-center" style={{ opacity: 0.17 }}>
              <CrownArt size={34} />
              <span className="ls-font text-[62px] leading-[0.92] text-white" style={{ textShadow: '0 4px 0 rgba(80,15,75,0.45)' }}>LUDO</span>
              <span className="ls-font text-lg leading-none tracking-[0.46em] text-white" style={{ marginRight: '-0.46em', textShadow: '0 2px 0 rgba(80,15,75,0.45)' }}>STAR</span>
            </div>
          </div>

          {/* floating deco (dice + pawns) */}
          <motion.div
            className="pointer-events-none absolute left-6 top-[38%] z-0"
            animate={{ y: [0, -9, 0], rotate: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 5.2, ease: 'easeInOut' }}
            aria-hidden
          >
            <Dice3D size={46} />
          </motion.div>
          <motion.div
            className="pointer-events-none absolute right-8 top-[30%] z-0"
            animate={{ y: [0, -11, 0], rotate: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 0.7 }}
            aria-hidden
          >
            <DecoDie value={3} size={32} tilt={18} />
          </motion.div>
          <motion.div
            className="pointer-events-none absolute right-[34%] top-[20%] z-0"
            animate={{ y: [0, -7, 0] }}
            transition={{ repeat: Infinity, duration: 4.6, ease: 'easeInOut', delay: 0.3 }}
            aria-hidden
          >
            <DecoToken color="yellow" size={22} />
          </motion.div>
          <motion.div
            className="pointer-events-none absolute left-[30%] top-[52%] z-0"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut', delay: 1 }}
            aria-hidden
          >
            <DecoToken color="green" size={19} />
          </motion.div>
          <motion.div
            className="pointer-events-none absolute right-[16%] top-[58%] z-0"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 0.4 }}
            aria-hidden
          >
            <DecoToken color="blue" size={17} />
          </motion.div>

          <div className="flex-1" />

          {/* big tiles */}
          <div className="relative z-10 grid grid-cols-2 gap-2.5">
            <motion.button
              whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.35, ease: 'easeOut' }}
              onClick={() => { setSheet('table2'); setSheetMode('classic') }}
              className="ls-tile-gold ls-shine relative flex h-[min(42vw,25vh,176px)] flex-col overflow-hidden rounded-2xl p-1.5"
              aria-label="Play 2 player"
            >
              <motion.span
                className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full bg-white/25 blur-2xl"
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              />
              <div className="relative min-h-0 flex-1">
                <div className="grid h-full place-items-center pb-0.5"><Pawn2x3D size={84} /></div>
                <PlayChip />
              </div>
              <span className="ls-font pb-1 text-center text-[15px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(150,80,0,0.7)' }}>2 PLAYER</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.35, ease: 'easeOut' }}
              onClick={() => setSheet('private')}
              className="ls-tile-purple ls-shine relative flex h-[min(42vw,25vh,176px)] flex-col overflow-hidden rounded-2xl p-1.5"
              aria-label="Open private table"
            >
              <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/35 text-amber-200" title="Invite with a code">
                <KeyRound size={11} />
              </span>
              <div className="relative min-h-0 flex-1">
                <div className="grid h-full place-items-center pb-0.5"><Crown3D size={74} /></div>
                <PlayChip />
              </div>
              <span className="ls-font pb-1 text-center text-[13px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(40,10,90,0.7)' }}>PRIVATE TABLE</span>
            </motion.button>
          </div>

          {/* second row — 4 PLAYER + OFFLINE */}
          <div className="relative z-10 mt-2.5 grid grid-cols-2 gap-2.5 pb-1.5">
            <motion.button
              whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19, duration: 0.35, ease: 'easeOut' }}
              onClick={() => { setSheet('table4'); setSheetMode('classic') }}
              className="ls-tile-purple ls-shine relative flex h-[min(32vw,18vh,132px)] flex-col overflow-hidden rounded-2xl p-1.5"
              aria-label="Play 4 player"
            >
              <div className="relative min-h-0 flex-1">
                <div className="grid h-full place-items-center pb-0.5"><Pawn4x3D size={74} /></div>
                <PlayChip />
              </div>
              <span className="ls-font pb-1 text-center text-[13px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(40,10,90,0.7)' }}>4 PLAYER</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.35, ease: 'easeOut' }}
              onClick={() => { setSheet('offline'); setSheetMode('classic') }}
              className="ls-tile-green ls-shine relative flex h-[min(32vw,18vh,132px)] flex-col overflow-hidden rounded-2xl p-1.5"
              aria-label="Play offline — bots or pass and play"
            >
              <div className="relative min-h-0 flex-1">
                <div className="grid h-full place-items-center pb-0.5"><Robot3D size={66} /></div>
                <PlayChip />
              </div>
              <span className="ls-font pb-1 text-center text-[13px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(10,60,30,0.7)' }}>OFFLINE</span>
            </motion.button>
          </div>
        </main>

        {/* ============ BOTTOM NAV ============ */}
        <nav className="ls-nav-bar relative z-40 border-t border-white/10">
          <div className="mx-auto grid w-full max-w-[430px] grid-cols-5 px-1.5">
            {([
              { id: 'shop', icon: <NavShop size={30} />, label: 'Shop' },
              { id: 'friends', icon: <NavFriends size={30} />, label: 'Friends' },
              { id: 'home', icon: <HomeGlyph size={30} />, label: 'Home', raised: true },
              { id: 'collections', icon: <NavCollections size={30} />, label: 'Collections', badge: unlockedAchievements },
              { id: 'chest', icon: <Chest3D size={30} />, label: 'Chest', badge: dailyClaimable ? 1 : undefined },
            ] as Array<{ id: LobbyTab; icon: React.ReactNode; label: string; raised?: boolean; badge?: number }>).map((item) => {
              const active = tab === item.id
              if (item.raised) {
                return (
                  <button key={item.id} onClick={() => setTab(item.id)} className="relative flex flex-col items-center" aria-current={active ? 'page' : undefined}>
                    <motion.span
                      whileTap={{ scale: 0.9 }}
                      className={`ls-tile-purple -mt-7 grid h-14 w-16 place-items-center rounded-2xl text-white ${active ? 'ls-nav-home-glow' : ''}`}
                      style={{ boxShadow: '0 6px 0 #3b1580, 0 12px 20px rgba(20,5,50,0.55), inset 0 2px 0 rgba(255,255,255,0.35)' }}
                    >
                      {item.icon}
                    </motion.span>
                    <span className={`ls-font mt-0.5 text-[9px] ${active ? 'text-white' : 'text-fuchsia-100/70'}`}>{item.label}</span>
                  </button>
                )
              }
              return (
                <button key={item.id} onClick={() => setTab(item.id)} className="relative flex flex-col items-center gap-0.5 py-1.5" aria-current={active ? 'page' : undefined}>
                  <motion.span whileTap={{ scale: 0.85 }} className={`relative grid h-8 w-8 place-items-center rounded-xl transition ${active ? 'bg-white/15 text-white' : 'text-fuchsia-100/55'}`}>
                    {item.icon}
                    {item.badge ? (
                      <span className="ls-font absolute -right-1.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[8px] text-white ring-2 ring-[#2b0a4a]">{item.badge}</span>
                    ) : null}
                  </motion.span>
                  <span className={`ls-font text-[9px] ${active ? 'text-white' : 'text-fuchsia-100/50'}`}>{item.label}</span>
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
            className="absolute inset-0 z-30 mx-auto flex w-full max-w-[430px] flex-col px-3 pb-[86px] pt-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="ls-font text-lg text-white">
                {tab === 'shop' && 'SHOP'}
                {tab === 'friends' && 'FRIENDS'}
                {tab === 'collections' && 'COLLECTIONS'}
                {tab === 'chest' && 'CHEST'}
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
                      <p className="ls-font text-sm text-white">Free coin refill</p>
                      <p className="text-[10px] text-amber-100/80">Tap anytime — instant +{FREE_REFILL.toLocaleString()} coins</p>
                    </div>
                    <span className="ls-font rounded-xl bg-black/25 px-3 py-1.5 text-xs text-white">+{FREE_REFILL.toLocaleString()}</span>
                  </motion.button>

                  <div className="ls-tile-purple flex items-center gap-3 rounded-2xl p-3">
                    <GemIcon size={34} animated />
                    <div className="flex-1">
                      <p className="ls-font text-sm text-white">Gems</p>
                      <p className="text-[10px] text-fuchsia-100/75">Earn 2 gems for every online win</p>
                    </div>
                    <span className="ls-font text-sm text-teal-100">{profile.gems.toLocaleString()}</span>
                  </div>

                  <div className="ls-panel rounded-2xl p-3">
                    <p className="ls-font text-xs text-amber-200">MORE WAYS TO EARN</p>
                    <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-fuchsia-50/80">
                      <li className="flex items-center gap-2"><Gift size={12} className="text-amber-200" /> Daily chest — open the Chest tab every day</li>
                      <li className="flex items-center gap-2"><Trophy size={12} className="text-amber-200" /> Win online tables — pot goes to the champion</li>
                      <li className="flex items-center gap-2"><IconStarGold size={13} /> Streak Stars — bigger rewards every day in a row</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ---- FRIENDS ---- */}
              {tab === 'friends' && (
                <div>
                  <p className="mb-2 text-[11px] text-fuchsia-100/70">{onlineFriends} friends online now</p>
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
                              {f.status === 'in-game' ? `Playing at ${f.table}` : f.status === 'online' ? `Level ${f.level} · Online` : 'Offline'}
                            </p>
                          </div>
                          {f.status !== 'offline' && (
                            <button
                              onClick={() => startVsComputer('classic', 4, 0)}
                              className="ls-btn ls-btn-green ls-font flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] text-white"
                            >
                              <Zap size={10} /> PLAY
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[10px] leading-relaxed text-fuchsia-100/60">
                    Open a Private Table from Home and share the code to invite anyone.
                  </p>
                </div>
              )}

              {/* ---- COLLECTIONS (profile + achievements) ---- */}
              {tab === 'collections' && (
                <div className="space-y-3">
                  <div className="ls-panel rounded-2xl p-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <AvatarRing avatar={profile.avatar} size={58} />
                        <span
                          className="ls-font absolute -bottom-1 -right-1.5 grid h-[22px] min-w-[22px] place-items-center rounded-full px-1 text-[10px] text-white"
                          style={{ background: 'linear-gradient(180deg,#ff9d3c,#e8720c)', boxShadow: '0 2px 5px rgba(0,0,0,0.45), 0 0 0 2.5px #1b0630' }}
                        >
                          {lvl.level}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <input
                          value={profile.name}
                          onChange={(e) => updateProfile({ name: e.target.value.slice(0, 14) })}
                          className="ls-glass-input ls-font w-full rounded-xl px-3 py-2 text-sm font-bold text-white"
                          aria-label="Your name"
                          maxLength={14}
                          placeholder="Your name"
                        />
                        <p className="ls-font mt-1.5 text-[10px] text-amber-200/85">LV {lvl.level} · {rankTitle(lvl.level)}</p>
                        <p className="mt-0.5 text-[9px] text-fuchsia-100/60">{lvl.xpNow}/{lvl.xpNeed} wins to level {lvl.level + 1}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Wins', value: profile.wins, tone: 'text-emerald-300' },
                        { label: 'Losses', value: profile.losses, tone: 'text-rose-300' },
                        { label: 'Win rate', value: `${winRate}%`, tone: 'text-amber-200' },
                      ].map((s) => (
                        <div key={s.label} className="ls-panel rounded-xl py-2">
                          <p className={`ls-font text-base ${s.tone}`}>{s.value}</p>
                          <p className="text-[8px] uppercase tracking-wide text-fuchsia-100/50">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <HistoryGraph history={profile.history} coins={profile.coins} />

                  <div className="ls-panel rounded-2xl p-3.5">
                    <p className="ls-font mb-2 text-xs text-amber-200">AVATAR COLLECTION</p>
                    <div className="flex flex-wrap gap-2">
                      {AVATARS.map((a) => (
                        <motion.button
                          key={a}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateProfile({ avatar: a })}
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
                    <p className="ls-font mb-2 text-xs text-amber-200">ACHIEVEMENTS</p>
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
                      {dailyClaimable ? `DAY ${(daily?.streak ?? 0) + 1} — CLAIM` : 'CLAIMED — BACK TOMORROW'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-100/85">
                      <CoinIcon size={13} />
                      {DAILY_REWARDS[daily ? Math.min(6, daily.streak) : 0].toLocaleString()} coins
                    </span>
                  </motion.button>

                  <div className="ls-panel mt-3 rounded-2xl p-3">
                    <p className="ls-font mb-2 text-xs text-amber-200">STREAK STARS</p>
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
                    <p className="mt-2 text-[10px] leading-relaxed text-fuchsia-100/60">Come back every day — the chest grows to 2,500 coins on day 7.</p>
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
                        <h3 className="ls-font text-lg leading-tight text-white">{sheet === 'table2' ? '2 PLAYER' : '4 PLAYER'}</h3>
                        <p className="text-[10px] text-fuchsia-100/60">
                          {sheet === 'table2' ? '1 v 1 online table' : '4 seats · live players & bots'}
                        </p>
                      </div>
                    </div>

                    <p className="ls-font mb-1.5 text-[10px] tracking-wide text-amber-200">GAME TYPE</p>
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

                    <p className="ls-font mb-1.5 mt-3 text-[10px] tracking-wide text-amber-200">ENTRY STAKE</p>
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
                          <span className="inline-flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> FINDING TABLE...</span>
                        ) : (
                          <>
                            <Globe size={17} /> PLAY ONLINE
                          </>
                        )}
                      </motion.button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => startVsComputer(sheetMode, seats, stake)}
                          className="ls-btn ls-btn-green ls-font flex items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-[11px] text-white"
                        >
                          <Bot size={13} /> VS BOT
                        </button>
                        <button
                          onClick={() => startPass(sheetMode, seats, stake)}
                          className="ls-btn ls-font flex items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-[11px] text-white"
                        >
                          <Users size={13} /> PASS N PLAY
                        </button>
                      </div>
                    </div>

                    {!canPlay && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-950/50 px-3 py-2">
                        <span className="text-[11px] text-rose-200">Not enough coins for this stake.</span>
                        <button onClick={refillCoins} className="ls-font ml-auto rounded-full px-3 py-1 text-[10px] text-[#4a2c00]" style={{ background: 'linear-gradient(180deg,#ffe08a,#e09b1a)' }}>
                          GET {FREE_REFILL.toLocaleString()} FREE
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
                        <h3 className="ls-font text-lg leading-tight text-white">PRIVATE TABLE</h3>
                        <p className="text-[10px] text-fuchsia-100/60">Room code with friends</p>
                      </div>
                    </div>

                    <p className="ls-font mb-1.5 text-[10px] tracking-wide text-amber-200">ENTRY STAKE</p>
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
                        <span className="inline-flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> CREATING...</span>
                      ) : (
                        <>
                          <KeyRound size={17} /> CREATE ROOM
                        </>
                      )}
                    </motion.button>

                    <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                      <input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                        placeholder="ENTER ROOM CODE"
                        className="ls-glass-input min-w-0 flex-1 rounded-xl px-3 py-2.5 text-center text-sm font-black tracking-[0.25em] text-white placeholder:tracking-normal placeholder:text-fuchsia-100/40"
                        aria-label="Room code"
                      />
                      <button
                        onClick={() => canPlay && joinCode.length >= 3 && onlineJoin(joinCode, stake, 'classic')}
                        disabled={!canPlay || joinCode.length < 3}
                        className="ls-btn ls-btn-green ls-font flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm text-white disabled:opacity-40"
                      >
                        <Send size={13} /> JOIN
                      </button>
                    </div>

                    {!canPlay && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-950/50 px-3 py-2">
                        <span className="text-[11px] text-rose-200">Not enough coins for this stake.</span>
                        <button onClick={refillCoins} className="ls-font ml-auto rounded-full px-3 py-1 text-[10px] text-[#4a2c00]" style={{ background: 'linear-gradient(180deg,#ffe08a,#e09b1a)' }}>
                          GET {FREE_REFILL.toLocaleString()} FREE
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
                        <h3 className="ls-font text-lg leading-tight text-white">OFFLINE</h3>
                        <p className="text-[10px] text-fuchsia-100/60">Play instantly · free</p>
                      </div>
                    </div>

                    <p className="ls-font mb-1.5 text-[10px] tracking-wide text-amber-200">GAME TYPE</p>
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

                    <p className="ls-font mb-1.5 mt-3 text-[10px] tracking-wide text-amber-200">PLAYERS</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([2, 4] as Array<2 | 4>).map((n) => (
                        <button
                          key={n}
                          onClick={() => setOfflineSeats(n)}
                          data-active={offlineSeats === n}
                          className="ls-option ls-font flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] text-white"
                        >
                          <Users size={13} /> {n} PLAYERS
                        </button>
                      ))}
                    </div>

                    <div className="mt-3.5 grid grid-cols-1 gap-2">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => startVsComputer(sheetMode, offlineSeats, 0)}
                        className="ls-btn ls-btn-gold ls-font flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base text-white"
                      >
                        <Bot size={18} /> VS COMPUTER
                      </motion.button>
                      <button
                        onClick={() => startPass(sheetMode, offlineSeats, 0)}
                        className="ls-btn ls-btn-green ls-font flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] text-white"
                      >
                        <Users size={14} /> PASS N PLAY
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
                        <h3 className="ls-font text-lg leading-tight text-white">LEADERBOARD</h3>
                        <p className="text-[10px] text-fuchsia-100/60">Season 1 · resets every Monday</p>
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
                              {r.name}{'isYou' in r && r.isYou ? ' (You)' : ''}
                            </span>
                            <span className="text-[10px] text-fuchsia-100/60">{r.trophies} 🏆</span>
                            <span className="ls-font w-12 text-right text-[11px] text-amber-100">{r.wins} wins</span>
                          </div>
                        ))
                      })()}
                    </div>
                    <p className="mt-2 text-[10px] text-fuchsia-100/50">Wins from every mode count toward your rank.</p>
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
            <Copy size={13} className="text-emerald-300" /> Copied!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
