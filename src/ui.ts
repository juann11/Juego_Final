import Phaser from 'phaser'
import { sonar } from './sonido'

// Paleta "Pixel Art" (ui-ux-pro-max): fondo oscuro, rojo = peligro, azul = jugador, verde = acción/puntaje.
export const COLOR = {
  fondo: 0x0f172a,
  tarjeta: 0x192134,
  rojo: 0xdc2626,
  azul: 0x2563eb,
  verde: 0x22c55e,
  texto: '#ffffff',
  textoSuave: '#94a3b8',
  textoVerde: '#22c55e',
  textoRojo: '#f87171',
}

export const FUENTE_TITULO = '"Press Start 2P"'
export const FUENTE_TEXTO = 'VT323'

export const ANCHO = 480
export const ALTO = 800

export function titulo(escena: Phaser.Scene, x: number, y: number, texto: string, tam = 20, color = COLOR.texto) {
  return escena.add
    .text(x, y, texto, { fontFamily: FUENTE_TITULO, fontSize: `${tam}px`, color, align: 'center', lineSpacing: 12 })
    .setOrigin(0.5)
}

export function texto(escena: Phaser.Scene, x: number, y: number, contenido: string, tam = 28, color = COLOR.texto) {
  return escena.add
    .text(x, y, contenido, { fontFamily: FUENTE_TEXTO, fontSize: `${tam}px`, color, align: 'center' })
    .setOrigin(0.5)
}

// Botón grande (>= 44px de alto para el dedo) con animación al presionar y sonido.
export function boton(escena: Phaser.Scene, y: number, etiqueta: string, alPulsar: () => void, color = COLOR.verde) {
  const fondo = escena.add.rectangle(0, 0, 300, 64, color).setStrokeStyle(4, 0xffffff)
  // texto oscuro sobre verde y blanco sobre azul: ambos superan contraste 4.5:1
  const rotulo = titulo(escena, 0, 2, etiqueta, 16, color === COLOR.verde ? '#0f172a' : COLOR.texto)
  const caja = escena.add.container(ANCHO / 2, y, [fondo, rotulo])
  fondo.setInteractive({ useHandCursor: true })
  fondo.on('pointerdown', () => escena.tweens.add({ targets: caja, scale: 0.92, duration: 60 }))
  fondo.on('pointerout', () => caja.setScale(1))
  fondo.on('pointerup', () => {
    escena.tweens.add({ targets: caja, scale: 1, duration: 120, ease: 'Back.easeOut' })
    sonar('clic')
    alPulsar()
  })
  return caja
}

// Transición con fundido a negro entre escenas.
export function irA(escena: Phaser.Scene, clave: string, datos?: object) {
  const camara = escena.cameras.main
  if (camara.fadeEffect.isRunning) return
  camara.fadeOut(220, 15, 23, 42)
  camara.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => escena.scene.start(clave, datos))
}

// Estrellas que caen de fondo; `velocidad` acelera la sensación de avance en el juego.
export function fondoEstrellas(escena: Phaser.Scene, velocidad = 1) {
  escena.cameras.main.setBackgroundColor(COLOR.fondo)
  const emisor = escena.add.particles(0, 0, 'estrella', {
    x: { min: 0, max: ANCHO },
    y: -10,
    lifespan: 12000 / velocidad,
    speedY: { min: 30 * velocidad, max: 90 * velocidad },
    scale: { min: 0.5, max: 1.2 },
    alpha: { min: 0.3, max: 1 },
    frequency: 90,
  })
  emisor.fastForward(10000 / velocidad)
  return emisor
}

// Editor de texto propio: window.prompt es poco confiable dentro del WebView de Android.
// Resuelve con lo que escribió el jugador, o null si cancela.
export function pedirTexto(pregunta: string, actual: string, maximo: number): Promise<string | null> {
  return new Promise((resolver) => {
    const fondo = document.createElement('div')
    fondo.style.cssText =
      'position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.88);touch-action:auto'
    const caja = document.createElement('form')
    caja.style.cssText =
      'box-sizing:border-box;width:100%;max-width:340px;display:flex;flex-direction:column;gap:16px;padding:24px;background:#192134;border:4px solid #22c55e;color:#fff;font-family:VT323,monospace'

    const campo = document.createElement('input')
    campo.id = 'campo-texto'
    campo.value = actual
    campo.maxLength = maximo
    campo.autocomplete = 'off'
    campo.setAttribute('autocapitalize', 'characters')
    // 16px evita el zoom automático del navegador móvil al enfocar
    campo.style.cssText =
      'box-sizing:border-box;width:100%;font:16px "Press Start 2P",monospace;padding:14px;background:#0f172a;color:#22c55e;border:3px solid #fff;text-transform:uppercase;user-select:text;outline-color:#facc15'

    const etiqueta = document.createElement('label')
    etiqueta.htmlFor = campo.id
    etiqueta.textContent = pregunta
    etiqueta.style.cssText = 'font-size:30px;text-align:center'

    const boton = (texto: string, tipo: 'submit' | 'button', fondoColor: string, color: string) => {
      const b = document.createElement('button')
      b.type = tipo
      b.textContent = texto
      b.style.cssText = `flex:1;min-height:52px;font:12px "Press Start 2P",monospace;background:${fondoColor};color:${color};border:3px solid #fff;cursor:pointer`
      return b
    }
    const fila = document.createElement('div')
    fila.style.cssText = 'display:flex;gap:12px'
    const cancelar = boton('CANCELAR', 'button', '#2563eb', '#fff')
    fila.append(cancelar, boton('GUARDAR', 'submit', '#22c55e', '#0f172a'))

    const cerrar = (valor: string | null) => {
      fondo.remove()
      resolver(valor)
    }
    caja.onsubmit = (e) => {
      e.preventDefault()
      cerrar(campo.value)
    }
    cancelar.onclick = () => cerrar(null)
    campo.onkeydown = (e) => e.key === 'Escape' && cerrar(null)

    caja.append(etiqueta, campo, fila)
    fondo.append(caja)
    document.body.append(fondo)
    campo.focus()
    campo.select()
  })
}
