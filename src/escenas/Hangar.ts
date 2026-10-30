import Phaser from 'phaser'
import { CAPITULOS, CAPITULO_JEFE } from '../logica/historia'
import { MEJORAS, NIVELES, VIDAS_MAX, comprar, costoMejora, type TipoMejora } from '../logica/partida'
import { sonar } from '../sonido'
import { ALTO, ANCHO, COLOR, boton, fondoEstrellas, texto, titulo } from '../ui'
import type { Juego } from './Juego'

const ICONO: Record<TipoMejora, string> = {
  potencia: 'bala',
  cadencia: 'pu-triple',
  alas: 'ala',
  iman: 'iman',
  vida: 'corazon',
  escudo: 'pu-escudo',
}
const ORDEN: TipoMejora[] = ['potencia', 'cadencia', 'alas', 'iman', 'vida', 'escudo']

// Tienda entre niveles: se lanza encima de Juego (pausado) y compra directamente sobre su partida.
export class Hangar extends Phaser.Scene {
  private refrescar = () => {}

  constructor() {
    super('Hangar')
  }

  create() {
    const juego = this.scene.get('Juego') as Juego
    fondoEstrellas(this)
    this.add.rectangle(ANCHO / 2, ALTO / 2, ANCHO, ALTO, COLOR.fondo, 0.6)
    this.cameras.main.fadeIn(250, 15, 23, 42)

    const p = juego.partida
    const ultimo = p.nivel >= NIVELES.length
    titulo(this, ANCHO / 2, 60, 'HANGAR', 26, COLOR.textoVerde)
    texto(this, ANCHO / 2, 100, ultimo ? '¡Prepárate para el jefe final!' : `Nivel ${p.nivel} superado · mejora tu nave`, 26, COLOR.textoSuave)
    this.add.image(ANCHO / 2 - 50, 145, 'moneda').setScale(2.2)
    const saldo = titulo(this, ANCHO / 2 - 14, 147, '', 20, '#facc15').setOrigin(0, 0.5)

    const tarjetas = ORDEN.map((tipo, i) => this.tarjeta(juego, tipo, i % 2 ? 360 : 120, 255 + Math.floor(i / 2) * 150))
    this.refrescar = () => {
      saldo.setText(`${juego.partida.monedas}`)
      tarjetas.forEach((t) => t())
    }
    this.refrescar()

    boton(this, 728, ultimo ? '¡AL JEFE!' : 'CONTINUAR', () => {
      // Juego sigue pausado detrás; se reanuda al acabar la escena de historia
      this.scene.start('Historia', {
        capitulo: ultimo ? CAPITULO_JEFE : CAPITULOS[p.nivel],
        alTerminar: (historia: Phaser.Scene) => {
          juego.continuarTrasHangar()
          historia.scene.resume('Juego')
          historia.scene.stop()
        },
      })
    }, ultimo ? COLOR.rojo : COLOR.verde)
  }

  // Devuelve una función que repinta la tarjeta según la partida actual.
  private tarjeta(juego: Juego, tipo: TipoMejora, x: number, y: number) {
    const { nombre, descripcion, costos } = MEJORAS[tipo]
    const fondo = this.add.rectangle(0, 0, 220, 136, COLOR.tarjeta).setStrokeStyle(3, 0x334155)
    const icono = this.add.image(-74, -26, ICONO[tipo]).setScale(tipo === 'potencia' ? 2.6 : 2)
    const rotulo = titulo(this, 16, -42, nombre, 11).setOrigin(0.5)
    const nivel = texto(this, 16, -14, '', 24, COLOR.textoSuave)
    const desc = texto(this, 0, 18, descripcion, 22)
    const moneda = this.add.image(-30, 48, 'moneda').setScale(1.3)
    const precio = titulo(this, -8, 50, '', 13).setOrigin(0, 0.5)
    const caja = this.add.container(x, y, [fondo, icono, rotulo, nivel, desc, moneda, precio])

    fondo.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      const antes = juego.partida
      juego.partida = comprar(antes, tipo)
      if (juego.partida === antes) {
        sonar('error')
        this.tweens.add({ targets: caja, x: { from: x - 8, to: x }, duration: 200, ease: 'Bounce.easeOut' })
        return
      }
      sonar('powerup')
      fondo.setFillStyle(0x22c55e)
      this.time.delayedCall(120, () => fondo.setFillStyle(COLOR.tarjeta))
      this.tweens.add({ targets: caja, scale: { from: 1.08, to: 1 }, duration: 200, ease: 'Back.easeOut' })
      this.refrescar()
    })

    return () => {
      const p = juego.partida
      const costo = costoMejora(p, tipo)
      if (tipo === 'vida') nivel.setText(`Vidas ${p.vidas}/${VIDAS_MAX}`)
      else if (tipo === 'escudo') nivel.setText(p.escudo ? 'Equipado' : 'Sin escudo')
      else nivel.setText(`Nv ${p.mejoras[tipo]}/${costos.length}`)

      const agotado = costo === null
      moneda.setVisible(!agotado)
      precio
        .setText(agotado ? (tipo === 'vida' ? 'LLENO' : tipo === 'escudo' ? 'ACTIVO' : 'MÁXIMO') : `${costo}`)
        .setX(agotado ? -40 : -8)
        .setColor(agotado ? COLOR.textoVerde : p.monedas >= costo ? '#facc15' : COLOR.textoRojo)
      caja.setAlpha(!agotado && p.monedas < costo ? 0.55 : 1)
      fondo.setStrokeStyle(3, !agotado && p.monedas >= costo ? COLOR.verde : 0x334155)
    }
  }
}
