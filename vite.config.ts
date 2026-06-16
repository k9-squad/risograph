import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Relative base so the build works on GitHub Pages project sites
// (https://<user>.github.io/<repo>/) as well as custom domains / local preview.
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
