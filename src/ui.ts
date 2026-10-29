import Phaser from 'phaser'
import { sonar } from './sonido'

// Paleta "Pixel Art" (ui-ux-pro-max): fondo oscuro, rojo = peligro, azul = jugador, verde = acción/puntaje.
export const COLOR = {
  fondo: 0x0f172a,
  tarjeta: 0x192134,
  rojo: 0xdc2626,
  azul: 0x2563eb,
  verde: 0x22c55e,
  texto: '#ffffff',
  textoSuave: '#94a3b8',
  textoVerde: '#22c55e',
  textoRojo: '#f87171',
}

export const FUENTE_TITULO = '"Press Start 2P"'
export const FUENTE_TEXTO = 'VT323'

export const ANCHO = 480
export const ALTO = 800

export function titulo(escena: Phaser.Scene, x: number, y: number, texto: string, tam = 20, color = COLOR.texto) {
  return escena.add
    .text(x, y, texto, { fontFamily: FUENTE_TITULO, fontSize: `${tam}px`, color, align: 'center', lineSpacing: 12 })
    .setOrigin(0.5)
}

export function texto(escena: Phaser.Scene, x: number, y: number, contenido: string, tam = 28, color = COLOR.texto) {
  return escena.add
    .text(x, y, contenido, { fontFamily: FUENTE_TEXTO, fontSize: `${tam}px`, color, align: 'center' })
    .setOrigin(0.5)
}

// Botón grande (>= 44px de alto para el dedo) con animación al presionar y sonido.
export function boton(escena: Phaser.Scene, y: number, etiqueta: string, alPulsar: () => void, color = COLOR.verde) {
  const fondo = escena.add.rectangle(0, 0, 300, 64, color).setStrokeStyle(4, 0xffffff)
  // texto oscuro sobre verde y blanco sobre azul: ambos superan contraste 4.5:1
  const rotulo = titulo(escena, 0, 2, etiqueta, 16, color === COLOR.verde ? '#0f172a' : COLOR.texto)
  const caja = escena.add.container(ANCHO / 2, y, [fondo, rotulo])
  fondo.setInteractive({ useHandCursor: true })
  fondo.on('pointerdown', () => escena.tweens.add({ targets: caja, scale: 0.92, duration: 60 }))
  fondo.on('pointerout', () => caja.setScale(1))
  fondo.on('pointerup', () => {
    escena.tweens.add({ targets: caja, scale: 1, duration: 120, ease: 'Back.easeOut' })
    sonar('clic')
    alPulsar()
  })
  return caja
}

// Transición con fundido a negro entre escenas.
export function irA(escena: Phaser.Scene, clave: string, datos?: object) {
  const camara = escena.cameras.main
  if (camara.fadeEffect.isRunning) return
  camara.fadeOut(220, 15, 23, 42)
  camara.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => escena.scene.start(clave, datos))
}

// Estrellas que caen de fondo; `velocidad` acelera la sensación de avance en el juego.
export function fondoEstrellas(escena: Phaser.Scene, velocidad = 1) {
  escena.cameras.main.setBackgroundColor(COLOR.fondo)
  const emisor = escena.add.particles(0, 0, 'estrella', {
    x: { min: 0, max: ANCHO },
    y: -10,
    lifespan: 12000 / velocidad,
    speedY: { min: 30 * velocidad, max: 90 * velocidad },
    scale: { min: 0.5, max: 1.2 },
    alpha: { min: 0.3, max: 1 },
    frequency: 90,
  })
  emisor.fastForward(10000 / velocidad)
  return emisor
}
