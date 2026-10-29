import { describe, expect, it } from 'vitest'
import {
  COMBO_VENTANA_S,
  DIFICULTADES,
  vidaJefe,
  ENEMIGOS,
  JEFE,
  NIVELES,
  VIDAS_MAX,
  aplicarPowerUp,
  avanzarTiempo,
  derrotarJefe,
  destruir,
  elegirEnemigo,
  multiplicador,
  nuevaPartida,
  recibirGolpe,
} from '../src/logica/partida'

const conCombo = (combo: number) => ({ ...nuevaPartida(), combo, comboTiempo: COMBO_VENTANA_S })

describe('partida', () => {
  it('empieza en el nivel 1 con 3 vidas, sin puntos ni combo', () => {
    const p = nuevaPartida()
    expect(p).toMatchObject({ nivel: 1, vidas: 3, puntos: 0, combo: 0, escudo: false, tripleS: 0, jefe: false, terminada: false })
    expect(p.tiempoRestante).toBe(NIVELES[0].duracionS)
  })

  it('tiene al menos 3 niveles, cada uno más rápido y con enemigos más seguido', () => {
    expect(NIVELES.length).toBeGreaterThanOrEqual(3)
    for (let i = 1; i < NIVELES.length; i++) {
      expect(NIVELES[i].velocidad).toBeGreaterThan(NIVELES[i - 1].velocidad)
      expect(NIVELES[i].intervaloMs).toBeLessThan(NIVELES[i - 1].intervaloMs)
    }
  })
})

describe('golpes y escudo', () => {
  it('un golpe quita una vida y rompe el combo', () => {
    const p = recibirGolpe(conCombo(7))
    expect(p.vidas).toBe(2)
    expect(p.combo).toBe(0)
  })

  it('con escudo el golpe no quita vida pero gasta el escudo', () => {
    const p = recibirGolpe({ ...nuevaPartida(), escudo: true })
    expect(p.vidas).toBe(3)
    expect(p.escudo).toBe(false)
  })

  it('sin vidas la partida termina perdida y no baja de 0', () => {
    let p = nuevaPartida()
    for (let i = 0; i < 4; i++) p = recibirGolpe(p)
    expect(p).toMatchObject({ vidas: 0, terminada: true, gano: false })
  })
})

describe('combos y puntos', () => {
  it('el multiplicador sube 1 cada 5 derribos seguidos, máximo x5', () => {
    expect(multiplicador(conCombo(0))).toBe(1)
    expect(multiplicador(conCombo(4))).toBe(1)
    expect(multiplicador(conCombo(5))).toBe(2)
    expect(multiplicador(conCombo(14))).toBe(3)
    expect(multiplicador(conCombo(100))).toBe(5)
  })

  it('destruir suma los puntos del enemigo por el multiplicador y alarga el combo', () => {
    const p = destruir(conCombo(5), 'zigzag')
    expect(p.puntos).toBe(ENEMIGOS.zigzag.puntos * 2)
    expect(p.combo).toBe(6)
    expect(p.comboTiempo).toBe(COMBO_VENTANA_S)
    expect(p.derribados).toBe(1)
  })

  it('si pasa la ventana sin derribar, el combo se pierde', () => {
    const p = avanzarTiempo(conCombo(9), COMBO_VENTANA_S + 0.1)
    expect(p.combo).toBe(0)
  })
})

describe('power-ups', () => {
  it('vida extra suma una vida sin pasar del máximo', () => {
    expect(aplicarPowerUp(nuevaPartida(), 'vida').vidas).toBe(4)
    expect(aplicarPowerUp({ ...nuevaPartida(), vidas: VIDAS_MAX }, 'vida').vidas).toBe(VIDAS_MAX)
  })

  it('escudo activa el escudo', () => {
    expect(aplicarPowerUp(nuevaPartida(), 'escudo').escudo).toBe(true)
  })

  it('triple dura un tiempo y se acaba', () => {
    const p = aplicarPowerUp(nuevaPartida(), 'triple')
    expect(p.tripleS).toBeGreaterThan(0)
    expect(avanzarTiempo(p, p.tripleS + 1).tripleS).toBe(0)
  })
})

describe('niveles y jefe', () => {
  it('al acabarse el tiempo pasa al siguiente nivel', () => {
    const p = avanzarTiempo(nuevaPartida(), NIVELES[0].duracionS)
    expect(p.nivel).toBe(2)
    expect(p.tiempoRestante).toBe(NIVELES[1].duracionS)
  })

  it('al acabar el último nivel aparece el jefe en vez de ganar', () => {
    const p = avanzarTiempo({ ...nuevaPartida(), nivel: NIVELES.length, tiempoRestante: 1 }, 2)
    expect(p).toMatchObject({ jefe: true, terminada: false, nivel: NIVELES.length })
  })

  it('durante el jefe el tiempo no hace avanzar de nivel', () => {
    const jefe = { ...nuevaPartida(), nivel: NIVELES.length, jefe: true, tiempoRestante: 0 }
    expect(avanzarTiempo(jefe, 60)).toMatchObject({ jefe: true, terminada: false })
  })

  it('derrotar al jefe gana la partida y da sus puntos', () => {
    const p = derrotarJefe({ ...nuevaPartida(), jefe: true })
    expect(p).toMatchObject({ terminada: true, gano: true, puntos: JEFE.puntos })
  })

  it('una partida terminada no cambia', () => {
    const fin = { ...nuevaPartida(), terminada: true }
    expect(avanzarTiempo(fin, 5)).toEqual(fin)
    expect(destruir(fin, 'dron')).toEqual(fin)
    expect(recibirGolpe(fin)).toEqual(fin)
  })
})

describe('elegirEnemigo', () => {
  const nivel = { ...NIVELES[0], enemigos: { dron: 70, meteorito: 30 } }

  it('elige según los pesos del nivel', () => {
    expect(elegirEnemigo(nivel, 0)).toBe('dron')
    expect(elegirEnemigo(nivel, 0.69)).toBe('dron')
    expect(elegirEnemigo(nivel, 0.71)).toBe('meteorito')
    expect(elegirEnemigo(nivel, 0.999)).toBe('meteorito')
  })

  it('cada nivel nuevo trae algún enemigo que no estaba antes', () => {
    for (let i = 1; i < NIVELES.length; i++) {
      const antes = Object.keys(NIVELES[i - 1].enemigos)
      expect(Object.keys(NIVELES[i].enemigos).some((t) => !antes.includes(t))).toBe(true)
    }
  })
})

describe('dificultad', () => {
  it('por defecto la partida es normal', () => {
    expect(nuevaPartida().dificultad).toBe('normal')
  })

  it('las vidas iniciales dependen de la dificultad', () => {
    expect(nuevaPartida('facil').vidas).toBe(DIFICULTADES.facil.vidas)
    expect(nuevaPartida('dificil').vidas).toBe(DIFICULTADES.dificil.vidas)
    expect(DIFICULTADES.facil.vidas).toBeGreaterThan(DIFICULTADES.dificil.vidas)
  })

  it('difícil da más puntos por derribo que fácil', () => {
    const facil = destruir(nuevaPartida('facil'), 'tirador').puntos
    const normal = destruir(nuevaPartida('normal'), 'tirador').puntos
    const dificil = destruir(nuevaPartida('dificil'), 'tirador').puntos
    expect(normal).toBe(ENEMIGOS.tirador.puntos)
    expect(facil).toBeLessThan(normal)
    expect(dificil).toBeGreaterThan(normal)
    expect(Number.isInteger(facil) && Number.isInteger(dificil)).toBe(true)
  })

  it('el jefe tiene más vida en difícil y menos en fácil', () => {
    expect(vidaJefe('normal')).toBe(JEFE.vida)
    expect(vidaJefe('facil')).toBeLessThan(JEFE.vida)
    expect(vidaJefe('dificil')).toBeGreaterThan(JEFE.vida)
  })

  it('en difícil los enemigos son más rápidos y salen más seguido', () => {
    expect(DIFICULTADES.dificil.velocidad).toBeGreaterThan(DIFICULTADES.normal.velocidad)
    expect(DIFICULTADES.dificil.intervalo).toBeLessThan(DIFICULTADES.normal.intervalo)
    expect(DIFICULTADES.facil.velocidad).toBeLessThan(DIFICULTADES.normal.velocidad)
  })
})
