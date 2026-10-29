// Persistencia entre vistas y sesiones. localStorage funciona igual dentro de Capacitor (WebView).
const PREFIJO = 'esquiva-estelar:'

export function cargar<T>(clave: string, porDefecto: T): T {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave)
    return crudo === null ? porDefecto : (JSON.parse(crudo) as T)
  } catch {
    return porDefecto
  }
}

export function guardar<T>(clave: string, valor: T): void {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor))
  } catch {
    // almacenamiento lleno o bloqueado: el juego sigue sin guardar
  }
}
