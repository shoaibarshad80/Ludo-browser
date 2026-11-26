// ============================================================
// Ludo Online Server - authoritative socket.io game service
// Rooms, quick match, turn timers, bot takeover, chat/emotes
// ============================================================

import { createServer } from 'http'
import { Server, type Socket } from 'socket.io'

import { createGame, rollDice, legalMoves, applyMove, passTurn } from '../../src/lib/ludo/engine'
import { botChooseMove } from '../../src/lib/ludo/ai'
import type { Color, GameMode, GameState, Move } from '../../src/lib/ludo/types'

const PORT = 3003
const TURN_SECONDS = 10
const COLORS: Color[] = ['red', 'green', 'yellow', 'blue']

// Diagonal seating like Ludo Star: 2P = red (top-left) vs yellow
// (bottom-right) — opposite corners, never the same side of the board.
function seatColor(seatCount: number, seatIndex: number): Color {
  if (seatCount === 2) return seatIndex % 2 === 0 ? 'red' : 'yellow'
  return COLORS[seatIndex % 4]
}

interface ProfileIn {
  id: string
  name: string
  avatar: string
}

interface RoomPlayer {
  id: string
  socketId: string | null
  name: string
  avatar: string
  color: Color
  isBot: boolean
  connected: boolean
  isHost: boolean
  rematch: boolean
  timeouts: number
}

interface Room {
  code: string
  stake: number
  mode: GameMode
  seats: number
  hostId: string
  quick: boolean
  botFill: boolean
  botFillTimer: NodeJS.Timeout | null
  players: RoomPlayer[]
  state: GameState | null
  phase: 'lobby' | 'playing' | 'finished'
  turnTimer: NodeJS.Timeout | null
  createdAt: number
}

const rooms = new Map<string, Room>()
const socketRoom = new Map<string, string>() // socketId -> roomCode
const socketProfile = new Map<string, string>() // socketId -> profileId

function newCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  } while (rooms.has(code))
  return code
}

function lobbyPayload(room: Room) {
  return {
    code: room.code,
    stake: room.stake,
    mode: room.mode,
    seats: room.seats,
    hostId: room.hostId,
    players: room.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      color: seatColor(room.seats, i),
      isBot: p.isBot,
      connected: p.connected,
      isHost: p.isHost,
    })),
  }
}

function roomOf(socket: Socket): Room | undefined {
  const code = socketRoom.get(socket.id)
  return code ? rooms.get(code) : undefined
}

function meIn(room: Room, socket: Socket): RoomPlayer | undefined {
  const pid = socketProfile.get(socket.id)
  return room.players.find((p) => p.id === pid)
}

function broadcastRoom(room: Room) {
  io.to(room.code).emit('lobby:update', { room: lobbyPayload(room) })
}

// ---------------- game driving ----------------

function clearTimers(room: Room) {
  if (room.turnTimer) clearTimeout(room.turnTimer)
  room.turnTimer = null
}

function drive(room: Room) {
  clearTimers(room)
  const st = room.state
  if (!st || st.phase === 'gameover') return
  const cur = room.players[st.turn]
  if (!cur) return

  if (st.phase === 'roll') {
    if (cur.isBot || !cur.connected) {
      room.turnTimer = setTimeout(() => doRoll(room), 450)
    } else {
      // human turn with timer
      room.turnTimer = setTimeout(() => {
        if (!room.state || room.state.phase !== 'roll') return
        cur.timeouts += 1
        if (cur.timeouts >= 2 && !cur.isBot) {
          botTakeover(room, cur)
        }
        doRoll(room)
      }, TURN_SECONDS * 1000 + 900)
    }
    return
  }

  // phase === 'move'
  if (legalMoves(st).length === 0) {
    room.turnTimer = setTimeout(() => {
      if (!room.state) return
      room.state = passTurn(room.state)
      io.to(room.code).emit('game:passed', { state: room.state, reason: 'nomove' })
      drive(room)
    }, 550)
    return
  }
  if (cur.isBot || !cur.connected) {
    room.turnTimer = setTimeout(() => doBotMove(room), 380)
  } else {
    room.turnTimer = setTimeout(() => {
      if (!room.state || room.state.phase !== 'move') return
      cur.timeouts += 1
      if (cur.timeouts >= 2 && !cur.isBot) {
        botTakeover(room, cur)
      }
      doBotMove(room)
    }, TURN_SECONDS * 1000 + 900)
  }
}

/**
 * Hand a human seat to a bot (AFK timeouts or leave). BUGFIX: the old
 * code flipped only the RoomPlayer flag and broadcast the UNCHANGED
 * game state, so every client still saw the seat as human — the UI
 * showed a live "your turn" die while the server was already driving
 * a bot for it. Keep the authoritative state and the room roster in
 * sync, then broadcast the corrected state.
 */
function botTakeover(room: Room, player: RoomPlayer) {
  player.isBot = true
  if (room.state) {
    const idx = room.players.indexOf(player)
    const sp = room.state.players[idx]
    if (sp && sp.color === player.color) sp.isBot = true
    io.to(room.code).emit('game:state', { state: room.state })
  }
}

function doRoll(room: Room) {
  if (!room.state || room.state.phase !== 'roll') return
  const { state, rolled, forfeited } = rollDice(room.state)
  room.state = state
  io.to(room.code).emit('game:rolled', { state, rolled, forfeited })

  if (forfeited) {
    room.turnTimer = setTimeout(() => {
      if (!room.state) return
      room.state = passTurn(room.state)
      io.to(room.code).emit('game:passed', { state: room.state, reason: 'forfeit' })
      drive(room)
    }, 750)
    return
  }
  if (legalMoves(state).length === 0) {
    room.turnTimer = setTimeout(() => {
      if (!room.state) return
      room.state = passTurn(room.state)
      io.to(room.code).emit('game:passed', { state: room.state, reason: 'nomove' })
      drive(room)
    }, 550)
    return
  }
  drive(room)
}

function doBotMove(room: Room) {
  if (!room.state || room.state.phase !== 'move') return
  const move = botChooseMove(room.state)
  if (!move) {
    room.state = passTurn(room.state)
    io.to(room.code).emit('game:passed', { state: room.state, reason: 'nomove' })
    drive(room)
    return
  }
  applyAndBroadcast(room, move)
}

function applyAndBroadcast(room: Room, move: Move) {
  if (!room.state) return
  const dieIndex = move.dieIndex
  const payload = movePayload(room.state, move, dieIndex)
  const next = applyMove(room.state, move)
  room.state = next
  io.to(room.code).emit('game:moved', { state: next, move: payload })

  if (next.phase === 'gameover' && next.winner) {
    room.phase = 'finished'
    clearTimers(room)
    const winnerPlayer = room.players.find((p) => p.color === next.winner)
    const pot = room.stake * room.players.length
    setTimeout(() => {
      io.to(room.code).emit('game:over', {
        winner: next.winner,
        winnerName: winnerPlayer?.name ?? next.winner,
        pot,
      })
    }, 900)
    return
  }
  drive(room)
}

function movePayload(state: GameState, move: Move, dieIndex: number) {
  void state
  return {
    tokenId: move.tokenId,
    dieIndex,
    die: state.dice[dieIndex] ?? 0,
    color: state.players[state.turn].color,
    captures: move.captures,
    finishes: move.finishes,
  }
}

function startGame(room: Room) {
  // fill empty seats with bots
  while (room.players.length < room.seats) {
    const botNames = ['Rocky', 'Zuby', 'Lola', 'Kiki', 'Bolt', 'Mona']
    room.players.push({
      id: 'bot-' + Math.random().toString(36).slice(2, 8),
      socketId: null,
      name: botNames[Math.floor(Math.random() * botNames.length)],
      avatar: ['🦁', '🐼', '🦊', '🐸', '🐯', '🐵'][Math.floor(Math.random() * 6)],
      color: seatColor(room.seats, room.players.length),
      isBot: true,
      connected: true,
      isHost: false,
      rematch: false,
      timeouts: 0,
    })
  }
  room.state = createGame({
    mode: room.mode,
    players: room.players.map((p, i) => ({
      color: seatColor(room.seats, i),
      name: p.name,
      avatar: p.avatar,
      isBot: p.isBot,
    })),
  })
  room.phase = 'playing'
  room.players.forEach((p, i) => {
    p.color = seatColor(room.seats, i)
    p.rematch = false
    p.timeouts = 0
  })

  for (const p of room.players) {
    if (!p.socketId) continue
    io.to(p.socketId).socketsJoin(room.code)
    io.to(p.socketId).emit('game:started', {
      state: room.state,
      yourColor: p.color,
      roomCode: room.code,
      stake: room.stake,
    })
  }
  drive(room)
}

// ---------------- matchmaking ----------------

function findQuickRoom(stake: number, mode: GameMode): Room | undefined {
  for (const room of rooms.values()) {
    if (
      room.quick &&
      room.phase === 'lobby' &&
      room.stake === stake &&
      room.mode === mode &&
      room.players.length < room.seats
    ) {
      return room
    }
  }
  return undefined
}

function scheduleBotFill(room: Room) {
  if (room.botFillTimer) clearTimeout(room.botFillTimer)
  room.botFillTimer = setTimeout(() => {
    if (room.phase === 'lobby' && room.players.length < room.seats) {
      startGame(room)
    }
  }, 6000)
}

function joinRoom(socket: Socket, room: Room, profile: ProfileIn): boolean {
  if (room.phase !== 'lobby') {
    socket.emit('lobby:error', { message: 'Game already started in this room.' })
    return false
  }
  if (room.players.length >= room.seats) {
    socket.emit('lobby:error', { message: 'Room is full.' })
    return false
  }
  if (room.players.some((p) => p.id === profile.id)) {
    socket.emit('lobby:error', { message: 'You are already in this room.' })
    return false
  }
  socket.join(room.code)
  socketRoom.set(socket.id, room.code)
  socketProfile.set(socket.id, profile.id)
  room.players.push({
    id: profile.id,
    socketId: socket.id,
    name: profile.name || 'Player',
    avatar: profile.avatar || '🙂',
    color: seatColor(room.seats, room.players.length),
    isBot: false,
    connected: true,
    isHost: room.players.length === 0,
    rematch: false,
    timeouts: 0,
  })
  if (room.players.length === 1) room.hostId = profile.id
  broadcastRoom(room)

  // auto start when everyone arrived
  if (room.players.length >= room.seats) {
    setTimeout(() => {
      if (room.phase === 'lobby' && room.players.length >= room.seats) startGame(room)
    }, 1200)
  }
  return true
}

function leaveRoom(socket: Socket, room: Room, wasDisconnect = false) {
  const me = meIn(room, socket)
  if (!me) return
  // always detach the socket from this room's broadcasts
  socket.leave(room.code)
  socketRoom.delete(socket.id)
  socketProfile.delete(socket.id)

  if (room.phase === 'lobby') {
    room.players = room.players.filter((p) => p.id !== me.id)
    if (room.players.length === 0) {
      if (room.botFillTimer) clearTimeout(room.botFillTimer)
      rooms.delete(room.code)
    } else {
      if (room.hostId === me.id) {
        room.hostId = room.players.find((p) => !p.isBot)?.id ?? room.players[0]?.id ?? ''
        room.players[0].isHost = true
      }
      broadcastRoom(room)
    }
    return
  }
  // playing / finished: bot takeover, keep the game alive
  if (!wasDisconnect && me.socketId) {
    me.connected = false
    botTakeover(room, me)
    io.to(room.code).emit('game:chat', {
      color: me.color,
      name: 'System',
      text: `${me.name} left - a bot took over their seat`,
    })
    drive(room)
  }
}

// ---------------- server ----------------

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

io.on('connection', (socket: Socket) => {
  console.log('[ludo-server] connected:', socket.id)

  socket.on('lobby:create', (data: { profile: ProfileIn; stake: number; mode: GameMode; seats?: number; botFill?: boolean }) => {
    const { profile, stake, mode } = data
    const seats = data.seats === 2 ? 2 : data.seats === 3 ? 3 : 4
    // leave previous room
    const prev = roomOf(socket)
    if (prev) leaveRoom(socket, prev)
    const room: Room = {
      code: newCode(),
      stake: Math.max(0, Math.min(100000, stake | 0)),
      mode: ['classic', 'quick', 'master'].includes(mode) ? mode : 'classic',
      seats,
      hostId: profile.id,
      quick: false,
      botFill: data.botFill !== false,
      botFillTimer: null,
      players: [],
      state: null,
      phase: 'lobby',
      turnTimer: null,
      createdAt: Date.now(),
    }
    rooms.set(room.code, room)
    if (joinRoom(socket, room, profile)) {
      socket.emit('lobby:created', { code: room.code })
      broadcastRoom(room)
      console.log('[ludo-server] room created:', room.code, 'stake', room.stake, room.mode)
    } else {
      rooms.delete(room.code)
    }
  })

  socket.on('lobby:join', (data: { code: string; profile: ProfileIn }) => {
    const room = rooms.get((data.code || '').trim().toUpperCase())
    if (!room) {
      socket.emit('lobby:error', { message: 'Room not found. Check the code.' })
      return
    }
    const prev = roomOf(socket)
    if (prev && prev.code !== room.code) leaveRoom(socket, prev)
    if (joinRoom(socket, room, data.profile)) {
      broadcastRoom(room)
    }
  })

  socket.on('lobby:quick', (data: { profile: ProfileIn; stake: number; mode: GameMode }) => {
    const prev = roomOf(socket)
    if (prev) leaveRoom(socket, prev)
    let room = findQuickRoom(data.stake, data.mode)
    if (!room) {
      room = {
        code: newCode(),
        stake: Math.max(0, Math.min(100000, data.stake | 0)),
        mode: ['classic', 'quick', 'master'].includes(data.mode) ? data.mode : 'classic',
        seats: 4,
        hostId: data.profile.id,
        quick: true,
        botFill: true,
        botFillTimer: null,
        players: [],
        state: null,
        phase: 'lobby',
        turnTimer: null,
        createdAt: Date.now(),
      }
      rooms.set(room.code, room)
      scheduleBotFill(room)
    }
    if (joinRoom(socket, room, data.profile)) {
      socket.emit('lobby:created', { code: room.code })
      broadcastRoom(room)
    }
  })

  socket.on('lobby:addbot', () => {
    const room = roomOf(socket)
    if (!room || room.phase !== 'lobby') return
    const me = meIn(room, socket)
    if (!me || !me.isHost) return
    if (room.players.length >= room.seats) return
    const botNames = ['Rocky', 'Zuby', 'Lola', 'Kiki', 'Bolt', 'Mona']
    room.players.push({
      id: 'bot-' + Math.random().toString(36).slice(2, 8),
      socketId: null,
      name: botNames[Math.floor(Math.random() * botNames.length)],
      avatar: ['🦁', '🐼', '🦊', '🐸', '🐯', '🐵'][Math.floor(Math.random() * 6)],
      color: seatColor(room.seats, room.players.length),
      isBot: true,
      connected: true,
      isHost: false,
      rematch: false,
      timeouts: 0,
    })
    broadcastRoom(room)
    if (room.players.length >= room.seats) {
      setTimeout(() => {
        if (room.phase === 'lobby') startGame(room)
      }, 900)
    }
  })

  socket.on('lobby:start', () => {
    const room = roomOf(socket)
    if (!room || room.phase !== 'lobby') return
    const me = meIn(room, socket)
    if (!me || !me.isHost) return
    if (room.botFillTimer) clearTimeout(room.botFillTimer)
    startGame(room)
  })

  socket.on('lobby:leave', () => {
    const room = roomOf(socket)
    if (room) leaveRoom(socket, room)
  })

  // ---------- game events ----------

  socket.on('game:roll', () => {
    const room = roomOf(socket)
    if (!room || !room.state || room.state.phase !== 'roll') return
    const me = meIn(room, socket)
    if (!me) return
    const cur = room.players[room.state.turn]
    if (cur.id !== me.id || cur.isBot) return
    me.timeouts = 0
    doRoll(room)
  })

  socket.on('game:move', (data: { tokenId: number; dieIndex: number }) => {
    const room = roomOf(socket)
    if (!room || !room.state || room.state.phase !== 'move') return
    const me = meIn(room, socket)
    if (!me) return
    const cur = room.players[room.state.turn]
    if (cur.id !== me.id || cur.isBot) return
    const move = legalMoves(room.state).find(
      (m) => m.tokenId === data.tokenId && m.dieIndex === data.dieIndex
    )
    if (!move) return
    me.timeouts = 0
    applyAndBroadcast(room, move)
  })

  socket.on('game:chat', (data: { text: string }) => {
    const room = roomOf(socket)
    if (!room || !room.state) return
    const me = meIn(room, socket)
    if (!me) return
    const text = String(data?.text ?? '').slice(0, 140)
    if (!text) return
    io.to(room.code).emit('game:chat', { color: me.color, name: me.name, text })
  })

  socket.on('game:emote', (data: { emoji: string }) => {
    const room = roomOf(socket)
    if (!room || !room.state) return
    const me = meIn(room, socket)
    if (!me) return
    const emoji = String(data?.emoji ?? '').slice(0, 8)
    if (!emoji) return
    io.to(room.code).emit('game:emote', { color: me.color, emoji })
  })

  socket.on('game:rematch', () => {
    const room = roomOf(socket)
    if (!room || room.phase !== 'finished') return
    const me = meIn(room, socket)
    if (!me) return
    me.rematch = true
    const humans = room.players.filter((p) => p.socketId)
    const votes = room.players.filter((p) => p.rematch && p.socketId).map((p) => p.name)
    io.to(room.code).emit('game:rematch', { votes, needed: humans.length })
    if (humans.every((p) => p.rematch)) {
      room.players.forEach((p) => {
        p.rematch = false
        p.timeouts = 0
      })
      room.phase = 'playing'
      startGame(room)
    }
  })

  socket.on('game:leave', () => {
    const room = roomOf(socket)
    if (room) leaveRoom(socket, room)
  })

  socket.on('game:sync', () => {
    const room = roomOf(socket)
    if (!room || !room.state) return
    const me = meIn(room, socket)
    socket.emit('game:state', { state: room.state, yourColor: me?.color })
  })

  // ---------- disconnect ----------

  socket.on('disconnect', () => {
    console.log('[ludo-server] disconnected:', socket.id)
    const room = roomOf(socket)
    if (!room) {
      socketRoom.delete(socket.id)
      socketProfile.delete(socket.id)
      return
    }
    const me = meIn(room, socket)
    if (me) {
      me.connected = false
      me.socketId = null
    }
    socketRoom.delete(socket.id)
    socketProfile.delete(socket.id)
    socket.leave(room.code)

    if (room.phase === 'lobby') {
      if (me) {
        room.players = room.players.filter((p) => p.id !== me.id)
        if (room.players.length === 0) {
          if (room.botFillTimer) clearTimeout(room.botFillTimer)
          rooms.delete(room.code)
        } else {
          if (room.hostId === me.id) {
            room.hostId = room.players.find((p) => !p.isBot)?.id ?? room.players[0]?.id ?? ''
            room.players[0].isHost = true
          }
          broadcastRoom(room)
        }
      }
      return
    }

    // playing: bot takeover, keep the game alive
    if (me && room.state && room.state.phase !== 'gameover') {
      botTakeover(room, me)
      io.to(room.code).emit('game:chat', {
        color: me.color,
        name: 'System',
        text: `${me.name} left - a bot took over their seat`,
      })
      drive(room)
    }
  })
})

// cleanup stale rooms every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [code, room] of rooms) {
    if (room.players.filter((p) => p.connected).length === 0 && now - room.createdAt > 10 * 60 * 1000) {
      clearTimers(room)
      if (room.botFillTimer) clearTimeout(room.botFillTimer)
      rooms.delete(code)
      console.log('[ludo-server] cleaned room', code)
    }
  }
}, 5 * 60 * 1000)

httpServer.listen(PORT, () => {
  console.log(`[ludo-server] listening on port ${PORT}`)
})
