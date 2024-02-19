import { defineConfig } from 'vite';
import { resolve } from 'path';
import dotenv from 'dotenv';

import svgr from 'vite-plugin-svgr';
import million from 'million/compiler';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    million.vite({ auto: true }),
    tsconfigPaths(),
    react(),
    svgr(),
    TanStackRouterVite({
      routesDirectory: resolve(__dirname, './src/pages'),
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 2048,
    proxy: {
      '/api': {
        target: process.env.SERVER_ENDPOINT || 'https://ai.infmonkeys.com',
        changeOrigin: true,
      },
    },
  },
});
