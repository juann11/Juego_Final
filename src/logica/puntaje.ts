import type { Dificultad } from './partida'

export interface Registro {
  nombre: string
  puntos: number
  fecha: string
  dificultad?: Dificultad // opcional: los puntajes guardados antes no la tienen
}

export const MAX_PUNTAJES = 5

export function agregarPuntaje(top: Registro[], nuevo: Registro): Registro[] {
  return [...top, nuevo].sort((a, b) => b.puntos - a.puntos).slice(0, MAX_PUNTAJES)
}
