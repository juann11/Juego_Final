import Phaser from 'phaser'
import { cargar } from '../almacen'
import { TEXTOS_FINAL, conNombre } from '../logica/historia'
import { sonar } from '../sonido'
import { ALTO, ANCHO, COLOR, irA, texto, titulo } from '../ui'
import { cielo } from './paisajes'

const CIELO = [0x1e1b4b, 0x312e81, 0x6b21a8, 0xbe185d, 0xf43f5e, 0xf97316, 0xfbbf24]
const LUZ = 0xfde68a

// Cinemática después de los créditos: el piloto baja de la nave al atardecer y vuelve a casa.
export class Final extends Phaser.Scene {
  private resultado?: object
  private listo = false

  constructor() {
    super('Final')
  }

  create(datos: { resultado?: object }) {
    this.resultado = datos.resultado
    this.listo = false
    this.cameras.main.fadeIn(1800, 0, 0, 0)
    sonar('final')

    cielo(this, CIELO, 0, 80)
    const sol = this.add.circle(150, 470, 70, 0xfef3c7)
    this.tweens.add({ targets: sol, y: 640, duration: 17000, ease: 'Sine.easeIn' })
    this.crearEstrellas()
    this.crearColinas()
    const { puerta, ventana } = this.crearCasa()

    this.add.image(90, 590, this.registry.get('nave') ?? 'nave').setScale(1.1).setTint(0x9a7b6a)
    const piloto = this.add.image(120, 625, 'piloto1').setScale(1.2)
    const familiar = this.add.image(372, 610, 'familiar').setScale(1.2).setAlpha(0)
    const perro = this.add.image(372, 632, 'perro').setScale(0.8).setAlpha(0)

    const paso = this.time.addEvent({
      delay: 240,
      loop: true,
      callback: () => piloto.setTexture(piloto.texture.key === 'piloto1' ? 'piloto2' : 'piloto1'),
    })
    this.narrar()
    this.tweens.add({ targets: piloto, x: 350, duration: 12500, ease: 'Linear' })

    // A mitad de camino se abre la puerta: alguien lo esperaba y el perro sale corriendo
    this.time.delayedCall(6000, () => {
      puerta.setFillStyle(LUZ)
      this.tweens.add({ targets: [familiar, perro], alpha: 1, duration: 600 })
      this.tweens.add({ targets: perro, x: 220, flipX: true, duration: 1700, ease: 'Sine.easeOut' })
      this.tweens.add({ targets: perro, y: 622, duration: 130, yoyo: true, repeat: 12 })
    })
    this.time.delayedCall(8000, () => this.tweens.add({ targets: perro, x: 330, duration: 4500 }))

    this.time.delayedCall(12800, () => {
      paso.remove()
      this.tweens.add({ targets: [piloto, familiar, perro], alpha: 0, duration: 900 })
      ventana.forEach((v) => v.setFillStyle(LUZ))
    })
    this.time.delayedCall(14600, () => this.mostrarFin())
  }

  private crearEstrellas() {
    for (let i = 0; i < 40; i++) {
      const s = this.add.rectangle(Phaser.Math.Between(0, ANCHO), Phaser.Math.Between(10, 280), 3, 3, 0xffffff).setAlpha(0)
      this.tweens.add({ targets: s, alpha: Phaser.Math.FloatBetween(0.4, 1), duration: 2500, delay: Phaser.Math.Between(4000, 13000) })
    }
  }

  private crearColinas() {
    this.add.circle(60, 840, 300, 0x3b0764)
    this.add.circle(420, 870, 340, 0x2e1065)
    this.add.rectangle(ANCHO / 2, 720, ANCHO, 200, 0x1e1033)
    this.add.rectangle(ANCHO / 2, 640, ANCHO, 16, 0x2e1065) // camino
  }

  private crearCasa() {
    this.add.rectangle(385, 570, 130, 130, 0x292524)
    this.add.triangle(385, 505, 0, 60, 90, -10, 180, 60, 0x7f1d1d).setOrigin(0.5, 0.5)
    const puerta = this.add.rectangle(372, 600, 34, 70, 0x1c1917)
    const ventana = [this.add.rectangle(342, 555, 28, 28, 0x57534e), this.add.rectangle(425, 555, 28, 28, LUZ)]
    return { puerta, ventana }
  }

  private narrar() {
    const nombre = cargar('nombre', 'PILOTO')
    TEXTOS_FINAL.forEach((linea, i) => {
      const t = texto(this, ANCHO / 2, 110, conNombre(linea, nombre), 30).setWordWrapWidth(420).setAlpha(0)
      this.tweens.chain({
        targets: t,
        tweens: [
          { alpha: 1, duration: 800, delay: 1200 + i * 3200 },
          { alpha: 0, duration: 800, delay: 1400 },
        ],
      })
    })
  }

  private mostrarFin() {
    const cierre = this.add.rectangle(ANCHO / 2, ALTO / 2, ANCHO, ALTO, 0x000000).setAlpha(0)
    this.tweens.add({ targets: cierre, alpha: 0.7, duration: 1400 })
    const fin = titulo(this, ANCHO / 2, ALTO / 2 - 30, 'FIN', 44, '#fde68a').setAlpha(0)
    const gracias = texto(this, ANCHO / 2, ALTO / 2 + 40, `Gracias por jugar, ${cargar('nombre', 'PILOTO')}`, 30).setAlpha(0)
    const seguir = texto(this, ANCHO / 2, ALTO - 60, 'Toca para continuar', 26, COLOR.textoSuave).setAlpha(0)
    this.tweens.add({
      targets: [fin, gracias, seguir],
      alpha: 1,
      duration: 1400,
      delay: 900,
      onComplete: () => {
        this.listo = true
      },
    })
    this.input.on('pointerdown', () => this.listo && irA(this, 'Puntajes', { resultado: this.resultado }))
  }
}
