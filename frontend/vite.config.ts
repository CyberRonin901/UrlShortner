import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendBase = (env.VITE_BACKEND_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy API calls to avoid CORS during local development.
        "/api": {
          target: backendBase,
          changeOrigin: true,
        },
        // Proxy redirect/delete endpoints that are not under /api.
        //
        // Proxy redirect/delete endpoints like `/{id}` and `/{id}/{alias}`.
        //
        // We exclude Vite internal paths like `/src/*` and `@vite/*` to avoid proxying
        // module requests (which previously caused MIME-type errors).
        //
        // This allows dots inside the path segments (so aliases containing '.' still work).
        "^/(?!@)(?!src)(?!assets)(?!favicon\\.ico$)[^/]+(\\/[^/]+)?$": {
          target: backendBase,
          changeOrigin: true,
        },
      },
    },
  };
});

