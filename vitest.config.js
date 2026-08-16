import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Each matching package becomes a Vitest project.
    projects: ["packages/*", "apps/api"],
  },
});
