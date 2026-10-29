import { describe, expect, it } from 'vitest'
import { MAX_NOMBRE, limpiarNombre } from '../src/logica/nombre'

describe('limpiarNombre', () => {
  it('pasa a mayúsculas y quita espacios de los extremos', () => {
    expect(limpiarNombre('  juan jose ')).toBe('JUAN JOSE')
  })

  it('junta espacios repetidos', () => {
    expect(limpiarNombre('jj    ospina')).toBe('JJ OSPINA')
  })

  it('corta al máximo de caracteres', () => {
    expect(limpiarNombre('abcdefghijklmnop')).toHaveLength(MAX_NOMBRE)
  })

  it('conserva tildes y ñ', () => {
    expect(limpiarNombre('josé ñandú')).toBe('JOSÉ ÑANDÚ')
  })

  it('vacío o solo espacios no es válido', () => {
    expect(limpiarNombre('')).toBeNull()
    expect(limpiarNombre('    ')).toBeNull()
  })
})
