import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  root: "./client",
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: `http://localhost:3000`, // Proxy to the Express server
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
});
