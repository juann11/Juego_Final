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
    // con llaves: si el manejador devolviera `false` (e.key !== 'Escape'), el navegador cancelaría la tecla
    campo.onkeydown = (e) => {
      if (e.key === 'Escape') cerrar(null)
    }

    // Phaser escucha estos eventos en `window`: si les llegan, el toque en GUARDAR también toca
    // el juego de abajo (reabre el editor o cambia la dificultad) y la tecla espacio queda bloqueada.
    for (const tipo of ['mousedown', 'mouseup', 'touchstart', 'touchend', 'pointerdown', 'pointerup', 'keydown', 'keyup']) {
      fondo.addEventListener(tipo, (e) => e.stopPropagation())
    }

    caja.append(etiqueta, campo, fila)
    fondo.append(caja)
    document.body.append(fondo)
    campo.focus()
    campo.select()
  })
}
