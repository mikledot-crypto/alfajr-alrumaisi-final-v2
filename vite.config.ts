import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro(),
    viteReact(),
    tailwindcss(),
    tsConfigPaths()
  ],
  server: {
    host: "::",
    port: 8080
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  }
});
