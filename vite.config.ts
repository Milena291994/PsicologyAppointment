import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages sirve el sitio en https://<usuario>.github.io/<repo>/; el workflow
  // de deploy define BASE_PATH. En local queda en "/".
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
