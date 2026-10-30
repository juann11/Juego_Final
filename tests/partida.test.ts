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
  MEJORAS,
  alas,
  cadenciaMs,
  comprar,
  costoMejora,
  danioBala,
  radioIman,
  recogerMonedas,
  salirDeTienda,
  CARGA_MAX,
  CARGA_POR_DERRIBO,
  CARGA_POR_ROCE,
  SOBRECARGA_S,
  activarSobrecarga,
  elegirEvento,
  marcarEvento,
  pideEvento,
  rozar,
  intervaloDisparo,
  vidaEnemigo,
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
  it('al acabarse el tiempo se abre el hangar y el reloj se detiene', () => {
    const p = avanzarTiempo(nuevaPartida(), NIVELES[0].duracionS)
    expect(p).toMatchObject({ tienda: true, nivel: 1 })
    expect(avanzarTiempo(p, 10)).toMatchObject({ tienda: true, nivel: 1, tiempoRestante: 0 })
  })

  it('al salir del hangar empieza el siguiente nivel', () => {
    const p = salirDeTienda(avanzarTiempo(nuevaPartida(), NIVELES[0].duracionS))
    expect(p).toMatchObject({ tienda: false, nivel: 2, tiempoRestante: NIVELES[1].duracionS })
  })

  it('al salir del hangar del último nivel aparece el jefe en vez de ganar', () => {
    const p = salirDeTienda(avanzarTiempo({ ...nuevaPartida(), nivel: NIVELES.length, tiempoRestante: 1 }, 2))
    expect(p).toMatchObject({ jefe: true, tienda: false, terminada: false, nivel: NIVELES.length })
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

describe('monedas y hangar', () => {
  const rica = (monedas = 1000) => ({ ...nuevaPartida(), monedas })

  it('empieza sin monedas ni mejoras', () => {
    const p = nuevaPartida()
    expect(p.monedas).toBe(0)
    expect(Object.values(p.mejoras).every((n) => n === 0)).toBe(true)
  })

  it('recoger monedas las suma', () => {
    expect(recogerMonedas(nuevaPartida(), 3).monedas).toBe(3)
  })

  it('comprar descuenta el costo y sube el nivel de la mejora', () => {
    const p = comprar(rica(100), 'potencia')
    expect(p.monedas).toBe(100 - MEJORAS.potencia.costos[0])
    expect(p.mejoras.potencia).toBe(1)
    expect(costoMejora(p, 'potencia')).toBe(MEJORAS.potencia.costos[1])
  })

  it('sin monedas suficientes no compra', () => {
    const p = rica(MEJORAS.potencia.costos[0] - 1)
    expect(comprar(p, 'potencia')).toEqual(p)
  })

  it('una mejora al máximo no se puede comprar más', () => {
    let p = rica()
    for (let i = 0; i < MEJORAS.alas.costos.length; i++) p = comprar(p, 'alas')
    expect(costoMejora(p, 'alas')).toBeNull()
    expect(comprar(p, 'alas')).toEqual(p)
  })

  it('reparar suma una vida y no se ofrece con vidas al máximo', () => {
    expect(comprar(rica(), 'vida').vidas).toBe(4)
    expect(costoMejora({ ...rica(), vidas: VIDAS_MAX }, 'vida')).toBeNull()
  })

  it('el escudo se compra solo si no lo tienes', () => {
    const p = comprar(rica(), 'escudo')
    expect(p.escudo).toBe(true)
    expect(costoMejora(p, 'escudo')).toBeNull()
  })

  it('las mejoras cambian las estadísticas de la nave', () => {
    let p = rica()
    const base = { danio: danioBala(p), cadencia: cadenciaMs(p), iman: radioIman(p), alas: alas(p) }
    for (const t of ['potencia', 'cadencia', 'iman', 'alas'] as const) p = comprar(p, t)
    expect(danioBala(p)).toBe(base.danio + 1)
    expect(cadenciaMs(p)).toBeLessThan(base.cadencia)
    expect(radioIman(p)).toBeGreaterThan(base.iman)
    expect(alas(p)).toBe(base.alas + 1)
  })

  it('cada enemigo da al menos una moneda', () => {
    for (const e of Object.values(ENEMIGOS)) expect(e.monedas).toBeGreaterThanOrEqual(1)
  })
})

describe('enemigos más duros', () => {
  it('los enemigos nuevos aguantan más que el dron y el acorazado es el más duro', () => {
    expect(ENEMIGOS.acorazado.vida).toBeGreaterThan(ENEMIGOS.dron.vida)
    expect(ENEMIGOS.orbe.vida).toBeGreaterThan(ENEMIGOS.dron.vida)
    const otros = Object.entries(ENEMIGOS).filter(([t]) => t !== 'acorazado')
    expect(otros.every(([, e]) => e.vida < ENEMIGOS.acorazado.vida)).toBe(true)
  })

  it('la vida de un enemigo sube con el nivel', () => {
    expect(vidaEnemigo('zigzag', 3, 'normal', false)).toBeGreaterThan(vidaEnemigo('zigzag', 1, 'normal', false))
    expect(vidaEnemigo('dron', 1, 'normal', false)).toBe(ENEMIGOS.dron.vida)
  })

  it('la vida depende de la dificultad', () => {
    expect(vidaEnemigo('tirador', 2, 'dificil', false)).toBeGreaterThan(vidaEnemigo('tirador', 2, 'normal', false))
    expect(vidaEnemigo('tirador', 2, 'facil', false)).toBeLessThan(vidaEnemigo('tirador', 2, 'normal', false))
  })

  it('un élite tiene el doble de vida y nunca menos de 1', () => {
    expect(vidaEnemigo('orbe', 2, 'normal', true)).toBe(2 * vidaEnemigo('orbe', 2, 'normal', false))
    expect(vidaEnemigo('dron', 1, 'facil', false)).toBeGreaterThanOrEqual(1)
  })

  it('derribar un élite da el doble de puntos', () => {
    const normal = destruir(nuevaPartida(), 'zigzag').puntos
    expect(destruir(nuevaPartida(), 'zigzag', true).puntos).toBe(normal * 2)
  })

  it('en niveles más altos disparan más seguido', () => {
    expect(intervaloDisparo('dron', 3, 'normal')).toBeLessThan(intervaloDisparo('dron', 1, 'normal'))
    expect(intervaloDisparo('dron', 1, 'normal')).toBe(ENEMIGOS.dron.disparoMs)
    expect(intervaloDisparo('meteorito', 1, 'normal')).toBeNull()
  })

  it('cada nivel tiene más probabilidad de élites y formaciones', () => {
    for (let i = 1; i < NIVELES.length; i++) {
      expect(NIVELES[i].elite).toBeGreaterThan(NIVELES[i - 1].elite)
      expect(NIVELES[i].formacion).toBeGreaterThanOrEqual(NIVELES[i - 1].formacion)
    }
  })
})

describe('sobrecarga y roce', () => {
  const llena = () => ({ ...nuevaPartida(), carga: CARGA_MAX })

  it('derribar y rozar balas llenan la barra', () => {
    expect(destruir(nuevaPartida(), 'dron').carga).toBe(CARGA_POR_DERRIBO)
    expect(rozar(nuevaPartida()).carga).toBe(CARGA_POR_ROCE)
  })

  it('rozar da unos puntos por el riesgo', () => {
    expect(rozar(nuevaPartida()).puntos).toBeGreaterThan(0)
  })

  it('la barra no pasa del máximo', () => {
    expect(rozar({ ...nuevaPartida(), carga: CARGA_MAX - 1 }).carga).toBe(CARGA_MAX)
  })

  it('solo se activa con la barra llena', () => {
    const p = { ...nuevaPartida(), carga: CARGA_MAX - 1 }
    expect(activarSobrecarga(p)).toBe(p)
    expect(activarSobrecarga(llena())).toMatchObject({ carga: 0, sobrecargaS: SOBRECARGA_S })
  })

  it('durante la sobrecarga la barra no se llena y se acaba con el tiempo', () => {
    const p = activarSobrecarga(llena())
    expect(destruir(p, 'dron').carga).toBe(0)
    expect(rozar(p).carga).toBe(0)
    expect(avanzarTiempo(p, SOBRECARGA_S + 1).sobrecargaS).toBe(0)
  })

  it('durante la sobrecarga dispara más rápido y hace más daño', () => {
    const p = activarSobrecarga(llena())
    expect(cadenciaMs(p)).toBeLessThan(cadenciaMs(nuevaPartida()))
    expect(danioBala(p)).toBeGreaterThan(danioBala(nuevaPartida()))
  })
})

describe('eventos sorpresa', () => {
  const mitad = () => ({ ...nuevaPartida(), tiempoRestante: NIVELES[0].duracionS * 0.5 })

  it('al principio del nivel no hay evento y a la mitad sí', () => {
    expect(pideEvento(nuevaPartida())).toBe(false)
    expect(pideEvento(mitad())).toBe(true)
  })

  it('sale una sola vez por nivel y se reinicia al salir del hangar', () => {
    const p = marcarEvento(mitad())
    expect(pideEvento(p)).toBe(false)
    expect(salirDeTienda({ ...p, tienda: true }).eventoHecho).toBe(false)
  })

  it('no sale con el jefe ni en el hangar', () => {
    expect(pideEvento({ ...mitad(), jefe: true })).toBe(false)
    expect(pideEvento({ ...mitad(), tienda: true })).toBe(false)
  })

  it('el mini-jefe no sale en el nivel 1 pero sí después', () => {
    expect(NIVELES[0].eventos).not.toContain('miniJefe')
    expect(NIVELES[1].eventos).toContain('miniJefe')
  })

  it('elegirEvento toma uno de los eventos del nivel', () => {
    expect(elegirEvento(NIVELES[1], 0)).toBe(NIVELES[1].eventos[0])
    expect(elegirEvento(NIVELES[1], 0.999)).toBe(NIVELES[1].eventos.at(-1))
  })
})
