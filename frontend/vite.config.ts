import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendBase = (env.VITE_BACKEND_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

  return {
    plugins: [react()],
    server: {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
        'Cross-Origin-Opener-Policy': 'unsafe-none',
      },
      https: mode === 'production' || process.env.HTTPS === 'true' ? {} : false,
      proxy: {
        // Proxy API calls to avoid CORS during local development.
        "/api": {
          target: backendBase,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              console.log('Sending Request to the Target:', proxyReq.method, proxyReq.path);
              // Allow mixed content by setting headers properly
              if (proxyReq.setHeader) {
                proxyReq.setHeader('x-forwarded-proto', 'http');
              }
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
              // Add CORS headers to allow mixed content
              proxyRes.headers['access-control-allow-origin'] = '*';
              proxyRes.headers['access-control-allow-credentials'] = 'true';
            });
          },
        },
        // Proxy redirect/delete endpoints that are not under /api.
        "^/(?!@)(?!src)(?!assets)(?!favicon\\.ico$)[^/]+(\\/[^/]+)?$": {
          target: backendBase,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              // Allow mixed content
              if (proxyReq.setHeader) {
                proxyReq.setHeader('x-forwarded-proto', 'http');
              }
            });
            proxy.on('proxyRes', (proxyRes, _req, _res) => {
              proxyRes.headers['access-control-allow-origin'] = '*';
              proxyRes.headers['access-control-allow-credentials'] = 'true';
            });
          },
        },
      },
    },
    build: {
      // Ensure build works with mixed content
      assetsInlineLimit: 4096,
      sourcemap: true,
    },
  };
});
