export const MAX_NOMBRE = 10 // cabe en la tabla del top 5

// null = nombre vacío, no se guarda
export function limpiarNombre(texto: string): string | null {
  const limpio = texto.trim().replace(/\s+/g, ' ').toUpperCase().slice(0, MAX_NOMBRE).trim()
  return limpio || null
}
