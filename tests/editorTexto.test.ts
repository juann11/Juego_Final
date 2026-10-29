// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pedirTexto } from '../src/editorTexto'

// Phaser escucha mouse/toque/teclado en `window`: si los eventos del editor llegan ahí,
// el toque en GUARDAR también "toca" el juego que está debajo y la tecla espacio se bloquea.
describe('pedirTexto', () => {
  afterEach(() => (document.body.innerHTML = ''))

  it.each(['mousedown', 'mouseup', 'touchstart', 'touchend', 'pointerdown', 'pointerup', 'keydown', 'keyup'])(
    'el evento %s dentro del editor no llega a window',
    (tipo) => {
      void pedirTexto('Nombre', 'PILOTO', 10)
      const espia = vi.fn()
      window.addEventListener(tipo, espia)
      document.getElementById('campo-texto')!.dispatchEvent(new Event(tipo, { bubbles: true }))
      window.removeEventListener(tipo, espia)
      expect(espia).not.toHaveBeenCalled()
    },
  )

  it.each(['a', ' ', 'Backspace'])('la tecla "%s" no se bloquea dentro del campo', (key) => {
    void pedirTexto('Nombre', 'PILOTO', 10)
    const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    document.getElementById('campo-texto')!.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
  })

  it('guardar devuelve lo escrito y cierra el editor', async () => {
    const promesa = pedirTexto('Nombre', 'PILOTO', 10)
    const campo = document.getElementById('campo-texto') as HTMLInputElement
    campo.value = 'juan jose'
    campo.form!.requestSubmit()
    await expect(promesa).resolves.toBe('juan jose')
    expect(document.getElementById('campo-texto')).toBeNull()
  })

  it('cancelar devuelve null', async () => {
    const promesa = pedirTexto('Nombre', 'PILOTO', 10)
    ;[...document.querySelectorAll('button')].find((b) => b.textContent === 'CANCELAR')!.click()
    await expect(promesa).resolves.toBeNull()
  })
})
