import Phaser from 'phaser'

export const W = 640
export const H = 860
export const FONT = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'

function canvas(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return
  const t = scene.textures.createCanvas(key, w, h)
  draw(t.getContext(), w, h)
  t.refresh()
}

export function makeTextures(scene) {
  canvas(scene, 'spark', 16, 16, (ctx) => {
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(8, 8, 8, 0, Math.PI * 2)
    ctx.fill()
  })
  canvas(scene, 'glow', 128, 128, (ctx) => {
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 128, 128)
  })
  canvas(scene, 'pixel', 8, 8, (ctx) => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 8, 8)
  })
  canvas(scene, 'heart', 24, 24, (ctx) => {
    ctx.fillStyle = '#f43f5e'
    ctx.beginPath()
    ctx.roundRect(0, 0, 24, 24, 6)
    ctx.fill()
  })
}

export function background(scene, [c1, c2], tint = 0xf9a8d4) {
  const key = `bg${c1}${c2}`
  canvas(scene, key, 64, H, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, c1)
    grad.addColorStop(1, c2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, H)
  })
  scene.add.image(W / 2, H / 2, key).setDisplaySize(W, H).setDepth(-100)
  scene.add
    .particles(0, 0, 'spark', {
      x: { min: 0, max: W },
      y: H + 10,
      speedY: { min: -34, max: -12 },
      speedX: { min: -8, max: 8 },
      lifespan: 11000,
      scale: { start: 0.34, end: 0.08 },
      alpha: { start: 0.3, end: 0 },
      frequency: 300,
      tint,
    })
    .setDepth(-90)
}

export function button(scene, x, y, label, fn, { w = 200, h = 54, size = 22, color = 0xdb2777, textColor = '#fff' } = {}) {
  const box = scene.add.container(x, y)
  const bg = scene.add.graphics()
  const draw = (fill, alpha) => {
    bg.clear()
    bg.fillStyle(fill, alpha).fillRoundedRect(-w / 2, -h / 2, w, h, 14)
    bg.lineStyle(2, 0xffffff, 0.28).strokeRoundedRect(-w / 2, -h / 2, w, h, 14)
  }
  draw(color, 0.94)
  const t = scene.add
    .text(0, 0, label, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color: textColor })
    .setOrigin(0.5)
  box.add([bg, t])
  box.setSize(w, h).setInteractive({ useHandCursor: true })
  box.on('pointerover', () => draw(color, 1))
  box.on('pointerout', () => draw(color, 0.94))
  box.on('pointerdown', () => {
    scene.tweens.add({ targets: box, scale: 0.94, duration: 70, yoyo: true })
    fn()
  })
  box.setLabel = (s) => t.setText(s)
  return box
}

export const text = (scene, x, y, str, size = 22, color = '#fff', extra = {}) =>
  scene.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color, ...extra })

export function fade(scene, to, data) {
  scene.input.enabled = false
  scene.cameras.main.fadeOut(200, 10, 8, 24)
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(to, data))
}

export const hint = (scene, x, y, str, size = 15, color = '#a5b4fc') =>
  text(scene, x, y, str, size, color).setOrigin(0.5)

export { Phaser }
