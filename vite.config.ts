import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ fastRefresh: false })],
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "@react-three/fiber", "@react-three/drei"]
        }
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});
