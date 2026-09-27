import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timelinememo.app',
  appName: 'Timeline Memo',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
