import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cc.lskl.souzou',
  appName: 'souzou',
  webDir: 'dist',
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
    }
  }
};

export default config;
