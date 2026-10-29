import Phaser from 'phaser'
import { cargar, guardar } from '../almacen'
import {
  ENEMIGOS,
  DIFICULTADES,
  NIVELES,
  VIDAS_MAX,
  alas,
  aplicarPowerUp,
  avanzarTiempo,
  cadenciaMs,
  danioBala,
  derrotarJefe,
  destruir,
  elegirEnemigo,
  multiplicador,
  nuevaPartida,
  radioIman,
  recogerMonedas,
  salirDeTienda,
  vidaJefe,
  type Dificultad,
  recibirGolpe,
  type Partida,
  type TipoEnemigo,
  type TipoPowerUp,
} from '../logica/partida'
import { agregarPuntaje, type Registro } from '../logica/puntaje'
import { detenerMusica, iniciarMusica, sonar } from '../sonido'
import { ALTO, ANCHO, COLOR, fondoEstrellas, irA, texto, titulo } from '../ui'

type Sprite = Phaser.Physics.Arcade.Sprite
type Grupo = Phaser.Physics.Arcade.Group

const VEL_BALA = 650
const POWERUPS: TipoPowerUp[] = ['triple', 'triple', 'escudo', 'vida']
const TEXTURA_POWERUP: Record<TipoPowerUp, string> = { triple: 'pu-triple', escudo: 'pu-escudo', vida: 'corazon' }
const NOMBRE_POWERUP: Record<TipoPowerUp, string> = { triple: '¡DISPARO TRIPLE!', escudo: '¡ESCUDO!', vida: '¡VIDA EXTRA!' }

export class Juego extends Phaser.Scene {
  partida!: Partida // pública: el Hangar compra sobre ella
  private nave!: Sprite
  private escudoVisual!: Phaser.GameObjects.Arc
  private balas!: Grupo
  private enemigos!: Grupo
  private balasEnemigas!: Grupo
  private powerups!: Grupo
  private monedas!: Grupo
  private disparo?: Phaser.Time.TimerEvent
  private tick = 0
  private alasNaves: Phaser.GameObjects.Image[] = []
  private hudMonedas!: Phaser.GameObjects.Text
  private jefe?: Sprite
  private jefeActivo = false
  private vidaJefeMax = 0
  private barraJefe?: Phaser.GameObjects.Rectangle
  private generador?: Phaser.Time.TimerEvent
  private teclas?: Phaser.Types.Input.Keyboard.CursorKeys
  private invulnerable = false
  private corazones: Phaser.GameObjects.Image[] = []
  private hudPuntos!: Phaser.GameObjects.Text
  private hudCombo!: Phaser.GameObjects.Text
  private hudTiempo!: Phaser.GameObjects.Text
  private hudNivel!: Phaser.GameObjects.Text

  constructor() {
    super('Juego')
  }

  private get dif() {
    return DIFICULTADES[this.partida.dificultad]
  }

  create() {
    this.cameras.main.fadeIn(220, 15, 23, 42)
    // localStorage se puede editar a mano: si el valor no es válido, normal
    const guardada = cargar<Dificultad>('dificultad', 'normal')
    const dificultad = guardada in DIFICULTADES ? guardada : 'normal'
    this.partida = nuevaPartida(dificultad)
    this.vidaJefeMax = vidaJefe(dificultad)
    this.invulnerable = false
    this.jefe = undefined
    this.jefeActivo = false
    this.alasNaves = []
    fondoEstrellas(this, 2)
    fondoEstrellas(this, 5).setAlpha(0.5)

    this.nave = this.physics.add.sprite(ANCHO / 2, ALTO - 120, cargar('secreto', false) ? 'gato' : 'nave')
    this.nave.setScale(1.3).setCollideWorldBounds(true).setDepth(2)
    // Caja de choque más pequeña que el sprite para que los roces se sientan justos
    this.nave.body!.setSize(this.nave.width * 0.45, this.nave.height * 0.6)
    this.escudoVisual = this.add.circle(0, 0, 44).setStrokeStyle(3, 0x38bdf8).setVisible(false).setDepth(2)
    this.tweens.add({ targets: this.escudoVisual, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 })

    this.balas = this.physics.add.group()
    this.enemigos = this.physics.add.group()
    this.balasEnemigas = this.physics.add.group()
    this.powerups = this.physics.add.group()
    this.monedas = this.physics.add.group()
    this.physics.add.overlap(this.balas, this.enemigos, (b, e) => this.impactar(b as Sprite, e as Sprite))
    this.physics.add.overlap(this.nave, this.monedas, (_n, m) => this.recogerMoneda(m as Sprite))
    this.physics.add.overlap(this.nave, this.enemigos, (_n, e) => this.chocar(e as Sprite))
    this.physics.add.overlap(this.nave, this.balasEnemigas, (_n, b) => this.chocar(b as Sprite))
    this.physics.add.overlap(this.nave, this.powerups, (_n, p) => this.recoger(p as Sprite))

    // Arrastre relativo: el dedo puede ir en cualquier parte sin tapar la nave.
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown || this.partida.terminada) return
      this.moverNave((p.x - p.prevPosition.x) * 1.3, (p.y - p.prevPosition.y) * 1.3)
    })
    this.teclas = this.input.keyboard?.createCursorKeys()
    this.aplicarMejoras()

    this.crearHud()
    this.mostrarTutorial()
    this.configurarNivel()
    iniciarMusica()

    // Si la app pasa a segundo plano, pausa.
    // (this.events sobrevive al reiniciar la escena, por eso se quitan los listeners en SHUTDOWN)
    const alOcultar = () => this.pausar()
    this.game.events.on(Phaser.Core.Events.HIDDEN, alOcultar)
    this.events.on(Phaser.Scenes.Events.RESUME, iniciarMusica)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.HIDDEN, alOcultar)
      this.events.off(Phaser.Scenes.Events.RESUME, iniciarMusica)
      detenerMusica()
    })
  }

  update(_t: number, delta: number) {
    if (this.partida.terminada) return
    const antes = this.partida
    this.partida = avanzarTiempo(this.partida, delta / 1000)
    if (this.partida.tienda && !antes.tienda) this.completarNivel()

    const vel = 0.5 * delta
    if (this.teclas?.left.isDown) this.moverNave(-vel, 0)
    if (this.teclas?.right.isDown) this.moverNave(vel, 0)
    if (this.teclas?.up.isDown) this.moverNave(0, -vel)
    if (this.teclas?.down.isDown) this.moverNave(0, vel)
    this.escudoVisual.setPosition(this.nave.x, this.nave.y).setVisible(this.partida.escudo)
    // las alas siguen a la nave con un poco de retraso
    this.alasNaves.forEach((a, i) => {
      a.x = Phaser.Math.Linear(a.x, this.nave.x + (i % 2 ? 55 : -55), 0.2)
      a.y = Phaser.Math.Linear(a.y, this.nave.y + 25, 0.2)
    })
    this.atraerMonedas()

    this.moverEnemigos()
    if (this.jefeActivo) this.moverJefe()
    this.limpiarFueraDePantalla()
    this.actualizarHud()
  }

  // ---------- jugador ----------

  private moverNave(dx: number, dy: number) {
    this.nave.x = Phaser.Math.Clamp(this.nave.x + dx, 24, ANCHO - 24)
    this.nave.y = Phaser.Math.Clamp(this.nave.y + dy, ALTO * 0.35, ALTO - 40)
    this.nave.setAngle(Phaser.Math.Clamp(dx * 2, -18, 18))
  }

  private disparar() {
    if (this.partida.terminada) return
    const angulos = this.partida.tripleS > 0 ? [-12, 0, 12] : [0]
    for (const a of angulos) this.crearBala(this.nave.x, this.nave.y - 34, a)
    // las alas disparan un tiro de cada dos
    if (this.tick++ % 2 === 0) for (const a of this.alasNaves) this.crearBala(a.x, a.y - 20, 0)
    sonar('disparo')
  }

  private crearBala(x: number, y: number, angulo: number) {
    const b = this.balas.create(x, y, 'bala') as Sprite
    const rad = Phaser.Math.DegToRad(angulo)
    b.setVelocity(Math.sin(rad) * VEL_BALA, -Math.cos(rad) * VEL_BALA).setAngle(angulo)
  }

  // Cadencia y alas dependen de las mejoras compradas en el Hangar.
  private aplicarMejoras() {
    this.disparo?.remove()
    this.disparo = this.time.addEvent({ delay: cadenciaMs(this.partida), loop: true, callback: () => this.disparar() })
    while (this.alasNaves.length < alas(this.partida)) {
      const a = this.add.image(this.nave.x, this.nave.y + 40, 'ala').setScale(1.3).setDepth(2)
      this.tweens.add({ targets: a, scale: { from: 0, to: 1.3 }, duration: 400, ease: 'Back.easeOut' })
      this.alasNaves.push(a)
    }
  }

  // ---------- monedas y hangar ----------

  private soltarMonedas(x: number, y: number, cantidad: number) {
    for (let i = 0; i < cantidad; i++) {
      const m = this.monedas.create(x + Phaser.Math.Between(-12, 12), y, 'moneda') as Sprite
      m.setScale(1.4).setVelocity(Phaser.Math.Between(-70, 70), Phaser.Math.Between(-150, -60)).setAccelerationY(320)
      ;(m.body as Phaser.Physics.Arcade.Body).setMaxVelocityY(220)
      this.tweens.add({ targets: m, scaleX: 0.3, duration: 220, yoyo: true, repeat: -1 })
    }
  }

  private atraerMonedas() {
    const radio = radioIman(this.partida)
    for (const m of this.monedas.getChildren() as Sprite[]) {
      if (Phaser.Math.Distance.Between(m.x, m.y, this.nave.x, this.nave.y) > radio) continue
      m.setAcceleration(0)
      this.physics.moveToObject(m, this.nave, 520)
    }
  }

  private recogerMoneda(m: Sprite) {
    if (!m.active) return
    m.destroy()
    this.partida = recogerMonedas(this.partida, 1)
    sonar('moneda')
    this.tweens.add({ targets: this.hudMonedas, scale: { from: 1.4, to: 1 }, duration: 150 })
  }

  private completarNivel() {
    this.generador?.remove()
    this.invulnerable = true
    sonar('victoria')
    // limpia la pantalla: enemigos explotan y las monedas sueltas se cobran solas
    for (const e of [...this.enemigos.getChildren()] as Sprite[]) {
      this.explosion(e.x, e.y, 8)
      e.destroy()
    }
    this.balasEnemigas.clear(true, true)
    const sueltas = this.monedas.getLength()
    this.monedas.clear(true, true)
    const bono = 10 * this.partida.nivel
    this.partida = recogerMonedas(this.partida, sueltas + bono)
    this.banner('¡NIVEL\nCOMPLETADO!', COLOR.textoVerde)
    this.textoFlotante(ANCHO / 2, ALTO / 2 + 40, `Bono +${bono} monedas`, '#facc15', 32)
    this.time.delayedCall(2000, () => {
      detenerMusica()
      this.scene.launch('Hangar')
      this.scene.pause()
    })
  }

  // La llama el Hangar al pulsar CONTINUAR, justo antes de reanudar esta escena.
  continuarTrasHangar() {
    this.partida = salirDeTienda(this.partida)
    this.aplicarMejoras()
    this.invulnerable = false
    if (this.partida.jefe) return this.aparecerJefe()
    sonar('nivel')
    this.configurarNivel()
  }

  private chocar(objeto: Sprite, destruirObjeto = true) {
    if (this.invulnerable || this.partida.terminada) return
    this.explosion(objeto.x, objeto.y, 12)
    if (destruirObjeto) objeto.destroy()
    const teniaEscudo = this.partida.escudo
    this.partida = recibirGolpe(this.partida)
    this.invulnerable = true

    if (teniaEscudo) {
      sonar('escudo')
      this.cameras.main.flash(150, 56, 189, 248)
      this.time.delayedCall(500, () => (this.invulnerable = false))
      return
    }
    sonar('golpe')
    navigator.vibrate?.(120)
    this.cameras.main.shake(250, 0.015)
    if (this.partida.terminada) return this.terminar()
    // 1.2 s de invulnerabilidad con parpadeo
    this.tweens.add({
      targets: this.nave,
      alpha: 0.2,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.nave.setAlpha(1)
        this.invulnerable = false
      },
    })
  }

  private recoger(pu: Sprite) {
    const tipo = pu.getData('tipo') as TipoPowerUp
    pu.destroy()
    this.partida = aplicarPowerUp(this.partida, tipo)
    sonar('powerup')
    this.textoFlotante(this.nave.x, this.nave.y - 60, NOMBRE_POWERUP[tipo], '#facc15', 26)
  }

  // ---------- enemigos ----------

  private configurarNivel() {
    const nivel = NIVELES[this.partida.nivel - 1]
    this.generador?.remove()
    this.generador = this.time.addEvent({ delay: nivel.intervaloMs * this.dif.intervalo, loop: true, callback: () => this.lanzarEnemigo() })
    this.banner(`NIVEL ${this.partida.nivel}`)
  }

  private lanzarEnemigo() {
    const nivel = NIVELES[this.partida.nivel - 1]
    const tipo = elegirEnemigo(nivel, Math.random())
    const x = tipo === 'zigzag' ? Phaser.Math.Between(110, ANCHO - 110) : Phaser.Math.Between(30, ANCHO - 30)
    const e = this.enemigos.create(x, -40, tipo) as Sprite
    e.setData({ tipo, vida: ENEMIGOS[tipo].vida, baseX: x, t0: this.time.now })
    const v = nivel.velocidad * this.dif.velocidad * Phaser.Math.FloatBetween(0.85, 1.15)

    if (tipo === 'meteorito') {
      e.setScale(Phaser.Math.FloatBetween(1, 1.6))
      e.setVelocity(Phaser.Math.Between(-40, 40), v * 0.8).setAngularVelocity(Phaser.Math.Between(-150, 150))
    } else {
      e.setScale(1.3).setVelocityY(tipo === 'zigzag' ? v * 0.7 : tipo === 'kamikaze' ? v * 0.8 : v)
    }
    const disparoMs = ENEMIGOS[tipo].disparoMs
    if (disparoMs) e.setData('proxDisparo', this.time.now + Phaser.Math.Between(400, disparoMs))
    if (tipo === 'tirador') e.setData({ alto: Phaser.Math.Between(110, 260), salida: 0 })
    if (tipo === 'kamikaze') e.setData({ alto: Phaser.Math.Between(120, 280), fase: 'baja' })
  }

  private moverEnemigos() {
    const ahora = this.time.now
    for (const e of this.enemigos.getChildren() as Sprite[]) {
      const tipo = e.getData('tipo') as TipoEnemigo
      if (tipo === 'zigzag') e.x = e.getData('baseX') + Math.sin((ahora - e.getData('t0')) / 280) * 80
      if (tipo === 'kamikaze') this.moverKamikaze(e, ahora)
      if (tipo === 'tirador') this.moverTirador(e, ahora)

      // dron dispara recto; zigzag y tirador apuntan a la nave (solo si están en pantalla)
      const disparoMs = ENEMIGOS[tipo].disparoMs
      const puede = tipo !== 'tirador' || (e.getData('salida') && ahora < e.getData('salida'))
      if (!disparoMs || !puede || e.y < 30 || e.y > ALTO * 0.6 || ahora < e.getData('proxDisparo')) continue
      if (tipo === 'dron') (this.balasEnemigas.create(e.x, e.y + 20, 'balaEnemiga') as Sprite).setVelocityY(260)
      else this.dispararA(e.x, e.y + 24, 280)
      e.setData('proxDisparo', ahora + disparoMs * this.dif.intervalo)
    }
  }

  // El tirador baja, se queda quieto disparando unos segundos y luego se va.
  private moverTirador(e: Sprite, ahora: number) {
    if (!e.getData('salida') && e.y >= e.getData('alto')) {
      e.setVelocityY(0).setData({ salida: ahora + 6000, proxDisparo: ahora + 500 })
    }
    const salida = e.getData('salida')
    if (salida && ahora > salida) e.setVelocityY(NIVELES[this.partida.nivel - 1].velocidad * this.dif.velocidad)
  }

  // El kamikaze baja, se detiene parpadeando en rojo (aviso) y se lanza en picada hacia la nave.
  private moverKamikaze(e: Sprite, ahora: number) {
    const fase = e.getData('fase')
    if (fase === 'baja' && e.y >= e.getData('alto')) {
      e.setVelocity(0).setData({ fase: 'carga', picada: ahora + 700 })
      this.tweens.add({ targets: e, alpha: 0.3, duration: 90, yoyo: true, repeat: 3, onStart: () => e.setTint(0xff4444) })
    }
    if (fase === 'carga' && ahora > e.getData('picada')) {
      e.setData('fase', 'picada').setAlpha(1)
      this.physics.moveToObject(e, this.nave, 480 * this.dif.velocidad)
      e.setRotation(Phaser.Math.Angle.Between(e.x, e.y, this.nave.x, this.nave.y) - Math.PI / 2)
      sonar('picada')
    }
  }

  private impactar(bala: Sprite, enemigo: Sprite) {
    // una bala puede tocar a dos enemigos en el mismo frame: solo cuenta la primera
    if (!bala.active || !enemigo.active) return
    bala.destroy()
    const vida = enemigo.getData('vida') - danioBala(this.partida)
    enemigo.setData('vida', vida)
    this.destello(enemigo)
    if (vida > 0) return sonar('impacto')

    const tipo = enemigo.getData('tipo') as TipoEnemigo
    const multAntes = multiplicador(this.partida)
    const puntosAntes = this.partida.puntos
    this.partida = destruir(this.partida, tipo)
    const mult = multiplicador(this.partida)
    sonar('explosion')
    this.explosion(enemigo.x, enemigo.y, tipo === 'meteorito' ? 14 : 10)
    this.textoFlotante(enemigo.x, enemigo.y, `+${this.partida.puntos - puntosAntes}`, mult > 1 ? '#facc15' : COLOR.texto)
    if (mult > multAntes) this.textoFlotante(ANCHO / 2, ALTO / 2, `¡COMBO x${mult}!`, COLOR.textoVerde, 40)
    if (Math.random() < this.dif.probPowerUp) this.soltarPowerUp(enemigo.x, enemigo.y)
    this.soltarMonedas(enemigo.x, enemigo.y, ENEMIGOS[tipo].monedas)
    enemigo.destroy()
  }

  private soltarPowerUp(x: number, y: number) {
    let tipo = Phaser.Utils.Array.GetRandom(POWERUPS)
    if (tipo === 'vida' && this.partida.vidas >= VIDAS_MAX) tipo = 'escudo'
    const pu = this.powerups.create(x, y, TEXTURA_POWERUP[tipo]) as Sprite
    pu.setData('tipo', tipo).setVelocityY(110).setScale(1.3)
    this.tweens.add({ targets: pu, scale: 1.6, duration: 300, yoyo: true, repeat: -1 })
  }

  private dispararA(x: number, y: number, velocidad: number) {
    const b = this.balasEnemigas.create(x, y, 'balaEnemiga') as Sprite
    this.physics.moveToObject(b, this.nave, velocidad)
  }

  // ---------- jefe ----------

  private aparecerJefe() {
    this.generador?.remove()
    sonar('alerta')
    this.banner('¡ALERTA!\nJEFE FINAL', COLOR.textoRojo)
    const jefe = this.physics.add.sprite(ANCHO / 2, -120, 'jefe').setScale(2).setDepth(1)
    jefe.body.setSize(jefe.width * 0.9, jefe.height * 0.7)
    jefe.setData({ vida: this.vidaJefeMax, proxAbanico: 0, proxApuntado: 0 })
    this.jefe = jefe
    this.physics.add.overlap(jefe, this.balas, (_j, b) => this.impactarJefe(b as Sprite))
    this.physics.add.overlap(this.nave, jefe, () => this.chocar(jefe, false))

    this.add.rectangle(ANCHO / 2, 92, 404, 16, 0xffffff).setDepth(5)
    this.barraJefe = this.add.rectangle(ANCHO / 2 - 200, 92, 400, 12, COLOR.rojo).setOrigin(0, 0.5).setDepth(5)
    this.tweens.add({
      targets: jefe,
      y: 170,
      duration: 2500,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.jefeActivo = true
        jefe.setData({ proxAbanico: this.time.now + 800, proxApuntado: this.time.now + 2000 })
      },
    })
  }

  private moverJefe() {
    const jefe = this.jefe!
    const ahora = this.time.now
    const furia = jefe.getData('vida') <= this.vidaJefeMax / 2
    jefe.x = ANCHO / 2 + Math.sin(ahora / (furia ? 600 : 900)) * 140
    if (ahora > jefe.getData('proxAbanico')) {
      // abanico de balas hacia abajo
      const n = furia ? 9 : 7
      for (let i = 0; i < n; i++) {
        const ang = Phaser.Math.DegToRad(50 + (80 / (n - 1)) * i)
        const b = this.balasEnemigas.create(jefe.x, jefe.y + 40, 'balaEnemiga') as Sprite
        b.setVelocity(Math.cos(ang) * 220, Math.sin(ang) * 220)
      }
      jefe.setData('proxAbanico', ahora + (furia ? 1300 : 1900) * this.dif.intervalo)
    }
    if (ahora > jefe.getData('proxApuntado')) {
      for (let i = 0; i < 3; i++) this.time.delayedCall(i * 150, () => this.jefeActivo && this.dispararA(jefe.x, jefe.y + 40, 320))
      jefe.setData('proxApuntado', ahora + (furia ? 1800 : 2800) * this.dif.intervalo)
    }
  }

  private impactarJefe(bala: Sprite) {
    if (!bala.active) return
    bala.destroy()
    const jefe = this.jefe!
    if (!this.jefeActivo) return
    const vidaAntes = jefe.getData('vida')
    const vida = vidaAntes - danioBala(this.partida)
    jefe.setData('vida', vida)
    this.destello(jefe)
    sonar('impacto')
    this.barraJefe!.width = 400 * Math.max(0, vida / this.vidaJefeMax)
    const mitad = this.vidaJefeMax / 2
    if (vidaAntes > mitad && vida <= mitad && vida > 0) {
      this.textoFlotante(ANCHO / 2, ALTO / 2, '¡MODO FURIA!', COLOR.textoRojo, 40)
      jefe.setTint(0xff8888)
    }
    if (vida > 0) return

    // Jefe derrotado: cadena de explosiones y victoria
    this.jefeActivo = false
    this.partida = derrotarJefe(this.partida)
    this.balasEnemigas.clear(true, true)
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 140, () => {
        this.explosion(jefe.x + Phaser.Math.Between(-80, 80), jefe.y + Phaser.Math.Between(-40, 40), 18)
        sonar('explosion')
        this.cameras.main.shake(120, 0.01)
      })
    }
    this.time.delayedCall(1200, () => jefe.destroy())
    this.terminar()
  }

  // ---------- fin de partida ----------

  private terminar() {
    const { puntos, gano, nivel, derribados } = this.partida
    this.generador?.remove()
    detenerMusica()
    if (!gano) this.physics.pause()
    this.nave.body!.enable = false
    const registro: Registro = { nombre: cargar('nombre', 'PILOTO'), puntos, fecha: new Date().toLocaleDateString('sv'), dificultad: this.partida.dificultad } // 'sv' = AAAA-MM-DD en hora local
    guardar('top', agregarPuntaje(cargar<Registro[]>('top', []), registro))
    this.time.delayedCall(gano ? 1300 : 0, () => {
      sonar(gano ? 'victoria' : 'fin')
      this.banner(gano ? '¡VICTORIA!' : 'GAME OVER', gano ? COLOR.textoVerde : COLOR.textoRojo)
    })
    this.time.delayedCall(gano ? 3200 : 1800, () => irA(this, 'Puntajes', { resultado: { ...registro, gano, nivel, derribados } }))
  }

  private pausar() {
    if (this.partida.terminada || !this.scene.isActive()) return
    detenerMusica()
    this.scene.launch('Pausa')
    this.scene.pause()
  }

  // ---------- efectos y HUD ----------

  private limpiarFueraDePantalla() {
    const fuera = (o: Sprite) => o.y > ALTO + 60 || o.y < -60 || o.x < -60 || o.x > ANCHO + 60
    for (const g of [this.balas, this.enemigos, this.balasEnemigas, this.powerups, this.monedas]) {
      for (const o of [...g.getChildren()] as Sprite[]) {
        // los enemigos nacen en y=-40: no se limpian por arriba
        if (g === this.enemigos ? o.y > ALTO + 60 || o.x < -80 || o.x > ANCHO + 80 : fuera(o)) o.destroy()
      }
    }
  }

  private destello(objetivo: Sprite) {
    objetivo.setTintFill(0xffffff)
    this.time.delayedCall(50, () => {
      if (!objetivo.active) return
      objetivo.clearTint()
      if (objetivo === this.jefe && objetivo.getData('vida') <= this.vidaJefeMax / 2) objetivo.setTint(0xff8888)
    })
  }

  private explosion(x: number, y: number, cantidad: number) {
    this.add
      .particles(x, y, 'chispa', { speed: { min: 60, max: 260 }, lifespan: 500, scale: { start: 1.6, end: 0 }, emitting: false })
      .setDepth(3)
      .explode(cantidad)
  }

  private textoFlotante(x: number, y: number, mensaje: string, color: string, tam = 28) {
    const t = texto(this, x, y, mensaje, tam, color).setDepth(6)
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 900, ease: 'Sine.easeOut', onComplete: () => t.destroy() })
  }

  private mostrarTutorial() {
    const t = texto(this, ANCHO / 2, ALTO - 260, 'Arrastra el dedo para moverte\nTu nave dispara sola', 30, COLOR.textoSuave).setDepth(6)
    this.tweens.add({ targets: t, alpha: 0, delay: 3000, duration: 600, onComplete: () => t.destroy() })
  }

  private crearHud() {
    // depth 5: el HUD queda por encima de todo lo que vuela
    this.add.rectangle(ANCHO / 2, 38, ANCHO, 76, COLOR.fondo, 0.75).setDepth(5)
    this.corazones = Array.from({ length: VIDAS_MAX }, (_, i) => this.add.image(26 + i * 40, 56, 'corazon').setDepth(5))
    this.hudPuntos = titulo(this, 16, 20, '', 14).setOrigin(0, 0.5).setDepth(5)
    this.hudCombo = titulo(this, 240, 20, '', 14, '#facc15').setDepth(5)
    this.hudTiempo = titulo(this, 232, 56, '', 14).setDepth(5)
    this.add.image(316, 56, 'moneda').setScale(1.2).setDepth(5)
    this.hudMonedas = titulo(this, 334, 56, '', 14, '#facc15').setOrigin(0, 0.5).setDepth(5)
    this.hudNivel = titulo(this, ANCHO - 16, 20, '', 12, COLOR.textoVerde).setOrigin(1, 0.5).setDepth(5)
    titulo(this, ANCHO - 30, 56, 'II', 16)
      .setDepth(5)
      .setPadding(14)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        sonar('clic')
        this.pausar()
      })
    this.actualizarHud()
  }

  private actualizarHud() {
    const p = this.partida
    this.corazones.forEach((c, i) => c.setVisible(i < Math.max(p.vidas, this.dif.vidas)).setAlpha(i < p.vidas ? 1 : 0.15))
    this.hudPuntos.setText(`${p.puntos}`)
    const mult = multiplicador(p)
    this.hudCombo.setText(mult > 1 ? `x${mult}` : '')
    this.hudTiempo.setText(p.jefe ? 'JEFE' : `${Math.ceil(p.tiempoRestante)}s`)
    this.hudMonedas.setText(`${p.monedas}`)
    this.hudNivel.setText(`NIVEL ${p.nivel}/${NIVELES.length}`)
  }

  private banner(mensaje: string, color = COLOR.texto) {
    const t = titulo(this, ANCHO / 2, ALTO / 2 - 60, mensaje, 28, color).setScale(0).setDepth(10)
    this.tweens.chain({
      targets: t,
      tweens: [
        { scale: 1, duration: 350, ease: 'Back.easeOut' },
        { alpha: 0, delay: 1100, duration: 300 },
      ],
      onComplete: () => t.destroy(),
    })
  }
}
