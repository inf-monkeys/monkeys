import dotenv from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'vite';

import { mdx } from '@cyco130/vite-plugin-mdx';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react-swc';
import million from 'million/compiler';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults and fully supports es6-module', 'maintained node versions', 'not IE 11'],
      modernPolyfills: ['es.array.at'],
    }),
    mdx({
      // See https://mdxjs.com/advanced/plugins
      remarkPlugins: [
        // E.g. `remark-frontmatter`
      ],
      rehypePlugins: [],
    }),
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
      '/v1': {
        target: process.env.SERVER_ENDPOINT || 'https://ai.infmonkeys.com',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2015',
  },
});
