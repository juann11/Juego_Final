import Phaser from 'phaser'
import { cargar, guardar } from '../almacen'
import { MAX_NOMBRE, limpiarNombre } from '../logica/nombre'
import { DIFICULTADES, type Dificultad } from '../logica/partida'
import type { Registro } from '../logica/puntaje'
import { alternarSonido, sonar, sonidoActivo } from '../sonido'
import { pedirTexto } from '../editorTexto'
import { ANCHO, COLOR, boton, fondoEstrellas, irA, texto, titulo } from '../ui'

const TOQUES_SECRETO = 5
const ORDEN_DIFICULTAD: Dificultad[] = ['facil', 'normal', 'dificil']
const COLOR_DIFICULTAD: Record<Dificultad, string> = { facil: COLOR.textoVerde, normal: '#facc15', dificil: COLOR.textoRojo }

export class Home extends Phaser.Scene {
  constructor() {
    super('Home')
  }

  create() {
    this.cameras.main.fadeIn(220, 15, 23, 42)
    fondoEstrellas(this)

    const secreto = cargar('secreto', false)
    const nave = this.add.image(ANCHO / 2, 300, secreto ? 'gato' : 'nave').setScale(2.5)
    this.tweens.add({ targets: nave, y: 320, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    const logo = titulo(this, ANCHO / 2, 140, 'ESCUADRÓN\nESTELAR', 32, COLOR.textoVerde)
    this.tweens.add({ targets: logo, scale: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    // Easter egg: tocar el título 5 veces activa/desactiva el gato espacial.
    let toques = 0
    logo.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      toques++
      this.tweens.add({ targets: logo, angle: { from: -6, to: 0 }, duration: 150 })
      if (toques < TOQUES_SECRETO) return
      toques = 0
      const activo = !cargar('secreto', false)
      guardar('secreto', activo)
      nave.setTexture(activo ? 'gato' : 'nave')
      sonar('secreto')
      this.cameras.main.flash(300, 250, 204, 21)
      const aviso = texto(this, ANCHO / 2, 503, activo ? '¡MODO GATO ESPACIAL!' : 'Modo normal', 30, '#facc15')
      this.tweens.add({ targets: aviso, alpha: 0, y: 493, delay: 1200, duration: 600, onComplete: () => aviso.destroy() })
    })

    const top = cargar<Registro[]>('top', [])
    texto(this, ANCHO / 2, 420, `Mejor puntaje: ${top[0]?.puntos ?? 0}`, 30, COLOR.textoSuave)

    const piloto = texto(this, ANCHO / 2, 460, '', 30)
    const pintarPiloto = () => piloto.setText(`Piloto: ${cargar('nombre', 'PILOTO')}  ✎ cambiar`)
    pintarPiloto()
    piloto.setPadding(12).setInteractive({ useHandCursor: true }).on('pointerup', async () => {
      sonar('clic')
      const nombre = await pedirTexto('¿Cómo te llamas, piloto?', cargar('nombre', 'PILOTO'), MAX_NOMBRE)
      const limpio = nombre === null ? null : limpiarNombre(nombre)
      if (limpio) guardar('nombre', limpio)
      if (piloto.active) pintarPiloto() // por si la escena cambió mientras el editor estaba abierto
    })

    // Selector de dificultad: cada toque pasa a la siguiente y se guarda
    const dificultad = texto(this, ANCHO / 2, 505, '', 30)
    const pintarDificultad = () => {
      const d = cargar<Dificultad>('dificultad', 'normal')
      const actual = d in DIFICULTADES ? d : 'normal'
      dificultad.setText(`Dificultad: ‹ ${DIFICULTADES[actual].nombre} ›`).setColor(COLOR_DIFICULTAD[actual])
      return actual
    }
    pintarDificultad()
    dificultad.setPadding(12).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      const actual = pintarDificultad()
      guardar('dificultad', ORDEN_DIFICULTAD[(ORDEN_DIFICULTAD.indexOf(actual) + 1) % ORDEN_DIFICULTAD.length])
      pintarDificultad()
      sonar('clic')
      this.tweens.add({ targets: dificultad, scale: { from: 1.15, to: 1 }, duration: 150 })
    })

    boton(this, 572, 'JUGAR', () => irA(this, 'Juego'))
    boton(this, 647, 'PUNTAJES', () => irA(this, 'Puntajes'), COLOR.azul)
    boton(this, 722, 'CRÉDITOS', () => irA(this, 'Creditos'), COLOR.azul)

    const sonido = texto(this, ANCHO - 16, 24, '', 26, COLOR.textoSuave).setOrigin(1, 0)
    const pintarSonido = () => sonido.setText(`Sonido: ${sonidoActivo() ? 'SÍ' : 'NO'}`)
    pintarSonido()
    sonido.setPadding(10).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      alternarSonido()
      sonar('clic')
      pintarSonido()
    })
  }
}
