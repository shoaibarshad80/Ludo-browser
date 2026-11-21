'use client'

// ============================================================
// GameScreen — Ludo Star table layout (same-to-same with the
// reference screenshot, premium edition):
//  · purple palace backdrop with soft pattern
//  · top HUD: menu · friends · trophy · sound + gold coins pill
//  · four corner player plates — YOUR plate always sits bottom-left
//    (Ludo Star seating), the others fill the corners clockwise; die
//    beside each
//  · clean board in the middle (yards hold only the pawns)
//  · compact status row under the board: EMOJI · turn pill · CHAT
// All game logic & handlers preserved (rules, dice, moves,
// turns, chat, emotes untouched).
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Plus, Trophy, Users, Volume2, VolumeX } from 'lucide-react'
import Board from '@/components/ludo/Board'
import Avatar from '@/components/ludo/Avatar'
import { DicePlate } from '@/components/ludo/Dice'
import { ChatPanel, EmoteButton, ChatButton } from '@/components/ludo/EmoteBar'
import WinOverlay from '@/components/ludo/WinOverlay'
import { useLudo } from '@/stores/ludoStore'
import { COLOR_HEX } from '@/lib/ludo/board'
import { FREE_REFILL } from '@/lib/ludo/constants'
import { TURN_SECONDS } from '@/lib/ludo/constants'
import type { Color, Player } from '@/lib/ludo/types'

/** 5000 -> "5K", 1200 -> "1.2K" (Ludo Star style coins text) */
function fmtCoins(n: number): string {
  if (n < 1000) return `${n}`
  const k = Math.round(n / 100) / 10
  return `${k.toString().replace(/\.0$/, '')}K`
}

/** tiny embossed gold coin */
function CoinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <defs>
        <radialGradient id="ls-coin-face" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#ffe98d" />
          <stop offset="0.55" stopColor="#f5c231" />
          <stop offset="1" stopColor="#c07c08" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#ls-coin-face)" stroke="#925c05" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b97c10" strokeWidth="1.2" opacity="0.8" />
      <path
        d="M12 7.6 l1.3 2.7 3 .4 -2.2 2 .6 2.9 -2.7 -1.5 -2.7 1.5 .6 -2.9 -2.2 -2 3 -.4 Z"
        fill="#8a5a06"
        opacity="0.72"
      />
      <ellipse cx="8.6" cy="7.8" rx="3" ry="1.8" fill="#fff" opacity="0.35" />
    </svg>
  )
}

interface SeatProps {
  color: Color | null
  player: Player | undefined
  isTurn: boolean
  isYou: boolean
  remainingSec: number | null
  showDice: boolean
  diceValues: number[]
  diceRolling: boolean
  canRoll: boolean
  usedDice: number[]
  selectedDie: number
  onSelectDie: (i: number) => void
  onRoll: () => void
  side: 'left' | 'right'
}

/** corner player plate: cartoon avatar in a color ring + name pill + die beside.
 *  color null (empty corner in 2-player games) renders an invisible spacer. */
function PlateSeat(p: SeatProps) {
  if (!p.color || !p.player) {
    // unused seat (2-player games) — invisible spacer keeps the board centered
    return <div className="h-[62px] w-[98px] shrink-0" aria-hidden />
  }
  const c = COLOR_HEX[p.color]
  const isTurn = p.isTurn
  return (
    <div className={`flex shrink-0 items-center gap-2 ${p.side === 'right' ? 'flex-row-reverse' : ''}`}>
      {/* avatar column */}
      <div className="flex flex-col items-center gap-1">
        <div className="relative" style={{ width: 44, height: 44 }}>
          {/* ring */}
          <div
            className="absolute inset-0 rounded-full transition-shadow duration-300"
            style={{
              background: `linear-gradient(160deg, ${c.light}, ${c.main} 55%, ${c.dark})`,
              border: isTurn ? '3px solid #ffd23e' : '2.5px solid rgba(255,255,255,0.8)',
              boxShadow: isTurn
                ? `0 0 16px 4px ${c.glow}, 0 0 4px 1px #ffd23e, 0 4px 8px rgba(10,2,20,0.5)`
                : '0 4px 8px rgba(10,2,20,0.5), inset 0 1px 0 rgba(255,255,255,0.5)',
            }}
          />
          {/* face window */}
          <div
            className="absolute inset-[9%] overflow-hidden rounded-full"
            style={{ background: `radial-gradient(circle at 50% 30%, #fff7e8, ${c.light}66)` }}
          >
            <Avatar color={p.color} className="h-full w-full" />
          </div>
          {/* turn-timer ring (graph of the turn budget) */}
          {isTurn && p.remainingSec != null && (
            <svg className="absolute -inset-[14%]" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(20,8,40,0.35)" strokeWidth="3" />
              <circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke={p.remainingSec <= 3 ? '#ef4444' : '#ffd23e'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0, Math.min(1, p.remainingSec / TURN_SECONDS)) * 106.8} 106.8`}
              />
            </svg>
          )}
          {/* crown — every seat wears one; the turn seat's crown bobs */}
          {isTurn ? (
            <motion.span
              className="pointer-events-none absolute left-1/2 z-20"
              style={{ top: -17, fontSize: 19, filter: 'drop-shadow(0 2px 3px rgba(10,2,20,0.6))' }}
              animate={{ x: '-50%', y: [0, -3.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.15, ease: 'easeInOut' }}
              aria-hidden
            >
              👑
            </motion.span>
          ) : (
            <span
              className="pointer-events-none absolute left-1/2 z-20"
              style={{ top: -14, fontSize: 14, transform: 'translateX(-50%) rotate(8deg)', filter: 'grayscale(0.25) drop-shadow(0 2px 2px rgba(10,2,20,0.55))', opacity: 0.85 }}
              aria-hidden
            >
              👑
            </span>
          )}
          {/* seconds chip while the turn clock runs */}
          {isTurn && p.remainingSec != null && (
            <span
              className="ls-font absolute -bottom-1 -right-1 rounded-full px-1 leading-tight"
              style={{
                background: p.remainingSec <= 3 ? 'linear-gradient(180deg,#f4695f,#b02820)' : 'linear-gradient(180deg,#ffe08a,#e09b1a)',
                color: p.remainingSec <= 3 ? '#fff' : '#4a2c00',
                fontSize: 9,
                fontWeight: 900,
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 2px 5px rgba(10,2,20,0.5)',
                zIndex: 20,
              }}
            >
              {p.remainingSec}s
            </span>
          )}
          {/* online dot */}
          {p.player.connected !== false && (
            <span
              className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full"
              style={{ background: 'radial-gradient(circle at 35% 30%, #86efac, #22c55e 60%, #15803d)', border: '2px solid #fff', zIndex: 20 }}
            />
          )}
          {/* YOU badge */}
          {p.isYou && (
            <span
              className="ls-font absolute -left-1.5 -top-0.5 rounded-full px-1 leading-tight text-white"
              style={{
                background: 'linear-gradient(180deg,#3b82f6,#1d4ed8)',
                fontSize: 8,
                border: '1px solid rgba(255,255,255,0.85)',
                boxShadow: '0 2px 4px rgba(10,2,20,0.45)',
                zIndex: 20,
              }}
            >
              YOU
            </span>
          )}
        </div>
        {/* name pill */}
        <span
          className="ls-font flex h-4.5 max-w-[86px] items-center truncate rounded-full px-2 leading-none text-white"
          style={{
            background: 'linear-gradient(180deg, rgba(24,10,40,0.85), rgba(16,6,30,0.85))',
            border: '1px solid rgba(255,255,255,0.3)',
            fontSize: 9.5,
            textShadow: '0 1px 0 rgba(5,2,12,0.8)',
            boxShadow: '0 3px 6px rgba(10,2,20,0.4)',
          }}
        >
          {p.player.name}
          {p.player.isBot ? ' · BOT' : ''}
        </span>
      </div>
      {/* die beside the plate */}
      {p.showDice && (
        <DicePlate
          color={p.color}
          dimmed={!isTurn}
          values={isTurn ? p.diceValues : []}
          rolling={isTurn && p.diceRolling}
          canRoll={isTurn && p.canRoll}
          isYou={p.isYou}
          usedDice={isTurn ? p.usedDice : []}
          selectedDie={p.selectedDie}
          onSelectDie={p.onSelectDie}
          onRoll={p.onRoll}
          size={46}
        />
      )}
    </div>
  )
}

export default function GameScreen() {
  const game = useLudo((s) => s.game)
  const session = useLudo((s) => s.session)
  const profile = useLudo((s) => s.profile)
  const animating = useLudo((s) => s.animating)
  const diceRolling = useLudo((s) => s.diceRolling)
  const diceValues = useLudo((s) => s.diceValues)
  const canRoll = useLudo((s) => s.canRoll)
  const movableTokenIds = useLudo((s) => s.movableTokenIds)
  const selectedDie = useLudo((s) => s.selectedDie)
  const roll = useLudo((s) => s.roll)
  const clickToken = useLudo((s) => s.clickToken)
  const selectDie = useLudo((s) => s.selectDie)
  const autoPlay = useLudo((s) => s.autoPlay)
  const leaveGame = useLudo((s) => s.leaveGame)
  const sendEmote = useLudo((s) => s.sendEmote)
  const sendChat = useLudo((s) => s.sendChat)
  const chat = useLudo((s) => s.chat)
  const chatOpen = useLudo((s) => s.chatOpen)
  const setChatOpen = useLudo((s) => s.setChatOpen)
  const emotes = useLudo((s) => s.emotes)
  const floatMsgs = useLudo((s) => s.floatMsgs)
  const winData = useLudo((s) => s.winData)
  const soundOn = useLudo((s) => s.soundOn)
  const toggleSound = useLudo((s) => s.toggleSound)
  const addCoins = useLudo((s) => s.addCoins)
  const turnDeadline = useLudo((s) => s.turnDeadline)

  const [now, setNow] = useState(Date.now())
  const lastChatCount = useRef(0)
  const [unread, setUnread] = useState(0)

  // clock tick for timer
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  // unread chat badge
  useEffect(() => {
    if (chat.length > lastChatCount.current) {
      if (!chatOpen) setUnread((u) => Math.min(99, u + chat.length - lastChatCount.current))
    }
    lastChatCount.current = chat.length
  }, [chat, chatOpen])

  useEffect(() => {
    if (chatOpen) setUnread(0)
  }, [chatOpen])

  // turn timeout -> auto play
  useEffect(() => {
    if (!turnDeadline || !game || winData) return
    if (now < turnDeadline) return
    void autoPlay(true)
  }, [now, turnDeadline, game, winData, autoPlay])

  // emotes expire
  const [nowEmote, setNowEmote] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setNowEmote(Date.now()), 300)
    return () => clearInterval(t)
  }, [])

  const visibleEmotes = useMemo(
    () => emotes.filter((e) => Date.now() - e.ts < 4200),
    [emotes, nowEmote]
  )

  if (!game || !session) return null

  const turnColor = game.players[game.turn].color
  const turnPlayer = game.players[game.turn]
  const youTurn = !turnPlayer.isBot && turnColor === session.youColor
  const remainingSec = turnDeadline ? Math.min(TURN_SECONDS, Math.max(0, Math.ceil((turnDeadline - now) / 1000))) : null

  /** who may tap tokens on this device: pass-n-play hands control to each human seat in turn */
  const interactiveColor: Color | null = session.online
    ? youTurn
      ? session.youColor
      : null
    : !turnPlayer.isBot
      ? turnColor
      : null

  // ── Ludo Star seating ──
  // Board yards never move; only the avatar plates rotate so the player
  // this device controls (session.youColor) always sits BOTTOM-LEFT.
  // plates = [TL, TR, BR, BL] in clockwise board order red→green→yellow→blue.
  const CLOCK: Color[] = ['red', 'green', 'yellow', 'blue']
  const inGame = CLOCK.filter((c) => game.players.some((p) => p.color === c))
  let plates: Array<Color | null>
  if (inGame.length === 2) {
    // 2P sits diagonally like Ludo Star: you bottom-left, opponent top-right
    const mine = inGame.includes(session.youColor) ? session.youColor : inGame[0]
    const opp = inGame.find((c) => c !== mine) ?? null
    plates = [null, opp, null, mine]
  } else {
    const i = inGame.indexOf(session.youColor)
    const rot = i >= 0 ? [...inGame.slice(i + 1), ...inGame.slice(0, i + 1)] : inGame
    plates = [rot[0] ?? null, rot[1] ?? null, rot[2] ?? null, rot[3] ?? null]
  }

  // dice shows TAP state when you can roll, otherwise last rolled value(s)
  const displayDice = canRoll && game.phase === 'roll' ? [] : diceValues.length > 0 ? diceValues : game.dice

  const seat = (color: Color | null, side: 'left' | 'right') => (
    <PlateSeat
      color={color}
      player={game.players.find((p) => p.color === color)}
      isTurn={turnColor === color && game.phase !== 'gameover'}
      isYou={session.youColor === color}
      remainingSec={turnColor === color && game.phase !== 'gameover' ? remainingSec : null}
      showDice={game.phase !== 'gameover'}
      diceValues={displayDice}
      diceRolling={diceRolling}
      canRoll={canRoll}
      usedDice={game.usedDice}
      selectedDie={selectedDie ?? 0}
      onSelectDie={selectDie}
      onRoll={() => void roll()}
      side={side}
    />
  )

  // pill text (crown status line under the board)
  const pillText =
    game.phase === 'gameover'
      ? 'GAME OVER'
      : diceRolling
        ? 'ROLLING...'
        : canRoll && game.phase === 'roll' && game.sixStreak > 0
          ? 'SIX! ROLL AGAIN'
          : interactiveColor
            ? game.phase === 'roll'
              ? 'TAP THE DICE'
              : movableTokenIds.length > 0
                ? 'TAP A GLOWING TOKEN'
                : '...'
            : `${turnColor.charAt(0).toUpperCase() + turnColor.slice(1)}'s Turn`

  return (
    <div className="ls-palace relative h-full overflow-hidden">
      <div className="ls-vignette" />
      <div className="ls-safe-bottom relative z-10 mx-auto flex h-full w-full max-w-[430px] flex-col px-0.5 pb-1.5 pt-1.5">
        {/* ── top HUD: menu · friends · trophy · sound — coins pill ── */}
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={leaveGame}
              className="ls-hud-btn grid h-9 w-10 place-items-center rounded-xl text-white"
              aria-label="Leave game"
            >
              <Menu size={17} strokeWidth={2.6} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setChatOpen(!chatOpen)}
              className="ls-hud-btn relative grid h-9 w-9 place-items-center rounded-xl text-white"
              aria-label="Friends and chat"
            >
              <Users size={16} strokeWidth={2.4} />
              {unread > 0 && (
                <span
                  className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-0.5 text-[9px] font-bold text-white"
                  style={{ background: 'linear-gradient(180deg,#f4695f,#b02820)', border: '1px solid #fecaca' }}
                >
                  {unread}
                </span>
              )}
            </motion.button>
            <span className="ls-hud-btn pointer-events-none grid h-9 w-9 place-items-center rounded-xl" aria-hidden>
              <Trophy size={16} className="text-amber-300" style={{ filter: 'drop-shadow(0 1px 1px rgba(80,40,0,0.6))' }} />
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleSound}
              className="ls-hud-btn grid h-9 w-9 place-items-center rounded-xl text-white"
              aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
            >
              {soundOn ? <Volume2 size={16} strokeWidth={2.4} /> : <VolumeX size={16} strokeWidth={2.4} />}
            </motion.button>
          </div>
          {/* coins pill */}
          <div
            className="flex items-center gap-1.5 rounded-full py-1 pl-2 pr-1"
            style={{
              background: 'linear-gradient(180deg, rgba(52,18,74,0.92), rgba(30,8,50,0.92))',
              border: '1.5px solid rgba(246,196,83,0.55)',
              boxShadow: 'inset 0 1px 0 rgba(255,236,190,0.22), 0 4px 10px rgba(10,2,20,0.45)',
            }}
          >
            <CoinIcon size={17} />
            <span className="ls-font text-[13px] leading-none text-amber-100">{fmtCoins(profile.coins)}</span>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => addCoins(FREE_REFILL)}
              className="grid h-5 w-5 place-items-center rounded-full"
              style={{ background: 'linear-gradient(180deg,#4ade80,#16a34a)', border: '1.5px solid #bbf7d0', boxShadow: '0 2px 0 #14532d' }}
              aria-label="Collect free coins"
            >
              <Plus size={12} strokeWidth={3.5} className="text-white" />
            </motion.button>
          </div>
        </div>

        {/* floating capture / six toasts */}
        <div className="pointer-events-none absolute left-1/2 top-12 z-40 flex -translate-x-1/2 flex-col items-center gap-1">
          <AnimatePresence>
            {floatMsgs.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: -8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="ls-font rounded-full px-4 py-1.5 text-xs text-white shadow-lg"
                style={{
                  background:
                    m.kind === 'capture'
                      ? 'linear-gradient(180deg,#f4695f,#b02820)'
                      : m.kind === 'six'
                        ? 'linear-gradient(180deg,#ffe08a,#e09b1a)'
                        : m.kind === 'forfeit'
                          ? 'linear-gradient(180deg,#7f1d1d,#450a0a)'
                          : 'linear-gradient(180deg,#4a1258,#2b0a3a)',
                  border: '2px solid rgba(233,213,255,0.7)',
                  textShadow: '0 1px 0 rgba(10,2,20,0.6)',
                }}
              >
                {m.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ── table: plates row · board · plates row ── */}
        <div className="flex w-full min-h-0 flex-1 flex-col items-center justify-center">
          {/* top plates: TL | TR */}
          <div className="flex w-full items-center justify-between px-2 pb-0.5">
            {seat(plates[0], 'left')}
            {seat(plates[1], 'right')}
          </div>

          {/* the board — fills the phone edge-to-edge (Ludo Star) */}
          <div className="flex w-full min-h-0 flex-1 items-center justify-center py-0.5">
            <Board
              game={game}
              movableTokenIds={movableTokenIds}
              onTokenClick={(id) => void clickToken(id)}
              interactiveColor={interactiveColor}
              animating={animating}
              emotes={visibleEmotes.map((e) => ({ id: e.id, color: e.color, emoji: e.emoji }))}
            />
          </div>

          {/* bottom plates: BL (you) | BR */}
          <div className="flex w-full items-center justify-between px-2 pt-0.5">
            {seat(plates[3], 'left')}
            {seat(plates[2], 'right')}
          </div>

          {/* status row: EMOJI · turn pill · CHAT */}
          <div className="mt-0.5 flex w-full items-center justify-center gap-2.5">
            <EmoteButton onEmote={sendEmote} />
            <div
              className="flex items-center gap-1.5 rounded-full px-3.5 py-0.5"
              style={{
                background: 'linear-gradient(180deg, rgba(40,12,62,0.9), rgba(24,6,40,0.9))',
                border: `1.5px solid rgba(246,196,83,0.45)`,
                boxShadow: `0 4px 10px rgba(10,2,20,0.45), 0 0 14px ${COLOR_HEX[turnColor]?.glow ?? 'transparent'}55, inset 0 1px 0 rgba(255,236,190,0.16)`,
              }}
            >
            {game.phase !== 'gameover' && (
              <motion.span
                style={{ fontSize: 12, filter: 'drop-shadow(0 1.5px 1px rgba(10,2,20,0.55))' }}
                animate={diceRolling ? { rotate: [0, -12, 12, 0] } : { y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: diceRolling ? 0.4 : 1.3, ease: 'easeInOut' }}
                aria-hidden
              >
                👑
              </motion.span>
            )}
            <span className="ls-font text-[12px] tracking-wide" style={{ color: COLOR_HEX[turnColor]?.light, textShadow: '0 1px 0 rgba(10,2,20,0.7)' }}>
              {pillText}
            </span>
          </div>
          <ChatButton onOpenChat={() => setChatOpen(!chatOpen)} unread={unread} />
          </div>
          {game.mode === 'master' && game.dice.length > 1 && (
            <div className="text-center text-[10px] text-fuchsia-200/50">Master: use both dice · tap a die to switch</div>
          )}
        </div>
      </div>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} chat={chat} onSend={sendChat} youColor={session.youColor} />

      <AnimatePresence>
        {winData && <WinOverlay win={winData} isOnline={session.online} />}
      </AnimatePresence>
    </div>
  )
}

// re-export for potential external timer use
export { TURN_SECONDS }
