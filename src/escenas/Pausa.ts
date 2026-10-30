import Phaser from 'phaser'
import { alternarSonido, sonar, sonidoActivo } from '../sonido'
import { ALTO, ANCHO, COLOR, boton, texto, titulo } from '../ui'

// Se lanza encima de Juego (que queda pausado) como capa semitransparente.
export class Pausa extends Phaser.Scene {
  constructor() {
    super('Pausa')
  }

  create() {
    this.add.rectangle(ANCHO / 2, ALTO / 2, ANCHO, ALTO, COLOR.fondo, 0.85).setInteractive()
    titulo(this, ANCHO / 2, 300, 'PAUSA', 32, COLOR.textoVerde)
    boton(this, 430, 'CONTINUAR', () => {
      this.scene.resume('Juego')
      this.scene.stop()
    })
    boton(this, 510, 'MENÚ', () => {
      this.scene.stop('Juego')
      this.scene.start('Home')
    }, COLOR.azul)

    const sonido = texto(this, ANCHO / 2, 590, '', 30, COLOR.textoSuave).setPadding(14)
    const pintar = () => sonido.setText(`Sonido: ${sonidoActivo() ? 'SÍ' : 'NO'}`)
    pintar()
    sonido.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      alternarSonido()
      sonar('clic')
      pintar()
    })
  }
}
