// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { cargar, guardar } from '../src/almacen'

describe('almacen', () => {
  beforeEach(() => localStorage.clear())

  it('devuelve el valor por defecto si no hay nada guardado', () => {
    expect(cargar('top', [])).toEqual([])
  })

  it('guarda y carga objetos', () => {
    guardar('ajustes', { sonido: false })
    expect(cargar('ajustes', { sonido: true })).toEqual({ sonido: false })
  })

  it('si el dato está corrupto devuelve el valor por defecto', () => {
    localStorage.setItem('esquiva-estelar:top', '{no es json')
    expect(cargar('top', [])).toEqual([])
  })
})
