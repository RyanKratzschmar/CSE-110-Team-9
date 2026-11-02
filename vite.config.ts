// Vite builds the frontend (index.html + frontend/src) and forwards /api calls to the Express backend on port 3000.
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: { "/api": "http://localhost:3000" },
  },
});