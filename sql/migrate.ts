import { config } from "dotenv";

// En Vercel DATABASE_URL ya está en process.env — no cargar archivo
// Localmente: --prod carga .env.production, sin flag carga .env
if (!process.env.DATABASE_URL) {
  const isProd = process.argv.includes("--prod");
  config({ path: isProd ? ".env.production" : ".env" });
}
import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const ssl = connectionString?.includes("supabase.com") ? { rejectUnauthorized: false } : undefined;
const pool = new Pool({ connectionString, ssl });
const TENANT_SCHEMAS = ["perfumeria", "ropa", "tendencias"];

async function migrate() {
  const client = await pool.connect();
  try {
    // Tablas públicas (001 + 007 super_admins)
    console.log("→ Migrando catalogo_public...");
    const publicSql = readFileSync(join(__dirname, "001_public_tenants.sql"), "utf-8");
    await client.query(publicSql);
    const superAdminSql = readFileSync(join(__dirname, "007_super_admins.sql"), "utf-8");
    await client.query(superAdminSql);
    console.log("✓ catalogo_public OK");

    const migrationFiles = ["002_tenant_tables.sql", "003_add_discount.sql", "004_add_orders.sql", "005_update_order_statuses.sql", "006_add_discount_code.sql"];

    // Obtener tenants existentes de la DB para migrar todos
    const { rows: tenantRows } = await client.query(
      "SELECT schema_name FROM catalogo_public.tenants"
    );
    const dbSchemas = tenantRows.map((r: { schema_name: string }) => r.schema_name);
    const allSchemas = [...new Set([...TENANT_SCHEMAS, ...dbSchemas])];

    for (const schema of allSchemas) {
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
