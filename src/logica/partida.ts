// Lógica pura de la partida: sin Phaser, para poder probarla con Vitest.

export type TipoEnemigo = 'dron' | 'zigzag' | 'tirador' | 'meteorito'
export type TipoPowerUp = 'triple' | 'escudo' | 'vida'

export const ENEMIGOS: Record<TipoEnemigo, { vida: number; puntos: number }> = {
  dron: { vida: 1, puntos: 10 },
  meteorito: { vida: 3, puntos: 15 },
  zigzag: { vida: 2, puntos: 25 },
  tirador: { vida: 4, puntos: 40 },
}

export const JEFE = { vida: 140, puntos: 2000 }

export interface Nivel {
  velocidad: number // px/s base de los enemigos
  intervaloMs: number // cada cuánto aparece un enemigo
  duracionS: number // segundos que dura el nivel
  enemigos: Partial<Record<TipoEnemigo, number>> // pesos de aparición
}

export const NIVELES: Nivel[] = [
  { velocidad: 170, intervaloMs: 800, duracionS: 30, enemigos: { dron: 70, meteorito: 30 } },
  { velocidad: 210, intervaloMs: 650, duracionS: 35, enemigos: { dron: 40, zigzag: 35, meteorito: 25 } },
  { velocidad: 250, intervaloMs: 520, duracionS: 40, enemigos: { dron: 30, zigzag: 30, tirador: 25, meteorito: 15 } },
]

export const VIDAS_INICIALES = 3
export const VIDAS_MAX = 5
export const COMBO_VENTANA_S = 2.5
export const MULTIPLICADOR_MAX = 5
export const TRIPLE_S = 10

export interface Partida {
  nivel: number // empieza en 1
  vidas: number
  puntos: number
  tiempoRestante: number
  jefe: boolean // true cuando acabó el último nivel y toca pelear contra el jefe
  combo: number // derribos seguidos sin dejar pasar la ventana ni recibir golpes
  comboTiempo: number
  escudo: boolean
  tripleS: number // segundos restantes de disparo triple
  derribados: number
  terminada: boolean
  gano: boolean
}

export function nuevaPartida(): Partida {
  return {
    nivel: 1,
    vidas: VIDAS_INICIALES,
    puntos: 0,
    tiempoRestante: NIVELES[0].duracionS,
    jefe: false,
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
    puntos: p.puntos + ENEMIGOS[tipo].puntos * multiplicador(p),
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
  return { ...p, puntos: p.puntos + JEFE.puntos * multiplicador(p), derribados: p.derribados + 1, terminada: true, gano: true }
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
  if (p.jefe) return base
  const tiempoRestante = p.tiempoRestante - segundos
  if (tiempoRestante > 0) return { ...base, tiempoRestante }
  if (p.nivel >= NIVELES.length) return { ...base, tiempoRestante: 0, jefe: true }
  return { ...base, nivel: p.nivel + 1, tiempoRestante: NIVELES[p.nivel].duracionS }
}

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
