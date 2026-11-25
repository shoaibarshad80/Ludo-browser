'use client'

// Catches render crashes inside a view and shows a branded recovery card
// instead of a white screen / stuck spinner.

import { Component, type ReactNode } from 'react'
import { LudoLogo } from '@/components/ludo/ui'

interface Props {
  children: ReactNode
}

interface State {
  err: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null }

  static getDerivedStateFromError(err: Error): State {
    return { err }
  }

  componentDidCatch(err: Error) {
    console.error('[ludo] view crash:', err)
  }

  render() {
    if (!this.state.err) return this.props.children
    return (
      <main className="ls-bg grid h-[100dvh] place-items-center overflow-hidden px-6 text-center text-indigo-50">
        <div className="flex flex-col items-center gap-3">
          <LudoLogo />
          <p className="ls-font text-sm text-fuchsia-100/85">Something went wrong</p>
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
        </div>
      </main>
    )
  }
}
