import { defineConfig } from '@vben/vite-config';
import type { ConfigEnv } from 'vite';
import { loadEnv } from 'vite';

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
    },
    vite: {
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
