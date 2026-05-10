/**
 * Crea el primer super administrador global.
 *
 * Uso:
 *   npx tsx sql/create-superadmin.ts <email> <nombre> <contraseña>
 *
 * Ejemplo:
 *   npx tsx sql/create-superadmin.ts admin@allexclusive.com "Super Admin" miClave123
 */

import { config } from "dotenv";
if (!process.env.DATABASE_URL) {
  const isProd = process.argv.includes("--prod");
  config({ path: isProd ? ".env.production" : ".env" });
}

import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

async function createSuperAdmin(email: string, name: string, password: string) {
  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash(password, 12);

    const { rows } = await client.query(
      `INSERT INTO catalogo_public.super_admins (email, password, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name
       RETURNING id, email, name`,
      [email.toLowerCase(), hash, name]
    );

    const admin = rows[0];
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  ✅ Super Admin creado / actualizado
╠══════════════════════════════════════════════════════════╣
║  Email:    ${admin.email.padEnd(44)}
║  Nombre:   ${admin.name.padEnd(44)}
╠══════════════════════════════════════════════════════════╣
║  🔧 Acceso: http://localhost:3000/superadmin/login
╚══════════════════════════════════════════════════════════╝
`);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const [email, name, password] = args;

if (!email || !name || !password) {
  console.log(`
Uso:
  npx tsx sql/create-superadmin.ts <email> <nombre> <contraseña>

Ejemplo:
  npx tsx sql/create-superadmin.ts admin@allexclusive.com "Super Admin" miClave123
`);
  process.exit(1);
}

createSuperAdmin(email, name, password);
