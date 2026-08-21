import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Dev is same-origin by design (ADR-003's cookie posture): the browser
      // only ever talks to this dev server, which forwards /api/* to the
      // Express api on 3000.
      "/api": {
        target: "http://localhost:3000",
        // BetterAuth's CSRF check compares the Origin header against its
        // baseURL (http://localhost:3000), but the browser sends this dev
        // server's origin (http://localhost:5173). Rewriting it here keeps
        // the api production-shaped — no dev-only trusted-origins list.
        headers: { origin: "http://localhost:3000" },
      },
    },
  },
});
