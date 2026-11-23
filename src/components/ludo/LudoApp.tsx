'use client'

// Ludo Royale — root app: lobby <-> waiting room <-> game,
// with smooth page transitions between views.

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLudo } from '@/stores/ludoStore'
import MenuScreen from '@/components/ludo/MenuScreen'
import WaitingRoom from '@/components/ludo/WaitingRoom'
import GameScreen from '@/components/ludo/GameScreen'

const VIEWS: Record<string, React.ComponentType> = {
  menu: MenuScreen,
  lobby: WaitingRoom,
  game: GameScreen,
}

// premium velvet-table photo backdrop (static asset, next to logo.svg)
const BG_TABLE_IMG = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/bg-table.png`

export default function LudoApp() {
  const view = useLudo((s) => s.view)
  const hydrate = useLudo((s) => s.hydrate)

  useEffect(() => {
    hydrate()
    ;(window as unknown as { __LUDO__: typeof useLudo }).__LUDO__ = useLudo
  }, [hydrate])

  const Active = VIEWS[view] ?? MenuScreen

  return (
    <main className="ls-bg h-[100dvh] overflow-hidden text-indigo-50">
      {/* high-quality velvet table photo — sits UNDER every screen; the
          dark gradient keeps the board and text readable on top of it.
          Static (never re-renders), so it costs nothing at runtime. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(7,9,28,0.60) 0%, rgba(7,9,28,0.68) 55%, rgba(7,9,28,0.78) 100%), url(${BG_TABLE_IMG})`,
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center, center',
        }}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.985 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="h-full"
        >
          <Active />
        </motion.div>
      </AnimatePresence>
    </main>
  )
}
