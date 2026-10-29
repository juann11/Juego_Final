import { describe, expect, it } from 'vitest'
import { agregarPuntaje } from '../src/logica/puntaje'

const r = (nombre: string, puntos: number) => ({ nombre, puntos, fecha: '2026-10-28' })

describe('agregarPuntaje', () => {
  it('ordena de mayor a menor', () => {
    const top = agregarPuntaje([r('a', 50), r('b', 10)], r('c', 30))
    expect(top.map((x) => x.puntos)).toEqual([50, 30, 10])
  })

  it('guarda máximo 5 registros', () => {
    const lista = [r('a', 50), r('b', 40), r('c', 30), r('d', 20), r('e', 10)]
    const top = agregarPuntaje(lista, r('f', 5))
    expect(top).toHaveLength(5)
    expect(top.some((x) => x.nombre === 'f')).toBe(false)
  })

  it('no modifica la lista original', () => {
    const lista = [r('a', 50)]
    agregarPuntaje(lista, r('b', 60))
    expect(lista).toHaveLength(1)
  })
})
