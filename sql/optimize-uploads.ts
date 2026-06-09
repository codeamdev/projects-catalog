/**
 * Optimiza todas las imágenes existentes en /app/public/uploads/
 * Convierte JPG/PNG/AVIF a WebP (max 1920px, calidad 82) y actualiza las URLs en la BD.
 *
 * Uso (dentro del contenedor o localmente con .env):
 *   npx tsx sql/optimize-uploads.ts [--prod] [--dry-run]
 *
 * --dry-run  Muestra qué haría sin modificar archivos ni la BD.
 * --prod     Usa .env.production para conectar a la BD.
 */

import { config } from "dotenv";
if (!process.env.DATABASE_URL) {
  const isProd = process.argv.includes("--prod");
  config({ path: isProd ? ".env.production" : ".env" });
}

import { readdirSync, statSync } from "fs";
import { rename, unlink, writeFile } from "fs/promises";
import { join, extname, basename, dirname } from "path";
import sharp from "sharp";
import { Pool } from "pg";

const DRY_RUN = process.argv.includes("--dry-run");
const UPLOADS_DIR = join(process.cwd(), "public", "uploads");
const QUALITY = 90;
const MAX_WIDTH = 1920;

const CONVERTIBLE = new Set([".jpg", ".jpeg", ".png", ".avif", ".webp"]);
const SKIP_EXT    = new Set([".gif", ".mp4", ".webm", ".ogv", ".mov"]);

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

// ── Helpers ───────────────────────────────────────────────────────────────────

function walkDir(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((e) =>
    e.isDirectory()
      ? walkDir(join(dir, e.name))
      : [join(dir, e.name)]
  );
}

function urlFromPath(absPath: string): string {
  // /app/public/uploads/essenza/foo.jpg  →  /uploads/essenza/foo.jpg
  const rel = absPath.split(/[/\\]public[/\\]/)[1];
  return "/" + rel.replace(/\\/g, "/");
}

function fmt(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── DB update ─────────────────────────────────────────────────────────────────

async function updateUrl(oldUrl: string, newUrl: string) {
  if (DRY_RUN) return;
  const client = await pool.connect();
  try {
    // catalogo_public.tenants → logo_url
    await client.query(
      `UPDATE catalogo_public.tenants SET logo_url = $2 WHERE logo_url = $1`,
      [oldUrl, newUrl]
    );

    // Por cada tenant schema: product_images + settings
    const { rows: tenants } = await client.query(
      `SELECT schema_name FROM catalogo_public.tenants`
    );

    for (const { schema_name } of tenants) {
      await client.query(
        `UPDATE "${schema_name}".product_images SET url = $2 WHERE url = $1`,
        [oldUrl, newUrl]
      );
      await client.query(
        `UPDATE "${schema_name}".settings
         SET
           hero_image_url        = REPLACE(hero_image_url,        $1, $2),
           hero_image_url_mobile = REPLACE(hero_image_url_mobile, $1, $2)
         WHERE hero_image_url LIKE $3 OR hero_image_url_mobile LIKE $3`,
        [oldUrl, newUrl, `%${oldUrl}%`]
      );
    }
  } finally {
    client.release();
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍 Buscando imágenes en ${UPLOADS_DIR}…`);
  if (DRY_RUN) console.log("   (modo --dry-run, no se modifica nada)\n");

  let files: string[];
  try {
    files = walkDir(UPLOADS_DIR);
  } catch {
    console.error(`❌ No se encontró el directorio ${UPLOADS_DIR}`);
    process.exit(1);
  }

  const images = files.filter((f) => CONVERTIBLE.has(extname(f).toLowerCase()));
  const skipped = files.filter((f) => SKIP_EXT.has(extname(f).toLowerCase()));

  console.log(`   ${files.length} archivos encontrados`);
  console.log(`   ${images.length} imágenes a convertir`);
  console.log(`   ${skipped.length} archivos ignorados (webp/gif/video)\n`);

  let totalSaved = 0;
  let ok = 0;
  let errors = 0;

  for (const imgPath of images) {
    const ext     = extname(imgPath).toLowerCase();
    const dir     = dirname(imgPath);
    const stem    = basename(imgPath, ext);
    const newPath = join(dir, `${stem}.webp`);
    const oldUrl  = urlFromPath(imgPath);
    const newUrl  = urlFromPath(newPath);

    const sizeBefore = statSync(imgPath).size;

    try {
      const optimized = await sharp(imgPath)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();

      const sizeAfter = optimized.length;
      const saved = sizeBefore - sizeAfter;
      totalSaved += saved;

      const tag = saved > 0 ? "✓" : "~";
      console.log(
        `${tag} ${oldUrl}\n` +
        `  ${fmt(sizeBefore)} → ${fmt(sizeAfter)}` +
        (saved > 0 ? ` (−${fmt(saved)})` : " (sin reducción)") +
        (newPath !== imgPath ? `\n  → ${newUrl}` : "")
      );

      if (!DRY_RUN) {
        await writeFile(newPath, optimized);
        if (newPath !== imgPath) await unlink(imgPath);
        await updateUrl(oldUrl, newUrl);
      }

      ok++;
    } catch (err) {
      console.error(`✗ Error procesando ${oldUrl}:`, err);
      errors++;
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ${ok} imágenes procesadas${DRY_RUN ? " (simulación)" : ""}
${errors > 0 ? `⚠️  ${errors} errores\n` : ""}💾 Espacio liberado: ${fmt(totalSaved)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
