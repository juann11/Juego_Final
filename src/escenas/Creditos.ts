import Phaser from 'phaser'
import { ANCHO, COLOR, boton, fondoEstrellas, irA, texto, titulo } from '../ui'

const EQUIPO = ['Juan José Ospina', 'JJ']

const SECCIONES: [string, string[]][] = [
  ['EQUIPO', EQUIPO],
  ['CURSO', ['Aplicaciones Móviles · UPB']],
  ['HECHO CON', ['Phaser 3 · TypeScript · Capacitor']],
  ['ARTE Y SONIDO', ['Pixel art y chiptune por código', 'Fuentes: Press Start 2P y VT323']],
  ['USO DE IA', ['Claude Code ayudó a programar;', 'el equipo lo revisó y lo entiende']],
]

export class Creditos extends Phaser.Scene {
  constructor() {
    super('Creditos')
  }

  // alTerminar: después de ganar los créditos continúan a la escena final en vez de volver al menú
  create(datos: { alTerminar?: (escena: Phaser.Scene) => void }) {
    this.cameras.main.fadeIn(220, 15, 23, 42)
    fondoEstrellas(this)
    titulo(this, ANCHO / 2, 60, 'CRÉDITOS', 24, COLOR.textoVerde)

    let y = 120
    let retraso = 0
    for (const [cabecera, lineas] of SECCIONES) {
      const bloque = [titulo(this, ANCHO / 2, y, cabecera, 12, '#facc15')]
      lineas.forEach((l, i) => bloque.push(texto(this, ANCHO / 2, y + 28 + i * 26, l, 24)))
      bloque.forEach((o) => o.setAlpha(0))
      this.tweens.add({ targets: bloque, alpha: 1, duration: 400, delay: retraso })
      y += 28 + lineas.length * 26 + 22
      retraso += 180
    }

    texto(this, ANCHO / 2, 640, 'Pista: el título guarda un secreto...', 24, COLOR.textoSuave)
    const { alTerminar } = datos
    boton(this, 720, alTerminar ? 'CONTINUAR' : 'VOLVER', () => (alTerminar ? alTerminar(this) : irA(this, 'Home')), COLOR.azul)
  }
}
