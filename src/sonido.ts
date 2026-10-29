// Efectos tipo chiptune generados con Web Audio: sin archivos de audio que descargar ni licenciar.
import { cargar, guardar } from './almacen'

type Efecto = 'clic' | 'golpe' | 'nivel' | 'fin' | 'victoria' | 'secreto'

// [frecuencia Hz, duración s] tocadas en secuencia
const MELODIAS: Record<Efecto, [number, number][]> = {
  clic: [[880, 0.05]],
  golpe: [[160, 0.12], [80, 0.25]],
  nivel: [[523, 0.1], [659, 0.1], [784, 0.2]],
  fin: [[392, 0.15], [330, 0.15], [262, 0.4]],
  victoria: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.4]],
  secreto: [[1047, 0.08], [784, 0.08], [1047, 0.08], [1319, 0.3]],
}

let contexto: AudioContext | null = null
let activo = cargar('sonido', true)

export function sonidoActivo() {
  return activo
}

export function alternarSonido() {
  activo = !activo
  guardar('sonido', activo)
  return activo
}

export function sonar(efecto: Efecto) {
  if (!activo) return
  try {
    // El navegador solo permite crear/reanudar audio tras un toque del usuario.
    contexto ??= new AudioContext()
    if (contexto.state === 'suspended') void contexto.resume()
    let t = contexto.currentTime
    for (const [frecuencia, duracion] of MELODIAS[efecto]) {
      const osc = contexto.createOscillator()
      const volumen = contexto.createGain()
      osc.type = efecto === 'golpe' ? 'sawtooth' : 'square'
      osc.frequency.value = frecuencia
      volumen.gain.setValueAtTime(0.12, t)
      volumen.gain.exponentialRampToValueAtTime(0.001, t + duracion)
      osc.connect(volumen).connect(contexto.destination)
      osc.start(t)
      osc.stop(t + duracion)
      t += duracion
    }
  } catch {
    // sin Web Audio el juego sigue en silencio
  }
}
