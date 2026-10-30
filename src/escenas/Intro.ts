import Phaser from 'phaser'
import { cargar } from '../almacen'
import { sonar } from '../sonido'
import { ALTO, ANCHO, COLOR, fondoEstrellas, irA, texto, titulo } from '../ui'

const MURO = 0x1e293b
const COMPUERTA = 0x334155

// Cinemática antes del nivel 1: el piloto corre, sube a la nave y despega por el techo del hangar.
export class Intro extends Phaser.Scene {
  constructor() {
    super('Intro')
  }

  create() {
    this.cameras.main.fadeIn(300, 15, 23, 42)
    fondoEstrellas(this, 3) // se ven al abrirse las compuertas

    this.add.rectangle(ANCHO / 2, 470, ANCHO, 660, MURO)
    this.add.rectangle(50, 70, 100, 140, MURO)
    this.add.rectangle(ANCHO - 50, 70, 100, 140, MURO)
    const izquierda = this.add.rectangle(170, 70, 140, 140, COMPUERTA).setStrokeStyle(3, 0x475569)
    const derecha = this.add.rectangle(310, 70, 140, 140, COMPUERTA).setStrokeStyle(3, 0x475569)
    for (let i = 0; i < 4; i++) this.add.rectangle(60 + i * 120, 170, 44, 8, 0xfacc15)
    this.add.rectangle(ANCHO / 2, 700, ANCHO, 200, COLOR.fondo)
    this.add.rectangle(ANCHO / 2, 600, ANCHO, 8, 0xfacc15)

    const nave = this.add.image(300, 510, cargar('secreto', false) ? 'gato' : 'nave').setScale(3)
    const piloto = this.add.image(-30, 555, 'piloto1').setScale(2)
    const fuego = this.add.particles(0, 0, 'chispa', {
      speedY: { min: 150, max: 350 },
      speedX: { min: -40, max: 40 },
      lifespan: 450,
      scale: { start: 1.6, end: 0 },
      frequency: 25,
      emitting: false,
    })
    fuego.startFollow(nave, 0, 85)

    this.escribir(`Piloto ${cargar('nombre', 'PILOTO')}:\nla flota enemiga se acerca.`)
    texto(this, ANCHO / 2, ALTO - 50, 'Toca para saltar', 26, COLOR.textoSuave)
    this.input.once('pointerdown', () => irA(this, 'Juego'))

    const paso = this.time.addEvent({
      delay: 130,
      loop: true,
      callback: () => piloto.setTexture(piloto.texture.key === 'piloto1' ? 'piloto2' : 'piloto1'),
    })

    this.tweens.chain({
      targets: piloto,
      tweens: [
        { x: 200, duration: 1900, onComplete: () => paso.remove() },
        // sube a la cabina: se aleja y desaparece dentro de la nave
        { x: 300, y: 470, scale: 1, alpha: 0, duration: 650, ease: 'Sine.easeIn', onComplete: () => this.despegar(nave, fuego, izquierda, derecha) },
      ],
    })
  }

  private escribir(mensaje: string) {
    const t = texto(this, ANCHO / 2, 270, '', 32)
    let i = 0
    this.time.addEvent({ delay: 35, repeat: mensaje.length - 1, callback: () => t.setText(mensaje.slice(0, ++i)) })
  }

  private despegar(
    nave: Phaser.GameObjects.Image,
    fuego: Phaser.GameObjects.Particles.ParticleEmitter,
    izquierda: Phaser.GameObjects.Rectangle,
    derecha: Phaser.GameObjects.Rectangle,
  ) {
    sonar('motor')
    fuego.start()
    this.cameras.main.shake(1700, 0.006)
    this.tweens.add({ targets: izquierda, x: 40, duration: 800, ease: 'Sine.easeInOut' })
    this.tweens.add({ targets: derecha, x: ANCHO - 40, duration: 800, ease: 'Sine.easeInOut' })
    const aviso = titulo(this, ANCHO / 2, 360, '¡DESPEGUE!', 26, COLOR.textoVerde).setScale(0)
    this.tweens.add({ targets: aviso, scale: 1, duration: 300, delay: 500, ease: 'Back.easeOut' })
    this.tweens.add({ targets: nave, x: ANCHO / 2, duration: 500 })
    this.tweens.add({
      targets: nave,
      y: -150,
      duration: 1100,
      delay: 700,
      ease: 'Cubic.easeIn',
      onComplete: () => irA(this, 'Juego'),
    })
  }
}
