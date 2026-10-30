// Efectos y música tipo chiptune generados con Web Audio: sin archivos de audio que descargar ni licenciar.
import { cargar, guardar } from './almacen'

type Efecto =
  | 'clic' | 'golpe' | 'nivel' | 'fin' | 'victoria' | 'secreto'
  | 'disparo' | 'explosion' | 'powerup' | 'alerta' | 'escudo' | 'impacto' | 'moneda' | 'error' | 'picada' | 'roce' | 'sobrecarga' | 'motor' | 'evolucion' | 'final'

interface Sonido {
  notas: [number, number][] // [frecuencia Hz, duración s] en secuencia
  onda: OscillatorType
  vol: number
}

const EFECTOS: Record<Efecto, Sonido> = {
  clic: { notas: [[880, 0.05]], onda: 'square', vol: 0.1 },
  golpe: { notas: [[160, 0.12], [80, 0.25]], onda: 'sawtooth', vol: 0.15 },
  nivel: { notas: [[523, 0.1], [659, 0.1], [784, 0.2]], onda: 'square', vol: 0.1 },
  fin: { notas: [[392, 0.15], [330, 0.15], [262, 0.4]], onda: 'square', vol: 0.1 },
  victoria: { notas: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.4]], onda: 'square', vol: 0.1 },
  secreto: { notas: [[1047, 0.08], [784, 0.08], [1047, 0.08], [1319, 0.3]], onda: 'square', vol: 0.1 },
  disparo: { notas: [[1400, 0.03]], onda: 'square', vol: 0.02 },
  impacto: { notas: [[300, 0.03]], onda: 'square', vol: 0.03 },
  explosion: { notas: [[220, 0.05], [120, 0.08], [60, 0.15]], onda: 'sawtooth', vol: 0.09 },
  powerup: { notas: [[523, 0.06], [659, 0.06], [784, 0.06], [1047, 0.12]], onda: 'square', vol: 0.09 },
  alerta: { notas: [[880, 0.15], [660, 0.15], [880, 0.15], [660, 0.15], [880, 0.15], [660, 0.3]], onda: 'square', vol: 0.08 },
  escudo: { notas: [[300, 0.08], [600, 0.15]], onda: 'triangle', vol: 0.15 },
  moneda: { notas: [[1320, 0.04], [1760, 0.07]], onda: 'square', vol: 0.04 },
  error: { notas: [[140, 0.18]], onda: 'square', vol: 0.08 },
  picada: { notas: [[900, 0.06], [700, 0.06], [500, 0.08]], onda: 'sawtooth', vol: 0.04 },
  roce: { notas: [[1800, 0.05]], onda: 'sine', vol: 0.06 },
  sobrecarga: { notas: [[330, 0.07], [494, 0.07], [659, 0.07], [988, 0.07], [1319, 0.25]], onda: 'square', vol: 0.1 },
  evolucion: { notas: [[262, 0.1], [330, 0.1], [392, 0.1], [523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.15], [1319, 0.6]], onda: 'square', vol: 0.1 },
  final: {
    notas: [[392, 0.8], [440, 0.8], [523, 1.2], [494, 0.8], [440, 0.8], [392, 1.6], [330, 0.8], [392, 0.8], [440, 1.2], [392, 2.4]],
    onda: 'triangle',
    vol: 0.14,
  },
  motor: { notas: [[70, 0.3], [90, 0.3], [120, 0.3], [170, 0.4], [240, 0.5]], onda: 'sawtooth', vol: 0.08 },
}

let contexto: AudioContext | null = null
let activo = cargar('sonido', true)

export function sonidoActivo() {
  return activo
}

export function alternarSonido() {
  activo = !activo
  guardar('sonido', activo)
  if (!activo) detenerMusica()
  return activo
}

// El navegador solo permite crear/reanudar audio tras un toque del usuario.
function audio(): AudioContext | null {
  try {
    contexto ??= new AudioContext()
    if (contexto.state === 'suspended') void contexto.resume()
    return contexto
  } catch {
    return null // sin Web Audio el juego sigue en silencio
  }
}

function nota(ctx: AudioContext, frecuencia: number, inicio: number, duracion: number, onda: OscillatorType, vol: number) {
  const osc = ctx.createOscillator()
  const volumen = ctx.createGain()
  osc.type = onda
  osc.frequency.value = frecuencia
  volumen.gain.setValueAtTime(vol, inicio)
  volumen.gain.exponentialRampToValueAtTime(0.001, inicio + duracion)
  osc.connect(volumen).connect(ctx.destination)
  osc.start(inicio)
  osc.stop(inicio + duracion)
}

export function sonar(efecto: Efecto) {
  if (!activo) return
  const ctx = audio()
  if (!ctx) return
  const { notas, onda, vol } = EFECTOS[efecto]
  let t = ctx.currentTime
  for (const [frecuencia, duracion] of notas) {
    nota(ctx, frecuencia, t, duracion, onda, vol)
    t += duracion
  }
}

// Música de batalla: bajo de 16 corcheas (La-Fa-Sol-Mi) y melodía de 32; 0 = silencio.
const BAJO = [110, 110, 220, 110, 87, 87, 175, 87, 98, 98, 196, 98, 82, 82, 165, 82]
const MELODIA = [
  440, 0, 523, 659, 0, 659, 587, 523, 494, 0, 392, 494, 587, 0, 523, 494,
  440, 0, 523, 659, 0, 880, 784, 659, 587, 0, 494, 587, 659, 0, 0, 0,
]
const CORCHEA_S = 60 / 150 / 2
let intervalo: ReturnType<typeof setInterval> | undefined

export function iniciarMusica() {
  if (!activo || intervalo) return
  const ctx = audio()
  if (!ctx) return
  let paso = 0
  let siguiente = ctx.currentTime + 0.05
  // Programa las notas un poco por delante para que no haya cortes aunque el timer se atrase.
  intervalo = setInterval(() => {
    while (siguiente < ctx.currentTime + 0.3) {
      nota(ctx, BAJO[paso % BAJO.length], siguiente, CORCHEA_S * 0.9, 'triangle', 0.09)
      const m = MELODIA[paso % MELODIA.length]
      if (m) nota(ctx, m, siguiente, CORCHEA_S * 0.8, 'square', 0.025)
      siguiente += CORCHEA_S
      paso++
    }
  }, 100)
}

export function detenerMusica() {
  clearInterval(intervalo)
  intervalo = undefined
}
