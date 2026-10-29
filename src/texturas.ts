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
  m: 0xa855f7,
  p: 0xec4899,
  v: 0x22c55e,
  e: 0x166534,
}

const SPRITES: Record<string, string[]> = {
  // caza del jugador
  nave: [
    '.....b.....',
    '....bab....',
    '....bcb....',
    '...bacab...',
    '.b.baaab.b.',
    'babaaaaabab',
    'baaaaaaaaab',
    'bab.aaa.bab',
    'b...bab...b',
    '....o.o....',
    '....y.y....',
  ],
  dron: [
    '.m.....m.',
    '.mm...mm.',
    'mmmpmpmmm',
    'mmpppppmm',
    '.mmkpkmm.',
    '..mm.mm..',
    '..m...m..',
  ],
  zigzag: [
    '..vvvvv..',
    '.vvbvbvv.',
    'vvvvvvvvv',
    'vevevevev',
    '.e.e.e.e.',
  ],
  tirador: [
    '...rrrrr...',
    '..roooooor.',
    '.rookkkoor.',
    'rrooooooorr',
    'r.rrrrrrr.r',
    'r..r...r..r',
    '...y...y...',
  ],
  jefe: [
    '....dddddddddddd....',
    '..ddrrrrrrrrrrrrdd..',
    '.drroookkookkooorrd.',
    'drrroooooooooooorrrd',
    'drrryyyyyyyyyyyyrrrd',
    'drrrrrrrrrrrrrrrrrrd',
    'dd.rrrr.rrrr.rrrr.dd',
    'd..rr...rrrr...rr..d',
    'd..oo...oooo...oo..d',
    '...yy....yy....yy...',
  ],
  kamikaze: [
    '.o.....o.',
    '.oo...oo.',
    '..ooroo..',
    '..orkro..',
    '...rrr...',
    '...yry...',
    '....y....',
  ],
  // nave de apoyo (mejora ALAS)
  ala: ['...b...', '..bcb..', '.baaab.', 'baaaaab', 'b.aaa.b', '..o.o..'],
  moneda: ['.yyy.', 'yyoyy', 'yoyoy', 'yyoyy', '.yyy.'],
  iman: ['rr...rr', 'rr...rr', 'rr...rr', 'rr...rr', 'grrrrrg', '.rrrrr.'],
  bala: ['c', 'b', 'c'],
  balaEnemiga: ['pp', 'pp'],
  'pu-triple': ['yyyyyyy', 'yc.c.cy', 'yc.c.cy', 'yc.c.cy', 'y.....y', 'yyyyyyy'],
  'pu-escudo': ['..ccc..', '.c...c.', 'c..b..c', 'c.bbb.c', 'c..b..c', '.c...c.', '..ccc..'],
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
