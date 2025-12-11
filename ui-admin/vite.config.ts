import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = command === 'serve';
  const devTarget =
    env.VITE_SERVER_ENDPOINT || env.SERVER_ENDPOINT || 'http://localhost:3000';

  return {
    base: '/admin',
    plugins: [
      react(),
      tsconfigPaths(),
      TanStackRouterVite({
        routesDirectory: resolve(__dirname, './src/pages'),
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    // 仅开发环境使用代理，生产构建后直接走相对路径，由部署反代处理
    server: isDev
      ? {
          port: 3001,
          host: '::',
          proxy: {
            '/api': {
              target: devTarget,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  };
});
