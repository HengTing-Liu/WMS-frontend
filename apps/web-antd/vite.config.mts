import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {
      injectGlobalScss: false,
    },
    vite: {
      server: {
        open: true,
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            target: 'http://39.96.207.148:8080/api',
            // target: 'http://192.168.110.74:8080/api',
            ws: true,
          },
        },
      },
    },
  };
});
 // target: 'http://39.96.207.148:8080/api',
//  target: 'http://192.168.110.74:8080/api',
