// Lógica pura de la partida: sin Phaser, para poder probarla con Vitest.

export type TipoEnemigo = 'dron' | 'zigzag' | 'tirador' | 'meteorito' | 'kamikaze' | 'acorazado' | 'orbe' | 'carguero'
export type TipoEvento = 'lluvia' | 'carguero' | 'miniJefe'
export type TipoPowerUp = 'triple' | 'escudo' | 'vida'
export type TipoMejora = 'potencia' | 'cadencia' | 'alas' | 'iman' | 'vida' | 'escudo'

// disparoMs: cada cuánto dispara (sin él, no dispara)
export const ENEMIGOS: Record<TipoEnemigo, { vida: number; puntos: number; monedas: number; disparoMs?: number }> = {
  dron: { vida: 2, puntos: 10, monedas: 1, disparoMs: 2800 },
  meteorito: { vida: 4, puntos: 15, monedas: 1 },
  zigzag: { vida: 4, puntos: 25, monedas: 2, disparoMs: 2000 },
  kamikaze: { vida: 3, puntos: 30, monedas: 2 },
  tirador: { vida: 7, puntos: 45, monedas: 3, disparoMs: 1600 },
  orbe: { vida: 9, puntos: 60, monedas: 4, disparoMs: 2000 },
  acorazado: { vida: 14, puntos: 90, monedas: 6, disparoMs: 2200 },
  carguero: { vida: 12, puntos: 100, monedas: 12 }, // solo aparece como evento: huye sin atacar
}

export const SUBIDA_VIDA_POR_NIVEL = 0.25 // +25% de vida enemiga por cada nivel
export const SUBIDA_CADENCIA_POR_NIVEL = 0.15 // y disparan un 15% más seguido

// Hangar entre niveles: `costos[i]` es el precio del nivel i+1. Reparar y escudo se pueden recomprar.
export const MEJORAS: Record<TipoMejora, { nombre: string; descripcion: string; costos: number[] }> = {
  potencia: { nombre: 'POTENCIA', descripcion: '+1 daño por bala', costos: [25, 60, 110] },
  cadencia: { nombre: 'CADENCIA', descripcion: 'Disparas más rápido', costos: [20, 50, 90] },
  alas: { nombre: 'ALAS', descripcion: 'Naves de apoyo', costos: [40, 90] },
  iman: { nombre: 'IMÁN', descripcion: 'Atrae monedas', costos: [15, 35] },
  vida: { nombre: 'REPARAR', descripcion: '+1 vida', costos: [30] },
  escudo: { nombre: 'ESCUDO', descripcion: 'Bloquea un golpe', costos: [20] },
}

export const JEFE = { vida: 320, puntos: 2000 }

export type Dificultad = 'facil' | 'normal' | 'dificil'

// Factores sobre los valores de NIVELES y JEFE; `puntos` compensa en el top 5 a quien juega más difícil.
export const DIFICULTADES: Record<
  Dificultad,
  { nombre: string; velocidad: number; intervalo: number; jefe: number; vidaEnemigos: number; vidas: number; probPowerUp: number; puntos: number }
> = {
  facil: { nombre: 'FÁCIL', velocidad: 0.8, intervalo: 1.3, jefe: 0.6, vidaEnemigos: 0.75, vidas: 5, probPowerUp: 0.15, puntos: 0.5 },
  normal: { nombre: 'NORMAL', velocidad: 1, intervalo: 1, jefe: 1, vidaEnemigos: 1, vidas: 3, probPowerUp: 0.1, puntos: 1 },
  dificil: { nombre: 'DIFÍCIL', velocidad: 1.25, intervalo: 0.75, jefe: 1.5, vidaEnemigos: 1.3, vidas: 2, probPowerUp: 0.07, puntos: 1.5 },
}

export function vidaJefe(d: Dificultad): number {
  return Math.round(JEFE.vida * DIFICULTADES[d].jefe)
}

export function vidaEnemigo(tipo: TipoEnemigo, nivel: number, d: Dificultad, elite: boolean): number {
  const base = ENEMIGOS[tipo].vida * (1 + SUBIDA_VIDA_POR_NIVEL * (nivel - 1)) * DIFICULTADES[d].vidaEnemigos
  return Math.max(1, Math.round(base)) * (elite ? 2 : 1)
}

// null = ese enemigo no dispara
export function intervaloDisparo(tipo: TipoEnemigo, nivel: number, d: Dificultad): number | null {
  const ms = ENEMIGOS[tipo].disparoMs
  if (!ms) return null
  return Math.round((ms * DIFICULTADES[d].intervalo) / (1 + SUBIDA_CADENCIA_POR_NIVEL * (nivel - 1)))
}

export interface Nivel {
  velocidad: number // px/s base de los enemigos
  intervaloMs: number // cada cuánto aparece un enemigo
  duracionS: number // segundos que dura el nivel
  enemigos: Partial<Record<TipoEnemigo, number>> // pesos de aparición
  elite: number // probabilidad de que un enemigo salga élite (dorado, x2 vida)
  formacion: number // probabilidad de que en vez de un enemigo baje un escuadrón de 5 drones
  eventos: TipoEvento[] // el evento sorpresa del nivel sale de esta lista
}

export const NIVELES: Nivel[] = [
  {
    velocidad: 170, intervaloMs: 800, duracionS: 30, elite: 0.03, formacion: 0.05, eventos: ['lluvia', 'carguero'],
    enemigos: { dron: 70, meteorito: 30 },
  },
  {
    velocidad: 190, intervaloMs: 720, duracionS: 30, elite: 0.05, formacion: 0.07, eventos: ['lluvia', 'carguero', 'miniJefe'],
    enemigos: { dron: 45, zigzag: 30, meteorito: 25 },
  },
  {
    velocidad: 210, intervaloMs: 650, duracionS: 35, elite: 0.08, formacion: 0.09, eventos: ['lluvia', 'carguero', 'miniJefe'],
    enemigos: { dron: 35, zigzag: 30, kamikaze: 20, meteorito: 15 },
  },
  {
    velocidad: 230, intervaloMs: 590, duracionS: 35, elite: 0.1, formacion: 0.11, eventos: ['lluvia', 'carguero', 'miniJefe'],
    enemigos: { dron: 30, zigzag: 25, kamikaze: 15, tirador: 20, meteorito: 10 },
  },
  {
    velocidad: 250, intervaloMs: 540, duracionS: 40, elite: 0.12, formacion: 0.13, eventos: ['lluvia', 'carguero', 'miniJefe'],
    enemigos: { dron: 25, zigzag: 20, kamikaze: 15, tirador: 20, acorazado: 10, meteorito: 10 },
  },
  {
    velocidad: 270, intervaloMs: 500, duracionS: 40, elite: 0.14, formacion: 0.15, eventos: ['lluvia', 'carguero', 'miniJefe'],
    enemigos: { dron: 20, zigzag: 20, kamikaze: 15, tirador: 18, acorazado: 9, orbe: 10, meteorito: 8 },
  },
]

export const MEJORAS_NAVE: TipoMejora[] = ['potencia', 'cadencia', 'alas', 'iman'] // completarlas evoluciona la nave
export const FASES_JEFE = [2 / 3, 1 / 3] // al cruzar estas fracciones de vida la Reina se retira
export const VIDAS_MAX = 5
export const VIDAS_MIN_NIVEL = 3 // al terminar un nivel se recupera hasta aquí
export const COMBO_VENTANA_S = 2.5
export const MULTIPLICADOR_MAX = 5
export const TRIPLE_S = 10
export const CADENCIA_BASE_MS = 170
export const CARGA_MAX = 100
export const CARGA_POR_DERRIBO = 3
export const CARGA_POR_ROCE = 8
export const SOBRECARGA_S = 6
export const PUNTOS_ROCE = 5

export interface Partida {
  dificultad: Dificultad
  nivel: number // empieza en 1
  vidas: number
  puntos: number
  tiempoRestante: number
  jefe: boolean // true cuando acabó el último nivel y toca pelear contra el jefe
  tienda: boolean // true entre niveles, mientras el hangar está abierto
  eventoHecho: boolean // el evento sorpresa de este nivel ya salió
  evolucionada: boolean // completó las mejoras: pilota el Fénix
  carga: number // barra de sobrecarga
  sobrecargaS: number // segundos restantes de sobrecarga activa
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
    eventoHecho: false,
    evolucionada: false,
    carga: 0,
    sobrecargaS: 0,
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

// Durante la sobrecarga la barra no se llena: se gana solo al terminarla.
function sumarCarga(p: Partida, cantidad: number): number {
  return p.sobrecargaS > 0 ? p.carga : Math.min(CARGA_MAX, p.carga + cantidad)
}

export function rozar(p: Partida): Partida {
  if (p.terminada) return p
  return { ...p, carga: sumarCarga(p, CARGA_POR_ROCE), puntos: p.puntos + ganancia(p, PUNTOS_ROCE) }
}

export function activarSobrecarga(p: Partida): Partida {
  if (p.terminada || p.carga < CARGA_MAX) return p
  return { ...p, carga: 0, sobrecargaS: SOBRECARGA_S }
}

export function pideEvento(p: Partida): boolean {
  if (p.eventoHecho || p.jefe || p.tienda || p.terminada) return false
  return p.tiempoRestante <= NIVELES[p.nivel - 1].duracionS * 0.55
}

export function marcarEvento(p: Partida): Partida {
  return { ...p, eventoHecho: true }
}

// `azar` en [0, 1): se inyecta para poder probarlo sin Math.random
export function elegirEvento(nivel: Nivel, azar: number): TipoEvento {
  return nivel.eventos[Math.floor(azar * nivel.eventos.length)]
}

export function invencible(p: Partida): boolean {
  return p.sobrecargaS > 0
}

export function recibirGolpe(p: Partida): Partida {
  if (p.terminada || invencible(p)) return p
  if (p.escudo) return { ...p, escudo: false, combo: 0 }
  const vidas = Math.max(0, p.vidas - 1)
  return { ...p, vidas, combo: 0, terminada: vidas === 0 }
}

export function destruir(p: Partida, tipo: TipoEnemigo, elite = false): Partida {
  if (p.terminada) return p
  return {
    ...p,
    puntos: p.puntos + ganancia(p, ENEMIGOS[tipo].puntos * (elite ? 2 : 1)),
    carga: sumarCarga(p, CARGA_POR_DERRIBO),
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
    sobrecargaS: Math.max(0, p.sobrecargaS - segundos),
    comboTiempo: Math.max(0, comboTiempo),
    combo: comboTiempo > 0 ? p.combo : 0,
  }
  if (p.jefe || p.tienda) return base
  const tiempoRestante = p.tiempoRestante - segundos
  if (tiempoRestante > 0) return { ...base, tiempoRestante }
  return { ...base, tiempoRestante: 0, tienda: true, vidas: Math.max(p.vidas, VIDAS_MIN_NIVEL) }
}

export function cruzaFaseJefe(vidaAntes: number, vidaDespues: number, vidaMax: number): boolean {
  if (vidaDespues <= 0) return false
  return FASES_JEFE.some((f) => vidaAntes > vidaMax * f && vidaDespues <= vidaMax * f)
}

export function salirDeTienda(p: Partida): Partida {
  if (!p.tienda) return p
  if (p.nivel >= NIVELES.length) return { ...p, tienda: false, jefe: true }
  return { ...p, tienda: false, eventoHecho: false, nivel: p.nivel + 1, tiempoRestante: NIVELES[p.nivel].duracionS }
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

export function evolucionCompleta(p: Partida): boolean {
  return MEJORAS_NAVE.every((t) => p.mejoras[t] >= MEJORAS[t].costos.length)
}

export function comprar(p: Partida, tipo: TipoMejora): Partida {
  const costo = costoMejora(p, tipo)
  if (costo === null || p.monedas < costo) return p
  const mejoras = { ...p.mejoras, [tipo]: p.mejoras[tipo] + 1 }
  const q = { ...p, monedas: p.monedas - costo, mejoras, evolucionada: evolucionCompleta({ ...p, mejoras }) }
  if (tipo === 'vida') return { ...q, vidas: q.vidas + 1 }
  if (tipo === 'escudo') return { ...q, escudo: true }
  return q
}

export const danioBala = (p: Partida) => 1 + p.mejoras.potencia + (p.sobrecargaS > 0 ? 2 : 0) + (p.evolucionada ? 2 : 0)
export const cadenciaMs = (p: Partida) =>
  Math.round((CADENCIA_BASE_MS * 0.8 ** p.mejoras.cadencia * (p.evolucionada ? 0.85 : 1)) / (p.sobrecargaS > 0 ? 2 : 1))
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
