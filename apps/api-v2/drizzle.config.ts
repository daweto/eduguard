import "dotenv/config";
import type { Config } from "drizzle-kit";

const {
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_D1_DATABASE_ID,
  CLOUDFLARE_D1_TOKEN,
} = process.env;

if (
  !CLOUDFLARE_ACCOUNT_ID ||
  !CLOUDFLARE_D1_DATABASE_ID ||
  !CLOUDFLARE_D1_TOKEN
) {
  throw new Error(
    "Missing Cloudflare D1 credentials. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_D1_TOKEN to run drizzle-kit commands that require database access.",
  );
}

export default {
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: CLOUDFLARE_ACCOUNT_ID,
    databaseId: CLOUDFLARE_D1_DATABASE_ID,
    token: CLOUDFLARE_D1_TOKEN,
  },
} satisfies Config;
