// Lógica pura de la partida: sin Phaser, para poder probarla con Vitest.

export interface Nivel {
  velocidad: number // px/s a la que caen los meteoritos
  intervaloMs: number // cada cuánto aparece uno nuevo
  duracionS: number // segundos que hay que aguantar para pasar
}

export const NIVELES: Nivel[] = [
  { velocidad: 220, intervaloMs: 900, duracionS: 25 },
  { velocidad: 320, intervaloMs: 650, duracionS: 30 },
  { velocidad: 430, intervaloMs: 450, duracionS: 35 },
]

export const VIDAS_INICIALES = 3

export interface Partida {
  nivel: number // empieza en 1
  vidas: number
  puntos: number
  tiempoRestante: number
  terminada: boolean
  gano: boolean
}

export function nuevaPartida(): Partida {
  return {
    nivel: 1,
    vidas: VIDAS_INICIALES,
    puntos: 0,
    tiempoRestante: NIVELES[0].duracionS,
    terminada: false,
    gano: false,
  }
}

export function recibirGolpe(p: Partida): Partida {
  if (p.terminada) return p
  const vidas = Math.max(0, p.vidas - 1)
  return { ...p, vidas, terminada: vidas === 0 }
}

export function esquivar(p: Partida): Partida {
  if (p.terminada) return p
  return { ...p, puntos: p.puntos + 10 * p.nivel }
}

export function avanzarTiempo(p: Partida, segundos: number): Partida {
  if (p.terminada) return p
  const tiempoRestante = p.tiempoRestante - segundos
  if (tiempoRestante > 0) return { ...p, tiempoRestante }
  if (p.nivel >= NIVELES.length) return { ...p, tiempoRestante: 0, terminada: true, gano: true }
  return { ...p, nivel: p.nivel + 1, tiempoRestante: NIVELES[p.nivel].duracionS }
}
