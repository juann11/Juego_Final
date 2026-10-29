# Escuadrón Estelar

Shooter espacial para Android: pilotas un caza que dispara solo, derribas escuadrones enemigos durante 3 niveles y al final enfrentas al jefe. Tienes 3 vidas (hasta 5 con power-ups).

- **Enemigos:** dron (baja recto), zigzag (ondea), tirador (se detiene y te apunta) y meteorito (resistente). Cada nivel trae enemigos nuevos y más velocidad.
- **Jefe final:** barra de vida, ráfagas en abanico, disparos apuntados y modo furia a mitad de vida.
- **Power-ups:** disparo triple (10 s), escudo (absorbe un golpe) y vida extra.
- **Combos:** derribos seguidos suben el multiplicador hasta x5; un golpe o 2.5 s sin derribar lo reinician.
- **Pausa** con botón o al salir de la app; música chiptune y vibración al recibir golpes.

Entrega #4 - Final (Juego) · Aplicaciones Móviles · UPB.

## Secciones

| Escena | Qué hace |
|---|---|
| Splash | Logo animado y barra de carga (toca para saltar) |
| Home | Jugar, Puntajes, Créditos, nombre del piloto y sonido on/off |
| Juego | 3 niveles por tiempo + jefe final, vidas, combos y power-ups (con capa de Pausa) |
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
  logica/      partida.ts (niveles, vidas, combos, power-ups, jefe), puntaje.ts (top 5)
  escenas/     Splash, Home, Juego, Pausa, Puntajes, Creditos
  almacen.ts   persistencia
  sonido.ts    efectos y música con Web Audio
  texturas.ts  sprites pixel art
  ui.ts        paleta, fuentes, botones y transiciones
tests/         Vitest
android/       proyecto nativo generado por Capacitor
```
