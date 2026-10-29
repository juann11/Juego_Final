import Phaser from 'phaser'

// Sprites pixel art dibujados desde texto: cada letra es un color, '.' es transparente.
const PALETA: Record<string, number> = {
  b: 0xffffff,
  a: 0x2563eb,
  c: 0x38bdf8,
  r: 0xdc2626,
  o: 0xf97316,
  d: 0x7f1d1d,
  y: 0xfacc15,
  k: 0x0f172a,
  g: 0x94a3b8,
}

const SPRITES: Record<string, string[]> = {
  nave: [
    '....b....',
    '...bab...',
    '...bcb...',
    '..bacab..',
    '..baaab..',
    '.baaaaab.',
    'baabbbaab',
    'bab...bab',
    'b..o.o..b',
    '...y.y...',
  ],
  meteorito: [
    '..dddd..',
    '.droord.',
    'drooorrd',
    'drodoord',
    'droooodd',
    'drrorodd',
    '.drrrdd.',
    '..dddd..',
  ],
  corazon: ['.rr.rr.', 'rrrrrrr', 'rrbrrrr', '.rrrrr.', '..rrr..', '...r...'],
  // easter egg: la nave se convierte en un gato espacial
  gato: [
    '.y.....y.',
    '.yy...yy.',
    '.yyyyyyy.',
    'yykyyykyy',
    'yyyyyyyyy',
    'yyyyryyyy',
    '.yyyyyyy.',
    '.yy...yy.',
    '..o...o..',
    '..y...y..',
  ],
  estrella: ['b'],
  chispa: ['yo', 'oy'],
}

export function crearTexturas(escena: Phaser.Scene, tamPixel = 5) {
  for (const [clave, filas] of Object.entries(SPRITES)) {
    if (escena.textures.exists(clave)) continue
    const g = escena.make.graphics({}, false)
    filas.forEach((fila, y) =>
      [...fila].forEach((c, x) => {
        if (c === '.') return
        g.fillStyle(PALETA[c])
        g.fillRect(x * tamPixel, y * tamPixel, tamPixel, tamPixel)
      }),
    )
    g.generateTexture(clave, filas[0].length * tamPixel, filas.length * tamPixel)
    g.destroy()
  }
}
