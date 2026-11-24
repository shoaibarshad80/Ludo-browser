'use client'

// ============================================================
// HOME LOBBY — "Ludo Star" store-ready redesign (v2)
// Brief: magenta→violet gradient, dark glass panels, one warm
// amber accent, four Ludo colours reserved for pawns + logo.
// ONE icon style everywhere: 24px grid, 1.8px stroke, round caps
// (see line-icons.tsx). Layout per brief:
//   top bar → profile row (XP ring) → compact logo → 7-day
//   daily strip → QUICK PLAY → 2x2 short mode cards → 320x50
//   ad slot → floating rounded bottom nav (Shop·Friends·Home·
//   Profile·Chat with unread badge).
// All motion is transform/opacity-only (composited, no JS loop)
// so the lobby stays smooth on low-end phones. Chest moved to a
// sheet opened from the daily strip; a light local chat lives in
// the Chat tab (bot buddies, canned replies, unread badge).
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LnBot, LnCamera, LnChat, LnCheck, LnChevron, LnCoin, LnCopy, LnDices,
  LnFlag, LnFriends, LnGem, LnGift, LnGlobe, LnHome, LnKey, LnPlayFill,
  LnPlus, LnProfile, LnSend, LnSettings, LnShop, LnSpinner, LnStar,
  LnTrash, LnTrophy, LnZap,
} from '@/components/ludo/line-icons'
import { LudoBadge, DecoDie, DecoToken, ChestArt } from '@/components/ludo/icons'
import { Art2P, Art4P, ArtPrivate, ArtOffline } from '@/components/ludo/MenuArt'
import { Pawn2x3D, Pawn4x3D, Robot3D, Crown3D } from '@/components/ludo/art3d'
import HistoryGraph from '@/components/ludo/HistoryGraph'
import { useLudo, DAILY_REWARDS } from '@/stores/ludoStore'
import { AVATARS, FREE_REFILL, STAKES } from '@/lib/ludo/constants'
import { ACHIEVEMENTS, BOT_FRIENDS, LEADERBOARD_SEED, levelFromWins, rankTitle } from '@/lib/ludo/social'
import { LANGS, t, type Lang } from '@/lib/ludo/i18n'
import { sfx } from '@/lib/ludo/sounds'
import { AvatarXP, AvatarRing, CoinIcon, GemIcon, LudoLogo, ModeIllustration } from '@/components/ludo/ui'
import type { GameMode } from '@/lib/ludo/types'

type LobbyTab = 'home' | 'friends' | 'profile' | 'chat' | 'shop'
type SheetKind = null | 'table2' | 'table4' | 'private' | 'offline' | 'ranks' | 'chest'

// ---------- chat (lobby bot buddies) ----------

type ChatMsg = { me: boolean; text: string }

const CHAT_SEED: Record<Lang, Record<string, string[]>> = {
  en: {
    Rocky: ['gg! that last six was brutal 😅', 'rematch later?'],
    Zuby: ['table 7 is open 🔥'],
    Lola: ['nice win streak!'],
    Kiki: ['send me 200 coins pls 🥺'],
    Mango: ['leaderboard is mine this week 👑'],
    Pixel: ['beep boop. ready to lose?'],
    Aurora: ['your turn to host the private table!'],
    Draco: ['GG'],
  },
  ur: {
    Rocky: ['واہ! آخری چھ کمال تھی 😅', 'بعد میں ری میچ؟'],
    Zuby: ['ٹیبل 7 کھلا ہے 🔥'],
    Lola: ['زبردست جیت سلسلہ!'],
    Kiki: ['200 سکے بھیج دو 🥺'],
    Mango: ['اس ہفتے لیڈر بورڈ میرا ہے 👑'],
    Pixel: ['تیار ہو جاؤ!'],
    Aurora: ['اب نجی میز تم میزبان بنو!'],
    Draco: ['شاباش'],
  },
  hi: {
    Rocky: ['वाह! आखिरी छह कमाल थी 😅', 'बाद में रीमैच?'],
    Zuby: ['टेबल 7 खुला है 🔥'],
    Lola: ['शानदार जीत सिलसिला!'],
    Kiki: ['200 सिक्के भेजो ना 🥺'],
    Mango: ['इस हफ़्ते लीडरबोर्ड मेरा है 👑'],
    Pixel: ['तैयार हो जाओ!'],
    Aurora: ['अब प्राइवेट टेबल तुम होस्ट करो!'],
    Draco: ['शाबाश'],
  },
}

const CHAT_REPLIES: Record<Lang, string[]> = {
  en: ['gg — one more?', 'haha, lucky six!', 'bring your best dice 😄', 'table is heating up 🔥', 'rematch? no mercy this time', 'claim your chest first!'],
  ur: ['شاباش — ایک اور؟', 'ہاہا، قسمت والی چھ!', 'اپنے بہترین ڈائس لاؤ 😄', 'میز گرم ہو رہی ہے 🔥', 'ری میچ؟ اس بار کوئی رحم نہیں', 'پہلے اپنا صندوق کھولو!'],
  hi: ['शाबाश — एक और?', 'हहा, किस्मत वाली छह!', 'अपना बेस्ट डाइस लाओ 😄', 'टेबल गरम हो रही है 🔥', 'रीमैच? इस बार कोई रहम नहीं', 'पहले अपना संदूक खोलो!'],
}

const CHAT_TIME: Record<string, string> = {
  Rocky: '2m', Zuby: '15m', Lola: '1h', Kiki: '3h', Mango: '1d', Pixel: '2d', Aurora: '5h', Draco: '1w',
}

// ---------- shared atoms ----------

const AMBER_BTN = {
  background: 'linear-gradient(180deg,#ffc94d 0%,#f5a623 58%,#ef8f0d 100%)',
  boxShadow: '0 3px 8px rgba(180,90,10,0.45), inset 0 1px 0 rgba(255,255,255,0.55)',
} as React.CSSProperties

function CurrencyChip({
  value,
  icon,
  onClick,
  label,
  plus = false,
}: {
  value: string
  icon: React.ReactNode
  onClick?: () => void
  label: string
  plus?: boolean
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="ls-chip-v2 flex h-11 min-w-0 items-center gap-1.5 rounded-full pl-2 pr-2"
      aria-label={label}
      title={label}
    >
      <span className="shrink-0">{icon}</span>
      <span className="ls-font truncate text-[13px] font-semibold leading-none text-white">{value}</span>
      {plus && onClick && (
        <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full" style={AMBER_BTN} aria-hidden>
          <LnPlus size={12} strokeWidth={2.6} className="text-[#3A1D00]" />
        </span>
      )}
    </motion.button>
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
  const onlineStatus = useLudo((s) => s.onlineStatus)
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

  // ---- lobby chat (local, bot buddies) ----
  const [chatLog, setChatLog] = useState<Record<string, ChatMsg[]>>({})
  const [chatUnread, setChatUnread] = useState<Record<string, number>>({ Rocky: 1, Zuby: 1 })
  const [thread, setThread] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const threadRef = useRef<string | null>(null)
  const chatTimers = useRef<number[]>([])
  useEffect(() => {
    threadRef.current = thread
  }, [thread])
  useEffect(() => () => {
    chatTimers.current.forEach((id) => clearTimeout(id))
  }, [])
  const chatUnreadTotal = Object.values(chatUnread).reduce((a, b) => a + b, 0)

  const seedFor = (name: string): ChatMsg[] =>
    (CHAT_SEED[profile.lang][name] ?? ['👋']).map((text) => ({ me: false, text }))

  function openThread(name: string) {
    setChatLog((log) => (log[name] ? log : { ...log, [name]: seedFor(name) }))
    setChatUnread((u) => ({ ...u, [name]: 0 }))
    setThread(name)
    sfx.click()
  }

  function sendChat() {
    const name = thread
    const text = chatInput.trim()
    if (!name || !text) return
    const askedIdx = (chatLog[name]?.length ?? 0)
    setChatLog((log) => ({ ...log, [name]: [...(log[name] ?? []), { me: true, text }] }))
    setChatInput('')
    sfx.click()
    const pool = CHAT_REPLIES[profile.lang]
    const reply = pool[askedIdx % pool.length]
    const id = window.setTimeout(() => {
      setChatLog((log) => ({ ...log, [name]: [...(log[name] ?? []), { me: false, text: reply }] }))
      if (threadRef.current !== name) {
        setChatUnread((u) => ({ ...u, [name]: (u[name] ?? 0) + 1 }))
      }
    }, 1300)
    chatTimers.current.push(id)
  }

  // pre-warm online connection so quick match feels instant
  useEffect(() => {
    onlineConnect()
  }, [onlineConnect])

  const lvl = levelFromWins(profile.wins)
  const lang = profile.lang
  const tr = (k: string) => t(lang, k)

  // ---- daily reward math ----
  const today = new Date().toLocaleDateString('en-CA')
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA')
  const dailyClaimable = daily?.lastClaim !== today
  const chainAlive = daily?.lastClaim === yesterday
  const dailyStreak = daily?.streak ?? 0
  const nextIdx = dailyClaimable ? (chainAlive ? Math.min(7, dailyStreak + 1) : 1) - 1 : -1
  const claimedUpto = dailyClaimable ? (chainAlive ? dailyStreak : 0) : dailyStreak

  function onDailyTap() {
    sfx.click()
    if (dailyClaimable) claimDaily()
    else setSheet('chest')
  }

  /** One-tap match: use the live server when it is connected, otherwise an instant bot table. */
  function quickPlay() {
    sfx.click()
    if (profile.coins < 100) {
      refillCoins()
      return
    }
    if (onlineStatus === 'connected' || onlineStatus === 'lobby') {
      onlineQuick(100, 'classic')
      return
    }
    startVsComputer('classic', 4, 100)
  }

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
          <LnSpinner size={24} className="animate-spin text-fuchsia-200" />
        </div>
      </div>
    )
  }

  const navItems: Array<{ id: LobbyTab; icon: React.ReactNode; label: string }> = [
    { id: 'shop', icon: <LnShop size={22} />, label: tr('shop') },
    { id: 'friends', icon: <LnFriends size={22} />, label: tr('friends') },
    { id: 'home', icon: <LnHome size={22} />, label: tr('home') },
    { id: 'profile', icon: <LnProfile size={22} />, label: tr('profile') },
    { id: 'chat', icon: <LnChat size={22} />, label: tr('chat') },
  ]

  return (
    <div className="ls-bg-lobby fixed inset-0 z-0 overflow-hidden">
      {/* desktop ambience outside the phone column */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 55% at 50% 42%, rgba(255,255,255,0.10) 0%, transparent 60%)' }} />

      <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col">

        {/* ============ TOP BAR (currency + settings, 44px targets) ============ */}
        <div className="relative z-20 flex items-center gap-1.5 px-3.5 pt-2.5">
          <CurrencyChip
            value={`${Math.min(profile.wins, 50)}/50`}
            icon={<LnStar size={17} />}
            onClick={() => setSheet('ranks')}
            label={`${tr('winStars')} ${profile.wins}/50 — ${tr('tapForLeaderboard')}`}
          />
          <CurrencyChip
            value={profile.coins.toLocaleString()}
            icon={<LnCoin size={17} className="text-amber-300" />}
            onClick={refillCoins}
            label={`${tr('coins')} ${profile.coins.toLocaleString()} — ${tr('tapForRefill')}`}
            plus
          />
          <CurrencyChip
            value={profile.gems.toLocaleString()}
            icon={<LnGem size={17} className="text-teal-300" />}
            onClick={() => setTab('shop')}
            label={`${tr('gems')} ${profile.gems} — ${tr('tapForShop')}`}
            plus
          />
          <div className="relative ml-auto">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setSettingsOpen((o) => !o); sfx.click() }}
              className="ls-chip-v2 grid h-11 w-11 place-items-center rounded-full text-fuchsia-100"
              aria-label={tr('settings')}
            >
              <LnSettings size={21} />
            </motion.button>
            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  className="ls-sheet absolute right-0 top-12 z-50 w-56 rounded-2xl p-2"
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
                    {tr('editProfile')} <LnChevron size={14} className="text-fuchsia-200" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ============ PLAYER ROW (XP-ring avatar + level + wins) ============ */}
        <div className="relative z-20 flex items-center gap-3 px-3.5 pt-2.5">
          <button onClick={() => { setTab('profile'); sfx.click() }} className="relative shrink-0" aria-label={tr('profile')}>
            <AvatarXP avatar={profile.avatar} pct={lvl.pct} size={54} />
            <span
              className="ls-font absolute -bottom-1 -right-1.5 grid h-[22px] min-w-[22px] place-items-center rounded-full px-1 text-[10px] leading-none text-[#3A1D00]"
              style={{ background: 'linear-gradient(180deg,#ffc94d,#ef8f0d)', boxShadow: '0 2px 5px rgba(0,0,0,0.45), 0 0 0 2.5px rgba(58,10,70,0.9)' }}
            >
              {lvl.level}
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="ls-font truncate text-[15px] font-semibold leading-tight text-white">{profile.name}</p>
              <span
                className="ls-font inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-[2px] text-[9px] leading-none text-[#3A1D00]"
                style={{ background: 'linear-gradient(180deg,#ffc94d,#ef8f0d)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)' }}
              >
                <LnFlag size={9} fill="#3A1D00" /> {tr('level')} {lvl.level}
              </span>
            </div>
            <div
              className="mt-1.5 h-[5px] w-[132px] max-w-full overflow-hidden rounded-full bg-white/15"
              style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.35)' }}
              title={`XP ${lvl.xpNow}/${lvl.xpNeed} → ${tr('level')} ${lvl.level + 1}`}
            >
              <div
                className="ls-xp-fill h-full rounded-full"
                style={{
                  width: `${Math.max(6, lvl.pct)}%`,
                  background: 'linear-gradient(90deg,#ffd76e,#f5a623)',
                  boxShadow: '0 0 6px rgba(255,180,60,0.6)',
                }}
              />
            </div>
          </div>
          <span
            className="ls-chip-v2 ls-font inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-2 text-[11px] leading-none text-amber-100"
            title={tr('totalWins')}
          >
            <LnTrophy size={13} className="text-amber-300" /> {profile.wins} {tr('winsShort').toUpperCase()}
          </span>
        </div>

        {/* ============ MAIN (compact hero · daily strip · quick play · mode cards) ============ */}
        <main className="ls-scroll relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4">

          {/* compact logo — badge + tight wordmark (floating dice beside) */}
          <div className="pointer-events-none relative z-0 my-auto flex flex-col items-center pb-1.5 pt-2">
            <div className="ls-float-a absolute left-1 top-4" aria-hidden>
              <DecoDie value={5} size={28} tilt={14} />
            </div>
            <div className="ls-float-b absolute right-2 bottom-3" aria-hidden>
              <DecoToken color="blue" size={20} />
            </div>
            <div className="ls-hero-float relative">
              <span aria-hidden className="ls-hero-halo absolute -inset-4 rounded-[34%]" />
              <div className="aspect-square h-[62px]">
                <LudoBadge size={62} className="h-full w-full" />
              </div>
            </div>
            <h1 className="ls-font ls-hero-word-v2 mt-1">LUDO <span className="ls-hero-star-v2 inline-block">STAR</span></h1>
          </div>

          {/* daily reward strip — 7-day streak, today highlighted */}
          <button
            onClick={onDailyTap}
            className="ls-glass-card ls-rise relative z-10 flex w-full shrink-0 flex-col gap-2 rounded-[20px] p-2.5 text-left"
            style={{ '--d': '40ms' } as React.CSSProperties}
            title={dailyClaimable ? tr('tapToClaim') : tr('claimedBack')}
            aria-label={tr('dailyReward')}
          >
            <span className="flex items-center gap-1.5">
              <LnGift size={15} className="text-amber-300" />
              <span className="ls-font text-[11px] font-semibold tracking-[0.14em] text-amber-200">{tr('dailyReward')}</span>
              <span className="ls-font ml-auto text-[11px] leading-none text-white/75">
                {tr('day')} {dailyClaimable ? nextIdx + 1 : dailyStreak}/7
              </span>
            </span>
            <span className="flex gap-1.5">
              {DAILY_REWARDS.map((r, i) => {
                const claimed = i < claimedUpto
                const isToday = dailyClaimable && i === nextIdx
                const doneToday = !dailyClaimable && i === dailyStreak - 1
                return (
                  <span
                    key={i}
                    className={`flex h-[46px] min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-xl ${isToday ? 'ls-daily-today' : ''}`}
                    style={
                      isToday
                        ? { background: 'linear-gradient(180deg,#ffc94d,#ef8f0d)', boxShadow: '0 3px 8px rgba(180,90,10,0.45), inset 0 1px 0 rgba(255,255,255,0.55)' }
                        : claimed || doneToday
                          ? { background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.16)' }
                          : { background: 'rgba(0,0,0,0.28)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10)' }
                    }
                  >
                    {claimed || doneToday ? (
                      <LnCheck size={13} className={doneToday ? 'text-amber-300' : 'text-emerald-300'} />
                    ) : (
                      <span className={`ls-font text-[10px] leading-none ${isToday ? 'font-semibold text-[#3A1D00]' : 'text-white/75'}`}>
                        {r >= 1000 ? `${r / 1000}k` : r}
                      </span>
                    )}
                    <span className={`text-[7.5px] font-bold uppercase leading-none tracking-wide ${isToday ? 'text-[#5B3200]' : doneToday ? 'text-amber-200/85' : claimed ? 'text-white/55' : 'text-white/40'}`}>
                      D{i + 1}
                    </span>
                  </span>
                )
              })}
            </span>
          </button>

          {/* quick play — the one primary action */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={quickPlay}
            className="ls-rise relative z-10 mt-3 flex h-[54px] w-full shrink-0 items-center rounded-[20px] px-4"
            style={{
              '--d': '100ms',
              background: 'linear-gradient(180deg,#ffc94d 0%,#f5a623 58%,#ef8f0d 100%)',
              border: '2px solid rgba(255,244,214,0.9)',
              boxShadow: '0 5px 0 #b45309, 0 14px 26px rgba(90,30,80,0.45), inset 0 2px 0 rgba(255,255,255,0.55)',
            } as React.CSSProperties}
            aria-label={tr('quickPlay')}
          >
            <LnDices size={24} className="shrink-0 text-[#3A1D00]" />
            <span className="ml-3 flex min-w-0 flex-col">
              <span className="ls-font text-[17px] font-bold leading-tight text-[#3A1D00]">{tr('quickPlay')}</span>
              <span className="text-[10.5px] leading-tight text-[#5B3200]">{tr('quickPlaySub')}</span>
            </span>
            <LnChevron size={20} className="ml-auto shrink-0 text-[#3A1D00]/80" />
          </motion.button>

          {/* mode cards — short 2x2 glass cards, high on the page */}
          <div className="relative z-10 mt-3 grid shrink-0 grid-cols-2 gap-3 pb-2">
            {([
              { id: 'table2', art: <Pawn2x3D size={40} />, label: tr('twoPlayer'), sub: tr('card2Sub'), d: '160ms' },
              { id: 'private', art: <Crown3D size={40} />, label: tr('privateTable'), sub: tr('cardPrivateSub'), d: '220ms' },
              { id: 'table4', art: <Pawn4x3D size={40} />, label: tr('fourPlayer'), sub: tr('card4Sub'), d: '280ms' },
              { id: 'offline', art: <Robot3D size={38} />, label: tr('offline'), sub: tr('cardOfflineSub'), d: '340ms' },
            ] as Array<{ id: SheetKind; art: React.ReactNode; label: string; sub: string; d: string }>).map((card) => (
              <motion.button
                key={card.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => { setSheet(card.id); if (card.id === 'table2' || card.id === 'table4') setSheetMode('classic'); sfx.click() }}
                className="ls-glass-card ls-rise relative flex h-[84px] items-center gap-2 overflow-hidden rounded-[22px] p-2.5 text-left"
                style={{ '--d': card.d } as React.CSSProperties}
                aria-label={card.sub}
              >
                <span
                  className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full"
                  style={{ background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}
                >
                  {card.art}
                </span>
                <span className="flex min-w-0 flex-1 flex-col pb-1 pr-3">
                  <span className="ls-font text-[17px] font-semibold leading-[1.02] text-white" style={{ textShadow: '0 1.5px 0 rgba(20,4,40,0.6)' }}>
                    {card.label}
                  </span>
                  <span className="mt-1 truncate text-[10px] leading-tight text-white/75">{card.sub}</span>
                </span>
                <span
                  className="absolute bottom-2 right-2 grid h-[26px] w-[26px] place-items-center rounded-full text-[#3A1D00]"
                  style={{ background: 'linear-gradient(180deg,#ffc94d,#ef8f0d)', boxShadow: '0 2px 5px rgba(60,25,0,0.5), inset 0 1px 0 rgba(255,255,255,0.6)' }}
                  aria-hidden
                >
                  <LnPlayFill size={12} className="translate-x-[1px]" />
                </span>
              </motion.button>
            ))}
          </div>
        </main>

        {/* ============ AD SLOT — 320x50, in flow, never overlaps the nav ============ */}
        <div className="relative z-10 flex shrink-0 justify-center px-4 pb-2">
          <div className="ls-ad-slot flex items-center justify-center gap-2">
            <span className="ls-font rounded-md bg-white/15 px-1.5 py-0.5 text-[9px] leading-none text-white/85">AD</span>
            <span className="text-[11px] text-white/60">{tr('advertisement')}</span>
          </div>
        </div>

        {/* ============ BOTTOM NAV — floating rounded bar, line icons, amber pill ============ */}
        <nav className="relative z-40 shrink-0 px-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}>
          <div className="ls-nav-v2 mx-auto grid h-[64px] w-full max-w-[430px] grid-cols-5">
            {navItems.map((item) => {
              const active = tab === item.id
              const badge = item.id === 'chat' ? chatUnreadTotal : 0
              return (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); if (item.id !== 'chat') setThread(null); sfx.click() }}
                  className="ls-nav-item flex min-w-0 items-center justify-center"
                  aria-current={active ? 'page' : undefined}
                >
                  <span className={`flex flex-col items-center gap-[3px] rounded-[18px] px-3 py-[7px] transition-colors duration-150 ${active ? 'ls-nav-pill' : ''}`}>
                    <span className={`relative ${active ? 'ls-nav-pill-ico' : 'text-white/80'}`}>
                      {item.icon}
                      {badge > 0 && (
                        <span
                          className="ls-font ls-badge-pulse absolute -right-2 -top-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[9px] font-bold leading-none text-[#3A1D00]"
                          style={{ ...AMBER_BTN, boxShadow: '0 0 0 2px rgba(14,5,30,0.95), 0 2px 5px rgba(0,0,0,0.4)' }}
                        >
                          {badge}
                        </span>
                      )}
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
            className="absolute inset-0 z-30 mx-auto flex w-full max-w-[430px] flex-col px-3 pt-[122px]"
            style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="ls-font text-lg text-white">
                {tab === 'shop' && tr('shop').toUpperCase()}
                {tab === 'friends' && tr('friends').toUpperCase()}
                {tab === 'profile' && tr('myProfile')}
                {tab === 'chat' && tr('chat').toUpperCase()}
              </h2>
              <button onClick={() => setTab('home')} className="ls-chip-v2 grid h-9 w-9 place-items-center rounded-full text-white" aria-label="Close">
                <LnChevron size={16} className="rotate-90" />
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
                      <li className="flex items-center gap-2"><LnGift size={12} className="text-amber-200" /> {tr('dailyChestLine')}</li>
                      <li className="flex items-center gap-2"><LnTrophy size={12} className="text-amber-200" /> {tr('winOnlineLine')}</li>
                      <li className="flex items-center gap-2"><LnStar size={13} /> {tr('streakStarsLine')}</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ---- FRIENDS ---- */}
              {tab === 'friends' && (
                <div>
                  <p className="mb-2 text-[11px] text-fuchsia-100/70">
                    {BOT_FRIENDS.filter((f) => f.status !== 'offline').length} {tr('friendsOnlineNow')}
                  </p>
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
                              <LnZap size={10} /> {tr('play')}
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

              {/* ---- CHAT (bot buddies, local) ---- */}
              {tab === 'chat' && (
                <div className="flex h-full min-h-0 flex-col">
                  {thread === null ? (
                    <div className="min-h-0 flex-1">
                      <p className="mb-2 text-[11px] text-fuchsia-100/70">{tr('chatIntro')}</p>
                      <div className="space-y-2">
                        {BOT_FRIENDS.map((f) => {
                          const msgs = chatLog[f.name] ?? seedFor(f.name)
                          const last = msgs[msgs.length - 1]
                          const unreadN = chatUnread[f.name] ?? 0
                          return (
                            <button
                              key={f.name}
                              onClick={() => openThread(f.name)}
                              className="ls-glass-card flex min-h-[60px] w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left"
                            >
                              <AvatarRing avatar={f.avatar} size={40} />
                              <span className="min-w-0 flex-1">
                                <span className="ls-font block truncate text-[13px] font-semibold leading-tight text-white">{f.name}</span>
                                <span className="block truncate text-[11px] leading-tight text-white/65">{last?.text}</span>
                              </span>
                              {unreadN > 0 ? (
                                <span
                                  className="ls-font grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full px-1 text-[9px] font-bold leading-none text-[#3A1D00]"
                                  style={AMBER_BTN}
                                >
                                  {unreadN}
                                </span>
                              ) : (
                                <span className="shrink-0 text-[9px] text-white/40">{CHAT_TIME[f.name] ?? ''}</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-1.5 flex items-center gap-2">
                        <button
                          onClick={() => { setThread(null); sfx.click() }}
                          className="ls-chip-v2 grid h-9 w-9 place-items-center rounded-full text-white"
                          aria-label="Back"
                        >
                          <LnChevron size={16} className="rotate-180" />
                        </button>
                        <AvatarRing avatar={BOT_FRIENDS.find((f) => f.name === thread)?.avatar ?? '👋'} size={34} />
                        <p className="ls-font text-sm text-white">{thread}</p>
                      </div>
                      <div className="ls-scroll min-h-0 flex-1 space-y-2 overflow-y-auto py-1">
                        {(chatLog[thread] ?? seedFor(thread)).map((m, i) => (
                          <div key={i} className={`flex ${m.me ? 'justify-end' : 'justify-start'}`}>
                            <span
                              className={`max-w-[82%] px-3 py-2 text-[13px] leading-snug ${
                                m.me
                                  ? 'rounded-2xl rounded-br-md font-medium text-[#3A1D00]'
                                  : 'ls-glass-card rounded-2xl rounded-bl-md text-white'
                              }`}
                              style={m.me ? { background: 'linear-gradient(180deg,#ffc94d,#f0a01c)' } : undefined}
                            >
                              {m.text}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') sendChat() }}
                          placeholder={tr('typeMessage')}
                          className="ls-glass-input ls-font h-11 min-w-0 flex-1 rounded-full px-4 text-[13px] text-white placeholder:text-white/40"
                          aria-label={tr('typeMessage')}
                        />
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={sendChat}
                          disabled={!chatInput.trim()}
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#3A1D00] disabled:opacity-40"
                          style={AMBER_BTN}
                          aria-label="Send"
                        >
                          <LnSend size={19} />
                        </motion.button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ---- PROFILE ---- */}
              {tab === 'profile' && (
                <div className="space-y-3">
                  <div className="ls-panel rounded-2xl p-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <AvatarXP avatar={profile.avatar} pct={lvl.pct} size={64} />
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="absolute -bottom-1.5 -right-1.5 grid h-8 w-8 place-items-center rounded-full text-white"
                          style={{ background: 'linear-gradient(180deg,#a05ce8,#5b1fa8)', border: '2px solid rgba(255,255,255,0.85)', boxShadow: '0 3px 8px rgba(10,2,30,0.5)' }}
                          aria-label={tr('changePhoto')}
                          title={tr('changePhoto')}
                        >
                          <LnCamera size={14} />
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
                              <LnTrash size={9} /> {tr('removePhoto')}
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
                                {done && <LnCheck size={13} className="shrink-0 text-emerald-400" />}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ SHEETS (table setup / private / ranks / chest) ============ */}
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
                          <span className="inline-flex items-center gap-2"><LnSpinner size={17} className="animate-spin" /> {tr('findingTable')}</span>
                        ) : (
                          <>
                            <LnGlobe size={17} /> {tr('playOnline')}
                          </>
                        )}
                      </motion.button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => startVsComputer(sheetMode, seats, stake)}
                          className="ls-btn ls-btn-green ls-font flex items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-[11px] text-white"
                        >
                          <LnBot size={13} /> {tr('vsBot')}
                        </button>
                        <button
                          onClick={() => startPass(sheetMode, seats, stake)}
                          className="ls-btn ls-font flex items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-[11px] text-white"
                        >
                          <LnFriends size={13} /> {tr('passNPlay')}
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
                        <span className="inline-flex items-center gap-2"><LnSpinner size={17} className="animate-spin" /> {tr('creating')}</span>
                      ) : (
                        <>
                          <LnKey size={17} /> {tr('createRoom')}
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
                        <LnSend size={13} /> {tr('join')}
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
                          <LnFriends size={13} /> {n} {tr('players')}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3.5 grid grid-cols-1 gap-2">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => startVsComputer(sheetMode, offlineSeats, 0)}
                        className="ls-btn ls-btn-gold ls-font flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base text-white"
                      >
                        <LnBot size={18} /> {tr('vsComputer')}
                      </motion.button>
                      <button
                        onClick={() => startPass(sheetMode, offlineSeats, 0)}
                        className="ls-btn ls-btn-green ls-font flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] text-white"
                      >
                        <LnFriends size={14} /> {tr('passNPlay')}
                      </button>
                    </div>
                  </div>
                )}

                {/* ---- CHEST SHEET (opened from the daily strip) ---- */}
                {sheet === 'chest' && (
                  <div>
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl text-amber-200" style={{ background: 'rgba(246,196,83,0.15)', boxShadow: 'inset 0 0 0 1.5px rgba(246,196,83,0.4)' }}>
                        <LnGift size={22} />
                      </span>
                      <div>
                        <h3 className="ls-font text-lg leading-tight text-white">{tr('dailyReward')}</h3>
                        <p className="text-[10px] text-fuchsia-100/60">{tr('streakStars')}</p>
                      </div>
                    </div>
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
                        {dailyClaimable ? `${tr('day')} ${(chainAlive ? Math.min(7, dailyStreak + 1) : 1)} — ${tr('claim')}` : tr('claimedBack')}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-amber-100/85">
                        <CoinIcon size={13} />
                        {DAILY_REWARDS[(chainAlive ? Math.min(7, dailyStreak + 1) : 1) - 1].toLocaleString()} {tr('coinsShort')}
                      </span>
                    </motion.button>

                    <div className="ls-panel mt-3 rounded-2xl p-3">
                      <p className="ls-font mb-2 text-xs text-amber-200">{tr('streakStars')}</p>
                      <div className="grid grid-cols-7 gap-1">
                        {DAILY_REWARDS.map((r, i) => {
                          const reached = i < claimedUpto || (dailyClaimable && i === nextIdx)
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

                {/* ---- RANKS SHEET ---- */}
                {sheet === 'ranks' && (
                  <div>
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl text-amber-200" style={{ background: 'rgba(246,196,83,0.15)', boxShadow: 'inset 0 0 0 1.5px rgba(246,196,83,0.4)' }}>
                        <LnTrophy size={22} />
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
            <LnCopy size={13} className="text-emerald-300" /> {tr('copied')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
