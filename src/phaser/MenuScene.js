import Phaser from 'phaser'
import { W, H, background, button, text, fade, hint } from './common.js'
import { data, starTotal } from './save.js'
import { PUZZLES } from '../puzzles.js'
import { customDef, decodePuzzle } from '../game.js'
import { sfx } from '../sound.js'

const MOSAIC = ['..r.r..', '.rrrrr.', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...']

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu')
  }

  create() {
    background(this, ['#2b1a3d', '#150f2b'])
    this.cameras.main.fadeIn(260, 10, 8, 24)

    this.drawMosaic()

    const title = text(this, W / 2, 292, 'Pixel Stitch', 74, '#f9a8d4', {
      fontStyle: 'bold',
      stroke: '#2b0f24',
      strokeThickness: 8,
    }).setOrigin(0.5)
    this.tweens.add({ targets: title, scale: 1.03, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
    text(this, W / 2, 350, 'Fill the numbers. Watch the picture appear.', 20, '#e9d5ff').setOrigin(0.5)

    const solved = Object.keys(data.stars).length
    text(this, W / 2, 396, `${solved}/${PUZZLES.length} patterns stitched · ${starTotal()} ★`, 17, '#c4b5fd').setOrigin(0.5)

    button(this, W / 2, 470, '▶  Play', () => fade(this, 'levels'), { w: 380, h: 62, size: 27, color: 0xdb2777 })
    button(this, W / 2, 548, '✏️  Create a pattern', () => fade(this, 'editor'), {
      w: 380,
      h: 58,
      size: 23,
      color: 0x6366f1,
    })
    button(this, W / 2, 618, 'How to play', () => this.rules(), { w: 380, h: 46, size: 18, color: 0x3f3357 })

    this.sharedLink()
    this.mosaicTween()

    hint(this, W / 2, H - 62, 'Read the numbers, then fill the runs they describe.', 15, '#a5b4fc')
    hint(this, W / 2, H - 36, '24 starter patterns · share codes for your own designs', 14, '#7c6ba8')
  }

  drawMosaic() {
    const cell = 30
    const cols = MOSAIC[0].length
    const ox = W / 2 - (cols * cell) / 2
    const oy = 96
    this.tiles = []
    MOSAIC.forEach((line, r) => {
      ;[...line].forEach((ch, c) => {
        const on = ch !== '.'
        const tile = this.add
          .rectangle(ox + c * cell, oy + r * cell, cell - 4, cell - 4, on ? 0xf472b6 : 0x3b2a52)
          .setOrigin(0)
          .setStrokeStyle(1, 0xffffff, on ? 0.35 : 0.08)
        this.tiles.push({ tile, on, r, c })
      })
    })
  }

  mosaicTween() {
    this.tiles.forEach(({ tile, on, r, c }) => {
      if (!on) return
      this.tweens.add({
        targets: tile,
        alpha: { from: 0.45, to: 1 },
        duration: 900,
        delay: (r + c) * 70,
        yoyo: true,
        repeat: -1,
        repeatDelay: 1200,
        ease: 'Sine.InOut',
      })
    })
  }

  sharedLink() {
    const code = decodeURIComponent((window.location.hash || '').replace(/^#/, ''))
    if (!code) return
    const decoded = decodePuzzle(code)
    if (!decoded) return

    const def = customDef(decoded, 'Shared pattern')
    text(this, W / 2, 690, `A shared ${decoded.cols}×${decoded.rows} pattern is waiting.`, 16, '#fbcfe8').setOrigin(0.5)
    button(this, W / 2, 734, `Play shared pattern — ${decoded.cols}×${decoded.rows}`, () => fade(this, 'game', { custom: def }), {
      w: 380,
      h: 48,
      size: 18,
      color: 0x9333ea,
    })
  }

  rules() {
    if (this.rulesCard) {
      this.rulesCard.destroy()
      this.rulesCard = null
      return
    }
    const layer = this.add.container(0, 0).setDepth(50)
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x0b0718, 0.86).setInteractive()
    dim.on('pointerdown', () => {
      layer.destroy()
      this.rulesCard = null
    })
    const card = this.add.rectangle(W / 2, H / 2, 536, 470, 0x1c1430, 1).setStrokeStyle(2, 0xf472b6, 0.5)
    card.setStrokeStyle(2, 0xf472b6, 0.5)
    const lines = [
      ['How to play', 30, '#f9a8d4', 62],
      ['The numbers along each row and column describe', 18, '#e9d5ff', 108],
      ['groups of filled squares, in order.', 18, '#e9d5ff', 136],
      ['For example  “3 2”  means three filled squares,', 18, '#c4b5fd', 186],
      ['at least one empty square, then two more.', 18, '#c4b5fd', 214],
      ['Tap a square to fill it. Tap again to clear it.', 18, '#e9d5ff', 262],
      ['Use ✕ mode (or right-click) to mark squares', 18, '#e9d5ff', 290],
      ['you know are empty.', 18, '#e9d5ff', 318],
      ['Finished rows and columns cross themselves out,', 18, '#e9d5ff', 366],
      ['so you can always reason forward — no guessing.', 18, '#e9d5ff', 394],
      ['Filling a wrong square counts as a mistake.', 16, '#fbbf24', 432],
    ]
    layer.add([dim, card])
    lines.forEach(([str, size, color, y]) => {
      layer.add(text(this, W / 2, H / 2 - 235 + y, str, size, color, { align: 'center' }).setOrigin(0.5))
    })
    const close = text(this, W / 2, H / 2 + 205, 'Tap anywhere to close', 15, '#a5b4fc').setOrigin(0.5)
    layer.add(close)
    sfx.click()
    this.rulesCard = layer
  }
}
