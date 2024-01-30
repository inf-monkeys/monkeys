import { defineConfig } from 'vite';
import path from 'path';

import million from 'million/compiler';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    million.vite({ auto: true }),
    tsconfigPaths(),
    react(),
    TanStackRouterVite({
      routesDirectory: path.resolve(__dirname, './src/pages'),
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/'),
    },
  },
  server: {
    port: 2048,
  },
});
