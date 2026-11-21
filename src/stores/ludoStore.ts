// ============================================================
// Ludo game store - orchestration for local + online play
// ============================================================

import { create } from 'zustand'
import type { Color, GameConfig, GameMode, GameState, Move, Token } from '@/lib/ludo/types'
import {
  applyMove,
  createGame,
  legalMoves,
  passTurn,
  rollDice,
  tokensPerPlayerFor,
} from '@/lib/ludo/engine'
import { botChooseMove } from '@/lib/ludo/ai'
import { START_IDX, trackIdxFor, tokenScreenPos } from '@/lib/ludo/board'
import { AVATARS, FREE_REFILL, STARTING_COINS, TURN_SECONDS } from '@/lib/ludo/constants'
import { sfx, setMuted as setSfxMuted } from '@/lib/ludo/sounds'
import { getSocket, online } from '@/lib/online/client'

export interface Profile {
  id: string
  name: string
  avatar: string
  coins: number
  gems: number
  wins: number
  losses: number
  /** recent finished games, oldest first (for the profile timeline graph) */
  history: GameHistoryEntry[]
}

export interface GameHistoryEntry {
  /** wall-clock timestamp (ms) when the game ended */
  t: number
  won: boolean
  /** coin balance change caused by this game */
  delta: number
}

export interface Session {
  mode: GameMode
  stake: number
  online: boolean
  pot: number
  youColor: Color
  roomCode?: string
}

export interface FloatMsg {
  id: number
  text: string
  kind: 'info' | 'capture' | 'six' | 'pass' | 'forfeit' | 'coin'
}

export interface EmoteMsg {
  id: number
  color: Color
  emoji: string
  /** wall-clock ms when sent — bubbles stay visible a few seconds */
  ts: number
}

export interface ChatMsg {
  id: number
  color: Color
  name: string
  text: string
  ts: number
}

export interface WinData {
  winner: Color
  winnerName: string
  pot: number
  youWon: boolean
  coinDelta: number
}

export interface LobbyPlayer {
  id: string
  name: string
  avatar: string
  color: Color
  isBot: boolean
  connected: boolean
  isHost: boolean
}

export interface LobbyInfo {
  code: string
  stake: number
  mode: GameMode
  hostId: string
  players: LobbyPlayer[]
  seats: number
}

export interface DailyState {
  lastClaim: string
  streak: number
}

type View = 'menu' | 'lobby' | 'game'
type MenuTab = 'computer' | 'pass' | 'online'

interface LudoStore {
  // profile
  profile: Profile
  hydrated: boolean
  soundOn: boolean
  hydrate: () => void
  updateProfile: (patch: Partial<Profile>) => void
  addCoins: (n: number) => void
  addGems: (n: number) => void
  refillCoins: () => void
  toggleSound: () => void
  daily: DailyState | null
  claimDaily: () => void

  // navigation
  view: View
  menuTab: MenuTab
  setMenuTab: (t: MenuTab) => void
  goto: (v: View) => void

  // session + game
  session: Session | null
  game: GameState | null
  animating: boolean
  diceRolling: boolean
  diceValues: number[]
  canRoll: boolean
  movableTokenIds: number[]
  selectedDie: number
  floatMsgs: FloatMsg[]
  emotes: EmoteMsg[]
  chat: ChatMsg[]
  chatOpen: boolean
  winData: WinData | null
  turnDeadline: number | null

  // online
  onlineStatus: 'idle' | 'connecting' | 'connected' | 'lobby' | 'playing' | 'error'
  onlineError: string
  lobby: LobbyInfo | null
  rematchVotes: string[]

  // local actions
  startLocalGame: (opts: { mode: GameMode; stake: number; players: Array<{ name: string; avatar: string; isBot: boolean }> }) => void
  roll: () => Promise<void>
  clickToken: (tokenId: number) => Promise<void>
  selectDie: (i: number) => void
  autoPlay: (timedOut?: boolean) => Promise<void>
  leaveGame: () => void
  localRematch: () => void
  sendEmote: (emoji: string) => void
  sendChat: (text: string) => void
  setChatOpen: (open: boolean) => void
  clearFloat: (id: number) => void

  // online actions
  onlineConnect: () => void
  onlineCreate: (opts: { stake: number; mode: GameMode; seats: number; botFill: boolean }) => void
  onlineJoin: (code: string, stake: number, mode: GameMode) => void
  onlineQuick: (stake: number, mode: GameMode) => void
  onlineAddBot: () => void
  onlineStart: () => void
  onlineLeave: () => void
  onlineRematch: () => void
}

// ---------- helpers ----------

let msgId = 1
let loopGen = 0
let pendingTimer: ReturnType<typeof setTimeout> | null = null

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

const DEFAULT_PROFILE: Profile = {
  id: '',
  name: 'Player',
  avatar: AVATARS[0],
  coins: STARTING_COINS,
  gems: 20,
  wins: 0,
  losses: 0,
  history: [],
}

function loadProfile(): Profile {
  if (typeof window === 'undefined') return { ...DEFAULT_PROFILE, id: 'ssr' }
  try {
    const raw = localStorage.getItem('ludo.profile.v1')
    if (raw) {
      const p = JSON.parse(raw) as Partial<Profile>
      return {
        ...DEFAULT_PROFILE,
        ...p,
        gems: typeof p.gems === 'number' ? p.gems : 20,
        history: Array.isArray(p.history) ? p.history : [],
      }
    }
  } catch {
    /* ignore */
  }
  return {
    ...DEFAULT_PROFILE,
    id: uid(),
    name: 'Player' + Math.floor(100 + Math.random() * 900),
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    history: [],
  }
}

/** Append a finished game to the profile history (kept last 30). */
function recordHistory(profile: Profile, won: boolean, delta: number): Profile {
  return { ...profile, history: [...profile.history, { t: Date.now(), won, delta }].slice(-30) }
}

function loadDaily(): DailyState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('ludo.daily.v1')
    if (raw) return JSON.parse(raw) as DailyState
  } catch {
    /* ignore */
  }
  return null
}

function saveDaily(d: DailyState) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ludo.daily.v1', JSON.stringify(d))
    } catch {
      /* ignore */
    }
  }
}

function todayStr(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 86400000).toLocaleDateString('en-CA')
}

export const DAILY_REWARDS = [200, 300, 500, 750, 1000, 1500, 2500]

function saveProfile(p: Profile) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ludo.profile.v1', JSON.stringify(p))
    } catch {
      /* ignore */
    }
  }
}

function schedule(ms: number, fn: () => void) {
  if (pendingTimer) clearTimeout(pendingTimer)
  pendingTimer = setTimeout(fn, ms)
}

function cancelSchedule() {
  if (pendingTimer) clearTimeout(pendingTimer)
  pendingTimer = null
}

/** Walk of intermediate positions for a move (for step animation). */
function movePath(game: GameState, move: Move): Array<{ location: 'track' | 'home' | 'finished'; trackIdx: number; homeStep: number }> {
  const color = game.players[game.turn].color
  const token = game.players[game.turn].tokens[move.tokenId]
  const die = game.dice[move.dieIndex]
  const from = token.location === 'yard' ? -1 : token.location === 'home' ? 50 + token.homeStep : token.location === 'finished' ? 56 : token.progress
  const to = token.location === 'yard' ? 0 : Math.min(from + die, 56)
  const steps: Array<{ location: 'track' | 'home' | 'finished'; trackIdx: number; homeStep: number }> = []
  for (let p = from + 1; p <= to; p++) {
    if (p <= 50) steps.push({ location: 'track', trackIdx: trackIdxFor(color, p), homeStep: 0 })
    else if (p < 56) steps.push({ location: 'home', trackIdx: -1, homeStep: p - 50 })
    else steps.push({ location: 'finished', trackIdx: -1, homeStep: 0 })
  }
  return steps
}

function patchToken(game: GameState, move: Move, step: { location: string; trackIdx: number; homeStep: number }): GameState {
  const pIdx = game.turn
  return {
    ...game,
    players: game.players.map((p, i) =>
      i !== pIdx
        ? p
        : {
            ...p,
            tokens: p.tokens.map((t) =>
              t.id === move.tokenId ? { ...t, location: step.location as Token['location'], trackIdx: step.trackIdx, homeStep: step.homeStep } : t
            ),
          }
    ),
  }
}

/** Move payload relayed by the online server (color + die value included). */
interface OnlineMove {
  tokenId: number
  dieIndex: number
  die: number
  color: Color
  captures: number[]
  finishes: boolean
}

export const useLudo = create<LudoStore>((set, get) => {
  // ---- core flow helpers (defined inside create for set/get access) ----

  function pushFloat(text: string, kind: FloatMsg['kind'] = 'info') {
    const id = msgId++
    set((s) => ({ floatMsgs: [...s.floatMsgs, { id, text, kind }].slice(-4) }))
    // independent timer — must not clash with the shared turn scheduler
    setTimeout(() => get().clearFloat(id), 1800)
  }

  function startTurnTimer() {
    set({ turnDeadline: Date.now() + TURN_SECONDS * 1000 })
  }

  function finishGame(result: GameState) {
    const session = get().session
    if (!session || !result.winner) return
    const winnerPlayer = result.players.find((p) => p.color === result.winner)
    const youWon = result.winner === session.youColor
    const pot = session.pot
    const coinDelta = youWon ? pot : 0
    // net coin change of the whole game (stake paid at start, pot collected on win)
    const netDelta = youWon ? pot - session.stake : -session.stake
    if (youWon) {
      get().addCoins(pot)
      sfx.win()
      set((s) => ({ profile: recordHistory({ ...s.profile, wins: s.profile.wins + 1, gems: s.profile.gems + 2 }, true, netDelta) }))
    } else {
      sfx.lose()
      set((s) => ({ profile: recordHistory({ ...s.profile, losses: s.profile.losses + 1 }, false, netDelta) }))
    }
    cancelSchedule()
    set({
      winData: { winner: result.winner, winnerName: winnerPlayer?.name ?? result.winner, pot, youWon, coinDelta },
      animating: false,
      canRoll: false,
      movableTokenIds: [],
      turnDeadline: null,
    })
    saveProfile(get().profile)
  }

  /** After every applied move / pass: decide who acts next (local games only). */
  function scheduleNext() {
    const s = get()
    if (!s.game || s.game.phase === 'gameover' || s.session?.online) return
    const gen = ++loopGen
    const g = s.game
    const cur = g.players[g.turn]

    if (g.phase === 'roll') {
      if (cur.isBot) {
        set({ canRoll: false, turnDeadline: null })
        schedule(400, () => void botRoll(gen))
      } else {
        set({ canRoll: true, movableTokenIds: [], selectedDie: 0, turnDeadline: null })
        startTurnTimer()
      }
      return
    }

    if (g.phase === 'move') {
      const moves = legalMoves(g)
      if (moves.length === 0) {
        pushFloat(cur.isBot ? `${cur.name} has no move` : 'No possible move', 'pass')
        sfx.pass()
        const passed = passTurn(g)
        set({ game: passed })
        schedule(550, () => scheduleNext())
        return
      }
      if (cur.isBot) {
        set({ canRoll: false, turnDeadline: null })
        schedule(280, () => void botMove(gen))
        return
      }
      // human: compute movable tokens for selected die; auto-switch die if needed
      set({ canRoll: false })
      computeMovable()
      // fresh countdown window for the move phase
      startTurnTimer()
    }
  }

  function computeMovable() {
    const g = get().game
    if (!g || g.phase !== 'move') return
    let dieIdx = get().selectedDie
    let moves = legalMoves(g).filter((m) => m.dieIndex === dieIdx)
    if (moves.length === 0) {
      // auto-switch to a die that has moves
      const all = legalMoves(g)
      if (all.length > 0) {
        dieIdx = all[0].dieIndex
        set({ selectedDie: dieIdx })
        moves = all.filter((m) => m.dieIndex === dieIdx)
      }
    }
    set({ movableTokenIds: [...new Set(moves.map((m) => m.tokenId))] })
  }

  async function animateAndApply(g0: GameState, move: Move) {
    const gen = loopGen
    set({ animating: true, movableTokenIds: [], canRoll: false, turnDeadline: null })
    const steps = movePath(g0, move)
    for (const step of steps) {
      if (gen !== loopGen) return
      await sleep(step.location === 'finished' ? 200 : 95)
      if (gen !== loopGen) return
      set({ game: patchToken(g0, move, step) })
      sfx.step()
    }
    if (gen !== loopGen) return
    await sleep(80)
    const result = applyMove(g0, move)
    if (move.captures.length > 0) {
      sfx.capture()
      pushFloat(`Captured ${move.captures.length} token${move.captures.length > 1 ? 's' : ''}!`, 'capture')
    }
    if (move.finishes) sfx.finish()
    set({ game: result, animating: false, diceValues: [] })
    if (result.phase === 'gameover' && result.winner) {
      finishGame(result)
      return
    }
    scheduleNext()
  }

  async function botRoll(gen: number) {
    if (gen !== loopGen) return
    const g = get().game
    if (!g || g.phase !== 'roll') return
    set({ canRoll: false, diceRolling: true })
    sfx.dice()
    await sleep(450)
    if (gen !== loopGen) return
    const { state, rolled, forfeited } = rollDice(g)
    set({ game: state, diceValues: rolled, diceRolling: false, selectedDie: 0 })
    if (rolled[0] === 6 || (state.mode === 'master' && rolled.every((d) => d === 6))) sfx.six()
    if (forfeited) {
      pushFloat(`Three sixes! ${g.players[g.turn].name} loses the turn`, 'forfeit')
      const passed = passTurn(state)
      set({ game: passed })
      schedule(750, () => scheduleNext())
      return
    }
    await sleep(140)
    if (gen !== loopGen) return
    scheduleNext()
  }

  async function botMove(gen: number) {
    if (gen !== loopGen) return
    const g = get().game
    if (!g || g.phase !== 'move') return
    const move = botChooseMove(g)
    if (!move) {
      const passed = passTurn(g)
      set({ game: passed })
      schedule(550, () => scheduleNext())
      return
    }
    set({ selectedDie: move.dieIndex, diceValues: [...g.dice] })
    await animateAndApply(g, move)
  }

  // ---- online event wiring ----

  function wireOnline() {
    const sock = getSocket()
    sock.off('connect')
    sock.off('disconnect')
    sock.on('connect', () => {
      set((s) => ({ onlineStatus: s.lobby ? 'lobby' : 'connected', onlineError: '' }))
    })
    sock.on('disconnect', () => {
      set((s) => (s.onlineStatus === 'playing' ? { onlineStatus: 'playing' } : { onlineStatus: 'idle' }))
    })
    online.on('lobby:created', ({ code }: { code: string }) => {
      set({ onlineStatus: 'lobby', view: 'lobby' })
    })
    online.on('lobby:update', ({ room }: { room: LobbyInfo }) => {
      set((s) => ({
        onlineStatus: 'lobby',
        lobby: room,
        onlineError: '',
        view: s.view === 'game' ? 'game' : 'lobby',
      }))
    })
    online.on('lobby:error', ({ message }: { message: string }) => {
      set({ onlineError: message })
    })
    online.on('game:started', ({ state, yourColor, roomCode, stake }: { state: GameState; yourColor: Color; roomCode: string; stake: number }) => {
      loopGen++
      cancelSchedule()
      const pot = stake * state.players.length
      const me = get().profile
      set({
        view: 'game',
        session: { mode: state.mode, stake, online: true, pot, youColor: yourColor, roomCode },
        game: state,
        onlineStatus: 'playing',
        winData: null,
        animating: false,
        diceRolling: false,
        diceValues: [],
        canRoll: false,
        movableTokenIds: [],
        selectedDie: 0,
        chat: [],
        floatMsgs: [],
        rematchVotes: [],
        lobby: null,
        turnDeadline: null,
      })
      get().addCoins(-stake) // pay entry
      sfx.coin()
      void me
      // drive my turn if it starts now
      setTimeout(() => scheduleNextOnline(), 400)
    })
    online.on('game:rolled', ({ state, rolled, forfeited }: { state: GameState; rolled: number[]; forfeited: boolean }) => {
      const gen = ++loopGen
      cancelSchedule()
      set({ game: state, diceValues: rolled, diceRolling: false, canRoll: false, selectedDie: 0 })
      if (rolled[0] === 6) sfx.six()
      if (forfeited) {
        pushFloat('Three sixes! Turn forfeited', 'forfeit')
      }
      setTimeout(() => scheduleNextOnline(), 300)
      void gen
    })
    online.on('game:moved', ({ state, move }: { state: GameState; move: OnlineMove }) => {
      // replay animation from previous visible state, then snap to authoritative state
      const g0 = get().game
      const gen = ++loopGen
      cancelSchedule()
      if (g0 && move) {
        void (async () => {
          set({ animating: true, movableTokenIds: [] })
          const steps = movePathForOnline(g0, move)
          for (const step of steps) {
            if (gen !== loopGen) return
            await sleep(step.location === 'finished' ? 260 : 130)
            if (gen !== loopGen) return
            set({ game: patchTokenOnline(g0, move, step) })
            sfx.step()
          }
          if (gen !== loopGen) return
          if (move.captures.length > 0) {
            sfx.capture()
            pushFloat('Capture!', 'capture')
          }
          if (move.finishes) sfx.finish()
          set({ game: state, animating: false, diceValues: [] })
          setTimeout(() => scheduleNextOnline(), 250)
        })()
      } else {
        set({ game: state, animating: false })
        setTimeout(() => scheduleNextOnline(), 250)
      }
    })
    online.on('game:passed', ({ state, reason }: { state: GameState; reason?: string }) => {
      set({ game: state, diceValues: [] })
      pushFloat(reason === 'forfeit' ? 'Three sixes! Turn forfeited' : 'No possible move', reason === 'forfeit' ? 'forfeit' : 'pass')
      sfx.pass()
      setTimeout(() => scheduleNextOnline(), 300)
    })
    online.on('game:state', ({ state }: { state: GameState }) => {
      // full authoritative sync (bot takeover, reconnect)
      const gen = ++loopGen
      cancelSchedule()
      set({ game: state, animating: false, diceRolling: false, diceValues: [], movableTokenIds: [] })
      void gen
      setTimeout(() => scheduleNextOnline(), 300)
    })
    online.on('game:over', ({ winner, winnerName, pot }: { winner: Color; winnerName: string; pot: number }) => {
      const session = get().session
      if (!session) return
      const youWon = winner === session.youColor
      const netDelta = youWon ? pot - session.stake : -session.stake
      if (youWon) {
        get().addCoins(pot)
        sfx.win()
        set((s) => ({ profile: recordHistory({ ...s.profile, wins: s.profile.wins + 1, gems: s.profile.gems + 2 }, true, netDelta) }))
      } else {
        sfx.lose()
        set((s) => ({ profile: recordHistory({ ...s.profile, losses: s.profile.losses + 1 }, false, netDelta) }))
      }
      saveProfile(get().profile)
      set({
        winData: { winner, winnerName, pot, youWon, coinDelta: youWon ? pot : 0 },
        canRoll: false,
        movableTokenIds: [],
        animating: false,
        turnDeadline: null,
      })
    })
    online.on('game:chat', (msg: { color: Color; name: string; text: string }) => {
      set((s) => ({ chat: [...s.chat, { id: msgId++, color: msg.color, name: msg.name, text: msg.text, ts: Date.now() }].slice(-50) }))
    })
    online.on('game:emote', ({ color, emoji }: { color: Color; emoji: string }) => {
      sfx.emote()
      set((s) => ({ emotes: [...s.emotes, { id: msgId++, color, emoji, ts: Date.now() }].slice(-6) }))
    })
    online.on('game:rematch', ({ votes }: { votes: string[] }) => {
      set({ rematchVotes: votes })
      if (votes.length > 0) pushFloat('Rematch requested', 'info')
    })
    online.on('room:closed', ({ reason }: { reason: string }) => {
      set({ onlineStatus: 'idle', lobby: null, session: null, game: null, view: 'menu', onlineError: reason || 'Room closed' })
    })
    online.on('connect_error', () => {
      set({ onlineError: 'Cannot reach game server. Try again shortly.' })
    })
  }

  /** Online equivalent of scheduleNext: only enables local input; bots are server-driven. */
  function scheduleNextOnline() {
    const s = get()
    if (!s.game || s.game.phase === 'gameover' || !s.session?.online) return
    const g = s.game
    const cur = g.players[g.turn]
    const isMe = cur.color === s.session.youColor && !cur.isBot
    if (g.phase === 'roll') {
      if (isMe) {
        set({ canRoll: true })
        startTurnTimer()
      } else {
        set({ canRoll: false })
      }
      return
    }
    if (g.phase === 'move') {
      if (isMe) {
        set({ canRoll: false })
        computeMovable()
        // fresh countdown window for the move phase
        startTurnTimer()
      } else {
        set({ movableTokenIds: [] })
      }
    }
  }

  function movePathForOnline(g0: GameState, move: OnlineMove) {
    // find moving token in current display state (turn might differ from server snapshot ordering)
    const color = move.color
    const token = g0.players.find((p) => p.color === color)?.tokens[move.tokenId]
    if (!token) return []
    const die = move.die
    const from = token.location === 'yard' ? -1 : token.location === 'home' ? 50 + token.homeStep : token.location === 'finished' ? 56 : token.progress
    const to = token.location === 'yard' ? 0 : Math.min(from + die, 56)
    const steps: Array<{ location: 'track' | 'home' | 'finished'; trackIdx: number; homeStep: number }> = []
    for (let p = from + 1; p <= to; p++) {
      if (p <= 50) steps.push({ location: 'track', trackIdx: trackIdxFor(color, p), homeStep: 0 })
      else if (p < 56) steps.push({ location: 'home', trackIdx: -1, homeStep: p - 50 })
      else steps.push({ location: 'finished', trackIdx: -1, homeStep: 0 })
    }
    return steps
  }

  function patchTokenOnline(g0: GameState, move: OnlineMove, step: { location: string; trackIdx: number; homeStep: number }) {
    return {
      ...g0,
      players: g0.players.map((p) =>
        p.color !== move.color
          ? p
          : {
              ...p,
              tokens: p.tokens.map((t) =>
                t.id === move.tokenId ? { ...t, location: step.location as Token['location'], trackIdx: step.trackIdx, homeStep: step.homeStep } : t
              ),
            }
      ),
    }
  }

  return {
    profile: { ...DEFAULT_PROFILE },
    hydrated: false,
    soundOn: true,
    daily: null,
    hydrate: () => {
      const p = loadProfile()
      set({ profile: p, daily: loadDaily(), hydrated: true })
    },
    updateProfile: (patch) => {
      set((s) => {
        const p = { ...s.profile, ...patch }
        saveProfile(p)
        return { profile: p }
      })
    },
    addCoins: (n) => {
      set((s) => {
        const p = { ...s.profile, coins: Math.max(0, s.profile.coins + n) }
        saveProfile(p)
        return { profile: p }
      })
    },
    addGems: (n) => {
      set((s) => {
        const p = { ...s.profile, gems: Math.max(0, s.profile.gems + n) }
        saveProfile(p)
        return { profile: p }
      })
    },
    claimDaily: () => {
      const today = todayStr()
      const d = get().daily
      if (d?.lastClaim === today) return
      const streak = d?.lastClaim === todayStr(-1) ? Math.min(7, d.streak + 1) : 1
      const next = { lastClaim: today, streak }
      set({ daily: next })
      saveDaily(next)
      get().addCoins(DAILY_REWARDS[streak - 1])
      sfx.coin()
    },
    refillCoins: () => {
      get().addCoins(FREE_REFILL)
      sfx.coin()
    },
    toggleSound: () => {
      const next = !get().soundOn
      setSfxMuted(!next)
      set({ soundOn: next })
    },

    view: 'menu',
    menuTab: 'computer',
    setMenuTab: (t) => set({ menuTab: t }),
    goto: (v) => set({ view: v }),

    session: null,
    game: null,
    animating: false,
    diceRolling: false,
    diceValues: [],
    canRoll: false,
    movableTokenIds: [],
    selectedDie: 0,
    floatMsgs: [],
    emotes: [],
    chat: [],
    chatOpen: false,
    winData: null,
    turnDeadline: null,

    onlineStatus: 'idle',
    onlineError: '',
    lobby: null,
    rematchVotes: [],

    startLocalGame: ({ mode, stake, players }) => {
      loopGen++
      cancelSchedule()
      const me = get().profile
      // THIS device always plays BLUE — the color whose yard sits at the
      // bottom-left corner, exactly under the "you" plate (Ludo Star).
      // 2P: opponent takes green, the diagonal top-right yard.
      const seatColors: Color[] =
        players.length === 2 ? ['blue', 'green'] : ['blue', 'red', 'green', 'yellow']
      const config: GameConfig = {
        mode,
        players: players.map((p, i) => ({
          color: seatColors[i],
          name: p.name,
          avatar: p.avatar,
          isBot: p.isBot,
        })),
      }
      const state = createGame(config)
      const tpp = tokensPerPlayerFor(mode)
      set({
        view: 'game',
        session: { mode, stake, online: false, pot: stake * players.length, youColor: 'blue' },
        game: state,
        winData: null,
        animating: false,
        diceRolling: false,
        diceValues: [],
        canRoll: false,
        movableTokenIds: [],
        selectedDie: 0,
        floatMsgs: [],
        emotes: [],
        chat: [],
        chatOpen: false,
        turnDeadline: null,
        rematchVotes: [],
        onlineStatus: 'idle',
      })
      get().addCoins(-stake)
      sfx.coin()
      void tpp
      void me
      scheduleNext()
    },

    roll: async () => {
      const s = get()
      if (!s.game || s.animating || s.diceRolling || !s.canRoll) return
      const g = s.game
      if (s.session?.online) {
        set({ canRoll: false, diceRolling: true })
        sfx.dice()
        online.emit('game:roll')
        return
      }
      const gen = ++loopGen
      set({ canRoll: false, diceRolling: true })
      sfx.dice()
      await sleep(650)
      if (gen !== loopGen) return
      const { state, rolled, forfeited } = rollDice(g)
      set({ game: state, diceValues: rolled, diceRolling: false, selectedDie: 0 })
      if (rolled[0] === 6) sfx.six()
      if (forfeited) {
        pushFloat('Three sixes! Turn forfeited', 'forfeit')
        const passed = passTurn(state)
        set({ game: passed })
        schedule(750, () => scheduleNext())
        return
      }
      await sleep(140)
      if (gen !== loopGen) return
      scheduleNext()
    },

    clickToken: async (tokenId) => {
      const s = get()
      if (!s.game || s.animating) return
      const g = s.game
      if (g.players[g.turn].isBot) return
      if (!s.movableTokenIds.includes(tokenId)) return

      const dieIdx = s.selectedDie
      let move = legalMoves(g).find((m) => m.tokenId === tokenId && m.dieIndex === dieIdx)
      if (!move) {
        // token can move with the other die -> auto switch
        move = legalMoves(g).find((m) => m.tokenId === tokenId)
        if (!move) return
        set({ selectedDie: move.dieIndex })
      }
      if (s.session?.online) {
        set({ movableTokenIds: [], animating: true })
        online.emit('game:move', { tokenId: move.tokenId, dieIndex: move.dieIndex })
        return
      }
      await animateAndApply(g, move)
    },

    selectDie: (i) => {
      const s = get()
      if (!s.game) return
      if (s.game.usedDice.includes(i)) return
      set({ selectedDie: i })
      if (s.session?.online) {
        if (s.game.players[s.game.turn].color === s.session.youColor) computeMovable()
      } else {
        computeMovable()
      }
    },

    autoPlay: async (timedOut) => {
      const s = get()
      if (!s.game || s.animating || s.diceRolling) return
      if (s.winData) return
      if (s.game.phase === 'roll' && s.canRoll) {
        if (timedOut) pushFloat('Time up — auto rolled', 'info')
        await get().roll()
        return
      }
      if (s.game.phase === 'move' && s.movableTokenIds.length > 0) {
        const g = s.game
        const best = botChooseMove(g)
        if (!best) return
        if (timedOut) pushFloat('Time up — auto played', 'info')
        if (s.session?.online) {
          online.emit('game:move', { tokenId: best.tokenId, dieIndex: best.dieIndex })
          set({ movableTokenIds: [], animating: true })
          return
        }
        set({ selectedDie: best.dieIndex })
        await animateAndApply(g, best)
      }
    },

    leaveGame: () => {
      loopGen++
      cancelSchedule()
      if (get().session?.online) online.emit('game:leave')
      const s = get()
      // refund stake in unfinished local games
      if (s.session && !s.session.online && !s.winData && s.game?.phase !== 'gameover') {
        get().addCoins(s.session.stake)
      }
      set({ view: 'menu', game: null, session: null, winData: null, animating: false, diceRolling: false, canRoll: false, movableTokenIds: [], floatMsgs: [], emotes: [], chat: [], turnDeadline: null, onlineStatus: 'idle', lobby: null })
    },

    localRematch: () => {
      const s = get()
      if (!s.session || s.session.online) return
      const players = s.game
        ? s.game.players.map((p) => ({ name: p.name, avatar: p.avatar, isBot: p.isBot }))
        : []
      get().startLocalGame({ mode: s.session.mode, stake: s.session.stake, players })
    },

    sendEmote: (emoji) => {
      const s = get()
      const color = s.session?.youColor ?? (s.game ? s.game.players[s.game.turn].color : 'red')
      sfx.emote()
      set((st) => ({ emotes: [...st.emotes, { id: msgId++, color, emoji, ts: Date.now() }].slice(-6) }))
      if (s.session?.online) online.emit('game:emote', { emoji })
    },

    sendChat: (text) => {
      const s = get()
      if (!text.trim()) return
      const color = s.session?.youColor ?? (s.game ? s.game.players[s.game.turn].color : 'red')
      set((st) => ({ chat: [...st.chat, { id: msgId++, color, name: s.profile.name, text: text.trim(), ts: Date.now() }].slice(-50) }))
      if (s.session?.online) online.emit('game:chat', { text: text.trim() })
    },

    setChatOpen: (open) => set({ chatOpen: open }),

    clearFloat: (id) => set((s) => ({ floatMsgs: s.floatMsgs.filter((m) => m.id !== id) })),

    // ---- online ----
    onlineConnect: () => {
      if (get().onlineStatus === 'connecting' || get().onlineStatus === 'lobby') return
      set({ onlineStatus: 'connecting', onlineError: '' })
      wireOnline()
      online.connect()
      // socket may already be connected (e.g. returning from a finished game):
      // 'connect' will not re-fire, so resolve the status immediately.
      if (online.connected()) {
        set((s) => ({ onlineStatus: s.lobby ? 'lobby' : 'connected' }))
      }
    },
    onlineCreate: ({ stake, mode, seats, botFill }) => {
      const p = get().profile
      online.emit('lobby:create', { profile: { id: p.id, name: p.name, avatar: p.avatar, coins: p.coins }, stake, mode, seats, botFill })
    },
    onlineJoin: (code, stake, mode) => {
      const p = get().profile
      online.emit('lobby:join', { code: code.trim().toUpperCase(), profile: { id: p.id, name: p.name, avatar: p.avatar, coins: p.coins }, stake, mode })
    },
    onlineQuick: (stake, mode) => {
      const p = get().profile
      set({ onlineError: '' })
      online.emit('lobby:quick', { profile: { id: p.id, name: p.name, avatar: p.avatar, coins: p.coins }, stake, mode })
    },
    onlineAddBot: () => {
      online.emit('lobby:addbot')
    },
    onlineStart: () => {
      online.emit('lobby:start')
    },
    onlineLeave: () => {
      online.emit('lobby:leave')
      set({ onlineStatus: 'idle', lobby: null, view: 'menu' })
    },
    onlineRematch: () => {
      online.emit('game:rematch')
    },
  }
})

// extra types used by online helpers
void tokenScreenPos
void START_IDX
