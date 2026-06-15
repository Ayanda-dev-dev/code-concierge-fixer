import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart({
      // Route bundled server entry through src/server.ts (SSR error wrapper)
      server: { entry: "./src/server.ts" },
    }),
    viteReact(),
  ],
});
