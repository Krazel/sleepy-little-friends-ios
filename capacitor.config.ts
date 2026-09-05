import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.krazel.animalitosadormir',
  appName: 'Sleepy Little Friends',
  webDir: 'dist/native',
  ios: {
    backgroundColor: '#fbf5e9',
    contentInset: 'never',
    scrollEnabled: true,
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    webContentsDebuggingEnabled: false,
  },
};
export default config;
