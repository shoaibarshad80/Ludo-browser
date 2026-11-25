'use client'

// Boot fallback shown while the store hydrates. If the device or network is
// very slow (JS chunks stalled), it surfaces a reload path after 7s instead
// of spinning forever.

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { LudoLogo } from '@/components/ludo/ui'

export default function BootScreen() {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 7000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="ls-bg-lobby fixed inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <LudoLogo />
        <Loader2 className="h-6 w-6 animate-spin text-fuchsia-200" />
        {slow && (
          <>
            <p className="ls-font text-[12px] leading-snug text-fuchsia-100/85">
              Still loading… check your connection
            </p>
            <button
              onClick={() => { try { location.reload() } catch { /* ignore */ } }}
              className="ls-font min-h-[44px] rounded-full px-7 text-[13px] font-semibold tracking-wide text-[#3A1D00]"
              style={{
                background: 'linear-gradient(180deg,#ffe08a 0%,#f4ad38 55%,#df8f0b 100%)',
                boxShadow: '0 3px 0 #8a5a06, 0 6px 14px rgba(12,2,28,0.45), inset 0 2px 0 rgba(255,255,255,0.6)',
              }}
            >
              RELOAD
            </button>
          </>
        )}
      </div>
    </div>
  )
}
