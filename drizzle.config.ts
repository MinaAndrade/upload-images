import "dotenv/config";
import type { Config } from "drizzle-kit";

console.log("DATABASE_URL =>", process.env.DATABASE_URL);

export default {
    schema: "./src/infra/db/schemas/*",
    out: "./src/infra/db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
} satisfies Config;