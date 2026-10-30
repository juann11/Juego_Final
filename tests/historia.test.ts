import { describe, expect, it } from 'vitest'
import { CAPITULOS, CAPITULO_JEFE, EPILOGO, TEXTOS_FINAL, conNombre } from '../src/logica/historia'
import { NIVELES } from '../src/logica/partida'

describe('historia', () => {
  it('hay un capítulo por nivel', () => {
    expect(CAPITULOS).toHaveLength(NIVELES.length)
  })

  it('cada capítulo tiene título corto y diálogos que caben en la caja', () => {
    // el capítulo 1 no lleva diálogos: su historia es la escena Intro
    expect(CAPITULOS[0].lineas).toHaveLength(0)
    for (const c of [...CAPITULOS.slice(1), CAPITULO_JEFE, EPILOGO]) {
      expect(c.titulo.length).toBeLessThanOrEqual(22) // a 20px cabe en 480px
      expect(c.lineas.length).toBeGreaterThan(0)
      for (const l of c.lineas) expect(l.texto.length).toBeLessThanOrEqual(110)
    }
  })

  it('cada capítulo tiene su propio paisaje', () => {
    const paisajes = [...CAPITULOS, CAPITULO_JEFE, EPILOGO].map((c) => c.paisaje)
    expect(new Set(paisajes).size).toBe(paisajes.length)
  })

  it('el final tiene textos que caben en pantalla', () => {
    expect(TEXTOS_FINAL.length).toBeGreaterThan(1)
    for (const t of TEXTOS_FINAL) expect(t.length).toBeLessThanOrEqual(60)
  })

  it('pone el nombre del piloto en el texto', () => {
    expect(conNombre('Buen vuelo, {nombre}.', 'JJ')).toBe('Buen vuelo, JJ.')
  })
})
