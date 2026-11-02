// Nonogram engine: clue generation, painting rules, a line solver (so every
// puzzle can be checked for "solvable without guessing"), and share codes for
// player-made puzzles.

export const EMPTY = 0
export const FILLED = 1
export const MARKED = 2

// Colours available in the puzzle editor / share codes.
export const CUSTOM_COLORS = [
  '#fb7185',
  '#fb923c',
  '#fbbf24',
  '#4ade80',
  '#38bdf8',
  '#818cf8',
  '#c084fc',
  '#94a3b8',
]

export const MAX_SIZE = 16

export function emptyState(rows, cols) {
  return Array.from({ length: rows }, () => new Array(cols).fill(EMPTY))
}

export function runsOf(values) {
  const runs = []
  let current = 0
  for (const value of values) {
    if (value) current += 1
    else if (current) {
      runs.push(current)
      current = 0
    }
  }
  if (current) runs.push(current)
  return runs
}

export function cluesFrom(values) {
  const runs = runsOf(values)
  return runs.length ? runs : [0]
}

export function buildPuzzle(def) {
  const rows = def.art.length
  const cols = def.art[0].length
  if (!rows || !cols) throw new Error(`puzzle ${def.id} has no art`)

  const grid = []
  const colors = []
  for (let r = 0; r < rows; r += 1) {
    const line = def.art[r]
    if (line.length !== cols) throw new Error(`puzzle ${def.id} row ${r} is the wrong width`)
    const row = []
    for (let c = 0; c < cols; c += 1) {
      const ch = line[c]
      if (ch === '.') {
        row.push(null)
      } else {
        const color = def.colors?.[ch]
        if (!color) throw new Error(`puzzle ${def.id} uses undefined colour '${ch}'`)
        row.push(color)
        colors.push(color)
      }
    }
    grid.push(row)
  }

  const rowClues = grid.map((row) => cluesFrom(row.map((cell) => (cell ? 1 : 0))))
  const colClues = []
  for (let c = 0; c < cols; c += 1) {
    colClues.push(cluesFrom(grid.map((row) => (row[c] ? 1 : 0))))
  }

  let filled = 0
  for (const row of grid) for (const cell of row) if (cell) filled += 1

  return {
    id: def.id,
    name: def.name,
    pack: def.pack,
    rows,
    cols,
    grid,
    rowClues,
    colClues,
    filled,
    colors: [...new Set(colors)],
  }
}

export function lineFrom(state, puzzle, axis, index) {
  if (axis === 'row') return state[index]
  return state.map((row) => row[index])
}

export function clueSatisfied(clue, values) {
  const runs = runsOf(values)
  const wanted = clue.filter((n) => n > 0)
  if (runs.length !== wanted.length) return false
  return runs.every((run, i) => run === wanted[i])
}

// Once a row or column already matches its clue, every unknown cell in that
// line must be empty, so crossing them out is always safe.
export function autoMarks(state, puzzle) {
  const marks = []
  const seen = new Set()

  const consider = (axis, index, clue, values) => {
    if (!clueSatisfied(clue, values)) return
    values.forEach((value, i) => {
      if (value !== EMPTY) return
      const r = axis === 'row' ? index : i
      const c = axis === 'row' ? i : index
      const key = `${r}:${c}`
      if (seen.has(key)) return
      seen.add(key)
      marks.push([r, c])
    })
  }

  for (let r = 0; r < puzzle.rows; r += 1) {
    consider('row', r, puzzle.rowClues[r], state[r].map((value) => (value === FILLED ? 1 : 0)))
  }
  for (let c = 0; c < puzzle.cols; c += 1) {
    consider(
      'col',
      c,
      puzzle.colClues[c],
      state.map((row) => (row[c] === FILLED ? 1 : 0)),
    )
  }

  return marks
}

export function isSolved(state, puzzle) {
  for (let r = 0; r < puzzle.rows; r += 1) {
    for (let c = 0; c < puzzle.cols; c += 1) {
      const filled = state[r][c] === FILLED
      if (filled !== Boolean(puzzle.grid[r][c])) return false
    }
  }
  return true
}

export function filledCount(state) {
  let total = 0
  for (const row of state) for (const value of row) if (value === FILLED) total += 1
  return total
}

export function starsFor({ mistakes = 0, hints = 0 } = {}) {
  if (hints > 0) return 1
  if (mistakes === 0) return 3
  if (mistakes <= 2) return 2
  return 1
}

// ---------- logic solver ----------

function knownLine(state, puzzle, axis, index) {
  return lineFrom(state, puzzle, axis, index).slice()
}

function candidates(clue, length, known) {
  const wanted = clue.filter((n) => n > 0)
  const out = []

  const walk = (block, start, line) => {
    if (block === wanted.length) {
      const finished = line.slice()
      for (let i = start; i < length; i += 1) {
        if (known[i] === FILLED) return
        finished[i] = MARKED
      }
      out.push(finished)
      return
    }

    const size = wanted[block]
    const remaining = wanted.slice(block).reduce((sum, n) => sum + n, 0) + (wanted.length - block - 1)

    for (let at = start; at + remaining <= length; at += 1) {
      let blocked = false
      for (let i = start; i < at; i += 1) {
        if (known[i] === FILLED) {
          blocked = true
          break
        }
      }
      if (blocked) break

      let fits = true
      for (let i = at; i < at + size; i += 1) {
        if (known[i] === MARKED) {
          fits = false
          break
        }
      }
      if (!fits) continue
      if (at + size < length && known[at + size] === FILLED) continue

      const next = line.slice()
      for (let i = start; i < at; i += 1) next[i] = MARKED
      for (let i = at; i < at + size; i += 1) next[i] = FILLED
      if (at + size < length) next[at + size] = MARKED

      walk(block + 1, Math.min(length, at + size + 1), next)
    }
  }

  walk(0, 0, new Array(length).fill(MARKED))
  return out
}

// Pure line-constraint propagation. Returns the solved grid (true/false cells)
// or null when the clues contradict each other.
export function solve(puzzle, { maxRounds = 200 } = {}) {
  const state = emptyState(puzzle.rows, puzzle.cols)

  for (let round = 0; round < maxRounds; round += 1) {
    let changed = false

    const applyLine = (axis, index, clue) => {
      const known = knownLine(state, puzzle, axis, index)
      const length = axis === 'row' ? puzzle.cols : puzzle.rows
      const options = candidates(clue, length, known)
      if (!options.length) return false

      for (let i = 0; i < length; i += 1) {
        if (known[i] !== EMPTY) continue
        const first = options[0][i]
        if (options.every((option) => option[i] === first)) {
          const r = axis === 'row' ? index : i
          const c = axis === 'row' ? i : index
          state[r][c] = first
          changed = true
        }
      }
      return true
    }

    for (let r = 0; r < puzzle.rows; r += 1) {
      if (!applyLine('row', r, puzzle.rowClues[r])) return null
    }
    for (let c = 0; c < puzzle.cols; c += 1) {
      if (!applyLine('col', c, puzzle.colClues[c])) return null
    }

    if (!changed) break
  }

  return state
}

// True when the clues can be finished with pure logic and match the artwork.
export function logicallySolvable(puzzle) {
  const solved = solve(puzzle)
  if (!solved) return false
  for (let r = 0; r < puzzle.rows; r += 1) {
    for (let c = 0; c < puzzle.cols; c += 1) {
      const want = Boolean(puzzle.grid[r][c])
      if ((solved[r][c] === FILLED) !== want) return false
    }
  }
  return true
}

// First wrong-but-filled cell, or the first unfilled cell that should be filled.
export function nextHint(state, puzzle) {
  for (let r = 0; r < puzzle.rows; r += 1) {
    for (let c = 0; c < puzzle.cols; c += 1) {
      if (puzzle.grid[r][c] && state[r][c] !== FILLED) return [r, c]
    }
  }
  for (let r = 0; r < puzzle.rows; r += 1) {
    for (let c = 0; c < puzzle.cols; c += 1) {
      if (!puzzle.grid[r][c] && state[r][c] === FILLED) return [r, c]
    }
  }
  return null
}

// ---------- share codes ----------

const CODE_PREFIX = 'PS1'

export function encodePuzzle({ cols, rows, state, palette = CUSTOM_COLORS }) {
  const paletteIndex = (color) => {
    const index = palette.indexOf(color)
    return index < 0 ? 0 : index
  }
  let cells = ''
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = state[r][c]
      cells += cell && cell !== EMPTY ? String(paletteIndex(cell) + 1) : '0'
    }
  }
  return `${CODE_PREFIX}${cols.toString(36)}x${rows.toString(36)}:${cells}`
}

export function decodePuzzle(code, palette = CUSTOM_COLORS) {
  if (typeof code !== 'string') return null
  const trimmed = code.trim().replace(/^#?p=/, '')
  if (!trimmed.startsWith(CODE_PREFIX)) return null

  const body = trimmed.slice(CODE_PREFIX.length)
  const match = /^([0-9a-z]{1,2})x([0-9a-z]{1,2}):([0-9]+)$/i.exec(body)
  if (!match) return null

  const cols = Number.parseInt(match[1], 36)
  const rows = Number.parseInt(match[2], 36)
  if (!cols || !rows || cols > MAX_SIZE || rows > MAX_SIZE) return null
  if (match[3].length !== cols * rows) return null
  if (!/^[0-9]+$/.test(match[3])) return null

  const state = Array.from({ length: rows }, () => new Array(cols).fill(null))
  let filled = 0
  for (let i = 0; i < match[3].length; i += 1) {
    const digit = Number(match[3][i])
    if (digit === 0) continue
    if (digit > palette.length) return null
    state[Math.floor(i / cols)][i % cols] = palette[digit - 1]
    filled += 1
  }
  if (!filled) return null

  return { cols, rows, state, filled }
}

export function codeFromGrid(grid) {
  const rows = grid.length
  const cols = grid[0].length
  return encodePuzzle({ rows, cols, state: grid })
}

export function hashCode(code) {
  let hash = 5381
  for (let i = 0; i < code.length; i += 1) hash = ((hash << 5) + hash + code.charCodeAt(i)) >>> 0
  return hash.toString(36)
}

// Turn a decoded share code into a puzzle definition the rest of the game can
// treat exactly like a built-in puzzle.
export function customDef(decoded, name = 'My Design') {
  const chars = '123456789abcdefg'
  const colors = {}
  CUSTOM_COLORS.forEach((color, index) => {
    colors[chars[index]] = color
  })
  return {
    id: `custom-${hashCode(`${decoded.cols}x${decoded.rows}:${decoded.state.flat().join('')}`)}`,
    name,
    pack: 'custom',
    colors,
    art: artFromState(decoded.state, CUSTOM_COLORS, chars),
  }
}

export function artFromState(state, palette, chars = '123456789abcdefg') {
  return state.map((row) =>
    row
      .map((cell) => {
        if (!cell) return '.'
        const index = palette.indexOf(cell)
        return chars[index < 0 ? 0 : index]
      })
      .join(''),
  )
}
