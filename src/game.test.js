import test from 'node:test'
import assert from 'node:assert/strict'
import { PUZZLES, PACKS } from './puzzles.js'
import {
  CUSTOM_COLORS,
  EMPTY,
  FILLED,
  MARKED,
  autoMarks,
  buildPuzzle,
  cluesFrom,
  decodePuzzle,
  emptyState,
  encodePuzzle,
  filledCount,
  isSolved,
  logicallySolvable,
  nextHint,
  runsOf,
  solve,
  starsFor,
} from './game.js'

test('runs are counted the way nonogram clues need', () => {
  assert.deepEqual(runsOf([1, 1, 0, 1]), [2, 1])
  assert.deepEqual(runsOf([0, 0, 0]), [])
  assert.deepEqual(cluesFrom([0, 0, 0]), [0])
  assert.deepEqual(cluesFrom([1, 0, 1, 1]), [1, 2])
})

test('the starter set is big enough and every puzzle is well formed', () => {
  assert.ok(PUZZLES.length >= 24, `only ${PUZZLES.length} puzzles`)
  assert.equal(new Set(PUZZLES.map((p) => p.id)).size, PUZZLES.length, 'ids must be unique')
  assert.equal(new Set(PUZZLES.map((p) => p.name)).size, PUZZLES.length, 'names must be unique')

  for (const pack of PACKS) {
    const puzzles = PUZZLES.filter((p) => p.pack === pack.id)
    assert.ok(puzzles.length >= 6, `pack ${pack.id} has ${puzzles.length} puzzles`)
  }

  for (const def of PUZZLES) {
    assert.ok(PACKS.some((pack) => pack.id === def.pack), `${def.id} has an unknown pack`)
    const puzzle = buildPuzzle(def)
    const width = def.art[0].length
    assert.ok(puzzle.rows >= 5 && puzzle.cols >= 5, `${def.id} is too small`)
    assert.equal(puzzle.rows, width, `${def.id} is not square art`)
    assert.ok(puzzle.filled >= 8, `${def.id} only fills ${puzzle.filled} cells`)
    assert.ok(puzzle.filled < puzzle.rows * puzzle.cols, `${def.id} is completely full`)
    assert.ok(puzzle.colors.length >= 1, `${def.id} has no colour`)
  }
})

test('every starter puzzle can be solved by logic alone, without guessing', () => {
  const ambiguous = []
  for (const def of PUZZLES) {
    const puzzle = buildPuzzle(def)
    if (!logicallySolvable(puzzle)) ambiguous.push(`${def.id} (${puzzle.rows}x${puzzle.cols})`)
  }
  assert.deepEqual(ambiguous, [], `needs guessing: ${ambiguous.join(', ')}`)
})

test('derived clues describe the artwork exactly', () => {
  for (const def of PUZZLES) {
    const puzzle = buildPuzzle(def)
    const solved = solve(puzzle)
    assert.ok(solved, `${def.id} has contradictory clues`)
    for (let r = 0; r < puzzle.rows; r += 1) {
      assert.deepEqual(
        cluesFrom(solved[r].map((value) => (value === FILLED ? 1 : 0))),
        cluesFrom(puzzle.grid[r].map((cell) => (cell ? 1 : 0))),
        `${def.id} row ${r} clue mismatch`,
      )
    }
    for (let c = 0; c < puzzle.cols; c += 1) {
      const column = solved.map((row) => (row[c] === FILLED ? 1 : 0))
      assert.deepEqual(
        cluesFrom(column),
        cluesFrom(puzzle.grid.map((row) => (row[c] ? 1 : 0))),
        `${def.id} column ${c} clue mismatch`,
      )
    }
  }
})

test('auto-marking only crosses out finished lines', () => {
  const puzzle = buildPuzzle({
    id: 'unit',
    name: 'Unit',
    pack: 'sprouts',
    colors: { x: '#fff' },
    art: ['x..', '...', '..x'],
  })
  // Column 1 is empty, so its clue is [0] and every cell there is knowable.
  let state = emptyState(3, 3)
  const marks = autoMarks(state, puzzle)
  assert.ok(marks.some(([r, c]) => r === 0 && c === 1))
  assert.ok(marks.some(([r, c]) => r === 2 && c === 1))
  assert.ok(!marks.some(([r, c]) => r === 0 && c === 0), 'a filled cell must never be auto-crossed')

  // Solving row 0 exactly makes its leftovers crossable.
  state = emptyState(3, 3)
  state[0][0] = FILLED
  const rowMarks = autoMarks(state, puzzle)
  assert.ok(rowMarks.some(([r, c]) => r === 0 && c === 2))

  // An unfinished row is left alone.
  state = emptyState(3, 3)
  assert.ok(!autoMarks(state, puzzle).some(([r, c]) => r === 2 && c === 2))
})

test('playing the solution wins the puzzle', () => {
  const puzzle = buildPuzzle(PUZZLES[0])
  const state = emptyState(puzzle.rows, puzzle.cols)
  assert.equal(isSolved(state, puzzle), false)
  assert.equal(filledCount(state), 0)

  for (let r = 0; r < puzzle.rows; r += 1) {
    for (let c = 0; c < puzzle.cols; c += 1) {
      if (puzzle.grid[r][c]) state[r][c] = FILLED
    }
  }
  assert.equal(isSolved(state, puzzle), true)
  assert.equal(filledCount(state), puzzle.filled)

  // A single extra fill is a loss, even with every real cell painted.
  const extra = puzzle.grid.findIndex((row) => row.some((cell) => !cell))
  if (extra >= 0) {
    state[extra][puzzle.grid[extra].findIndex((cell) => !cell)] = FILLED
    assert.equal(isSolved(state, puzzle), false)
  }
})

test('marked cells do not count as solved fills', () => {
  const puzzle = buildPuzzle(PUZZLES[0])
  const state = emptyState(puzzle.rows, puzzle.cols)
  for (let r = 0; r < puzzle.rows; r += 1) {
    for (let c = 0; c < puzzle.cols; c += 1) state[r][c] = puzzle.grid[r][c] ? MARKED : MARKED
  }
  assert.equal(isSolved(state, puzzle), false)
})

test('hints point at something genuinely wrong', () => {
  const puzzle = buildPuzzle(PUZZLES[0])
  const state = emptyState(puzzle.rows, puzzle.cols)
  const hint = nextHint(state, puzzle)
  assert.ok(hint)
  const [r, c] = hint
  assert.ok(puzzle.grid[r][c], 'first hint should be a cell that must be filled')

  state[r][c] = FILLED
  const next = nextHint(state, puzzle)
  assert.notDeepEqual(next, hint)
})

test('star ratings reward accuracy', () => {
  assert.equal(starsFor({ mistakes: 0, hints: 0 }), 3)
  assert.equal(starsFor({ mistakes: 1 }), 2)
  assert.equal(starsFor({ mistakes: 5 }), 1)
  assert.equal(starsFor({ mistakes: 0, hints: 1 }), 1)
})

test('share codes round-trip any rectangle', () => {
  const state = [
    [CUSTOM_COLORS[0], null, CUSTOM_COLORS[3], null],
    [null, CUSTOM_COLORS[5], null, null],
    [null, null, null, CUSTOM_COLORS[1]],
  ]
  const code = encodePuzzle({ cols: 4, rows: 3, state })
  assert.match(code, /^PS1/)

  const decoded = decodePuzzle(code)
  assert.ok(decoded)
  assert.equal(decoded.cols, 4)
  assert.equal(decoded.rows, 3)
  assert.equal(decoded.filled, 4)
  assert.deepEqual(decoded.state, state)

  // The form players will paste from a URL.
  assert.deepEqual(decodePuzzle(`#p=${code}`)?.state, state)
})

test('share codes reject junk instead of breaking the game', () => {
  assert.equal(decodePuzzle(''), null)
  assert.equal(decodePuzzle('hello'), null)
  assert.equal(decodePuzzle('PS1'), null)
  assert.equal(decodePuzzle('PS1zzxzz:000'), null)
  assert.equal(decodePuzzle('PS19x9:000'), null, 'length must match the size')
  assert.equal(decodePuzzle('PS13x3:000'), null, 'an empty design is not a puzzle')
  assert.equal(decodePuzzle('PS13x3:900'), null, 'colour index out of range')
  assert.equal(decodePuzzle('PS1qxq:' + '0'.repeat(256) + '1'), null, 'too big')

  // Whitespace and a stray leading dot are tolerated.
  const state = [[CUSTOM_COLORS[2], null, null]]
  const code = encodePuzzle({ cols: 3, rows: 1, state })
  assert.ok(decodePuzzle(`  ${code}  `))
  assert.ok(decodePuzzle(code.toUpperCase()), 'case differences are tolerated')
})

test('a decoded design builds into a playable puzzle', () => {
  const source = buildPuzzle(PUZZLES.find((p) => p.id === 'heart'))
  const state = source.grid.map((row) => row.map((cell) => (cell ? CUSTOM_COLORS[0] : null)))
  const decoded = decodePuzzle(encodePuzzle({ cols: source.cols, rows: source.rows, state }))
  assert.ok(decoded)
  assert.equal(decoded.filled, source.filled)

  // Turn the share state into art the same way the editor does.
  const chars = '123456789abcdefg'
  const art = decoded.state.map((row) =>
    row
      .map((cell) => {
        if (!cell) return '.'
        return chars[CUSTOM_COLORS.indexOf(cell)]
      })
      .join(''),
  )
  const colors = {}
  CUSTOM_COLORS.forEach((color, i) => {
    colors[chars[i]] = color
  })

  const puzzle = buildPuzzle({ id: 'custom', name: 'Custom', pack: 'custom', art, colors })
  assert.equal(puzzle.rows, source.rows)
  assert.equal(puzzle.cols, source.cols)
  assert.equal(puzzle.filled, source.filled)
  assert.equal(logicallySolvable(puzzle), true)
  const solved = emptyState(puzzle.rows, puzzle.cols)
  for (let r = 0; r < puzzle.rows; r += 1) {
    for (let c = 0; c < puzzle.cols; c += 1) if (puzzle.grid[r][c]) solved[r][c] = FILLED
  }
  assert.equal(isSolved(solved, puzzle), true)
  assert.equal(EMPTY, 0)
  assert.ok(Array.isArray(CUSTOM_COLORS))
})
