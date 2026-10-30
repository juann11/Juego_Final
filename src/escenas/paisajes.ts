import Phaser from 'phaser'
import type { Paisaje } from '../logica/historia'
import { ANCHO } from '../ui'

// Decorado animado de cada capítulo: ocupa de y=140 a y=530, sobre el cuadro de diálogo.
type Escena = Phaser.Scene

const { Between, FloatBetween } = Phaser.Math

// Algo que cruza la pantalla de derecha a izquierda en bucle
function cruzar(e: Escena, objeto: Phaser.GameObjects.Components.Transform, duracion: number) {
  e.tweens.add({ targets: objeto, x: -80, duration: duracion, repeat: -1, delay: Between(0, 3000) })
}

// Franjas horizontales que simulan un degradado en pixel art
export function cielo(e: Escena, colores: number[], y: number, alto: number) {
  colores.forEach((c, i) => e.add.rectangle(ANCHO / 2, y + (i + 0.5) * alto, ANCHO, alto + 1, c))
}

function cristal(e: Escena) {
  for (let i = 0; i < 16; i++) {
    const t = FloatBetween(0.5, 1.8)
    const c = e.add.polygon(Between(0, ANCHO + 80), Between(170, 500), [0, -22, 15, 0, 0, 26, -15, 0], i % 2 ? 0x2dd4bf : 0x99f6e4)
    c.setScale(t).setAlpha(0.35 + t / 3).setRotation(FloatBetween(0, 3))
    e.tweens.add({ targets: c, rotation: '+=6.28', duration: 6000 / t, repeat: -1 })
    cruzar(e, c, 9000 / t)
  }
}

function nebulosa(e: Escena) {
  for (let i = 0; i < 12; i++) {
    const n = e.add.circle(Between(0, ANCHO), Between(170, 500), Between(60, 130), i % 3 ? 0xf43f5e : 0xa855f7, 0.13)
    e.tweens.add({ targets: n, scale: 1.3, x: `+=${Between(-40, 40)}`, duration: Between(3000, 6000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  }
  const rayo = e.add.graphics()
  e.time.addEvent({
    delay: 1500,
    loop: true,
    callback: () => {
      let x = Between(60, ANCHO - 60)
      let y = 150
      rayo.clear().lineStyle(4, 0xfecdd3)
      rayo.beginPath().moveTo(x, y)
      while (y < 500) rayo.lineTo((x += Between(-40, 40)), (y += Between(30, 70)))
      rayo.strokePath()
      e.time.delayedCall(110, () => rayo.clear())
      e.cameras.main.flash(90, 120, 30, 60)
    },
  })
  for (let i = 0; i < 3; i++) cruzar(e, e.add.image(ANCHO + 80, 200 + i * 90, 'kamikaze').setAngle(90).setScale(1.2), 5000 + i * 1200)
}

function prision(e: Escena) {
  e.add.circle(ANCHO / 2, 930, 490, 0x4c4a7a)
  for (const [x, y, r] of [[80, 490, 18], [210, 462, 12], [420, 480, 22]]) e.add.circle(x, y, r, 0x3b3a63)
  // cúpula con barrotes
  e.add.circle(250, 475, 72, 0x312e81).setStrokeStyle(4, 0xa78bfa)
  for (let i = 0; i < 6; i++) e.add.rectangle(195 + i * 22, 460, 4, 80, 0xc4b5fd)
  for (const x of [120, 380]) {
    e.add.rectangle(x, 400, 16, 130, 0x1e1b4b)
    const luz = e.add.triangle(x, 340, 0, 0, -70, 210, 70, 210, 0xfef08a, 0.22).setOrigin(0.5, 0)
    luz.setAngle(x < 200 ? -30 : 30)
    e.tweens.add({ targets: luz, angle: x < 200 ? 30 : -30, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    const sirena = e.add.circle(x, 336, 8, 0xdc2626)
    e.tweens.add({ targets: sirena, alpha: 0.15, duration: 300, yoyo: true, repeat: -1 })
  }
}

function astillero(e: Escena) {
  e.add.rectangle(ANCHO / 2, 225, ANCHO, 40, 0x292524)
  for (let x = 20; x < ANCHO; x += 92) e.add.rectangle(x, 340, 14, 350, 0x292524)
  e.add.rectangle(ANCHO / 2, 505, ANCHO, 26, 0x44403c)
  for (const [x, y] of [[120, 310], [350, 400]]) {
    e.add.rectangle(x, (y + 240) / 2, 6, y - 240, 0x57534e)
    const barco = e.add.image(x, y + 40, 'acorazado').setScale(2).setTint(0x78716c)
    e.tweens.add({ targets: barco, y: y + 48, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    e.add.particles(x + 40, y + 30, 'chispa', { speed: { min: 40, max: 160 }, gravityY: 300, lifespan: 500, scale: { start: 0.8, end: 0 }, frequency: 90 })
  }
}

function puerta(e: Escena) {
  const [cx, cy] = [330, 330]
  const nucleo = e.add.circle(cx, cy, 95, 0xfacc15, 0.35)
  e.tweens.add({ targets: nucleo, scale: 1.2, alpha: 0.65, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  e.add.circle(cx, cy, 130).setStrokeStyle(18, 0x78350f)
  e.add.circle(cx, cy, 112).setStrokeStyle(4, 0xfacc15)
  const orbes = [0, 1, 2, 3].map(() => e.add.image(cx, cy, 'orbe').setScale(0.9))
  e.tweens.addCounter({
    from: 0,
    to: 6.283,
    duration: 7000,
    repeat: -1,
    onUpdate: (t) => orbes.forEach((o, i) => {
      const a = (t.getValue() ?? 0) + (i * Math.PI) / 2
      o.setPosition(cx + Math.cos(a) * 165, cy + Math.sin(a) * 165).setRotation(a)
    }),
  })
}

function reina(e: Escena) {
  const nave = e.add.image(ANCHO / 2, 320, 'jefe').setScale(3).setTint(0x7f1d1d)
  e.tweens.add({ targets: nave, scale: 5, duration: 12000, ease: 'Sine.easeIn' })
  for (let i = 0; i < 14; i++) {
    const d = e.add.image(Between(0, ANCHO), Between(160, 510), 'dron').setScale(FloatBetween(0.3, 0.7))
    e.tweens.add({ targets: d, x: `+=${Between(-60, 60)}`, y: `+=${Between(-30, 30)}`, duration: Between(900, 1800), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  }
  for (const y of [146, 524]) {
    const alarma = e.add.rectangle(ANCHO / 2, y, ANCHO, 10, 0xdc2626)
    e.tweens.add({ targets: alarma, alpha: 0.1, duration: 350, yoyo: true, repeat: -1 })
  }
}

function amanecer(e: Escena) {
  cielo(e, [0x1e1b4b, 0x4c1d95, 0xbe185d, 0xf97316, 0xfacc15], 150, 60)
  const sol = e.add.circle(ANCHO / 2, 500, 60, 0xfef9c3)
  e.tweens.add({ targets: sol, y: 330, duration: 11000, ease: 'Sine.easeOut' })
  e.add.circle(ANCHO / 2, 1010, 560, 0x0f172a) // horizonte curvo
  for (const [x, ancho, alto] of [[110, 30, 80], [160, 44, 120], [230, 26, 60], [330, 50, 100], [385, 24, 70]]) {
    e.add.rectangle(x, 500 - alto / 2, ancho, alto, 0x1e293b)
    const luz = e.add.rectangle(x, 500 - alto + 12, 8, 8, 0xfacc15)
    e.tweens.add({ targets: luz, alpha: 0.2, duration: Between(600, 1400), yoyo: true, repeat: -1 })
  }
}

export const PAISAJES: Record<Paisaje, (e: Escena) => void> = {
  base: () => {}, // el capítulo 1 usa la escena Intro
  cristal,
  nebulosa,
  prision,
  astillero,
  puerta,
  reina,
  amanecer,
}
