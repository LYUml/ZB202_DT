import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "web",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        index: resolve(process.cwd(), "web/index.html"),
        overview: resolve(process.cwd(), "web/overview.html"),
        device: resolve(process.cwd(), "web/device.html"),
        twin: resolve(process.cwd(), "web/twin.html"),
      },
    },
  },
});
