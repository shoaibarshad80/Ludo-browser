#!/usr/bin/env python3
"""Lobby upgrade batch 2: LudoBadge hero, dock nav, profile tab, i18n, settings."""
import sys

P = 'src/components/ludo/MenuScreen.tsx'
s = open(P).read()
fails = []


def rep(old, new, count=1, tag=''):
    global s
    n = s.count(old)
    if n != count:
        fails.append(f'{tag or old[:60]!r}: expected {count} got {n}')
        return
    s = s.replace(old, new)


# ---------- imports ----------
rep(
    """import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot, Check, ChevronRight, Copy, Flag, Gift, Globe,
  KeyRound, Loader2, Play, Send, Settings, Trophy,
  Users, Volume2, VolumeX, Zap,
} from 'lucide-react'
import {
  NavShop, NavFriends, HomeGlyph, NavCollections,
  IconStarGold,
  DecoDie, DecoToken, ChestArt,
} from '@/components/ludo/icons'
import { Art2P, Art4P, ArtPrivate, ArtOffline } from '@/components/ludo/MenuArt'
import {
  Coin3D, Gem3D, Chest3D, Pawn2x3D, Pawn4x3D, Robot3D, Crown3D, Logo3D,
} from '@/components/ludo/art3d'
import HistoryGraph from '@/components/ludo/HistoryGraph'
import { useLudo } from '@/stores/ludoStore'
import { AVATARS, FREE_REFILL, STAKES } from '@/lib/ludo/constants'
import { ACHIEVEMENTS, BOT_FRIENDS, LEADERBOARD_SEED, levelFromWins, rankTitle } from '@/lib/ludo/social'
import { DAILY_REWARDS } from '@/stores/ludoStore'
import { AvatarRing, CoinIcon, GemIcon, LudoLogo, ModeIllustration } from '@/components/ludo/ui'
import type { GameMode } from '@/lib/ludo/types'

type LobbyTab = 'home' | 'friends' | 'collections' | 'chest' | 'shop'
""",
    """import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot, Camera, Check, ChevronRight, Copy, Flag, Gift, Globe,
  KeyRound, Loader2, Play, Send, Settings, Trash2, Trophy,
  Users, Zap,
} from 'lucide-react'
import {
  NavShop, NavFriends, HomeGlyph, NavProfile,
  IconStarGold, LudoBadge,
  DecoDie, DecoToken, ChestArt,
} from '@/components/ludo/icons'
import { Art2P, Art4P, ArtPrivate, ArtOffline } from '@/components/ludo/MenuArt'
import {
  Coin3D, Gem3D, Chest3D, Pawn2x3D, Pawn4x3D, Robot3D, Crown3D,
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
""",
    1, 'imports',
)

# ---------- store hooks + helpers ----------
rep(
    """  const soundOn = useLudo((s) => s.soundOn)
  const toggleSound = useLudo((s) => s.toggleSound)
""",
    """  const soundOn = useLudo((s) => s.soundOn)
  const toggleSound = useLudo((s) => s.toggleSound)
  const sfxOn = useLudo((s) => s.sfxOn)
  const setSfxOn = useLudo((s) => s.setSfxOn)
""",
    1, 'store hooks',
)

rep(
    """  const lvl = levelFromWins(profile.wins)
""",
    """  const lvl = levelFromWins(profile.wins)
  const lang = profile.lang
  const tr = (k: string) => t(lang, k)
""",
    1, 'lang helper',
)

rep(
    """  const totalGames = profile.wins + profile.losses
  const winRate = totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0
""",
    """  const totalGames = profile.wins + profile.losses
  const winRate = totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0

  /** longest run of consecutive wins in recorded history */
  let run = 0
  const bestStreak = profile.history.reduce((best, h) => {
    run = h.won ? run + 1 : 0
    return Math.max(best, run)
  }, 0)
""",
    1, 'best streak',
)

rep(
    """  function copyInvite(code: string) {
    if (!code) return
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    }).catch(() => undefined)
  }
""",
    """  function copyInvite(code: string) {
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
""",
    1, 'pickPhoto',
)

# ---------- top bar labels ----------
rep(
    "            label={`Win stars ${profile.wins}/50 — tap for leaderboard`}",
    "            label={`${tr('winStars')} ${profile.wins}/50 — ${tr('tapForLeaderboard')}`}",
    1, 'chip stars label',
)
rep(
    "            label={`Coins ${profile.coins} — tap for free refill`}",
    "            label={`${tr('coins')} ${profile.coins.toLocaleString()} — ${tr('tapForRefill')}`}",
    1, 'chip coins label',
)
rep(
    "            label={`Gems ${profile.gems} — tap for the shop`}",
    "            label={`${tr('gems')} ${profile.gems} — ${tr('tapForShop')}`}",
    1, 'chip gems label',
)

# ---------- settings dropdown ----------
rep(
    """            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setSettingsOpen((o) => !o) }}
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
""",
    """            <div className="relative">
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
""",
    1, 'settings dropdown',
)

# ---------- player row ----------
rep(
    """          <button onClick={() => setTab('collections')} className="relative shrink-0" aria-label="Open profile">
""",
    """          <button onClick={() => { setTab('profile'); sfx.click() }} className="relative shrink-0" aria-label={tr('profile')}>
""",
    1, 'avatar opens profile',
)
rep(
    """              <Flag size={9} fill="#fff" /> Level {lvl.level}
""",
    """              <Flag size={9} fill="#fff" /> {tr('level')} {lvl.level}
""",
    1, 'level chip',
)
rep(
    """            title="Your total wins"
          >
            <Trophy size={11} className="text-amber-300" /> {profile.wins} WINS
""",
    """            title={tr('totalWins')}
          >
            <Trophy size={11} className="text-amber-300" /> {profile.wins} {tr('winsShort').toUpperCase()}
""",
    1, 'wins chip',
)

# ---------- hero: custom LudoBadge emblem + tighter rhythm ----------
rep(
    """              <div className="aspect-square h-[min(23vh,100px)]">
                <Logo3D size={100} className="h-full w-full" />
              </div>
""",
    """              <div className="aspect-square h-[min(20vh,92px)]">
                <LudoBadge size={92} className="h-full w-full" />
              </div>
""",
    1, 'hero emblem',
)
rep(
    """          <div className="ls-float-a pointer-events-none absolute left-5 top-[30%] z-0" aria-hidden>
            <DecoDie value={5} size={30} tilt={14} />
          </div>
          <div className="ls-float-b pointer-events-none absolute right-6 top-[54%] z-0" aria-hidden>
            <DecoToken color="blue" size={20} />
          </div>
""",
    """          <div className="ls-float-a pointer-events-none absolute left-5 top-[20%] z-0" aria-hidden>
            <DecoDie value={5} size={30} tilt={14} />
          </div>
          <div className="ls-float-b pointer-events-none absolute right-6 top-[62%] z-0" aria-hidden>
            <DecoToken color="blue" size={20} />
          </div>
""",
    1, 'floaters',
)

# ---------- tiles: heights, clicks, translated labels ----------
rep(
    """              onClick={() => { setSheet('table2'); setSheetMode('classic') }}
              className="ls-tile-gold ls-shine ls-rise relative flex h-[min(42vw,25vh,176px)] flex-col overflow-hidden rounded-2xl p-1.5"
""",
    """              onClick={() => { setSheet('table2'); setSheetMode('classic'); sfx.click() }}
              className="ls-tile-gold ls-shine ls-rise relative flex h-[min(44vw,26vh,184px)] flex-col overflow-hidden rounded-2xl p-1.5"
""",
    1, 'tile2 button',
)
rep(
    """              <span className="ls-font pb-1 text-center text-[15px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(150,80,0,0.7)' }}>2 PLAYER</span>
""",
    """              <span className="ls-font pb-1 text-center text-[15px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(150,80,0,0.7)' }}>{tr('twoPlayer')}</span>
""",
    1, 'tile2 label',
)
rep(
    """              onClick={() => setSheet('private')}
              className="ls-tile-purple ls-shine ls-rise relative flex h-[min(42vw,25vh,176px)] flex-col overflow-hidden rounded-2xl p-1.5"
""",
    """              onClick={() => { setSheet('private'); sfx.click() }}
              className="ls-tile-purple ls-shine ls-rise relative flex h-[min(44vw,26vh,184px)] flex-col overflow-hidden rounded-2xl p-1.5"
""",
    1, 'tile private button',
)
rep(
    """              <span className="ls-font pb-1 text-center text-[13px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(40,10,90,0.7)' }}>PRIVATE TABLE</span>
            </button>
          </div>

          {/* second row — 4 PLAYER + OFFLINE */}
""",
    """              <span className="ls-font pb-1 text-center text-[13px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(40,10,90,0.7)' }}>{tr('privateTable')}</span>
            </button>
          </div>

          {/* second row — 4 PLAYER + OFFLINE */}
""",
    1, 'tile private label',
)
rep(
    """              onClick={() => { setSheet('table4'); setSheetMode('classic') }}
              className="ls-tile-purple ls-shine ls-rise relative flex h-[min(32vw,18vh,132px)] flex-col overflow-hidden rounded-2xl p-1.5"
""",
    """              onClick={() => { setSheet('table4'); setSheetMode('classic'); sfx.click() }}
              className="ls-tile-purple ls-shine ls-rise relative flex h-[min(34vw,19vh,140px)] flex-col overflow-hidden rounded-2xl p-1.5"
""",
    1, 'tile4 button',
)
rep(
    """              <span className="ls-font pb-1 text-center text-[13px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(40,10,90,0.7)' }}>4 PLAYER</span>
""",
    """              <span className="ls-font pb-1 text-center text-[13px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(40,10,90,0.7)' }}>{tr('fourPlayer')}</span>
""",
    1, 'tile4 label',
)
rep(
    """              onClick={() => { setSheet('offline'); setSheetMode('classic') }}
              className="ls-tile-green ls-shine ls-rise relative flex h-[min(32vw,18vh,132px)] flex-col overflow-hidden rounded-2xl p-1.5"
""",
    """              onClick={() => { setSheet('offline'); setSheetMode('classic'); sfx.click() }}
              className="ls-tile-green ls-shine ls-rise relative flex h-[min(34vw,19vh,140px)] flex-col overflow-hidden rounded-2xl p-1.5"
""",
    1, 'tile offline button',
)
rep(
    """              <span className="ls-font pb-1 text-center text-[13px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(10,60,30,0.7)' }}>OFFLINE</span>
""",
    """              <span className="ls-font pb-1 text-center text-[13px] leading-none text-white" style={{ textShadow: '0 2px 0 rgba(10,60,30,0.7)' }}>{tr('offline')}</span>
""",
    1, 'tile offline label',
)

# ---------- nav: floating dock + profile tab ----------
rep(
    """        {/* ============ BOTTOM NAV — slim bar, gold raised HOME ============ */}
        <nav className="ls-nav-bar relative z-40">
          <div className="mx-auto grid w-full max-w-[430px] grid-cols-5 items-end px-2">
            {([
              { id: 'shop', icon: <NavShop size={27} />, label: 'Shop' },
              { id: 'friends', icon: <NavFriends size={27} />, label: 'Friends' },
              { id: 'home', icon: <HomeGlyph size={30} />, label: 'Home', raised: true },
              { id: 'collections', icon: <NavCollections size={27} />, label: 'Trophies', badge: unlockedAchievements },
              { id: 'chest', icon: <Chest3D size={27} />, label: 'Chest', badge: dailyClaimable ? 1 : undefined },
            ] as Array<{ id: LobbyTab; icon: React.ReactNode; label: string; raised?: boolean; badge?: number }>).map((item) => {
              const active = tab === item.id
              if (item.raised) {
                return (
                  <button key={item.id} onClick={() => setTab(item.id)} className="ls-nav-home-btn flex flex-col items-center" aria-current={active ? 'page' : undefined}>
                    <span className={`ls-nav-home ${active ? 'ls-nav-home-glow' : ''}`}>
                      {item.icon}
                    </span>
                    <span className={`ls-font mt-1 text-[10px] leading-none ${active ? 'text-amber-200' : 'text-fuchsia-100/60'}`}>{item.label}</span>
                  </button>
                )
              }
              return (
                <button key={item.id} onClick={() => setTab(item.id)} className="ls-nav-item flex flex-col items-center gap-1 pt-1.5" aria-current={active ? 'page' : undefined}>
                  <span className={`ls-nav-ico ${active ? 'ls-nav-ico-active' : ''}`}>
                    {item.icon}
                    {item.badge ? (
                      <span className="ls-nav-badge ls-font">{item.badge}</span>
                    ) : null}
                  </span>
                  <span className={`ls-font text-[9.5px] leading-none ${active ? 'text-white' : 'text-fuchsia-100/55'}`}>{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
""",
    """        {/* ============ BOTTOM NAV — floating dock, gold raised HOME ============ */}
        <nav className="relative z-40 px-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 7px)' }}>
          <div className="ls-nav-dock mx-auto grid w-full max-w-[430px] grid-cols-5 items-end">
            {([
              { id: 'shop', icon: <NavShop size={27} />, label: tr('shop') },
              { id: 'friends', icon: <NavFriends size={27} />, label: tr('friends') },
              { id: 'home', icon: <HomeGlyph size={30} />, label: tr('home'), raised: true },
              { id: 'profile', icon: <NavProfile size={27} />, label: tr('profile'), badge: unlockedAchievements },
              { id: 'chest', icon: <Chest3D size={27} />, label: tr('chest'), badge: dailyClaimable ? 1 : undefined },
            ] as Array<{ id: LobbyTab; icon: React.ReactNode; label: string; raised?: boolean; badge?: number }>).map((item) => {
              const active = tab === item.id
              if (item.raised) {
                return (
                  <button key={item.id} onClick={() => { setTab(item.id); sfx.click() }} className="ls-nav-home-btn flex flex-col items-center" aria-current={active ? 'page' : undefined}>
                    <span className={`ls-nav-home ${active ? 'ls-nav-home-glow' : ''}`}>
                      {item.icon}
                    </span>
                    <span className={`ls-font mt-1 text-[10px] leading-none ${active ? 'text-amber-200' : 'text-fuchsia-100/60'}`}>{item.label}</span>
                  </button>
                )
              }
              return (
                <button key={item.id} onClick={() => { setTab(item.id); sfx.click() }} className="ls-nav-item flex flex-col items-center gap-1 pt-1.5" aria-current={active ? 'page' : undefined}>
                  <span className={`ls-nav-ico ${active ? 'ls-nav-ico-active' : ''}`}>
                    {item.icon}
                    {item.badge ? (
                      <span className="ls-nav-badge ls-font">{item.badge}</span>
                    ) : null}
                  </span>
                  <span className={`ls-font text-[9.5px] leading-none ${active ? 'text-white' : 'text-fuchsia-100/55'}`}>{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
""",
    1, 'nav dock',
)

# ---------- panel padding + headings ----------
rep(
    'className="absolute inset-0 z-30 mx-auto flex w-full max-w-[430px] flex-col px-3 pb-[92px] pt-[106px]"',
    'className="absolute inset-0 z-30 mx-auto flex w-full max-w-[430px] flex-col px-3 pb-[102px] pt-[104px]"',
    1, 'panel padding',
)
rep(
    """              <h2 className="ls-font text-lg text-white">
                {tab === 'shop' && 'SHOP'}
                {tab === 'friends' && 'FRIENDS'}
                {tab === 'collections' && 'COLLECTIONS'}
                {tab === 'chest' && 'CHEST'}
              </h2>
""",
    """              <h2 className="ls-font text-lg text-white">
                {tab === 'shop' && tr('shop').toUpperCase()}
                {tab === 'friends' && tr('friends').toUpperCase()}
                {tab === 'profile' && tr('myProfile')}
                {tab === 'chest' && tr('chest').toUpperCase()}
              </h2>
""",
    1, 'panel headings',
)

# ---------- profile tab (bounded replace) ----------
start_marker = "              {tab === 'collections' && (\n"
end_marker = "              {/* ---- CHEST (daily reward) ---- */}"
i = s.find(start_marker)
j = s.find(end_marker)
if i < 0 or j < 0 or j <= i:
    fails.append('profile tab block bounds not found')
else:
    new_block = """              {tab === 'profile' && (
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

"""
    s = s[:i] + new_block + s[j:]

# ---------- shop tab strings ----------
rep(
    """                      <p className="ls-font text-sm text-white">Free coin refill</p>
                      <p className="text-[10px] text-amber-100/80">Tap anytime — instant +{FREE_REFILL.toLocaleString()} coins</p>
""",
    """                      <p className="ls-font text-sm text-white">{tr('freeRefill')}</p>
                      <p className="text-[10px] text-amber-100/80">{tr('tapAnytime')} +{FREE_REFILL.toLocaleString()} {tr('coins')}</p>
""",
    1, 'shop refill',
)
rep(
    """                      <p className="ls-font text-sm text-white">Gems</p>
                      <p className="text-[10px] text-fuchsia-100/75">Earn 2 gems for every online win</p>
""",
    """                      <p className="ls-font text-sm text-white">{tr('gems')}</p>
                      <p className="text-[10px] text-fuchsia-100/75">{tr('earnGems')}</p>
""",
    1, 'shop gems',
)
rep(
    """                    <p className="ls-font text-xs text-amber-200">MORE WAYS TO EARN</p>
""",
    """                    <p className="ls-font text-xs text-amber-200">{tr('moreWays')}</p>
""",
    1, 'shop more ways',
)
rep(
    """                      <li className="flex items-center gap-2"><Gift size={12} className="text-amber-200" /> Daily chest — open the Chest tab every day</li>
                      <li className="flex items-center gap-2"><Trophy size={12} className="text-amber-200" /> Win online tables — pot goes to the champion</li>
                      <li className="flex items-center gap-2"><IconStarGold size={13} /> Streak Stars — bigger rewards every day in a row</li>
""",
    """                      <li className="flex items-center gap-2"><Gift size={12} className="text-amber-200" /> {tr('dailyChestLine')}</li>
                      <li className="flex items-center gap-2"><Trophy size={12} className="text-amber-200" /> {tr('winOnlineLine')}</li>
                      <li className="flex items-center gap-2"><IconStarGold size={13} /> {tr('streakStarsLine')}</li>
""",
    1, 'shop bullets',
)

# ---------- friends tab strings ----------
rep(
    """                  <p className="mb-2 text-[11px] text-fuchsia-100/70">{onlineFriends} friends online now</p>
""",
    """                  <p className="mb-2 text-[11px] text-fuchsia-100/70">{onlineFriends} {tr('friendsOnlineNow')}</p>
""",
    1, 'friends count',
)
rep(
    """                              {f.status === 'in-game' ? `Playing at ${f.table}` : f.status === 'online' ? `Level ${f.level} · Online` : 'Offline'}
""",
    """                              {f.status === 'in-game' ? `${tr('playingAt')} ${f.table}` : f.status === 'online' ? `${tr('level')} ${f.level} · ${tr('online')}` : tr('offline')}
""",
    1, 'friend status',
)
rep(
    """                              <Zap size={10} /> PLAY
""",
    """                              <Zap size={10} /> {tr('play')}
""",
    1, 'friends play btn',
)
rep(
    """                    Open a Private Table from Home and share the code to invite anyone.
""",
    """                    {tr('inviteNote')}
""",
    1, 'friends invite note',
)

# ---------- chest tab strings ----------
rep(
    """                      {dailyClaimable ? `DAY ${(daily?.streak ?? 0) + 1} — CLAIM` : 'CLAIMED — BACK TOMORROW'}
""",
    """                      {dailyClaimable ? `${tr('day')} ${(daily?.streak ?? 0) + 1} — ${tr('claim')}` : tr('claimedBack')}
""",
    1, 'chest claim',
)
rep(
    """                      {DAILY_REWARDS[daily ? Math.min(6, daily.streak) : 0].toLocaleString()} coins
""",
    """                      {DAILY_REWARDS[daily ? Math.min(6, daily.streak) : 0].toLocaleString()} {tr('coinsShort')}
""",
    1, 'chest coins',
)
rep(
    """                    <p className="ls-font mb-2 text-xs text-amber-200">STREAK STARS</p>
""",
    """                    <p className="ls-font mb-2 text-xs text-amber-200">{tr('streakStars')}</p>
""",
    1, 'chest streak stars',
)
rep(
    """                    <p className="mt-2 text-[10px] leading-relaxed text-fuchsia-100/60">Come back every day — the chest grows to 2,500 coins on day 7.</p>
""",
    """                    <p className="mt-2 text-[10px] leading-relaxed text-fuchsia-100/60">{tr('chestNote')}</p>
""",
    1, 'chest note',
)

# ---------- sheet strings ----------
rep(
    """                        <h3 className="ls-font text-lg leading-tight text-white">{sheet === 'table2' ? '2 PLAYER' : '4 PLAYER'}</h3>
""",
    """                        <h3 className="ls-font text-lg leading-tight text-white">{sheet === 'table2' ? tr('twoPlayer') : tr('fourPlayer')}</h3>
""",
    1, 'sheet table heading',
)
rep(
    """                          {sheet === 'table2' ? '1 v 1 online table' : '4 seats · live players & bots'}
""",
    """                          {sheet === 'table2' ? tr('oneVOne') : tr('fourSeats')}
""",
    1, 'sheet table sub',
)
rep(
    """                    <p className="ls-font mb-1.5 text-[10px] tracking-wide text-amber-200">GAME TYPE</p>
""",
    """                    <p className="ls-font mb-1.5 text-[10px] tracking-wide text-amber-200">{tr('gameType')}</p>
""",
    2, 'game type x2',
)
rep(
    """                    <p className="ls-font mb-1.5 mt-3 text-[10px] tracking-wide text-amber-200">ENTRY STAKE</p>
""",
    """                    <p className="ls-font mb-1.5 mt-3 text-[10px] tracking-wide text-amber-200">{tr('entryStake')}</p>
""",
    1, 'sheet entry stake 1',
)
rep(
    """                          <span className="inline-flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> FINDING TABLE...</span>
""",
    """                          <span className="inline-flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> {tr('findingTable')}</span>
""",
    1, 'finding table',
)
rep(
    """                            <Globe size={17} /> PLAY ONLINE
""",
    """                            <Globe size={17} /> {tr('playOnline')}
""",
    1, 'play online',
)
rep(
    """                          <Bot size={13} /> VS BOT
""",
    """                          <Bot size={13} /> {tr('vsBot')}
""",
    1, 'vs bot',
)
rep(
    """                          <Users size={13} /> PASS N PLAY
""",
    """                          <Users size={13} /> {tr('passNPlay')}
""",
    1, 'pass n play sheet',
)
rep(
    """                        <span className="text-[11px] text-rose-200">Not enough coins for this stake.</span>
""",
    """                        <span className="text-[11px] text-rose-200">{tr('notEnoughCoins')}</span>
""",
    2, 'not enough coins x2',
)
rep(
    """                          GET {FREE_REFILL.toLocaleString()} FREE
""",
    """                          {tr('freeRefillBtn')}
""",
    2, 'get free x2',
)
rep(
    """                        <h3 className="ls-font text-lg leading-tight text-white">PRIVATE TABLE</h3>
""",
    """                        <h3 className="ls-font text-lg leading-tight text-white">{tr('privateTable')}</h3>
""",
    1, 'private sheet heading',
)
rep(
    """                        <p className="text-[10px] text-fuchsia-100/60">Room code with friends</p>
""",
    """                        <p className="text-[10px] text-fuchsia-100/60">{tr('roomWithFriends')}</p>
""",
    1, 'private sheet sub',
)
rep(
    """                    <p className="ls-font mb-1.5 text-[10px] tracking-wide text-amber-200">ENTRY STAKE</p>
""",
    """                    <p className="ls-font mb-1.5 text-[10px] tracking-wide text-amber-200">{tr('entryStake')}</p>
""",
    1, 'entry stake 2',
)
rep(
    """                        <span className="inline-flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> CREATING...</span>
""",
    """                        <span className="inline-flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> {tr('creating')}</span>
""",
    1, 'creating',
)
rep(
    """                          <KeyRound size={17} /> CREATE ROOM
""",
    """                          <KeyRound size={17} /> {tr('createRoom')}
""",
    1, 'create room',
)
rep(
    """                        placeholder="ENTER ROOM CODE"
""",
    """                        placeholder={tr('roomCode')}
""",
    1, 'room code placeholder',
)
rep(
    """                        <Send size={13} /> JOIN
""",
    """                        <Send size={13} /> {tr('join')}
""",
    1, 'join',
)
rep(
    """                        <h3 className="ls-font text-lg leading-tight text-white">OFFLINE</h3>
                        <p className="text-[10px] text-fuchsia-100/60">Play instantly · free</p>
""",
    """                        <h3 className="ls-font text-lg leading-tight text-white">{tr('offline')}</h3>
                        <p className="text-[10px] text-fuchsia-100/60">{tr('playInstant')}</p>
""",
    1, 'offline sheet',
)
rep(
    """                    <p className="ls-font mb-1.5 mt-3 text-[10px] tracking-wide text-amber-200">PLAYERS</p>
""",
    """                    <p className="ls-font mb-1.5 mt-3 text-[10px] tracking-wide text-amber-200">{tr('players')}</p>
""",
    1, 'players heading',
)
rep(
    """                          <Users size={13} /> {n} PLAYERS
""",
    """                          <Users size={13} /> {n} {tr('players')}
""",
    1, 'n players',
)
rep(
    """                        <Bot size={18} /> VS COMPUTER
""",
    """                        <Bot size={18} /> {tr('vsComputer')}
""",
    1, 'vs computer',
)
rep(
    """                        <Users size={14} /> PASS N PLAY
""",
    """                        <Users size={14} /> {tr('passNPlay')}
""",
    1, 'pass n play offline',
)
rep(
    """                        <h3 className="ls-font text-lg leading-tight text-white">LEADERBOARD</h3>
                        <p className="text-[10px] text-fuchsia-100/60">Season 1 · resets every Monday</p>
""",
    """                        <h3 className="ls-font text-lg leading-tight text-white">{tr('leaderboard')}</h3>
                        <p className="text-[10px] text-fuchsia-100/60">{tr('season')}</p>
""",
    1, 'ranks heading',
)
rep(
    """                              {r.name}{'isYou' in r && r.isYou ? ' (You)' : ''}
""",
    """                              {r.name}{'isYou' in r && r.isYou ? ` ${tr('you')}` : ''}
""",
    1, 'you marker',
)
rep(
    """                            <span className="ls-font w-12 text-right text-[11px] text-amber-100">{r.wins} wins</span>
""",
    """                            <span className="ls-font w-12 text-right text-[11px] text-amber-100">{r.wins} {tr('winsShort')}</span>
""",
    1, 'rank wins',
)
rep(
    """                    <p className="mt-2 text-[10px] text-fuchsia-100/50">Wins from every mode count toward your rank.</p>
""",
    """                    <p className="mt-2 text-[10px] text-fuchsia-100/50">{tr('winsFromAll')}</p>
""",
    1, 'wins from all',
)
rep(
    """            <Copy size={13} className="text-emerald-300" /> Copied!
""",
    """            <Copy size={13} className="text-emerald-300" /> {tr('copied')}
""",
    1, 'copied toast',
)

open(P, 'w').write(s)
print('OK — all patches applied' if not fails else 'PARTIAL — failures:\n' + '\n'.join(fails))
sys.exit(1 if fails else 0)
