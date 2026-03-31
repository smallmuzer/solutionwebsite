import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 5173,
    hmr: { overlay: false },
    proxy: {
      "/api/events": {
        target: "http://localhost:3001",
        changeOrigin: true,
        ws: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Accept", "text/event-stream");
            proxyReq.setHeader("Cache-Control", "no-cache");
          });
        },
      },
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    sourcemap: false,
  },
  optimizeDeps: {
    force: false,
  },
  esbuild: {
    sourcemap: false,
  },
}));
