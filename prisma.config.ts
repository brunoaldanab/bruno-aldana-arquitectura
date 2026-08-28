import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js guarda las env vars locales en .env.local, no en .env —
// dotenv/config por defecto solo lee .env, hay que apuntarlo a mano.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Conexión DIRECTA (no pooled) para el CLI/migraciones.
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
