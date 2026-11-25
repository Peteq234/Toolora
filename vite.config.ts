import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built index.html also works when opened directly from
  // disk (file://) or hosted under a sub-path. Combined with viteSingleFile, all
  // JS and CSS are inlined, so the site opens by double-click and over HTTP.
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    {
      // The guard in the repository-root index.html exists only to hand a
      // double-clicked source file over to ./dist/index.html. It must never be
      // copied into the built file, or dist/index.html would redirect to itself.
      name: "strip-dev-root-guard",
      apply: "build",
      transformIndexHtml(html) {
        return html.replace(/<!-- dev-root-guard -->[\s\S]*?<!-- \/dev-root-guard -->/g, "");
      },
    },
    viteSingleFile({ removeViteModuleLoader: true }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 4000,
  },
});
