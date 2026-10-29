# Escuadrón Estelar

Shooter espacial para Android: pilotas un caza que dispara solo, derribas escuadrones enemigos durante 3 niveles y al final enfrentas al jefe. Tienes 3 vidas (hasta 5 con power-ups; depende de la dificultad).

- **Enemigos que atacan:** dron (dispara recto), zigzag (ondea y te apunta), kamikaze (se marca en rojo y se lanza en picada), tirador (se detiene y te dispara) y meteorito (resistente). Cada nivel trae enemigos nuevos y más velocidad.
- **Monedas y Hangar:** los enemigos sueltan monedas (se atraen al pasar cerca). Al terminar cada nivel recibes un bono y se abre el **Hangar** para mejorar la nave antes del siguiente nivel o del jefe:

  | Mejora | Efecto | Precios |
  |---|---|---|
  | Potencia | +1 daño por bala | 25 · 60 · 110 |
  | Cadencia | Disparas un 20% más rápido por nivel | 20 · 50 · 90 |
  | Alas | Naves de apoyo que disparan contigo | 40 · 90 |
  | Imán | Atrae monedas desde más lejos | 15 · 35 |
  | Reparar | +1 vida (recomprable) | 30 |
  | Escudo | Bloquea un golpe (recomprable) | 20 |

  Se ajusta en `MEJORAS` de `src/logica/partida.ts`.
- **Jefe final:** barra de vida, ráfagas en abanico, disparos apuntados y modo furia a mitad de vida.
- **Power-ups:** disparo triple (10 s), escudo (absorbe un golpe) y vida extra.
- **Combos:** derribos seguidos suben el multiplicador hasta x5; un golpe o 2.5 s sin derribar lo reinician.
- **Dificultad** (se elige en el menú y se guarda):

  | | Fácil | Normal | Difícil |
  |---|---|---|---|
  | Velocidad enemigos | ×0.8 | ×1 | ×1.25 |
  | Tiempo entre enemigos | ×1.3 | ×1 | ×0.75 |
  | Vida del jefe | 132 | 220 | 330 |
  | Vidas iniciales | 5 | 3 | 2 |
  | Prob. power-up | 15% | 10% | 7% |
  | Puntos | ×0.5 | ×1 | ×1.5 |

  Se ajusta en `DIFICULTADES` de `src/logica/partida.ts`.
- **Pausa** con botón o al salir de la app; música chiptune y vibración al recibir golpes.

Entrega #4 - Final (Juego) · Aplicaciones Móviles · UPB.

## Secciones

| Escena | Qué hace |
|---|---|
| Splash | Logo animado y barra de carga (toca para saltar) |
| Home | Jugar, Puntajes, Créditos, nombre del piloto y sonido on/off |
| Juego | 3 niveles por tiempo + jefe final, vidas, combos, power-ups y monedas (con capa de Pausa) |
| Hangar | Tienda de mejoras entre niveles |
| Puntajes | Resultado, derribos y top 5 guardado |
| Créditos | Equipo, tecnologías y uso de IA |

**Persistencia:** top 5, nombre del piloto, sonido y modo secreto se guardan en `localStorage` (funciona igual en la app Android).
**Easter egg:** toca 5 veces el título en el menú. 🐱

## Stack

- **Phaser 3** (escenas, física arcade, tweens, partículas) + **TypeScript** + **Vite**
- **Capacitor** para generar el proyecto Android
- **Vitest** para la lógica del juego (`src/logica`)
- Sprites pixel art y sonidos chiptune generados por código (`src/texturas.ts`, `src/sonido.ts`): no hay assets de terceros que licenciar.

## Comandos

```bash
npm install
npm run dev        # jugar en el navegador (flechas o arrastrar el mouse)
npm test           # tests de la lógica
npm run android    # build web + copia al proyecto Android
npx cap open android   # abrir en Android Studio
```

## Publicar en Google Play

1. `npm run android` y `npx cap open android`.
2. En Android Studio: *Build → Generate Signed App Bundle / APK → Android App Bundle*, crea un keystore (guárdalo fuera del repo) y genera el `.aab`.
3. Sube el `.aab` en Play Console. Sube `versionCode` en `android/app/build.gradle` en cada nueva versión.

## Estructura

```
src/
  logica/      partida.ts (niveles, vidas, combos, power-ups, monedas, mejoras, jefe), puntaje.ts (top 5)
  escenas/     Splash, Home, Juego, Pausa, Hangar, Puntajes, Creditos
  almacen.ts   persistencia
  sonido.ts    efectos y música con Web Audio
  texturas.ts  sprites pixel art
  ui.ts        paleta, fuentes, botones y transiciones
tests/         Vitest
android/       proyecto nativo generado por Capacitor
```
