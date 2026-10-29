# Esquiva Estelar

Juego arcade para Android: pilotas una nave y esquivas meteoritos durante 3 niveles, cada uno más rápido. Tienes 3 vidas; aguanta el tiempo de cada nivel para pasar al siguiente.

Entrega #4 - Final (Juego) · Aplicaciones Móviles · UPB.

## Secciones

| Escena | Qué hace |
|---|---|
| Splash | Logo animado y barra de carga (toca para saltar) |
| Home | Jugar, Puntajes, Créditos, nombre del piloto y sonido on/off |
| Juego | 3 niveles por tiempo, 3 vidas, puntos por meteorito esquivado |
| Puntajes | Resultado de la partida y top 5 guardado |
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
  logica/      partida.ts (niveles, vidas, tiempo), puntaje.ts (top 5)
  escenas/     Splash, Home, Juego, Puntajes, Creditos
  almacen.ts   persistencia
  sonido.ts    efectos con Web Audio
  texturas.ts  sprites pixel art
  ui.ts        paleta, fuentes, botones y transiciones
tests/         Vitest
android/       proyecto nativo generado por Capacitor
```
