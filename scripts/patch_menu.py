#!/usr/bin/env python3
"""Premium home-screen upgrade patch for MenuScreen.tsx.

Every replacement is counted: the script FAILS if any anchor appears an
unexpected number of times, so nothing is silently skipped. All existing
handlers/state stay untouched — only presentation swaps.
"""
import re
import sys

P = '/home/z/my-project/src/components/ludo/MenuScreen.tsx'
src = open(P).read()
done = []


def rep(old, new, expect=1):
    global src
    n = src.count(old)
    if n != expect:
        print(f'ANCHOR MISMATCH ({n} != {expect}): {old[:70]!r}')
        sys.exit(1)
    src = src.replace(old, new)
    done.append(old[:44])


# 1) lucide imports: add Bell, CalendarDays, Play, Settings
rep(
    """import {
  Bot, Check, ChevronRight, Copy, Flag, Gift, Globe,
  KeyRound, Loader2, Send, Trophy,
  Users, Volume2, VolumeX, Zap,
} from 'lucide-react'""",
    """import {
  Bell, Bot, CalendarDays, Check, ChevronRight, Copy, Flag, Gift, Globe,
  KeyRound, Loader2, Play, Send, Settings, Trophy,
  Users, Volume2, VolumeX, Zap,
} from 'lucide-react'""",
)
# 2) icons import: drop IconGear (lucide Settings now) + RailTrophy (3D now)
rep('IconGear, IconStarGold, HomeGlyph,', 'IconStarGold, HomeGlyph,')
rep('RailEvents, RailTrophy, RailClubs,', 'RailEvents, RailClubs,')
# 3) art3d import after MenuArt import
rep(
    "import { Art2P, Art4P, ArtPrivate, ArtOffline } from '@/components/ludo/MenuArt'",
    "import { Art2P, Art4P, ArtPrivate, ArtOffline } from '@/components/ludo/MenuArt'\n"
    "import {\n"
    "  Coin3D, Gem3D, Chest3D, Trophy3D, Dice3D, Pawn2x3D, Pawn4x3D, Robot3D, Crown3D, Gift3D,\n"
    "} from '@/components/ludo/art3d'",
)
# 4) EVENTS icons: emoji -> premium art
rep("{ icon: '💎', title: 'Season 1 is live'", "{ icon: <Gem3D size={20} />, title: 'Season 1 is live'")
rep("{ icon: '🎁', title: 'Daily login streak'", "{ icon: <Gift3D size={20} />, title: 'Daily login streak'")
rep("{ icon: '🎉', title: 'Weekend tables'", "{ icon: <Crown3D size={22} />, title: 'Weekend tables'")
# 5) PlayChip atom before the main screen
rep(
    '// ---------- main screen ----------',
    """function PlayChip() {
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

// ---------- main screen ----------""",
)
# 6) currency chips -> 3D art
rep('<CoinIcon size={15} />', '<Coin3D size={24} />')
rep('<GemIcon size={15} />', '<Gem3D size={22} />')
# 7) settings gear -> lucide Settings
rep('<IconGear size={22} />', '<Settings size={20} />')
# 8) notification bell before the settings block
rep(
    '            {/* settings */}\n            <div className="relative">',
    '''            {/* notifications — same events panel as the rail button */}
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
            <div className="relative">''',
)
# 9) XP bar under the level pill
rep(
    '              <Flag size={9} fill="#fff" /> Level {lvl.level}\n            </span>',
    '''              <Flag size={9} fill="#fff" /> Level {lvl.level}
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
            </div>''',
)
# 10) rail trophy -> 3D trophy
rep('<RailTrophy size={34} />', '<Trophy3D size={30} />')
# 11) DAILY shortcut after the clubs rail button
rep(
    '            <span className="ls-font text-[8px] tracking-widest text-fuchsia-100/80">CLUBS</span>\n          </motion.button>\n        </div>',
    '''            <span className="ls-font text-[8px] tracking-widest text-fuchsia-100/80">CLUBS</span>
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
        </div>''',
)
# 12) tile art -> 3D assets + play chips
rep(
    '<div className="min-h-0 flex-1"><Art2P /></div>',
    '''<div className="relative min-h-0 flex-1">
                <div className="grid h-full place-items-center pb-0.5"><Pawn2x3D size={84} /></div>
                <PlayChip />
              </div>''',
)
rep(
    '<div className="min-h-0 flex-1"><ArtPrivate /></div>',
    '''<div className="relative min-h-0 flex-1">
                <div className="grid h-full place-items-center pb-0.5"><Crown3D size={74} /></div>
                <PlayChip />
              </div>''',
)
rep(
    '<div className="min-h-0 flex-1"><Art4P /></div>',
    '''<div className="relative min-h-0 flex-1">
                <div className="grid h-full place-items-center pb-0.5"><Pawn4x3D size={74} /></div>
                <PlayChip />
              </div>''',
)
rep(
    '<div className="min-h-0 flex-1"><ArtOffline /></div>',
    '''<div className="relative min-h-0 flex-1">
                <div className="grid h-full place-items-center pb-0.5"><Robot3D size={66} /></div>
                <PlayChip />
              </div>''',
)
# 13) tile entrance/hover animations — 4 occurrences, staggered
TILE_ANIM = (
    (0.05,),
    (0.12,),
    (0.19,),
    (0.26,),
)
total_tiles = src.count('whileTap={{ scale: 0.96 }}')
if total_tiles != 4:
    print(f'TILE ANCHOR MISMATCH ({total_tiles} != 4)')
    sys.exit(1)
for (delay,) in TILE_ANIM:
    src = src.replace(
        'whileTap={{ scale: 0.96 }}',
        f"whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: {delay}, duration: 0.35, ease: 'easeOut' }}",
        1,
    )
    done.append(f'tile anim delay {delay}')
# 14) deco: the big floating die becomes the 3D dice pair
rep('<DecoDie value={5} size={40} tilt={-14} />', '<Dice3D size={46} />')
# 15) bottom nav: chest gets the 3D treasure chest
rep('<NavChest size={30} />', '<Chest3D size={30} />')
# 16) raised HOME button: bigger + glowing active state (CSS-driven glow)
rep(
    'className="ls-tile-purple -mt-6 grid h-12 w-14 place-items-center rounded-2xl text-white"',
    'className={`ls-tile-purple -mt-7 grid h-14 w-16 place-items-center rounded-2xl text-white ${active ? \'ls-nav-home-glow\' : \'\'}`}',
)
rep('<HomeGlyph size={26} />', '<HomeGlyph size={30} />')

print(f'{len(done)} replacements OK')
open(P, 'w').write(src)
