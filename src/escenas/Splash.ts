import Phaser from 'phaser'
import { crearTexturas } from '../texturas'
import { ALTO, ANCHO, COLOR, fondoEstrellas, irA, texto, titulo } from '../ui'

export class Splash extends Phaser.Scene {
  constructor() {
    super('Splash')
  }

  create() {
    crearTexturas(this)
    fondoEstrellas(this)

    const nave = this.add.image(ANCHO / 2, ALTO / 2 - 140, 'nave').setScale(2).setAlpha(0)
    const logo = titulo(this, ANCHO / 2, ALTO / 2, 'ESCUADRÓN\nESTELAR', 34, COLOR.textoVerde).setScale(0)
    const sub = texto(this, ANCHO / 2, ALTO / 2 + 90, 'UPB · Aplicaciones Móviles', 28, COLOR.textoSuave).setAlpha(0)

    this.tweens.add({ targets: logo, scale: 1, duration: 700, ease: 'Back.easeOut' })
    this.tweens.add({ targets: nave, alpha: 1, y: nave.y + 20, duration: 900, delay: 300, ease: 'Sine.easeOut' })
    this.tweens.add({ targets: sub, alpha: 1, duration: 500, delay: 700 })

    // Barra de carga decorativa
    const barra = this.add.rectangle(ANCHO / 2 - 120, ALTO - 140, 0, 12, COLOR.verde).setOrigin(0, 0.5)
    this.add.rectangle(ANCHO / 2, ALTO - 140, 248, 20).setStrokeStyle(3, 0xffffff)
    this.tweens.add({ targets: barra, width: 240, duration: 1800, ease: 'Sine.easeInOut' })

    this.time.delayedCall(2300, () => irA(this, 'Home'))
    this.input.once('pointerdown', () => irA(this, 'Home'))
  }
}
