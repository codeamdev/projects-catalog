/**
 * Crea un nuevo tenant (empresa) en la base de datos.
 *
 * Uso:
 *   npx tsx sql/create-tenant.ts <subdominio> "<Nombre empresa>" <email-admin> <contraseña-admin>
 *
 * Ejemplos:
 *   npx tsx sql/create-tenant.ts tendencias "Tendencias Ropa" admin@tendencias.com admin1234
 *   npx tsx sql/create-tenant.ts perfumeria2 "La Perfumería" hola@perfumeria2.com miClave99
 *
 * Resultado:
 *   - Schema PostgreSQL creado: <subdominio>
 *   - Tablas migradas (products, categories, orders, settings, admin_users)
 *   - Registro en catalogo_public.tenants
 *   - Usuario admin creado
 *   - Instrucciones para acceder
 */

import { config } from "dotenv";
if (!process.env.DATABASE_URL) {
  const isProd = process.argv.includes("--prod");
  config({ path: isProd ? ".env.production" : ".env" });
}

import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

const MIGRATION_FILES = [
  "002_tenant_tables.sql",
  "003_add_discount.sql",
  "004_add_orders.sql",
  "005_update_order_statuses.sql",
  "006_add_discount_code.sql",
];

// El schema name en PostgreSQL usa solo letras, números y guión bajo
function toSchemaName(subdomain: string): string {
  return subdomain.toLowerCase().replace(/-/g, "_").replace(/[^a-z0-9_]/g, "");
}

async function createTenant(
  subdomain: string,
  tenantName: string,
  adminEmail: string,
  adminPassword: string,
  primaryColor = "#1a1a1a"
) {
  const schema = toSchemaName(subdomain);

  const VALID = /^[a-z][a-z0-9-]{0,60}[a-z0-9]$|^[a-z0-9]$/;
  if (!VALID.test(subdomain)) {
    console.error(`❌ Subdominio inválido: "${subdomain}"`);
    console.error("   Solo letras minúsculas, números y guiones. Debe empezar con letra.");
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    // ── 1. Verificar que el tenant no exista ya ──
    const { rows: existing } = await client.query(
      "SELECT subdomain FROM catalogo_public.tenants WHERE subdomain = $1 OR schema_name = $2",
      [subdomain, schema]
    );
    if (existing.length > 0) {
      console.error(`❌ Ya existe un tenant con subdominio "${subdomain}" o schema "${schema}".`);
      process.exit(1);
    }

    // ── 2. Ejecutar migraciones en el nuevo schema ──
    console.log(`\n→ Creando schema "${schema}"...`);
    for (const file of MIGRATION_FILES) {
      const sql = readFileSync(join(__dirname, file), "utf-8");
      await client.query(sql.replace(/:schema/g, schema));
    }
    console.log(`✓ Tablas creadas en schema "${schema}"`);

    // ── 3. Registrar tenant en catalogo_public ──
    await client.query(
      `INSERT INTO catalogo_public.tenants (subdomain, schema_name, name, primary_color)
       VALUES ($1, $2, $3, $4)`,
      [subdomain, schema, tenantName, primaryColor]
    );
    console.log(`✓ Tenant registrado en catalogo_public.tenants`);

    // ── 4. Crear usuario admin ──
    const hash = await bcrypt.hash(adminPassword, 12);
    await client.query(`SET search_path TO "${schema}"`);
    await client.query(
      `INSERT INTO admin_users (email, password, name, role)
       VALUES ($1, $2, 'Administrador', 'ADMIN')
       ON CONFLICT (email) DO NOTHING`,
      [adminEmail, hash]
    );
    console.log(`✓ Admin creado: ${adminEmail}`);

    // ── 5. Crear settings vacíos ──
    await client.query(
      `INSERT INTO settings (hero_title) VALUES ($1) ON CONFLICT DO NOTHING`,
      [tenantName]
    );

    // ── Resultado ──────────────────────────────────────────────
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";
    const isProd = rootDomain !== "localhost";

    console.log(`
╔══════════════════════════════════════════════════════════╗
║  ✅ Tenant "${subdomain}" creado correctamente
╠══════════════════════════════════════════════════════════╣
║  Schema:       ${schema.padEnd(40)}
║  Admin email:  ${adminEmail.padEnd(40)}
║  Contraseña:   ${adminPassword.padEnd(40)}
╠══════════════════════════════════════════════════════════╣`);

    if (!isProd) {
      console.log(`║  🌐 Catálogo:  http://${subdomain}.localhost:3000`);
      console.log(`║  🔧 Admin:     http://${subdomain}.localhost:3000/admin`);
      console.log(`╠══════════════════════════════════════════════════════════╣`);
      console.log(`║  ℹ️  Los navegadores modernos resuelven *.localhost`);
      console.log(`║     automáticamente. No se necesita editar hosts.`);
    } else {
      console.log(`║  🌐 Catálogo:  https://${subdomain}.${rootDomain}`);
      console.log(`║  🔧 Admin:     https://${subdomain}.${rootDomain}/admin`);
      console.log(`╠══════════════════════════════════════════════════════════╣`);
      console.log(`║  ⚠️  Configura el DNS: ${subdomain}.${rootDomain} → tu IP`);
    }
    console.log(`╚══════════════════════════════════════════════════════════╝\n`);

  } catch (err) {
    console.error("\n❌ Error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// ── CLI ────────────────────────────────────────────────────────
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const [subdomain, tenantName, adminEmail, adminPassword, primaryColor] = args;

if (!subdomain || !tenantName || !adminEmail || !adminPassword) {
  console.log(`
Uso:
  npx tsx sql/create-tenant.ts <subdominio> "<Nombre>" <email> <contraseña> [color]

Ejemplos:
  npx tsx sql/create-tenant.ts tendencias "Tendencias Ropa" admin@tendencias.com admin1234
  npx tsx sql/create-tenant.ts joyeria "La Joyería" hola@joyeria.com clave99 "#C5A028"

Parámetros:
  subdominio   Identificador URL (solo letras, números, guiones). Ej: tendencias
  Nombre       Nombre visible de la empresa. Ej: "Tendencias Ropa"
  email        Email del administrador
  contraseña   Contraseña del administrador
  color        Color primario en hex (opcional, default: #1a1a1a)
`);
  process.exit(1);
}

createTenant(subdomain, tenantName, adminEmail, adminPassword, primaryColor);
