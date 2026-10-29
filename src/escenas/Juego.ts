import Phaser from 'phaser'
import { cargar, guardar } from '../almacen'
import { NIVELES, VIDAS_INICIALES, avanzarTiempo, esquivar, nuevaPartida, recibirGolpe, type Partida } from '../logica/partida'
import { agregarPuntaje, type Registro } from '../logica/puntaje'
import { sonar } from '../sonido'
import { ALTO, ANCHO, COLOR, fondoEstrellas, irA, titulo } from '../ui'

type Sprite = Phaser.Physics.Arcade.Sprite

export class Juego extends Phaser.Scene {
  private partida!: Partida
  private nave!: Sprite
  private meteoritos!: Phaser.Physics.Arcade.Group
  private generador?: Phaser.Time.TimerEvent
  private teclas?: Phaser.Types.Input.Keyboard.CursorKeys
  private objetivoX = ANCHO / 2
  private invulnerable = false
  private corazones: Phaser.GameObjects.Image[] = []
  private hudPuntos!: Phaser.GameObjects.Text
  private hudTiempo!: Phaser.GameObjects.Text
  private hudNivel!: Phaser.GameObjects.Text

  constructor() {
    super('Juego')
  }

  create() {
    this.cameras.main.fadeIn(220, 15, 23, 42)
    this.partida = nuevaPartida()
    this.invulnerable = false
    this.objetivoX = ANCHO / 2
    fondoEstrellas(this, 3)

    this.nave = this.physics.add.sprite(ANCHO / 2, ALTO - 110, cargar('secreto', false) ? 'gato' : 'nave')
    this.nave.setScale(1.6).setCollideWorldBounds(true)
    // Caja de choque más pequeña que el sprite para que los roces se sientan justos
    this.nave.body!.setSize(this.nave.width * 0.6, this.nave.height * 0.7)

    this.meteoritos = this.physics.add.group()
    this.physics.add.overlap(this.nave, this.meteoritos, (_n, m) => this.chocar(m as Sprite))

    // Control: arrastrar el dedo (o mouse); flechas del teclado para probar en PC.
    const seguir = (p: Phaser.Input.Pointer) => (this.objetivoX = p.x)
    this.input.on('pointerdown', seguir)
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => p.isDown && seguir(p))
    this.teclas = this.input.keyboard?.createCursorKeys()

    this.crearHud()
    this.configurarNivel()
  }

  update(_t: number, delta: number) {
    if (this.partida.terminada) return
    const nivelAntes = this.partida.nivel
    this.partida = avanzarTiempo(this.partida, delta / 1000)
    if (this.partida.terminada) return this.terminar()
    if (this.partida.nivel !== nivelAntes) {
      sonar('nivel')
      this.configurarNivel()
    }

    if (this.teclas?.left.isDown) this.objetivoX -= 0.6 * delta
    if (this.teclas?.right.isDown) this.objetivoX += 0.6 * delta
    this.objetivoX = Phaser.Math.Clamp(this.objetivoX, 20, ANCHO - 20)
    const antes = this.nave.x
    this.nave.x = Phaser.Math.Linear(this.nave.x, this.objetivoX, 0.25)
    this.nave.setAngle(Phaser.Math.Clamp((this.nave.x - antes) * 3, -20, 20))

    for (const m of [...this.meteoritos.getChildren()] as Sprite[]) {
      if (m.y > ALTO + 40) {
        m.destroy()
        this.partida = esquivar(this.partida)
      }
    }
    this.actualizarHud()
  }

  private configurarNivel() {
    const nivel = NIVELES[this.partida.nivel - 1]
    this.generador?.remove()
    this.generador = this.time.addEvent({ delay: nivel.intervaloMs, loop: true, callback: () => this.lanzarMeteorito(nivel.velocidad) })
    this.banner(`NIVEL ${this.partida.nivel}`)
  }

  private lanzarMeteorito(velocidad: number) {
    const m = this.meteoritos.create(Phaser.Math.Between(24, ANCHO - 24), -40, 'meteorito') as Sprite
    m.setScale(Phaser.Math.FloatBetween(0.9, 1.7))
    m.setVelocity(Phaser.Math.Between(-40, 40), velocidad * Phaser.Math.FloatBetween(0.85, 1.15))
    m.setAngularVelocity(Phaser.Math.Between(-200, 200))
    m.body!.setCircle(m.width * 0.4, m.width * 0.1, m.height * 0.1)
  }

  private chocar(meteorito: Sprite) {
    if (this.invulnerable || this.partida.terminada) return
    this.add.particles(meteorito.x, meteorito.y, 'chispa', {
      speed: { min: 80, max: 240 },
      lifespan: 500,
      scale: { start: 1.5, end: 0 },
      emitting: false,
    }).explode(16)
    meteorito.destroy()
    this.partida = recibirGolpe(this.partida)
    sonar('golpe')
    this.cameras.main.shake(220, 0.012)
    this.actualizarHud()
    if (this.partida.terminada) return this.terminar()

    // 1 segundo de invulnerabilidad con parpadeo
    this.invulnerable = true
    this.tweens.add({
      targets: this.nave,
      alpha: 0.2,
      duration: 100,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.nave.setAlpha(1)
        this.invulnerable = false
      },
    })
  }

  private terminar() {
    this.generador?.remove()
    this.physics.pause()
    const { puntos, gano, nivel } = this.partida
    const registro: Registro = { nombre: cargar('nombre', 'PILOTO'), puntos, fecha: new Date().toLocaleDateString('sv') } // 'sv' = AAAA-MM-DD en hora local
    guardar('top', agregarPuntaje(cargar<Registro[]>('top', []), registro))
    sonar(gano ? 'victoria' : 'fin')
    this.banner(gano ? '¡GANASTE!' : 'GAME OVER', gano ? COLOR.textoVerde : COLOR.textoRojo)
    this.time.delayedCall(1800, () => irA(this, 'Puntajes', { resultado: { ...registro, gano, nivel } }))
  }

  private crearHud() {
    // depth 5: el HUD queda por encima de los meteoritos
    this.add.rectangle(ANCHO / 2, 36, ANCHO, 72, COLOR.fondo, 0.7).setDepth(5)
    this.corazones = Array.from({ length: VIDAS_INICIALES }, (_, i) =>
      this.add.image(28 + i * 44, 52, 'corazon').setScale(1.1).setDepth(5),
    )
    this.hudPuntos = titulo(this, 16, 20, '', 14).setOrigin(0, 0.5).setDepth(5)
    this.hudTiempo = titulo(this, ANCHO / 2 + 40, 52, '', 14).setDepth(5)
    this.hudNivel = titulo(this, ANCHO - 16, 20, '', 14, COLOR.textoVerde).setOrigin(1, 0.5).setDepth(5)
    this.actualizarHud()
  }

  private actualizarHud() {
    const p = this.partida
    this.corazones.forEach((c, i) => c.setAlpha(i < p.vidas ? 1 : 0.15))
    this.hudPuntos.setText(`${p.puntos} PTS`)
    this.hudTiempo.setText(`${Math.ceil(p.tiempoRestante)}s`)
    this.hudTiempo.setColor(p.tiempoRestante < 5 ? COLOR.textoVerde : COLOR.texto)
    this.hudNivel.setText(`NIVEL ${p.nivel}/${NIVELES.length}`)
  }

  private banner(mensaje: string, color = COLOR.texto) {
    const t = titulo(this, ANCHO / 2, ALTO / 2 - 60, mensaje, 30, color).setScale(0).setDepth(10)
    this.tweens.chain({
      targets: t,
      tweens: [
        { scale: 1, duration: 350, ease: 'Back.easeOut' },
        { alpha: 0, delay: 900, duration: 300 },
      ],
      onComplete: () => t.destroy(),
    })
  }
}
