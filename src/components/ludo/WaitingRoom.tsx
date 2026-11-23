'use client'

// ============================================================
// WAITING ROOM — dedicated multiplayer lobby screen:
// color-coded player slots, room code + copy invite,
// waiting animation, start / add-bot / cancel controls.
// ============================================================

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Bot, Check, Copy, Crown, Loader2, Play, Send, Users, WifiOff } from 'lucide-react'
import { useLudo } from '@/stores/ludoStore'
import { MODE_LABELS } from '@/lib/ludo/constants'
import { AvatarRing, CoinIcon } from '@/components/ludo/ui'
import { COLOR_HEX } from '@/lib/ludo/board'
import type { Color } from '@/lib/ludo/types'

const SEAT_ORDER: Color[] = ['red', 'green', 'yellow', 'blue']

export default function WaitingRoom() {
  const lobby = useLudo((s) => s.lobby)
  const profile = useLudo((s) => s.profile)
  const onlineStatus = useLudo((s) => s.onlineStatus)
  const onlineError = useLudo((s) => s.onlineError)
  const onlineStart = useLudo((s) => s.onlineStart)
  const onlineAddBot = useLudo((s) => s.onlineAddBot)
  const onlineLeave = useLudo((s) => s.onlineLeave)

  const [copied, setCopied] = useState(false)

  // if the lobby disappeared (disconnect / room closed) go back to menu
  useEffect(() => {
    if (!lobby && onlineStatus !== 'playing') {
      const t = setTimeout(() => useLudo.getState().goto('menu'), 900)
      return () => clearTimeout(t)
    }
  }, [lobby, onlineStatus])

  if (!lobby) {
    return (
      <div className="grid h-full place-items-center">
        <div className="ls-panel flex items-center gap-3 rounded-2xl px-6 py-4 text-sm text-indigo-100">
          <Loader2 size={16} className="animate-spin text-violet-300" />
          Leaving room...
        </div>
      </div>
    )
  }

  const isHost = lobby.hostId === profile.id
  const seatsFull = lobby.players.length >= lobby.seats
  const myPlayer = lobby.players.find((p) => p.id === profile.id)

  function copyInvite() {
    navigator.clipboard?.writeText(lobby!.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => undefined)
  }

  return (
    <div className="relative grid h-full place-items-center overflow-hidden px-4 py-8">
      <div className="ls-starfield" />
      <motion.div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 210, damping: 20 }}
        className="ls-panel relative z-10 w-full max-w-[430px] rounded-3xl p-5"
      >
        {/* header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onlineLeave}
            className="ls-btn ls-btn-ghost flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-indigo-100"
            aria-label="Leave room"
          >
            <ArrowLeft size={14} /> Leave
          </button>
          <div className="flex items-center gap-2">
            <span className="ls-chip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-indigo-200">
              <Users size={12} /> {lobby.players.length}/{lobby.seats}
            </span>
            <span className="ls-chip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-indigo-200">
              {MODE_LABELS[lobby.mode]}
            </span>
            <span className="ls-chip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-amber-200">
              <CoinIcon size={12} /> {lobby.stake.toLocaleString()} × {lobby.seats}
            </span>
          </div>
        </div>

        {/* room code + copy */}
        <div className="mt-4 flex flex-col items-center">
          <p className="ls-font text-[11px] uppercase tracking-[0.3em] text-indigo-300/70">Room Code</p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={copyInvite}
            className="ls-font ls-chip mt-1.5 flex items-center gap-3 rounded-2xl px-6 py-3 text-4xl tracking-[0.22em] text-amber-200 transition hover:brightness-125"
            aria-label={`Copy room code ${lobby.code}`}
            title="Tap to copy invite code"
          >
            {lobby.code}
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check size={20} className="text-emerald-400" />
                </motion.span>
              ) : (
                <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Copy size={18} className="text-indigo-300" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <p className="mt-1 text-[10px] text-indigo-300/60">Share this code with friends to invite them</p>
        </div>

        {/* player slots around a table */}
        <div className="relative mx-auto mt-5 aspect-square w-full max-w-[300px]">
          {/* center pot */}
          <motion.div
            className="absolute left-1/2 top-1/2 grid h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-center"
            style={{
              background: 'radial-gradient(circle at 35% 30%, rgba(139,92,246,0.4), rgba(30,20,80,0.85))',
              boxShadow: '0 0 30px rgba(124,58,237,0.35), inset 0 0 0 2px rgba(196,181,253,0.4)',
            }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
          >
            <div>
              <p className="ls-font text-[9px] uppercase tracking-widest text-violet-200/80">Prize Pot</p>
              <p className="ls-font flex items-center justify-center gap-1 text-lg text-amber-200">
                <CoinIcon size={15} /> {(lobby.stake * lobby.seats).toLocaleString()}
              </p>
            </div>
          </motion.div>

          {SEAT_ORDER.map((color, i) => {
            const player = lobby.players.find((p) => p.color === color)
            const angle = (i / 4) * 2 * Math.PI - Math.PI / 2
            const x = 50 + 38 * Math.cos(angle)
            const y = 50 + 38 * Math.sin(angle)
            const c = COLOR_HEX[color]
            const angleStyle = {
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }
            if (player) {
              const isMe = player.id === profile.id
              return (
                <motion.div
                  key={color}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.08 * i }}
                  className="ls-panel absolute z-10 flex w-[104px] flex-col items-center gap-1 rounded-2xl px-2 py-2"
                  style={{
                    ...angleStyle,
                    boxShadow: `0 0 0 2px ${c.main}88, 0 8px 20px rgba(2,4,16,0.5)`,
                  }}
                >
                  <div className="relative">
                    <AvatarRing avatar={player.avatar} color={color} size={38} />
                    {player.isHost && (
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-[#4a2c00] ring-2 ring-[#0b0f26]">
                        <Crown size={11} />
                      </span>
                    )}
                  </div>
                  <p className="ls-font max-w-full truncate text-[11px] text-white">
                    {player.name}{isMe ? ' (You)' : ''}
                  </p>
                  <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: c.light }}>
                    {player.isBot ? 'BOT' : 'READY'}
                  </span>
                </motion.div>
              )
            }
            // empty pulsing seat
            return (
              <motion.div
                key={color}
                className="absolute z-10 flex w-[104px] flex-col items-center gap-1 rounded-2xl border-2 border-dashed px-2 py-2"
                style={{ ...angleStyle, borderColor: `${c.main}55` }}
                animate={{ opacity: [0.45, 0.9, 0.45] }}
                transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.3, ease: 'easeInOut' }}
              >
                <span
                  className="grid h-[38px] w-[38px] place-items-center rounded-full text-lg"
                  style={{ background: `${c.main}22`, boxShadow: `inset 0 0 0 2px ${c.main}55` }}
                >
                  ?
                </span>
                <p className="ls-font text-[10px]" style={{ color: `${c.light}99` }}>
                  Waiting...
                </p>
                <span className="text-[8px] uppercase tracking-wide" style={{ color: `${c.main}88` }}>
                  {color}
                </span>
              </motion.div>
            )
          })}
        </div>

        {/* status line */}
        <div className="mt-4 text-center">
          {onlineStatus === 'connecting' ? (
            <p className="flex items-center justify-center gap-2 text-xs text-amber-200">
              <WifiOff size={13} /> Reconnecting to server...
            </p>
          ) : seatsFull ? (
            <p className="ls-font text-xs uppercase tracking-widest text-emerald-300">All players ready</p>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-xs text-indigo-300/80">
              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0 }}>●</motion.span>
              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }}>●</motion.span>
              <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }}>●</motion.span>
              <span className="ml-1">Waiting for players</span>
            </div>
          )}
          {myPlayer && !isHost && (
            <p className="mt-1 text-[10px] text-indigo-300/60">You are seated at {myPlayer.color}. Waiting for the host to start.</p>
          )}
        </div>

        {/* actions */}
        <div className="mt-4 flex gap-2">
          {isHost && !seatsFull && (
            <button
              onClick={onlineAddBot}
              className="ls-btn ls-font flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm text-white"
            >
              <Bot size={15} /> ADD BOT
            </button>
          )}
          {isHost ? (
            <button
              onClick={onlineStart}
              className="ls-btn ls-btn-green ls-font flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-base text-white"
            >
              <Play size={16} /> START GAME
            </button>
          ) : (
            <div className="ls-chip flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-sm text-indigo-200/80">
              <Loader2 size={14} className="animate-spin text-violet-300" /> Waiting for host...
            </div>
          )}
        </div>

        {onlineError && (
          <p className="mt-2 rounded-lg border border-rose-400/30 bg-rose-950/50 px-3 py-1.5 text-center text-[11px] text-rose-200">{onlineError}</p>
        )}

        {/* share row */}
        <button
          onClick={copyInvite}
          className="ls-btn ls-btn-ghost ls-font mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs text-indigo-100"
        >
          <Send size={13} /> COPY INVITATION CODE
        </button>
      </motion.div>
    </div>
  )
}
