export interface Registro {
  nombre: string
  puntos: number
  fecha: string
}

export const MAX_PUNTAJES = 5

export function agregarPuntaje(top: Registro[], nuevo: Registro): Registro[] {
  return [...top, nuevo].sort((a, b) => b.puntos - a.puntos).slice(0, MAX_PUNTAJES)
}
