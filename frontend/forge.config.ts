import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';

const config: ForgeConfig = {
  buildIdentifier: 'production',
  packagerConfig: {
    asar: true,
    // Keep dist and dist-electron in the packaged app; exclude heavy dev folders
    ignore: [
      /^\/release/,
      /^\/build/,
      /^\/android/,
      /^\/ios/,
      /^\/test(s)?/,
      /^\/cypress/,
      /^\/\.vscode/,
      /^\/\.git/,
      /^\/node_modules\/.vite\//,
    ],
  },
  makers: [
    new MakerSquirrel({ name: 'Souzou' }),
    new MakerZIP({}),
  ],
};

export default config;

