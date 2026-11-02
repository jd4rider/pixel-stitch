import Phaser from 'phaser'
import { W, background, button, text, fade, hint } from './common.js'
import { data, bestStars, starTotal } from './save.js'
import { PACKS, PUZZLES } from '../puzzles.js'
import { buildPuzzle } from '../game.js'

export default class LevelsScene extends Phaser.Scene {
  constructor() {
    super('levels')
  }

  init(payload = {}) {
    const unlockedIndex = Phaser.Math.Clamp(data.unlocked - 1, 0, PUZZLES.length - 1)
    const currentPack = PACKS.findIndex((pack) => pack.id === PUZZLES[unlockedIndex].pack)
    this.packIndex = Phaser.Math.Clamp(payload.pack ?? Math.max(0, currentPack), 0, PACKS.length - 1)
  }

  create() {
    const pack = PACKS[this.packIndex]
    background(this, pack.bg, pack.color)
    this.cameras.main.fadeIn(220, 10, 8, 24)

    text(this, W / 2, 56, pack.name, 38, '#fff', { fontStyle: 'bold' }).setOrigin(0.5)
    text(this, W / 2, 94, pack.blurb, 16, '#d8c9f0').setOrigin(0.5)
    button(this, 64, 34, '◀ Menu', () => fade(this, 'menu'), { w: 108, h: 40, size: 15, color: 0x3f3357 })
    text(this, W - 24, 34, `${starTotal()} ★`, 22, '#fde047', { fontStyle: 'bold' }).setOrigin(1, 0.5)

    const levels = PUZZLES.filter((puzzle) => puzzle.pack === pack.id)
    const cols = 2
    const cardW = 256
    const cardH = 150
    const gapX = 20
    const gapY = 18
    const left = (W - (cols * cardW + gapX)) / 2
    const top = 132

    levels.forEach((def, i) => {
      const index = PUZZLES.indexOf(def) + 1
      const open = index <= data.unlocked
      const x = left + (i % cols) * (cardW + gapX) + cardW / 2
      const y = top + Math.floor(i / cols) * (cardH + gapY) + cardH / 2
      this.drawCard(def, index, open, x, y, cardW, cardH, pack)
    })

    const go = (delta) => this.scene.restart({ pack: this.packIndex + delta })
    if (this.packIndex > 0) {
      button(this, 86, 800, '◀ Prev', () => go(-1), { w: 132, h: 46, size: 16, color: 0x43305c })
    }
    if (this.packIndex < PACKS.length - 1) {
      button(this, W - 86, 800, 'Next ▶', () => go(1), { w: 132, h: 46, size: 16, color: 0x43305c })
    }

    const nextIndex = data.unlocked - 1
    const next = PUZZLES[nextIndex]
    hint(
      this,
      W / 2,
      800,
      next ? `Next up: ${next.name}` : 'Every starter pattern is done — try creating one!',
      14,
      '#bda9e0',
    )
  }

  drawCard(def, index, open, x, y, w, h, pack) {
    const card = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(open ? 0x241a3a : 0x1a1428, 0.95).fillRoundedRect(-w / 2, -h / 2, w, h, 18)
    bg.lineStyle(2, open ? pack.color : 0x3d3357, open ? 0.55 : 0.5).strokeRoundedRect(-w / 2, -h / 2, w, h, 18)
    card.add(bg)

    const puzzle = buildPuzzle(def)
    card.add(text(this, -w / 2 + 16, -h / 2 + 14, def.name, 20, open ? '#fff' : '#6b5f8a', { fontStyle: 'bold' }))
    card.add(text(this, -w / 2 + 16, -h / 2 + 44, `${puzzle.cols} × ${puzzle.rows} · ${puzzle.filled} squares`, 14, open ? '#bda9e0' : '#584d75'))

    if (!open) {
      card.add(text(this, w / 2 - 30, -h / 2 + 26, '🔒', 22).setOrigin(0.5))
      card.add(text(this, -w / 2 + 16, h / 2 - 30, 'Finish the pattern before this one', 13, '#584d75'))
      return
    }

    const stars = bestStars(def.id)
    for (let s = 0; s < 3; s += 1) {
      card.add(text(this, -w / 2 + 20 + s * 26, h / 2 - 34, '★', 24, s < stars ? '#fde047' : '#00000055'))
    }
    card.add(text(this, w / 2 - 18, h / 2 - 30, `#${index}`, 13, '#8b7bb0').setOrigin(1, 0.5))

    card.setSize(w, h).setInteractive({ useHandCursor: true })
    card.on('pointerdown', () => {
      this.tweens.add({ targets: card, scale: 0.96, duration: 70, yoyo: true })
      fade(this, 'game', { id: def.id })
    })
    if (index === data.unlocked) {
      this.tweens.add({ targets: card, scale: 1.03, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
    }
  }
}
