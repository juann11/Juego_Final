import { describe, expect, it } from 'vitest'
import { NIVELES, avanzarTiempo, esquivar, nuevaPartida, recibirGolpe } from '../src/logica/partida'

describe('partida', () => {
  it('empieza en el nivel 1 con 3 vidas, 0 puntos y el tiempo del nivel', () => {
    const p = nuevaPartida()
    expect(p).toMatchObject({ nivel: 1, vidas: 3, puntos: 0, terminada: false, gano: false })
    expect(p.tiempoRestante).toBe(NIVELES[0].duracionS)
  })

  it('tiene al menos 3 niveles y cada uno es más difícil que el anterior', () => {
    expect(NIVELES.length).toBeGreaterThanOrEqual(3)
    for (let i = 1; i < NIVELES.length; i++) {
      expect(NIVELES[i].velocidad).toBeGreaterThan(NIVELES[i - 1].velocidad)
      expect(NIVELES[i].intervaloMs).toBeLessThan(NIVELES[i - 1].intervaloMs)
    }
  })

  it('recibir un golpe quita una vida', () => {
    expect(recibirGolpe(nuevaPartida()).vidas).toBe(2)
  })

  it('sin vidas la partida termina y se pierde', () => {
    let p = nuevaPartida()
    for (let i = 0; i < 3; i++) p = recibirGolpe(p)
    expect(p).toMatchObject({ vidas: 0, terminada: true, gano: false })
    // un golpe extra no baja de 0
    expect(recibirGolpe(p).vidas).toBe(0)
  })

  it('esquivar suma más puntos en niveles más altos', () => {
    const n1 = esquivar(nuevaPartida()).puntos
    const n2 = esquivar({ ...nuevaPartida(), nivel: 2 }).puntos
    expect(n1).toBe(10)
    expect(n2).toBe(20)
  })

  it('al acabarse el tiempo pasa al siguiente nivel con su tiempo', () => {
    const p = avanzarTiempo(nuevaPartida(), NIVELES[0].duracionS)
    expect(p.nivel).toBe(2)
    expect(p.tiempoRestante).toBe(NIVELES[1].duracionS)
    expect(p.terminada).toBe(false)
  })

  it('avanzar poco tiempo solo descuenta segundos', () => {
    const p = avanzarTiempo(nuevaPartida(), 1.5)
    expect(p.nivel).toBe(1)
    expect(p.tiempoRestante).toBeCloseTo(NIVELES[0].duracionS - 1.5)
  })

  it('superar el último nivel gana la partida', () => {
    const p = avanzarTiempo({ ...nuevaPartida(), nivel: NIVELES.length, tiempoRestante: 1 }, 2)
    expect(p).toMatchObject({ terminada: true, gano: true, nivel: NIVELES.length })
  })

  it('una partida terminada no cambia', () => {
    const fin = { ...nuevaPartida(), terminada: true }
    expect(avanzarTiempo(fin, 5)).toEqual(fin)
    expect(esquivar(fin)).toEqual(fin)
  })
})
