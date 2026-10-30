import Phaser from 'phaser'
import { cargar } from '../almacen'
import { conNombre, type Capitulo, type Hablante } from '../logica/historia'
import { sonar } from '../sonido'
import { ALTO, ANCHO, COLOR, fondoEstrellas, texto, titulo } from '../ui'
import { PAISAJES } from './paisajes'

interface Datos {
  capitulo: Capitulo
  alTerminar: (escena: Phaser.Scene) => void
}

const RETRATO: Record<Hablante, { textura: string; escala: number }> = {
  vega: { textura: 'vega', escala: 2.6 },
  piloto: { textura: 'piloto2', escala: 2.4 },
  reina: { textura: 'jefe', escala: 0.9 },
}

// Escena entre niveles: paisaje del capítulo, nave en vuelo y diálogos por radio.
export class Historia extends Phaser.Scene {
  private datos!: Datos
  private indice = 0
  private saliendo = false
  private completo = ''
  private escritura?: Phaser.Time.TimerEvent
  private cuerpo!: Phaser.GameObjects.Text
  private rotulo!: Phaser.GameObjects.Text
  private retrato!: Phaser.GameObjects.Image

  constructor() {
    super('Historia')
  }

  create(datos: Datos) {
    this.datos = datos
    this.indice = 0
    this.saliendo = false
    const { capitulo } = datos
    this.cameras.main.fadeIn(350, 15, 23, 42)
    fondoEstrellas(this)
    this.cameras.main.setBackgroundColor(capitulo.fondo)

    this.crearPaisaje(capitulo)
    titulo(this, ANCHO / 2, 70, capitulo.etiqueta, 13, COLOR.textoVerde)
    titulo(this, ANCHO / 2, 110, capitulo.titulo, 20)

    this.add.rectangle(ANCHO / 2, 640, 450, 210, COLOR.tarjeta, 0.95).setStrokeStyle(3, 0xffffff)
    this.retrato = this.add.image(84, 620, 'vega')
    this.rotulo = titulo(this, 150, 562, '', 12, '#facc15').setOrigin(0, 0.5)
    this.cuerpo = texto(this, 150, 584, '', 27).setOrigin(0, 0).setAlign('left').setWordWrapWidth(300)
    texto(this, ANCHO / 2, ALTO - 30, 'Toca para continuar', 24, COLOR.textoSuave)

    texto(this, ANCHO - 20, 20, 'Saltar »', 26, COLOR.textoSuave)
      .setOrigin(1, 0)
      .setPadding(10)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation() // que no cuente además como toque para avanzar
        this.terminar()
      })
    // al soltar y no al apoyar: si no, ese mismo toque le cae al juego reanudado (al botón de pausa, por ejemplo)
    this.input.on('pointerup', () => this.avanzar())
    this.mostrarLinea()
  }

  private crearPaisaje({ paisaje }: Capitulo) {
    PAISAJES[paisaje](this)
    const textura = this.registry.get('nave') ?? 'nave'
    const nave = this.add.image(-60, 370, textura).setAngle(90).setScale(1.3)
    this.tweens.add({ targets: nave, x: 170, duration: 1800, ease: 'Sine.easeOut' })
    this.tweens.add({ targets: nave, y: 385, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  }

  private mostrarLinea() {
    const { quien, texto: linea } = this.datos.capitulo.lineas[this.indice]
    const nombre = cargar('nombre', 'PILOTO')
    const { textura, escala } = RETRATO[quien]
    this.retrato.setTexture(textura).setScale(escala)
    this.rotulo.setText(quien === 'vega' ? 'CMDTE. VEGA' : quien === 'reina' ? 'LA REINA' : nombre)
    this.completo = conNombre(linea, nombre)
    this.cuerpo.setText('')
    let i = 0
    this.escritura = this.time.addEvent({
      delay: 22,
      repeat: this.completo.length - 1,
      callback: () => this.cuerpo.setText(this.completo.slice(0, ++i)),
    })
  }

  // Primer toque: completa la línea que se está escribiendo. Segundo toque: pasa a la siguiente.
  private avanzar() {
    if (this.escritura && this.escritura.getOverallProgress() < 1) {
      this.escritura.remove()
      this.cuerpo.setText(this.completo)
      return
    }
    sonar('clic')
    if (++this.indice >= this.datos.capitulo.lineas.length) return this.terminar()
    this.mostrarLinea()
  }

  private terminar() {
    if (this.saliendo) return
    this.saliendo = true
    this.datos.alTerminar(this)
  }
}
