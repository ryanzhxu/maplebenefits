import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // The crawl automation writes to the live registry unattended, so its
    // tests are part of the same gate, not a separate optional suite.
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
