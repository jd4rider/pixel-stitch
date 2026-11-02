import Phaser from 'phaser'
import { W, background, button, text, fade, hint } from './common.js'
import { data, persist } from './save.js'
import { CUSTOM_COLORS, customDef, decodePuzzle, encodePuzzle } from '../game.js'
import { sfx } from '../sound.js'

const SIZES = [5, 7, 10]

export default class EditorScene extends Phaser.Scene {
  constructor() {
    super('editor')
  }

  init(payload = {}) {
    this.size = payload.size ?? 5
    this.color = CUSTOM_COLORS[0]
    this.eraser = false
    this.grid = Array.from({ length: this.size }, () => new Array(this.size).fill(null))
  }

  create() {
    background(this, ['#221738', '#120c22'], 0xa78bfa)
    this.cameras.main.fadeIn(220, 10, 8, 24)

    text(this, W / 2, 40, 'Create', 32, '#fff', { fontStyle: 'bold' }).setOrigin(0.5)
    button(this, 60, 34, '◀ Menu', () => fade(this, 'menu'), { w: 104, h: 38, size: 14, color: 0x3f3357 })

    this.sizeButtons = []
    SIZES.forEach((size, i) => {
      const x = W / 2 + (i - 1) * 116
      this.sizeButtons.push(
        button(this, x, 92, `${size}×${size}`, () => this.setSize(size), {
          w: 104,
          h: 38,
          size: 15,
          color: size === this.size ? 0xdb2777 : 0x3f3357,
        }),
      )
    })

    this.swatches = []
    CUSTOM_COLORS.forEach((color, i) => {
      const x = W / 2 + (i - 3.5) * 52
      const swatch = this.add
        .rectangle(x, 146, 40, 40, Phaser.Display.Color.HexStringToColor(color).color)
        .setStrokeStyle(3, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })
      swatch.on('pointerdown', () => this.pick(color))
      this.swatches.push({ swatch, color })
    })
    this.eraserSwatch = this.add
      .rectangle(W / 2 + 4.5 * 52, 146, 40, 40, 0x1b1230)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true })
    this.eraserLabel = text(this, W / 2 + 4.5 * 52, 146, '⌫', 20, '#c4b5fd').setOrigin(0.5)
    this.eraserSwatch.on('pointerdown', () => this.pickEraser())

    this.buildGrid()

    button(this, W / 2 - 78, 0, 'Test play', () => this.play(), { w: 148, h: 44, size: 16, color: 0xdb2777 })
    button(this, W / 2 + 78, 0, 'Share', () => this.share(), { w: 148, h: 44, size: 16, color: 0x6366f1 })
    this.testButton = this.children.list.at(-2)
    this.shareButton = this.children.list.at(-1)
    this.testButton.setY(690)
    this.shareButton.setY(690)
    button(this, W / 2 - 78, 738, 'Import code', () => this.importCode(), { w: 148, h: 40, size: 15, color: 0x3f3357 })
    button(this, W / 2 + 78, 738, 'Clear', () => this.clear(), { w: 148, h: 40, size: 15, color: 0x3f3357 })

    this.codeText = text(this, W / 2, 786, '', 11, '#a5b4fc', { align: 'center', wordWrap: { width: W - 60 } }).setOrigin(0.5, 0)

    this.buildSaved()
    hint(this, W / 2, 838, 'Tap or drag to paint · Share turns your design into a code friends can play', 13, '#8b7bb0')

    this.pick(CUSTOM_COLORS[0])
    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return
      this.paintAt(pointer)
    })
  }

  // ---------- canvas ----------

  buildGrid() {
    this.cells?.forEach((row) => row.forEach((cell) => cell.rect.destroy()))
    this.cells = []
    const area = 380
    const cell = Math.min(46, Math.floor(area / this.size))
    this.cell = cell
    this.ox = W / 2 - (this.size * cell) / 2
    this.oy = 196 + (area - this.size * cell) / 2

    const panel = this.add.graphics().setDepth(2)
    panel.fillStyle(0x1b1230, 0.9)
    panel.fillRoundedRect(this.ox - 12, this.oy - 12, this.size * cell + 24, this.size * cell + 24, 16)
    panel.lineStyle(2, 0xffffff, 0.12)
    for (let i = 0; i <= this.size; i += 1) {
      panel.lineBetween(this.ox + i * cell, this.oy, this.ox + i * cell, this.oy + this.size * cell)
      panel.lineBetween(this.ox, this.oy + i * cell, this.ox + this.size * cell, this.oy + i * cell)
    }

    for (let r = 0; r < this.size; r += 1) {
      const row = []
      for (let c = 0; c < this.size; c += 1) {
        const rect = this.add
          .rectangle(this.ox + c * cell + cell / 2, this.oy + r * cell + cell / 2, cell - 3, cell - 3, 0x2a1e45)
          .setDepth(5)
          .setInteractive({ useHandCursor: true })
        rect.on('pointerdown', (pointer) => {
          this.apply(r, c)
          pointer.event?.preventDefault?.()
        })
        rect.on('pointerover', (pointer) => {
          if (pointer.isDown) this.apply(r, c)
        })
        row.push({ rect })
      }
      this.cells.push(row)
    }
    this.renderAll()
  }

  renderAll() {
    for (let r = 0; r < this.size; r += 1) {
      for (let c = 0; c < this.size; c += 1) this.renderCell(r, c)
    }
  }

  renderCell(r, c) {
    const color = this.grid[r][c]
    const rect = this.cells[r][c].rect
    if (color) {
      rect.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color)
      rect.setStrokeStyle(1, 0xffffff, 0.22)
    } else {
      rect.setFillStyle(0x2a1e45)
      rect.setStrokeStyle(1, 0xffffff, 0.06)
    }
  }

  paintAt(pointer) {
    const c = Math.floor((pointer.x - this.ox) / this.cell)
    const r = Math.floor((pointer.y - this.oy) / this.cell)
    if (r < 0 || c < 0 || r >= this.size || c >= this.size) return
    this.apply(r, c)
  }

  apply(r, c) {
    const value = this.eraser ? null : this.color
    if (this.grid[r][c] === value) return
    this.grid[r][c] = value
    this.renderCell(r, c)
    if (value) sfx.paint()
    else sfx.erase()
    this.codeText.setText('')
  }

  pick(color) {
    this.color = color
    this.eraser = false
    this.swatches.forEach(({ swatch, color: swatchColor }) =>
      swatch.setStrokeStyle(3, 0xffffff, swatchColor === color ? 0.95 : 0),
    )
    this.eraserSwatch.setStrokeStyle(2, 0xffffff, 0.3)
    sfx.click()
  }

  pickEraser() {
    this.eraser = true
    this.swatches.forEach(({ swatch }) => swatch.setStrokeStyle(3, 0xffffff, 0))
    this.eraserSwatch.setStrokeStyle(3, 0xffffff, 0.95)
    sfx.click()
  }

  setSize(size) {
    if (size === this.size) return
    this.size = size
    this.grid = Array.from({ length: size }, () => new Array(size).fill(null))
    this.scene.restart({ size })
  }

  clear() {
    this.grid = Array.from({ length: this.size }, () => new Array(this.size).fill(null))
    this.renderAll()
    this.codeText.setText('')
    sfx.whoosh()
  }

  // ---------- sharing ----------

  filled() {
    return this.grid.flat().filter(Boolean).length
  }

  code() {
    return encodePuzzle({ cols: this.size, rows: this.size, state: this.grid })
  }

  toast(message) {
    const label = text(this, W / 2, 660, message, 15, '#fde047', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(40)
    this.tweens.add({ targets: label, alpha: 0, y: 636, delay: 900, duration: 500, onComplete: () => label.destroy() })
  }

  play() {
    if (!this.filled()) {
      this.toast('Paint something first')
      return
    }
    const decoded = decodePuzzle(this.code())
    if (!decoded) {
      this.toast('That design cannot be played')
      return
    }
    const def = customDef(decoded, `My Design ${data.customs.length + 1}`)
    data.customs = [
      { code: this.code(), name: def.name },
      ...data.customs.filter((entry) => entry.code !== this.code()),
    ].slice(0, 12)
    persist()
    fade(this, 'game', { custom: def })
  }

  share() {
    if (!this.filled()) {
      this.toast('Paint something first')
      return
    }
    const code = this.code()
    this.codeText.setText(code)
    const url = `${window.location.origin}${window.location.pathname}#${code}`
    const copy = navigator.clipboard?.writeText(url)
    if (copy?.then) copy.then(() => this.toast('Link copied — send it to a friend')).catch(() => this.toast('Copy the code below'))
    else this.toast('Copy the code below')
    sfx.sparkle()
  }

  importCode() {
    const input = window.prompt('Paste a Pixel Stitch share code or link:')
    if (!input) return
    const code = input.includes('#') ? input.split('#').pop() : input
    const decoded = decodePuzzle(code)
    if (!decoded || decoded.cols !== decoded.rows) {
      this.toast('That code is not a valid square design')
      return
    }
    this.size = decoded.cols
    this.grid = decoded.state
    this.scene.restart({ size: this.size })
    this.time.delayedCall(60, () => this.toast('Design loaded'))
  }

  buildSaved() {
    const saved = data.customs.slice(0, 4)
    if (!saved.length) return
    text(this, W / 2, 806, 'Your saved designs', 12, '#8b7bb0').setOrigin(0.5)
    saved.forEach((entry, i) => {
      const decoded = decodePuzzle(entry.code)
      if (!decoded) return
      const x = W / 2 + (i - (saved.length - 1) / 2) * 132
      button(
        this,
        x,
        830,
        `${decoded.cols}×${decoded.rows}`,
        () => {
          const def = customDef(decoded, entry.name)
          fade(this, 'game', { custom: def })
        },
        { w: 120, h: 30, size: 13, color: 0x43305c },
      )
    })
  }
}
