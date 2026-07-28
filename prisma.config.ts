import { defineConfig } from "prisma/config";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrate: {
    adapter: async () => {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const { default: pg } = await import("pg");

      const pool = new pg.Pool({
        connectionString: process.env["DATABASE_URL"],
      });

      return new PrismaPg(pool);
    },
  },
});
