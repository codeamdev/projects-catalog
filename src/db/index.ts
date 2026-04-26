import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, PoolClient } from "pg";
import * as tenantSchema from "./tenant-schema";
import * as publicSchema from "./public-schema";

const connectionString = process.env.DATABASE_URL!;
const ssl = connectionString?.includes("supabase.com") ? { rejectUnauthorized: false } : undefined;

// En Vercel serverless cada instancia es efímera — pool pequeño para no agotar
// los límites de conexión de Supabase (free tier: ~60 conexiones totales)
const globalForPg = global as typeof global & { _pool?: Pool };
if (!globalForPg._pool) {
  globalForPg._pool = new Pool({
    connectionString,
    ssl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
}
const pool = globalForPg._pool;

// ── DB pública (catalogo_public.tenants) ──────────────────────
export const publicDb = drizzle(pool, { schema: publicSchema });

// ── DB dinámica por tenant ────────────────────────────────────
// Flujo:
//  1. Obtener un cliente del pool
//  2. SET search_path TO "perfumeria"  (o "ropa", etc.)
//  3. Crear instancia Drizzle sobre ese cliente
//  4. Queries → van al schema activo
//  5. Liberar el cliente al pool

export type TenantDb = NodePgDatabase<typeof tenantSchema>;

export async function withTenantDb<T>(
  schemaName: string,
  fn: (db: TenantDb) => Promise<T>
): Promise<T> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query(`SET search_path TO "${schemaName}"`);
    const db = drizzle(client, { schema: tenantSchema });
    return await fn(db as unknown as TenantDb);
  } finally {
    client.release();
  }
}

// Helper para transacciones en un schema de tenant
export async function withTenantTransaction<T>(
  schemaName: string,
  fn: (db: TenantDb) => Promise<T>
): Promise<T> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SET search_path TO "${schemaName}"`);
    const db = drizzle(client, { schema: tenantSchema });
    const result = await fn(db as unknown as TenantDb);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
