// Lógica pura de la partida: sin Phaser, para poder probarla con Vitest.

export type TipoEnemigo = 'dron' | 'zigzag' | 'tirador' | 'meteorito' | 'kamikaze'
export type TipoPowerUp = 'triple' | 'escudo' | 'vida'
export type TipoMejora = 'potencia' | 'cadencia' | 'alas' | 'iman' | 'vida' | 'escudo'

// disparoMs: cada cuánto dispara (sin él, no dispara)
export const ENEMIGOS: Record<TipoEnemigo, { vida: number; puntos: number; monedas: number; disparoMs?: number }> = {
  dron: { vida: 1, puntos: 10, monedas: 1, disparoMs: 2800 },
  meteorito: { vida: 3, puntos: 15, monedas: 1 },
  zigzag: { vida: 2, puntos: 25, monedas: 2, disparoMs: 2000 },
  kamikaze: { vida: 2, puntos: 30, monedas: 2 },
  tirador: { vida: 4, puntos: 40, monedas: 3, disparoMs: 1500 },
}

// Hangar entre niveles: `costos[i]` es el precio del nivel i+1. Reparar y escudo se pueden recomprar.
export const MEJORAS: Record<TipoMejora, { nombre: string; descripcion: string; costos: number[] }> = {
  potencia: { nombre: 'POTENCIA', descripcion: '+1 daño por bala', costos: [25, 60, 110] },
  cadencia: { nombre: 'CADENCIA', descripcion: 'Disparas más rápido', costos: [20, 50, 90] },
  alas: { nombre: 'ALAS', descripcion: 'Naves de apoyo', costos: [40, 90] },
  iman: { nombre: 'IMÁN', descripcion: 'Atrae monedas', costos: [15, 35] },
  vida: { nombre: 'REPARAR', descripcion: '+1 vida', costos: [30] },
  escudo: { nombre: 'ESCUDO', descripcion: 'Bloquea un golpe', costos: [20] },
}

export const JEFE = { vida: 220, puntos: 2000 }

export type Dificultad = 'facil' | 'normal' | 'dificil'

// Factores sobre los valores de NIVELES y JEFE; `puntos` compensa en el top 5 a quien juega más difícil.
export const DIFICULTADES: Record<
  Dificultad,
  { nombre: string; velocidad: number; intervalo: number; jefe: number; vidas: number; probPowerUp: number; puntos: number }
> = {
  facil: { nombre: 'FÁCIL', velocidad: 0.8, intervalo: 1.3, jefe: 0.6, vidas: 5, probPowerUp: 0.15, puntos: 0.5 },
  normal: { nombre: 'NORMAL', velocidad: 1, intervalo: 1, jefe: 1, vidas: 3, probPowerUp: 0.1, puntos: 1 },
  dificil: { nombre: 'DIFÍCIL', velocidad: 1.25, intervalo: 0.75, jefe: 1.5, vidas: 2, probPowerUp: 0.07, puntos: 1.5 },
}

export function vidaJefe(d: Dificultad): number {
  return Math.round(JEFE.vida * DIFICULTADES[d].jefe)
}

export interface Nivel {
  velocidad: number // px/s base de los enemigos
  intervaloMs: number // cada cuánto aparece un enemigo
  duracionS: number // segundos que dura el nivel
  enemigos: Partial<Record<TipoEnemigo, number>> // pesos de aparición
}

export const NIVELES: Nivel[] = [
  { velocidad: 170, intervaloMs: 800, duracionS: 30, enemigos: { dron: 70, meteorito: 30 } },
  { velocidad: 210, intervaloMs: 650, duracionS: 35, enemigos: { dron: 35, zigzag: 30, kamikaze: 15, meteorito: 20 } },
  { velocidad: 250, intervaloMs: 520, duracionS: 40, enemigos: { dron: 25, zigzag: 25, kamikaze: 15, tirador: 25, meteorito: 10 } },
]

export const VIDAS_MAX = 5
export const COMBO_VENTANA_S = 2.5
export const MULTIPLICADOR_MAX = 5
export const TRIPLE_S = 10
export const CADENCIA_BASE_MS = 170

export interface Partida {
  dificultad: Dificultad
  nivel: number // empieza en 1
  vidas: number
  puntos: number
  tiempoRestante: number
  jefe: boolean // true cuando acabó el último nivel y toca pelear contra el jefe
  tienda: boolean // true entre niveles, mientras el hangar está abierto
  monedas: number
  mejoras: Record<TipoMejora, number> // veces compradas
  combo: number // derribos seguidos sin dejar pasar la ventana ni recibir golpes
  comboTiempo: number
  escudo: boolean
  tripleS: number // segundos restantes de disparo triple
  derribados: number
  terminada: boolean
  gano: boolean
}

export function nuevaPartida(dificultad: Dificultad = 'normal'): Partida {
  return {
    dificultad,
    nivel: 1,
    vidas: DIFICULTADES[dificultad].vidas,
    puntos: 0,
    tiempoRestante: NIVELES[0].duracionS,
    jefe: false,
    tienda: false,
    monedas: 0,
    mejoras: { potencia: 0, cadencia: 0, alas: 0, iman: 0, vida: 0, escudo: 0 },
    combo: 0,
    comboTiempo: 0,
    escudo: false,
    tripleS: 0,
    derribados: 0,
    terminada: false,
    gano: false,
  }
}

export function multiplicador(p: Partida): number {
  return Math.min(MULTIPLICADOR_MAX, 1 + Math.floor(p.combo / 5))
}

function ganancia(p: Partida, base: number): number {
  return Math.round(base * multiplicador(p) * DIFICULTADES[p.dificultad].puntos)
}

export function recibirGolpe(p: Partida): Partida {
  if (p.terminada) return p
  if (p.escudo) return { ...p, escudo: false, combo: 0 }
  const vidas = Math.max(0, p.vidas - 1)
  return { ...p, vidas, combo: 0, terminada: vidas === 0 }
}

export function destruir(p: Partida, tipo: TipoEnemigo): Partida {
  if (p.terminada) return p
  return {
    ...p,
    puntos: p.puntos + ganancia(p, ENEMIGOS[tipo].puntos),
    combo: p.combo + 1,
    comboTiempo: COMBO_VENTANA_S,
    derribados: p.derribados + 1,
  }
}

export function aplicarPowerUp(p: Partida, tipo: TipoPowerUp): Partida {
  if (p.terminada) return p
  if (tipo === 'vida') return { ...p, vidas: Math.min(VIDAS_MAX, p.vidas + 1) }
  if (tipo === 'escudo') return { ...p, escudo: true }
  return { ...p, tripleS: TRIPLE_S }
}

export function derrotarJefe(p: Partida): Partida {
  if (p.terminada) return p
  return { ...p, puntos: p.puntos + ganancia(p, JEFE.puntos), derribados: p.derribados + 1, terminada: true, gano: true }
}

export function avanzarTiempo(p: Partida, segundos: number): Partida {
  if (p.terminada) return p
  const comboTiempo = p.comboTiempo - segundos
  const base = {
    ...p,
    tripleS: Math.max(0, p.tripleS - segundos),
    comboTiempo: Math.max(0, comboTiempo),
    combo: comboTiempo > 0 ? p.combo : 0,
  }
  if (p.jefe || p.tienda) return base
  const tiempoRestante = p.tiempoRestante - segundos
  if (tiempoRestante > 0) return { ...base, tiempoRestante }
  return { ...base, tiempoRestante: 0, tienda: true }
}

export function salirDeTienda(p: Partida): Partida {
  if (!p.tienda) return p
  if (p.nivel >= NIVELES.length) return { ...p, tienda: false, jefe: true }
  return { ...p, tienda: false, nivel: p.nivel + 1, tiempoRestante: NIVELES[p.nivel].duracionS }
}

export function recogerMonedas(p: Partida, cantidad: number): Partida {
  return { ...p, monedas: p.monedas + cantidad }
}

// null = no disponible (al máximo, vidas llenas o ya tiene escudo)
export function costoMejora(p: Partida, tipo: TipoMejora): number | null {
  const { costos } = MEJORAS[tipo]
  if (tipo === 'vida') return p.vidas >= VIDAS_MAX ? null : costos[0]
  if (tipo === 'escudo') return p.escudo ? null : costos[0]
  return costos[p.mejoras[tipo]] ?? null
}

export function comprar(p: Partida, tipo: TipoMejora): Partida {
  const costo = costoMejora(p, tipo)
  if (costo === null || p.monedas < costo) return p
  const q = { ...p, monedas: p.monedas - costo, mejoras: { ...p.mejoras, [tipo]: p.mejoras[tipo] + 1 } }
  if (tipo === 'vida') return { ...q, vidas: q.vidas + 1 }
  if (tipo === 'escudo') return { ...q, escudo: true }
  return q
}

export const danioBala = (p: Partida) => 1 + p.mejoras.potencia
export const cadenciaMs = (p: Partida) => Math.round(CADENCIA_BASE_MS * 0.8 ** p.mejoras.cadencia)
export const radioIman = (p: Partida) => 90 + 80 * p.mejoras.iman
export const alas = (p: Partida) => p.mejoras.alas

// `azar` en [0, 1): se inyecta para poder probarlo sin Math.random
export function elegirEnemigo(nivel: Nivel, azar: number): TipoEnemigo {
  const pesos = Object.entries(nivel.enemigos) as [TipoEnemigo, number][]
  let resto = azar * pesos.reduce((s, [, w]) => s + w, 0)
  for (const [tipo, peso] of pesos) {
    resto -= peso
    if (resto < 0) return tipo
  }
  return pesos[pesos.length - 1][0]
}
