import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    base: '/',
    application: {
      injectGlobalScss: false,
    },
    vite: {
      server: {
        host: '0.0.0.0',
        open: true,
        // 支持 history 路由刷新
        historyApiFallback: true,
        proxy: {
          '/api': {
            changeOrigin: true,
            target: 'http://localhost:8080',
            ws: true,
          },
          '/base': {
            changeOrigin: true,
            target: 'http://localhost:8080',
            ws: true,
          },
          '/crud': {
            changeOrigin: true,
            target: 'http://localhost:8080',
            ws: true,
            rewrite: (path) => '/api' + path,
          },
        },
      },
    },
  };
});
