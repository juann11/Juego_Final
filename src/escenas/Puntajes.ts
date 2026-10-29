import Phaser from 'phaser'
import { cargar } from '../almacen'
import { DIFICULTADES } from '../logica/partida'
import type { Registro } from '../logica/puntaje'
import { ANCHO, COLOR, boton, fondoEstrellas, irA, texto, titulo } from '../ui'

interface Datos {
  resultado?: Registro & { gano: boolean; nivel: number; derribados: number }
}

export class Puntajes extends Phaser.Scene {
  constructor() {
    super('Puntajes')
  }

  create(datos: Datos) {
    this.cameras.main.fadeIn(220, 15, 23, 42)
    fondoEstrellas(this)
    const r = datos.resultado
    let y = 90

    if (r) {
      titulo(this, ANCHO / 2, y, r.gano ? '¡MISIÓN\nCUMPLIDA!' : 'GAME OVER', 26, r.gano ? COLOR.textoVerde : COLOR.textoRojo)
      const puntos = titulo(this, ANCHO / 2, y + 100, '0', 36)
      // Contador animado del puntaje
      this.tweens.addCounter({
        from: 0,
        to: r.puntos,
        duration: 900,
        onUpdate: (tw) => puntos.setText(`${Math.round(tw.getValue() ?? 0)}`),
      })
      const logro = r.gano ? '¡Derrotaste al jefe!' : `Llegaste al nivel ${r.nivel}`
      texto(this, ANCHO / 2, y + 150, `${logro} · ${r.derribados} derribos`, 26, COLOR.textoSuave)
      y += 220
    }

    titulo(this, ANCHO / 2, y, 'TOP 5', 20, COLOR.textoVerde)
    const top = cargar<Registro[]>('top', [])
    if (top.length === 0) texto(this, ANCHO / 2, y + 60, 'Aún no hay puntajes.\n¡Sé el primero!', 30, COLOR.textoSuave)

    // Resalta la partida recién jugada (la primera que coincide)
    const nueva = r ? top.findIndex((t) => t.puntos === r.puntos && t.nombre === r.nombre && t.fecha === r.fecha) : -1
    top.forEach((t, i) => {
      const dif = t.dificultad ? DIFICULTADES[t.dificultad]?.nombre.slice(0, 3) ?? '' : ''
      const fila = texto(this, ANCHO / 2, y + 56 + i * 42, `${i + 1}. ${t.nombre.padEnd(10, ' ')} ${String(t.puntos).padStart(6, ' ')} ${dif.padEnd(3, ' ')}`, 32,
        i === nueva ? '#facc15' : COLOR.texto).setAlpha(0).setX(ANCHO / 2 + 40)
      this.tweens.add({ targets: fila, alpha: 1, x: ANCHO / 2, delay: 150 * i, duration: 300, ease: 'Sine.easeOut' })
    })

    boton(this, 640, r ? 'OTRA VEZ' : 'JUGAR', () => irA(this, 'Juego'))
    boton(this, 720, 'MENÚ', () => irA(this, 'Home'), COLOR.azul)
  }
}
