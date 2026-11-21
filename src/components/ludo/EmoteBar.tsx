'use client'

// Floating side stack (right edge, over the yard margin — Ludo Star style)
// + quick chat + chat panel — premium glass styling

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Smile, X } from 'lucide-react'
import { CHAT_QUICK, EMOTES } from '@/lib/ludo/constants'
import type { Color } from '@/lib/ludo/types'
import { COLOR_HEX } from '@/lib/ludo/board'

export function EmoteBar({
  onEmote,
  onOpenChat,
  unread,
}: {
  onEmote: (emoji: string) => void
  onOpenChat: () => void
  unread: number
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex flex-col items-center gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 12, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.85 }}
            className="ls-panel absolute right-11 top-0 z-50 w-60 rounded-2xl px-3 py-2"
          >
            <div className="grid grid-cols-6 gap-1">
              {EMOTES.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    onEmote(e)
                    setOpen(false)
                  }}
                  className="grid h-9 w-9 place-items-center rounded-xl text-xl transition hover:scale-110"
                  style={{ background: 'rgba(148,163,255,0.08)' }}
                  aria-label={`Send emote ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="mt-1.5 border-t border-white/10 pt-1.5">
              <div className="flex flex-wrap gap-1">
                {CHAT_QUICK.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      sendQuick(q, onEmote)
                      setOpen(false)
                    }}
                    className="ls-chip rounded-full px-2.5 py-1 text-[10px] text-indigo-100 transition hover:brightness-125"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen((o) => !o)}
        className="ls-bottom-btn relative grid h-10 w-10 place-items-center rounded-full"
        aria-label="Send emote"
      >
        <Smile size={18} className="text-amber-300" />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={onOpenChat}
        className="ls-bottom-btn relative grid h-10 w-10 place-items-center rounded-full"
        aria-label="Open chat"
      >
        <MessageCircle size={17} className="text-violet-200" />
        {unread > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: 'linear-gradient(180deg,#f4695f,#b02820)', border: '1.5px solid #fecaca', boxShadow: '0 2px 6px rgba(10,2,20,0.5)' }}
          >
            {unread}
          </span>
        )}
      </motion.button>
    </div>
  )
}

function sendQuick(text: string, onEmote: (emoji: string) => void) {
  // quick chats ride on the emote channel as text bubbles
  onEmote(text)
}

export function ChatPanel({
  open,
  onClose,
  chat,
  onSend,
  youColor,
}: {
  open: boolean
  onClose: () => void
  chat: Array<{ id: number; color: Color; name: string; text: string; ts: number }>
  onSend: (text: string) => void
  youColor: Color
}) {
  const [text, setText] = useState('')
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="ls-panel fixed bottom-4 left-1/2 z-50 w-72 -translate-x-1/2 max-w-[calc(100vw-2rem)] rounded-2xl"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="ls-font text-xs text-indigo-100">TABLE CHAT</span>
            <button onClick={onClose} aria-label="Close chat" className="text-indigo-300/70 hover:text-white">
              <X size={15} />
            </button>
          </div>
          <div className="ls-scroll max-h-44 space-y-1.5 overflow-y-auto px-3 py-2">
            {chat.length === 0 && <p className="py-6 text-center text-[11px] text-indigo-300/50">No messages yet. Say hi!</p>}
            {chat.map((m) => (
              <div key={m.id} className="flex items-start gap-1.5 text-[11px]">
                <span
                  className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: COLOR_HEX[m.color]?.main ?? '#94a3b8' }}
                />
                <span className="font-bold" style={{ color: COLOR_HEX[m.color]?.light ?? '#e2e8f0' }}>
                  {m.name}:
                </span>
                <span className="text-indigo-50/90">{m.text}</span>
              </div>
            ))}
          </div>
          <form
            className="flex gap-1.5 border-t border-white/10 p-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!text.trim()) return
              onSend(text)
              setText('')
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              maxLength={120}
              className="ls-glass-input min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-[11px] text-indigo-50 placeholder:text-indigo-300/40"
              aria-label="Chat message"
            />
            <button
              type="submit"
              className="ls-btn ls-font rounded-lg px-3 py-1.5 text-[11px] text-white"
            >
              SEND
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
