/// <reference types="@capawesome/capacitor-android-edge-to-edge-support" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cc.lskl.souzou',
  appName: 'souzou',
  webDir: 'dist',
  server: {
    // Allow cleartext traffic and disable HTTPS requirement
    cleartext: true,
    androidScheme: 'http'
  },
  plugins: {
    CapacitorSQLite: {
      // iOS configuration
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      iosKeychainPrefix: 'souzou',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for Souzou'
      },
      // Android configuration
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for Souzou',
        biometricSubTitle: 'Log in using your biometric'
      }
    },
    EdgeToEdge: {
      // Use the theme's main content background color
      // This will be dynamically updated based on the current theme
      backgroundColor: '#1a1a1a'
    }
  }
};

export default config;
