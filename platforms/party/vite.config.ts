import { defineConfig } from "vitest/config";

// vitest only — there is no bundle to build. The server runs on PartyKit's
// worker, and the protocol is consumed source-only by bundlers.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
