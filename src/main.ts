import '@fontsource/press-start-2p'
import '@fontsource/vt323'
import './style.css'
import Phaser from 'phaser'
import { Creditos } from './escenas/Creditos'
import { Home } from './escenas/Home'
import { Juego } from './escenas/Juego'
import { Puntajes } from './escenas/Puntajes'
import { Splash } from './escenas/Splash'
import { ALTO, ANCHO, COLOR } from './ui'

// Phaser dibuja en canvas: hay que esperar las fuentes o el texto sale con la fuente por defecto.
Promise.all([document.fonts.load('16px "Press Start 2P"'), document.fonts.load('16px VT323')]).finally(() => {
  const juego = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'app',
    width: ANCHO,
    height: ALTO,
    backgroundColor: COLOR.fondo,
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade' },
    scene: [Splash, Home, Juego, Puntajes, Creditos],
  })
  // Solo en desarrollo: acceso desde la consola para depurar
  if (import.meta.env.DEV) Object.assign(window, { juego })
})
