import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.upb.esquivaestelar',
  appName: 'Escuadrón Estelar',
  webDir: 'dist',
  plugins: {
    SystemBars: { style: 'DARK' }, // iconos claros: el juego siempre es oscuro
  },
};

export default config;
