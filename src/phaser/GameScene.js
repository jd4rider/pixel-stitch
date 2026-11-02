import Phaser from 'phaser'
import { W, H, background, button, text, fade } from './common.js'
import { confetti, flashAt, popText, ring, sparkle } from './fx.js'
import { audioState, sfx } from '../sound.js'
import { data, persist, recordSolve } from './save.js'
import {
  EMPTY,
  FILLED,
  MARKED,
  autoMarks,
  buildPuzzle,
  emptyState,
  filledCount,
  isSolved,
  nextHint,
  starsFor,
} from '../game.js'
import { PACKS, PUZZLES } from '../puzzles.js'

const BOARD_TOP = 132
const BOARD_BOTTOM = 726
const DEFAULT_BG = ['#2b1a3d', '#150f2b']

const colourOf = (hex) => Phaser.Display.Color.HexStringToColor(hex).color

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('game')
  }

  init(payload = {}) {
    this.def = payload.custom ?? PUZZLES.find((puzzle) => puzzle.id === payload.id) ?? PUZZLES[0]
    this.puzzle = buildPuzzle(this.def)
    this.isCustom = !PUZZLES.includes(this.def)
    this.pack = PACKS.find((pack) => pack.id === this.def.pack) ?? PACKS[0]
    this.state = emptyState(this.puzzle.rows, this.puzzle.cols)
    this.mistakes = 0
    this.hintsUsed = 0
    this.mode = 'fill'
    this.over = false
  }

  create() {
    background(this, this.isCustom ? DEFAULT_BG : this.pack.bg, this.isCustom ? 0xf9a8d4 : this.pack.color)
    this.cameras.main.fadeIn(220, 10, 8, 24)

    this.add.rectangle(W / 2, 60, W, 120, 0x0f0a1c, 0.92).setDepth(30)
    this.add.rectangle(W / 2, 120, W, 2, this.isCustom ? 0xf472b6 : this.pack.color, 0.9).setDepth(31)

    this.titleText = text(this, 22, 16, this.def.name, 25, '#fff', { fontStyle: 'bold' }).setDepth(32)
    this.subText = text(this, 22, 50, '', 14, '#bda9e0').setDepth(32)
    this.fillText = text(this, 22, 78, '', 14, '#c4b5fd').setDepth(32)
    this.mistakeText = text(this, 210, 78, '', 14, '#fca5a5').setDepth(32)

    this.modeButton = button(this, W - 96, 46, '✎ Fill', () => this.toggleMode(), {
      w: 152,
      h: 42,
      size: 17,
      color: 0x6366f1,
    }).setDepth(32)
    button(this, W - 62, 100, 'Menu', () => this.leave(), { w: 96, h: 32, size: 14, color: 0x3f3357 }).setDepth(32)

    this.buildBoard()
    this.buildFooter()

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-M', () => this.toggleMode())
      this.input.keyboard.on('keydown-H', () => this.useHint())
      this.input.keyboard.on('keydown-R', () => this.resetBoard())
    }

    this.input.on('pointerdown', (pointer) => this.onDown(pointer))
    this.input.on('pointermove', (pointer) => this.onMove(pointer))

    this.refreshHud()
  }

  // ---------- layout ----------

  buildBoard() {
    const puzzle = this.puzzle
    const longestRow = Math.max(...puzzle.rowClues.map((clue) => clue.length))
    const longestCol = Math.max(...puzzle.colClues.map((clue) => clue.length))

    let cell = 56
    let rowGutter = 0
    let colGutter = 0
    let boardW = 0
    let boardH = 0

    for (; cell >= 14; cell -= 1) {
      const unit = Math.max(13, cell * 0.56)
      rowGutter = longestRow * unit + 10
      colGutter = longestCol * unit + 10
      boardW = rowGutter + puzzle.cols * cell
      boardH = colGutter + puzzle.rows * cell
      if (boardW <= W - 24 && boardH <= BOARD_BOTTOM - BOARD_TOP) break
    }

    this.cell = cell
    this.ox = (W - boardW) / 2 + rowGutter
    this.oy = BOARD_TOP + (BOARD_BOTTOM - BOARD_TOP - boardH) / 2 + colGutter
    this.boardW = boardW
    this.boardH = boardH

    const panel = this.add.graphics().setDepth(2)
    panel.fillStyle(0x1b1230, 0.94)
    panel.fillRoundedRect(W / 2 - boardW / 2 - 10, this.oy - colGutter - 10, boardW + 20, boardH + 20, 18)
    panel.lineStyle(2, this.isCustom ? 0xf472b6 : this.pack.color, 0.4)
    panel.strokeRoundedRect(W / 2 - boardW / 2 - 10, this.oy - colGutter - 10, boardW + 20, boardH + 20, 18)

    const grid = this.add.graphics().setDepth(3)
    for (let c = 0; c <= puzzle.cols; c += 1) {
      const major = c % 5 === 0
      grid.lineStyle(major ? 2 : 1, 0xffffff, major ? 0.22 : 0.07)
      grid.lineBetween(this.ox + c * cell, this.oy, this.ox + c * cell, this.oy + puzzle.rows * cell)
    }
    for (let r = 0; r <= puzzle.rows; r += 1) {
      const major = r % 5 === 0
      grid.lineStyle(major ? 2 : 1, 0xffffff, major ? 0.22 : 0.07)
      grid.lineBetween(this.ox, this.oy + r * cell, this.ox + puzzle.cols * cell, this.oy + r * cell)
    }

    const fontSize = Math.max(11, Math.round(cell * 0.52))
    const spacing = Math.max(13, cell * 0.56)

    this.rowClueTexts = []
    puzzle.rowClues.forEach((clue, r) => {
      const total = (clue.length - 1) * spacing
      const group = clue.map((value, i) =>
        text(this, this.ox - 10 - (total - i * spacing), this.oy + r * cell + cell / 2, String(value), fontSize, '#d7c7f5', {
          fontStyle: 'bold',
        })
          .setOrigin(1, 0.5)
          .setDepth(4),
      )
      this.rowClueTexts.push(group)
    })

    this.colClueTexts = []
    puzzle.colClues.forEach((clue, c) => {
      const total = (clue.length - 1) * spacing
      const group = clue.map((value, i) =>
        text(this, this.ox + c * cell + cell / 2, this.oy - 10 - (total - i * spacing), String(value), fontSize, '#d7c7f5', {
          fontStyle: 'bold',
        })
          .setOrigin(0.5, 1)
          .setDepth(4),
      )
      this.colClueTexts.push(group)
    })

    this.cells = []
    for (let r = 0; r < puzzle.rows; r += 1) {
      const row = []
      for (let c = 0; c < puzzle.cols; c += 1) {
        const rect = this.add
          .rectangle(this.ox + c * cell + cell / 2, this.oy + r * cell + cell / 2, cell - 3, cell - 3, 0x2a1e45)
          .setStrokeStyle(1, 0xffffff, 0.06)
          .setDepth(5)
        const mark = text(this, this.ox + c * cell + cell / 2, this.oy + r * cell + cell / 2, '✕', Math.round(cell * 0.55), '#5b4b7d')
          .setOrigin(0.5)
          .setDepth(6)
          .setAlpha(0)
        row.push({ rect, mark })
      }
      this.cells.push(row)
    }
  }

  buildFooter() {
    const y = 792
    button(this, 74, y, '💡 Hint', () => this.useHint(), { w: 116, h: 44, size: 16, color: 0xb45309 }).setDepth(31)
    button(this, 206, y, '↺ Reset', () => this.resetBoard(), { w: 116, h: 44, size: 16, color: 0x0369a1 }).setDepth(31)
    this.soundButton = button(this, 338, y, audioState.muted ? 'Sound off' : 'Sound on', () => this.toggleSound(), {
      w: 116,
      h: 44,
      size: 16,
      color: 0x3f3357,
    }).setDepth(31)
    button(this, 480, y, 'All patterns', () => this.leave(), { w: 132, h: 44, size: 16, color: 0x3f3357 }).setDepth(31)
    text(this, 552, y + 44, '', 12, '#7c6ba8')
  }

  // ---------- interaction ----------

  cellAt(pointer) {
    const c = Math.floor((pointer.x - this.ox) / this.cell)
    const r = Math.floor((pointer.y - this.oy) / this.cell)
    if (r < 0 || c < 0 || r >= this.puzzle.rows || c >= this.puzzle.cols) return null
    return [r, c]
  }

  onDown(pointer) {
    if (this.over) return
    const at = this.cellAt(pointer)
    if (!at) return
    const mark = this.mode === 'mark' || pointer.rightButtonDown()
    this.apply(...at, { mark, toggle: true })
  }

  onMove(pointer) {
    if (this.over || !pointer.isDown) return
    const at = this.cellAt(pointer)
    if (!at) return
    const mark = this.mode === 'mark' || pointer.rightButtonDown()
    this.apply(...at, { mark, toggle: false })
  }

  apply(r, c, { mark = false, toggle = false } = {}) {
    const want = mark ? MARKED : FILLED
    const current = this.state[r][c]
    const next = toggle && current === want ? EMPTY : want
    if (next === current) return

    this.state[r][c] = next

    if (next === FILLED && !this.puzzle.grid[r][c]) {
      this.mistakes += 1
      sfx.wrong()
      this.cameras.main.shake(110, 0.004)
      flashAt(this, this.ox + c * this.cell + this.cell / 2, this.oy + r * this.cell + this.cell / 2, 60, 0xef4444)
    } else if (next === FILLED) {
      sfx.paint()
    } else if (next === MARKED) {
      sfx.cross()
    } else {
      sfx.erase()
    }

    this.renderCell(r, c)
    this.settle()
  }

  renderCell(r, c) {
    const { rect, mark } = this.cells[r][c]
    const value = this.state[r][c]
    const target = this.puzzle.grid[r][c]

    if (value === FILLED) {
      rect.setFillStyle(target ? colourOf(target) : 0x7f1d3a)
      rect.setStrokeStyle(1, 0xffffff, target ? 0.3 : 0.5)
      mark.setAlpha(0)
      this.tweens.add({ targets: rect, scaleX: 1.12, scaleY: 1.12, duration: 70, yoyo: true })
    } else if (value === MARKED) {
      rect.setFillStyle(0x241a3a)
      rect.setStrokeStyle(1, 0xffffff, 0.06)
      mark.setAlpha(1)
    } else {
      rect.setFillStyle(0x2a1e45)
      rect.setStrokeStyle(1, 0xffffff, 0.06)
      mark.setAlpha(0)
    }
  }

  settle() {
    const marks = autoMarks(this.state, this.puzzle)
    let crossed = 0
    for (const [r, c] of marks) {
      this.state[r][c] = MARKED
      this.renderCell(r, c)
      crossed += 1
    }
    if (crossed) {
      sfx.line(Math.min(crossed, 6))
      const [r, c] = marks[0]
      sparkle(this, this.ox + c * this.cell + this.cell / 2, this.oy + r * this.cell + this.cell / 2, 0xc4b5fd, 5)
    }

    this.refreshHud()

    if (isSolved(this.state, this.puzzle)) this.finish()
  }

  refreshHud() {
    const puzzle = this.puzzle
    this.subText.setText(`${puzzle.cols} × ${puzzle.rows} · ${puzzle.filled} squares to stitch`)
    this.fillText.setText(`Filled ${filledCount(this.state)}/${puzzle.filled}`)
    this.mistakeText.setText(this.mistakes ? `${this.mistakes} mistake${this.mistakes === 1 ? '' : 's'}` : '')
    this.mistakeText.setX(this.fillText.x + this.fillText.width + 22)
    this.modeButton.setLabel(this.mode === 'mark' ? '✕ Mark' : '✎ Fill')
  }

  toggleMode() {
    this.mode = this.mode === 'fill' ? 'mark' : 'fill'
    this.refreshHud()
    sfx.click()
  }

  toggleSound() {
    audioState.muted = !audioState.muted
    data.muted = audioState.muted
    persist()
    this.soundButton.setLabel(audioState.muted ? 'Sound off' : 'Sound on')
    if (!audioState.muted) sfx.click()
  }

  useHint() {
    if (this.over) return
    const spot = nextHint(this.state, this.puzzle)
    if (!spot) return
    const [r, c] = spot
    this.hintsUsed += 1
    this.state[r][c] = this.puzzle.grid[r][c] ? FILLED : EMPTY
    sfx.hint()
    flashAt(this, this.ox + c * this.cell + this.cell / 2, this.oy + r * this.cell + this.cell / 2, 90, 0xfde047)
    popText(this, this.ox + c * this.cell + this.cell / 2, this.oy + r * this.cell, 'hint', '#fde047', 18)
    this.renderCell(r, c)
    this.settle()
  }

  resetBoard() {
    if (this.over) return
    this.state = emptyState(this.puzzle.rows, this.puzzle.cols)
    this.mistakes = 0
    this.hintsUsed = 0
    for (let r = 0; r < this.puzzle.rows; r += 1) {
      for (let c = 0; c < this.puzzle.cols; c += 1) this.renderCell(r, c)
    }
    sfx.whoosh()
    this.refreshHud()
  }

  leave() {
    if (this.isCustom) fade(this, 'editor')
    else fade(this, 'levels', { pack: PACKS.indexOf(this.pack) })
  }

  // ---------- winning ----------

  finish() {
    if (this.over) return
    this.over = true
    const stars = starsFor({ mistakes: this.mistakes, hints: this.hintsUsed })
    recordSolve(this.puzzle.id, stars)

    if (!this.isCustom) {
      const index = PUZZLES.indexOf(this.def) + 1
      if (index === data.unlocked && index < PUZZLES.length) {
        data.unlocked = index + 1
        persist()
      }
    }

    sfx.win()
    for (let i = 0; i < 5; i += 1) {
      this.time.delayedCall(i * 90, () => {
        confetti(this, Phaser.Math.Between(80, W - 80), Phaser.Math.Between(180, 420), 0xf472b6, 8, 260)
      })
    }
    this.time.delayedCall(360, () => this.reveal(stars))
  }

  reveal(stars) {
    const puzzle = this.puzzle
    const layer = this.add.container(0, 0).setDepth(70)
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x0b0718, 0.9)
    const card = this.add.rectangle(W / 2, H / 2, 412, 604, 0x1c1430, 1).setStrokeStyle(2, 0xf472b6, 0.55)
    layer.add([dim, card])

    layer.add(text(this, W / 2, H / 2 - 250, 'Pattern stitched', 15, '#f9a8d4', { fontStyle: 'bold' }).setOrigin(0.5))
    layer.add(text(this, W / 2, H / 2 - 214, this.def.name, 30, '#fff', { fontStyle: 'bold' }).setOrigin(0.5))

    const artW = 300
    const artH = 250
    const artCell = Math.min(artW / puzzle.cols, artH / puzzle.rows, 32)
    const ax = W / 2 - (puzzle.cols * artCell) / 2
    const ay = H / 2 - 150 - (puzzle.rows * artCell) / 2 + 60

    const tiles = []
    for (let r = 0; r < puzzle.rows; r += 1) {
      for (let c = 0; c < puzzle.cols; c += 1) {
        const color = puzzle.grid[r][c]
        const tile = this.add
          .rectangle(ax + c * artCell + artCell / 2, ay + r * artCell + artCell / 2, artCell - 1, artCell - 1, color ? colourOf(color) : 0x241a3a)
          .setAlpha(color ? 1 : 0.35)
        layer.add(tile)
        if (color) {
          tile.setScale(0)
          tiles.push({ tile, delay: (r + c) * 16 })
        }
      }
    }
    tiles.forEach(({ tile, delay }) => {
      this.tweens.add({ targets: tile, scale: 1, duration: 260, delay, ease: 'Back.Out' })
    })
    ring(this, W / 2, ay + (puzzle.rows * artCell) / 2, 0xf472b6, 210, 700, 4)

    const starY = H / 2 + 138
    for (let i = 0; i < 3; i += 1) {
      const star = text(this, W / 2 + (i - 1) * 52, starY, '★', 40, i < stars ? '#fde047' : '#3a2d55', {
        fontStyle: 'bold',
      })
        .setOrigin(0.5)
        .setScale(0)
      layer.add(star)
      this.tweens.add({ targets: star, scale: i < stars ? 1 : 0.8, duration: 240, delay: 300 + i * 120, ease: 'Back.Out' })
    }

    const detail =
      this.mistakes || this.hintsUsed
        ? `${this.mistakes} mistake${this.mistakes === 1 ? '' : 's'} · ${this.hintsUsed} hint${this.hintsUsed === 1 ? '' : 's'}`
        : 'Perfect — no mistakes, no hints'
    layer.add(text(this, W / 2, starY + 46, detail, 15, '#bda9e0').setOrigin(0.5))

    const nextIndex = PUZZLES.indexOf(this.def) + 1
    const next = !this.isCustom ? PUZZLES[nextIndex] : null

    if (next) {
      button(this, W / 2, H / 2 + 226, `Next: ${next.name}`, () => this.scene.restart({ id: next.id }), {
        w: 320,
        h: 50,
        size: 18,
        color: 0xdb2777,
      }).setDepth(80)
    }
    button(this, W / 2, H / 2 + (next ? 282 : 226), 'Replay', () => this.scene.restart(this.isCustom ? { custom: this.def } : { id: this.def.id }), {
      w: 320,
      h: 44,
      size: 16,
      color: 0x6366f1,
    }).setDepth(80)
    button(this, W / 2, H / 2 + (next ? 330 : 274), this.isCustom ? 'Back to editor' : 'All patterns', () => this.leave(), {
      w: 320,
      h: 44,
      size: 16,
      color: 0x3f3357,
    }).setDepth(80)
  }
}
