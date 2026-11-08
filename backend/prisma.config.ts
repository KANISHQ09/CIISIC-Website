// Prisma CLI settings (replaces the old "prisma" block in package.json, which Prisma 7 drops).
// With this file present Prisma no longer reads .env by itself, so load it here first.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    // Used by `npm run db:seed` / `prisma db seed`
    seed: "ts-node --project prisma/tsconfig.scripts.json prisma/seed.ts",
  },
});
