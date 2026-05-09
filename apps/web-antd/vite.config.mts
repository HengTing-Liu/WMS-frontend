import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@vben/vite-config';
import type { ConfigEnv } from 'vite';
import { loadEnv } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** WMS-frontend 仓库根（monorepo 根） */
const monorepoRoot = path.resolve(__dirname, '../..');
/** 构建产物与 dist.zip 输出到仓库根，便于交付与 Nginx 指向 */
const distAtRoot = path.join(monorepoRoot, 'dist');

export default defineConfig(async (config: ConfigEnv) => {
  const env = loadEnv(config.mode, process.cwd(), '');
  const backendTarget =
    env.VITE_DEV_PROXY_TARGET?.trim() || 'http://localhost:8087';
  const previewPort = Number.parseInt(
    env.VITE_PREVIEW_PORT ?? '8082',
    10,
  ) || 8082;

  return {
    application: {
      injectGlobalScss: false,
      archiverPluginOptions: {
        name: 'dist',
        outputDir: monorepoRoot,
        sourceDir: distAtRoot,
      },
    },
    vite: {
      build: {
        outDir: distAtRoot,
      },
      server: {
        open: false,
        proxy: {
          '/api': {
            changeOrigin: true,
            target: backendTarget,
            ws: true,
          },
        },
      },
      preview: {
        host: true,
        port: previewPort,
      },
    },
  };
});
