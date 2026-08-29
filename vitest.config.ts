import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Las pruebas son de lógica pura: no necesitan DOM ni navegador. El alias
// replica el "@/" del tsconfig para que los imports se vean igual que en la app.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
