// Guion del juego: un capítulo por nivel, más la escena del jefe y el epílogo.

export type Hablante = 'vega' | 'piloto' | 'reina'
export type Paisaje = 'base' | 'cristal' | 'nebulosa' | 'prision' | 'astillero' | 'puerta' | 'reina' | 'amanecer'

export interface Capitulo {
  etiqueta: string
  titulo: string
  fondo: number // color del espacio en la escena y en el nivel
  paisaje: Paisaje
  lineas: { quien: Hablante; texto: string }[]
}

export const CAPITULOS: Capitulo[] = [
  { etiqueta: 'CAPÍTULO 1', titulo: 'BASE AURORA', fondo: 0x0f172a, paisaje: 'base', lineas: [] },
  {
    etiqueta: 'CAPÍTULO 2',
    titulo: 'CINTURÓN DE CRISTAL',
    fondo: 0x0a2a33,
    paisaje: 'cristal',
    lineas: [
      { quien: 'vega', texto: 'Aquí la comandante Vega. Base Aurora cayó, pero los civiles escaparon gracias a ti, {nombre}.' },
      { quien: 'piloto', texto: '¿Quiénes son esas naves, comandante?' },
      { quien: 'vega', texto: 'Las llamamos el Enjambre. Te siguen por el Cinturón de Cristal. ¡Ojo con los que ondean!' },
    ],
  },
  {
    etiqueta: 'CAPÍTULO 3',
    titulo: 'NEBULOSA CARMESÍ',
    fondo: 0x2b0d1f,
    paisaje: 'nebulosa',
    lineas: [
      { quien: 'vega', texto: 'Entras en la Nebulosa Carmesí. Mis sensores se quedan ciegos aquí dentro.' },
      { quien: 'piloto', texto: 'Veo naves que se ponen rojas y se lanzan contra mí.' },
      { quien: 'vega', texto: '¡Kamikazes! Cuando se marquen en rojo, muévete o derríbalos antes.' },
    ],
  },
  {
    etiqueta: 'CAPÍTULO 4',
    titulo: 'LUNA PRISIÓN',
    fondo: 0x1e1b4b,
    paisaje: 'prision',
    lineas: [
      { quien: 'vega', texto: 'Esa luna es una prisión. El Enjambre tiene ahí a nuestros pilotos capturados.' },
      { quien: 'piloto', texto: 'No los voy a dejar atrás.' },
      { quien: 'vega', texto: 'Cuidado: sus tiradores vigilan desde lo alto y disparan en ráfaga.' },
    ],
  },
  {
    etiqueta: 'CAPÍTULO 5',
    titulo: 'ASTILLERO NEGRO',
    fondo: 0x1c1917,
    paisaje: 'astillero',
    lineas: [
      { quien: 'piloto', texto: 'Los prisioneros están a salvo. Hay algo enorme en el radar.' },
      { quien: 'vega', texto: 'El Astillero Negro. Ahí construyen sus acorazados. Hay que frenarlos, {nombre}.' },
      { quien: 'reina', texto: 'Una sola nave... qué valiente. Qué inútil.' },
    ],
  },
  {
    etiqueta: 'CAPÍTULO 6',
    titulo: 'PUERTA DEL ENJAMBRE',
    fondo: 0x2a1a05,
    paisaje: 'puerta',
    lineas: [
      { quien: 'vega', texto: 'Esa voz era la Reina del Enjambre. Su nave está tras la Puerta.' },
      { quien: 'piloto', texto: 'Entonces voy a cruzarla.' },
      { quien: 'vega', texto: 'Los orbes la protegen: disparan en todas direcciones. No te quedes quieto.' },
    ],
  },
]

export const CAPITULO_JEFE: Capitulo = {
  etiqueta: 'CAPÍTULO FINAL',
  titulo: 'LA REINA',
  fondo: 0x2a0a0a,
  paisaje: 'reina',
  lineas: [
    { quien: 'reina', texto: 'Llegaste hasta mí, {nombre}. Tu galaxia será parte del Enjambre.' },
    { quien: 'piloto', texto: 'Hoy se acaba esto.' },
    { quien: 'vega', texto: 'Toda la flota está contigo. ¡Termina con ella!' },
  ],
}

export const EPILOGO: Capitulo = {
  etiqueta: 'EPÍLOGO',
  titulo: 'AMANECER EN AURORA',
  fondo: 0x0f172a,
  paisaje: 'amanecer',
  lineas: [
    { quien: 'vega', texto: 'La Reina cayó y el Enjambre se dispersa. Lo lograste, {nombre}.' },
    { quien: 'piloto', texto: 'Volvamos a casa, comandante.' },
    { quien: 'vega', texto: 'Base Aurora te espera. El Escuadrón Estelar te da la bienvenida.' },
  ],
}

// La cinemática final, después de los créditos.
export const TEXTOS_FINAL = [
  'La guerra terminó.',
  'Nadie en la galaxia sabrá tu nombre, {nombre}.',
  'Pero aquí alguien te esperó cada noche.',
  'Por fin, a casa.',
]

export function conNombre(texto: string, nombre: string): string {
  return texto.replaceAll('{nombre}', nombre)
}
