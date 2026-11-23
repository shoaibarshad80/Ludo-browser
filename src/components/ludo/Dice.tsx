'use client'

// ============================================================
// Dice — premium 3D ceramic die + DicePlate holder.
// Ludo Star layout: EVERY active player has a die beside their
// avatar plate (outside the board); only the TURN player's die
// is live — tap to roll. The holder is a glossy frame in the
// player color; the turn player's frame glows gold. Rolling
// dice tumble in 3D; landing dice bounce-squash. Master mode
// shows two mini dice. Same props/behavior as before.
// ============================================================

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Color } from '@/lib/ludo/types'
import { COLOR_HEX } from '@/lib/ludo/board'

const PIP: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[27, 27], [73, 73]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[27, 27], [73, 27], [27, 73], [73, 73]],
  5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[27, 24], [73, 24], [27, 50], [73, 50], [27, 76], [73, 76]],
}

export function DieFace({
  value,
  used = false,
  className = '',
  style,
  /** soft colored glow matching the owner player (optional) */
  glowColor,
}: {
  value: number
  used?: boolean
  className?: string
  style?: React.CSSProperties
  glowColor?: string
}) {
  // 3D cube illusion: glossy ceramic face + hard slab edge at the
  // bottom (thickness) + ambient drop + inner bevels on all sides
  const outer: React.CSSProperties = used
    ? { boxShadow: '0 4px 0 rgba(122,131,164,0.9), 0 8px 14px rgba(10,14,40,0.4)' }
    : {
        boxShadow: [
          glowColor ? `0 0 16px 3px ${glowColor}` : null,
          '0 5px 0 #9fa8c9',
          '0 10px 18px rgba(10,14,40,0.5)',
          'inset 0 2px 0 rgba(255,255,255,0.95)',
          'inset 0 -3px 6px rgba(90,100,160,0.30)',
          'inset 2px 0 3px rgba(255,255,255,0.4)',
          'inset -2px 0 4px rgba(90,100,160,0.22)',
        ]
          .filter(Boolean)
          .join(', '),
      }

  return (
    <div
      className={`relative h-full w-full rounded-[26%] ${className}`}
      style={{
        ...style,
        ...outer,
        background: used
          ? 'linear-gradient(150deg,#a7b0cb 0%,#7e89ad 60%,#67719a 100%)'
          : 'linear-gradient(155deg,#ffffff 0%,#f7f8ff 48%,#e2e7f8 100%)',
        border: '2px solid #c3c9e8',
        opacity: used ? 0.45 : 1,
      }}
    >
      {/* glossy sheen sweep */}
      {!used && (
        <span
          className="pointer-events-none absolute inset-0 rounded-[26%]"
          style={{
            background:
              'linear-gradient(128deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.25) 30%, transparent 52%)',
          }}
        />
      )}
      {(PIP[value] ?? PIP[1]).map(([x, y], i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: '20%',
            height: '20%',
            transform: 'translate(-50%,-50%)',
            background: used ? '#8fa0b5' : 'radial-gradient(circle at 35% 30%, #39415e, #05070f 72%)',
            boxShadow: used
              ? 'inset 0 2px 3px rgba(20,25,50,0.5)'
              : 'inset 0 2.5px 4px rgba(0,0,0,0.8), inset 0 -1px 1px rgba(120,130,170,0.35), 0 1px 0 rgba(255,255,255,0.6)',
          }}
        />
      ))}
    </div>
  )
}

/**
 * Face the die shows WHILE rolling: the pips flicker through random
 * values every ~90ms inside the 3D tumble, exactly like a real die
 * spinning on the felt (the old code showed a frozen "3").
 */
function RollingDieFace({ glowColor }: { glowColor?: string }) {
  const [v, setV] = useState(5)
  useEffect(() => {
    const t = setInterval(() => setV(1 + Math.floor(Math.random() * 6)), 90)
    return () => clearInterval(t)
  }, [])
  return <DieFace value={v} glowColor={glowColor} />
}

export interface DicePlateProps {
  color: Color
  values: number[]
  rolling: boolean
  canRoll: boolean
  isYou: boolean
  usedDice: number[]
  selectedDie: number
  onSelectDie?: (i: number) => void
  onRoll?: () => void
  /** plate size in px (default 52) */
  size?: number
  /** idle plate for a player whose turn it is NOT (dimmed, never interactive) */
  dimmed?: boolean
}

/**
 * Dice holder rendered BESIDE each active player's avatar plate.
 * The TURN player's plate is live (tap to roll); other players get
 * a small dimmed plate so every seat keeps its die.
 */
export function DicePlate({
  color,
  values,
  rolling,
  canRoll,
  isYou,
  usedDice,
  selectedDie,
  onSelectDie,
  onRoll,
  size = 52,
  dimmed = false,
}: DicePlateProps) {
  const c = COLOR_HEX[color]
  const showTap = !dimmed && canRoll && values.length === 0 && !rolling
  const twoDice = !dimmed && values.length > 1

  if (dimmed) {
    // quiet plate: same white ceramic die in its colored frame, just dimmed
    return (
      <div
        className="relative shrink-0"
        style={{ width: size, height: size, opacity: 0.55 }}
        aria-hidden
      >
        <div
          className="absolute inset-0 rounded-[30%]"
          style={{
            background: `linear-gradient(160deg, ${c.light} 0%, ${c.main} 55%, ${c.dark} 100%)`,
            border: '2px solid rgba(255,255,255,0.55)',
            boxShadow: `0 4px 0 ${c.dark}, 0 6px 10px rgba(20,4,45,0.35), inset 0 2px 0 rgba(255,255,255,0.35)`,
          }}
        />
        <div className="absolute inset-[12%] rounded-[24%]">
          <DieFace value={6} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* player-colored glossy frame — gold glow when it is this player's move */}
      <div
        className="absolute inset-0 rounded-[30%]"
        style={{
          background: `linear-gradient(160deg, ${c.light} 0%, ${c.main} 55%, ${c.dark} 100%)`,
          border: '2px solid rgba(255,255,255,0.75)',
          boxShadow: showTap
            ? `0 0 0 2.5px rgba(255,214,110,0.95), 0 0 20px 6px ${c.glow}, 0 4px 0 rgba(60,16,80,0.5), 0 8px 14px rgba(20,4,45,0.45), inset 0 2px 0 rgba(255,255,255,0.5)`
            : `0 4px 0 ${c.dark}, 0 7px 12px rgba(20,4,45,0.42), inset 0 2px 0 rgba(255,255,255,0.45)`,
        }}
      />
      {/* inner white die window */}
      <div className="absolute inset-[12%] rounded-[24%]">
        {rolling ? (
          <div className="grid h-full w-full place-items-center" style={{ perspective: 420 }}>
            <motion.div
              className="h-full w-full"
              animate={{
                rotateX: [0, 180, 360, 540, 720],
                rotateY: [0, 120, 240, 480, 600],
                rotate: [0, 40, 0, -30, 0],
                scale: [1, 1.16, 0.94, 1.1, 1],
                y: [0, -9, 0, -5, 0],
              }}
              transition={{ repeat: Infinity, duration: 0.62, ease: 'easeInOut' }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <RollingDieFace glowColor={c.glow} />
            </motion.div>
          </div>
        ) : twoDice ? (
          <div className="flex h-full w-full items-center justify-center gap-[6%]">
            {values.map((v, i) => (
              <motion.button
                key={`${values.join('-')}-${i}`}
                className={`relative aspect-square w-[44%] ${!usedDice.includes(i) && onSelectDie ? 'cursor-pointer' : ''}`}
                onClick={!usedDice.includes(i) && onSelectDie ? () => onSelectDie(i) : undefined}
                initial={{ scale: 1.35, y: -14, rotate: -8, opacity: 0.5 }}
                animate={
                  !usedDice.includes(i) && selectedDie === i
                    ? { scale: 1.12, y: -4, rotate: 0, opacity: 1 }
                    : { scale: 1, y: 0, rotate: 0, opacity: 1 }
                }
                transition={{ type: 'spring', stiffness: 460, damping: 16 }}
                aria-label={`Die ${i + 1} showing ${v}${usedDice.includes(i) ? ' (used)' : ''}`}
              >
                <DieFace value={v} used={usedDice.includes(i)} glowColor={usedDice.includes(i) ? undefined : c.glow} />
                {!usedDice.includes(i) && selectedDie === i && (
                  <span className="absolute -inset-[18%] rounded-[30%] border-[2.5px] border-white/90" />
                )}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="grid h-full w-full place-items-center">
            <motion.button
              key={`v${values[0] ?? 'e'}`}
              className={`relative h-full w-full ${showTap ? 'cursor-pointer' : ''}`}
              onClick={showTap ? onRoll : undefined}
              initial={values.length > 0 ? { scale: 1.45, y: -20, rotate: -12, opacity: 0.4 } : false}
              animate={
                showTap
                  ? { scale: [1, 1.1, 1], y: 0, rotate: 0, opacity: 1 }
                  : { scale: 1, y: 0, rotate: 0, opacity: values.length === 0 ? 0.5 : 1 }
              }
              transition={
                showTap
                  ? { scale: { repeat: Infinity, duration: 0.9, ease: 'easeInOut' } }
                  : { type: 'spring', stiffness: 460, damping: 15, opacity: { duration: 0.12 } }
              }
              whileTap={showTap ? { scale: 0.85 } : undefined}
              role={showTap ? 'button' : undefined}
              aria-disabled={!showTap}
              aria-label={showTap ? 'Roll dice' : values.length > 0 ? `Dice showing ${values[0]}` : undefined}
            >
              <DieFace value={values[0] ?? 6} used={usedDice.includes(0)} glowColor={usedDice.includes(0) ? undefined : c.glow} />
            </motion.button>
          </div>
        )}
      </div>

      {/* TAP badge */}
      {showTap && isYou && (
        <motion.span
          className="ls-font absolute -top-[30%] left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] leading-tight text-white"
          style={{
            background: 'linear-gradient(180deg,#ffe08a,#f0a10c)',
            border: '2px solid #fff3c9',
            textShadow: '0 1px 0 rgba(120,60,0,0.65)',
            boxShadow: '0 3px 8px rgba(0,0,0,0.45)',
            zIndex: 30,
          }}
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 0.9 }}
        >
          TAP
        </motion.span>
      )}
    </div>
  )
}
