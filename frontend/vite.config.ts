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
      proxy: {
        // Proxy API calls to avoid CORS during local development.
        "/api": {
          target: backendBase,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              console.log('Sending Request to the Target:', proxyReq.method, proxyReq.path);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
        // Proxy redirect/delete endpoints that are not under /api.
        //
        // Proxy redirect/delete endpoints like `/{id}` and `/{id}/{alias}`.
        //
        // We exclude Vite internal paths like `/src/*` and `@vite/*` to avoid proxying
        // module requests (which previously caused MIME-type errors).
        //
        // This allows dots inside path segments (so aliases containing '.' still work).
        "^/(?!@)(?!src)(?!assets)(?!favicon\\.ico$)[^/]+(\\/[^/]+)?$": {
          target: backendBase,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
