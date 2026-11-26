// Engine rule verification: extra turn on 6, capture/finish extra turn,
// turn order rotation, three-six forfeit, zero-crash over many games,
// locked-pair (block) rule: pairs can't be captured, landed on or passed.
import {
  applyMove,
  blockColorAt,
  createGame,
  legalMoves,
  passTurn,
  rollDice,
} from '../src/lib/ludo/engine'
import { trackIdxFor } from '../src/lib/ludo/board'
import type { GameState, Move } from '../src/lib/ludo/types'

let failures = 0
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++
    console.log('FAIL:', name)
  }
}

// Deterministic dice rig
function rig(seq: number[]) {
  let i = 0
  return () => {
    const v = seq[i % seq.length]
    i++
    return (v - 1) / 6 // rollDice does DICE_MIN + floor(rand*6)
  }
}

// ---- Test 1: extra turn on six (same player rolls again) ----
{
  const g = createGame({
    mode: 'classic',
    players: [
      { color: 'red', name: 'A', avatar: 'x', isBot: false },
      { color: 'yellow', name: 'B', avatar: 'y', isBot: false },
    ],
  })
  const { state: s1 } = rollDice(g, rig([6]))
  check('T1 six -> phase move', s1.phase === 'move')
  const moves = legalMoves(s1)
  check('T1 six opens token', moves.length === 4 && moves.every((m) => m.opens))
  const s2 = applyMove(s1, moves[0])
  check('T1 after moving with six, same player rolls again', s2.phase === 'roll' && s2.turn === 0)
  const { state: s3 } = rollDice(s2, rig([3]))
  check('T1 non-six -> next player', (() => {
    const m2 = legalMoves(s3)
    const s4 = m2.length ? applyMove(s3, m2[0]) : passTurn(s3)
    return s4.turn === 1 && s4.phase === 'roll'
  })())
}

// ---- Test 2: capture grants extra turn ----
{
  const g = createGame({
    mode: 'classic',
    players: [
      { color: 'red', name: 'A', avatar: 'x', isBot: false },
      { color: 'green', name: 'B', avatar: 'y', isBot: false },
    ],
  })
  // open red token (six), then six again -> land on progress 6? start=1 -> trackIdx 7... 
  // Simpler: walk red out, then advance to green's start cell (progress 13 -> abs 14) captures green opening later.
  let s = g
  const r = rig([6])
  ;({ state: s } = rollDice(s, r))
  s = applyMove(s, legalMoves(s)[0]) // red opens (progress 0), six => extra turn
  check('T2 red opened', s.players[0].tokens[0].location === 'track')
  // red walks 6+6+2 = progress 14 -> abs (1+14)%52 = 15 (NOT safe), one step past green's start
  ;({ state: s } = rollDice(s, rig([6])))
  s = applyMove(s, legalMoves(s).find((m) => m.tokenId === 0)!) // progress 6, extra turn
  ;({ state: s } = rollDice(s, rig([6])))
  s = applyMove(s, legalMoves(s).find((m) => m.tokenId === 0)!) // progress 12, extra turn
  ;({ state: s } = rollDice(s, rig([2])))
  const mv = legalMoves(s).find((m) => m.tokenId === 0)!
  s = applyMove(s, mv) // progress 14 -> abs 15, non-six passes turn
  check('T2 after non-six it is green turn', s.turn === 1)
  // green rolls 6, opens on its start (abs 14, safe) -> extra turn; then 1 -> lands abs 15 -> captures red
  ;({ state: s } = rollDice(s, rig([6])))
  const gmv = legalMoves(s).find((m) => m.opens)!
  check('T2 green opens without capture (start is safe)', gmv.captures.length === 0)
  s = applyMove(s, gmv)
  check('T2 green got extra turn from six', s.turn === 1 && s.phase === 'roll')
  ;({ state: s } = rollDice(s, rig([1])))
  const gmv2 = legalMoves(s).find((m) => m.tokenId === 0)!
  check('T2 green capture available', gmv2.captures.length === 1)
  s = applyMove(s, gmv2)
  check('T2 capture sends red home', s.players[0].tokens[0].location === 'yard')
  check('T2 capture grants green extra turn', s.turn === 1 && s.phase === 'roll')
}

// ---- Test 3: turn order cycles red -> green -> yellow -> blue (4P) ----
{
  const g = createGame({
    mode: 'classic',
    players: [
      { color: 'red', name: 'A', avatar: 'x', isBot: false },
      { color: 'green', name: 'B', avatar: 'y', isBot: false },
      { color: 'yellow', name: 'C', avatar: 'z', isBot: false },
      { color: 'blue', name: 'D', avatar: 'w', isBot: false },
    ],
  })
  let s = g
  for (let i = 0; i < 8; i++) {
    ;({ state: s } = rollDice(s, rig([2])))
    const mv: Move | undefined = legalMoves(s)[0]
    s = mv ? applyMove(s, mv) : passTurn(s)
  }
  const seq: number[] = []
  let t = s.turn
  // just check passTurn cycles without sixes
  const order: number[] = []
  let cur = passTurn(s)
  for (let i = 0; i < 4; i++) {
    order.push(cur.turn)
    cur = passTurn(cur)
  }
  check('T3 order cycles all four seats', new Set(order).size === 4)
  void t
  void seq
}

// ---- Test 4: three consecutive sixes forfeit ----
{
  const g = createGame({
    mode: 'classic',
    players: [
      { color: 'red', name: 'A', avatar: 'x', isBot: false },
      { color: 'yellow', name: 'B', avatar: 'y', isBot: false },
    ],
  })
  let s = g
  let ff = false
  // tokens all in yard: rolling 6 then moving keeps opening; we roll 6 three times but DO move each time
  // three sixes with moves between -> third six still forfeits (streak counts rolls, not moves)
  ;({ state: s, forfeited: ff } = rollDice(s, rig([6])))
  check('T4 first six not forfeit', !ff)
  s = applyMove(s, legalMoves(s)[0])
  ;({ state: s, forfeited: ff } = rollDice(s, rig([6])))
  check('T4 second six not forfeit', !ff)
  s = applyMove(s, legalMoves(s)[0])
  const res = rollDice(s, rig([6]))
  check('T4 third six forfeits', res.forfeited)
  const passed = passTurn(res.state)
  check('T4 forfeit passes turn', passed.turn === 1)
}

// ---- Test 5: stress — 300 random games, no crash, valid invariants ----
{
  let extraTurnOnSix = 0
  let sixRolls = 0
  for (let game = 0; game < 300; game++) {
    const seedN = (game * 7919) % 1000
    let s = createGame({
      mode: game % 3 === 0 ? 'quick' : 'classic',
      players: [
        { color: 'red', name: 'A', avatar: 'x', isBot: false },
        { color: 'yellow', name: 'B', avatar: 'y', isBot: false },
      ],
    })
    let guard = 0
    let prevTurn = s.turn
    let prevPhase: string = s.phase
    while (s.phase !== 'gameover' && guard++ < 20000) {
      if (s.phase === 'roll') {
        const val = ((game * 31 + guard * 17 + seedN) % 6) + 1
        prevTurn = s.turn
        prevPhase = 'roll'
        const { state, forfeited } = rollDice(s, rig([val]))
        s = forfeited ? passTurn(state) : state
        if (val === 6 && !forfeited) {
          sixRolls++
          // after the move resolves (next time we leave phase 'move'), same player should roll again
          // we detect right after applyMove below
        }
      } else if (s.phase === 'move') {
        const mvs = legalMoves(s)
        if (mvs.length === 0) s = passTurn(s)
        else {
          const m = mvs[guard % mvs.length]
          const wasSix = s.dice[m.dieIndex] === 6
          const mover = s.turn
          s = applyMove(s, m)
          if (wasSix && s.phase === 'roll' && s.turn === mover) extraTurnOnSix++
          if (wasSix && s.phase !== 'gameover' && s.turn !== mover) {
            failures++
            console.log('FAIL: six did not grant extra turn (game', game, 'step', guard, ')')
          }
        }
      }
      // invariants
      if (s.turn < 0 || s.turn >= s.players.length) {
        failures++
        console.log('FAIL: turn out of range')
        break
      }
      void prevTurn
      void prevPhase
    }
    if (s.phase !== 'gameover' && guard >= 20000) {
      failures++
      console.log('FAIL: game did not finish (stuck)')
    }
  }
  console.log('six rolls:', sixRolls, 'extra-turn-on-six confirmed:', extraTurnOnSix)
}

// ---- Test 6: locked pair (block) — enemies cannot land on or pass it ----
{
  const mk = () =>
    createGame({
      mode: 'classic',
      players: [
        { color: 'red', name: 'A', avatar: 'x', isBot: false },
        { color: 'green', name: 'B', avatar: 'y', isBot: false },
      ],
    })
  const place = (g: GameState, pIdx: number, tokId: number, progress: number) => {
    const p = g.players[pIdx]
    const t = p.tokens[tokId]
    if (progress < 0) {
      t.location = 'yard'
      t.trackIdx = -1
      t.homeStep = 0
      t.progress = 0
    } else {
      t.location = 'track'
      t.trackIdx = trackIdxFor(p.color, progress)
      t.homeStep = 0
      t.progress = progress
    }
  }

  const g = mk()
  place(g, 0, 0, 10) // red pair on abs idx 11 (non-safe)
  place(g, 0, 1, 10)
  place(g, 0, 2, -1)
  place(g, 0, 3, -1)
  place(g, 1, 0, 46) // green token at abs 8, two steps behind the pair
  place(g, 1, 1, -1)
  check('T6 blockColorAt detects the red pair', blockColorAt(g, 11) === 'red')

  // die 3 would land green exactly ON the pair — illegal
  const { state: s1 } = rollDice({ ...g, turn: 1 }, rig([3]))
  check('T6 enemy cannot land on a locked pair', legalMoves(s1).length === 0)

  // die 1 lands just before the pair — legal
  const { state: s2 } = rollDice({ ...g, turn: 1 }, rig([1]))
  check('T6 stepping up to the pair is allowed', legalMoves(s2).some((m) => m.tokenId === 0))

  // die 6 would carry green THROUGH the pair cell into the home lane — illegal
  const { state: s3 } = rollDice({ ...g, turn: 1 }, rig([6]))
  const mvs3 = legalMoves(s3)
  check('T6 path through a locked pair is blocked', !mvs3.some((m) => m.tokenId === 0))
  check('T6 opening elsewhere unaffected by the pair', mvs3.some((m) => m.opens))

  // own color may land on (join) its own pair — 3-stack stays legal
  const g4 = mk()
  place(g4, 0, 0, 10)
  place(g4, 0, 1, 10)
  place(g4, 0, 2, 4)
  place(g4, 0, 3, -1)
  place(g4, 1, 0, -1)
  place(g4, 1, 1, -1)
  const { state: s4 } = rollDice(g4, rig([6]))
  const own = legalMoves(s4).find((m) => m.tokenId === 2)
  check('T6 own color may join its own pair', !!own && own.to.trackIdx === 11 && own.captures.length === 0)

  // ---- Test 7: enemy pair parked on MY start blocks opening ----
  const g5 = mk()
  const greenProgForRedStart = (1 - 14 + 52) % 52 // 39
  place(g5, 1, 0, greenProgForRedStart)
  place(g5, 1, 1, greenProgForRedStart)
  place(g5, 1, 2, -1)
  place(g5, 1, 3, -1)
  check('T7 green pair detected on red start', blockColorAt(g5, 1) === 'green')
  const { state: s5 } = rollDice(g5, rig([6]))
  check('T7 entry blocked by enemy pair on my start', legalMoves(s5).length === 0)

  // ---- Test 8: single enemy tokens are still capturable (regression) ----
  const g8 = mk()
  place(g8, 1, 0, 1) // green single at abs 15 (non-safe)
  place(g8, 1, 1, -1)
  place(g8, 1, 2, -1)
  place(g8, 1, 3, -1)
  place(g8, 0, 0, 8) // red at abs 9, die 6 -> abs 15 captures
  place(g8, 0, 1, -1)
  place(g8, 0, 2, -1)
  place(g8, 0, 3, -1)
  const { state: s8 } = rollDice(g8, rig([6]))
  const cap = legalMoves(s8).find((m) => m.tokenId === 0)
  check('T8 single enemy still capturable', !!cap && cap.captures.length === 1)

  // applying the capture move still works and sends the victim home
  if (cap) {
    const after = applyMove(s8, cap)
    check('T8 captured token returns to yard', after.players[1].tokens[0].location === 'yard')
  }
}

console.log(failures === 0 ? 'ALL ENGINE RULE TESTS PASSED' : failures + ' FAILURES')
process.exit(failures === 0 ? 0 : 1)
