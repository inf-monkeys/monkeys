import dotenv from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'vite';

import { mdx } from '@cyco130/vite-plugin-mdx';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react-swc';
import legacy from '@vitejs/plugin-legacy';
import million from 'million/compiler';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
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
        target: process.env.SERVER_ENDPOINT || 'https://pioneer.infmonkeys.com',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2015',
  },
});
