// vite.config.ts
import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin";
var vite_config_default = defineConfig({
  plugins: [
    tanstackRouter()
  ],
  server: {
    port: 3e3,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      "~": "/src"
    }
  }
});
export {
  vite_config_default as default
};
