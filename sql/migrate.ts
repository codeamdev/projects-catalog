import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const TENANT_SCHEMAS = ["perfumeria", "ropa"];

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("→ Migrando catalogo_public...");
    const publicSql = readFileSync(join(__dirname, "001_public_tenants.sql"), "utf-8");
    await client.query(publicSql);
    console.log("✓ catalogo_public.tenants OK");

    const migrationFiles = ["002_tenant_tables.sql", "003_add_discount.sql", "004_add_orders.sql", "005_update_order_statuses.sql", "006_add_discount_code.sql"];

    for (const schema of TENANT_SCHEMAS) {
      console.log(`→ Migrando schema ${schema}...`);
      for (const file of migrationFiles) {
        const template = readFileSync(join(__dirname, file), "utf-8");
        await client.query(template.replace(/:schema/g, schema));
      }
      console.log(`✓ ${schema} OK`);
    }

    console.log("\n✅ Migración completa en project_catalogo.");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
