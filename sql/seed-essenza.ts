/**
 * Carga inicial de productos para el tenant "essenza" (Adriana Ossa Perfumería).
 * Fuente: Catálogo Colección Mujer — Adriana Ossa Perfumería.
 *
 * Uso:
 *   npx tsx sql/seed-essenza.ts            (usa .env)
 *   npx tsx sql/seed-essenza.ts --prod     (usa .env.production)
 *
 * El script es idempotente — puede ejecutarse varias veces sin duplicar datos.
 * El schema de essenza debe existir antes de correr este seed (creado con create-tenant.ts).
 */

import { config } from "dotenv";
if (!process.env.DATABASE_URL) {
  const isProd = process.argv.includes("--prod");
  config({ path: isProd ? ".env.production" : ".env" });
}

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

// ─── Datos extraídos del catálogo físico ─────────────────────────────────────

const SCHEMA = "essenza";

const categories = [
  { name: "Versace",          slug: "versace",           order: 1 },
  { name: "Carolina Herrera", slug: "carolina-herrera",  order: 2 },
  { name: "Dolce & Gabbana",  slug: "dolce-gabbana",     order: 3 },
  { name: "Halloween",        slug: "halloween",          order: 4 },
  { name: "Jean Paul Gaultier", slug: "jean-paul-gaultier", order: 5 },
  { name: "Moschino",         slug: "moschino",           order: 6 },
  { name: "Bond No 9",        slug: "bond-no-9",          order: 7 },
  { name: "Creed",            slug: "creed",              order: 8 },
  { name: "Loewe",            slug: "loewe",              order: 9 },
  { name: "Montale",          slug: "montale",            order: 10 },
];

// price en COP (pesos colombianos)
const products: Array<{
  title: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  featured?: boolean;
}> = [
  // ── VERSACE ─────────────────────────────────────────────────────────────
  {
    title: "Versace Bright Crystal",
    slug: "versace-bright-crystal",
    description: "Fragancia floral frutal con notas de granada, peonía y magnolia.",
    price: 360000,
    category: "versace",
    tags: ["floral", "frutal", "mujer"],
  },
  {
    title: "Versace Crystal Noir",
    slug: "versace-crystal-noir",
    description: "Fragancia floral frutal seductora con notas de gardenia, coco y almizcle.",
    price: 360000,
    category: "versace",
    tags: ["floral", "frutal", "mujer"],
  },
  {
    title: "Versace Pour Femme Dylan Blue",
    slug: "versace-pour-femme-dylan-blue",
    description: "Eau de Parfum floral frutal. Notas de grosella negra, peonía y pachulí.",
    price: 350000,
    category: "versace",
    tags: ["floral", "frutal", "mujer"],
  },
  {
    title: "Versace Yellow Diamond",
    slug: "versace-yellow-diamond",
    description: "Eau de Toilette floral radiante. Notas de bergamota, pera y frangipani.",
    price: 300000,
    category: "versace",
    tags: ["floral", "mujer"],
  },
  {
    title: "Versace Crystal Emerald",
    slug: "versace-crystal-emerald",
    description: "Eau de Parfum floral frutal con notas de lichi, magnolia y cedro.",
    price: 380000,
    category: "versace",
    tags: ["floral", "frutal", "mujer"],
  },
  {
    title: "Versace Dylan Purple EDP",
    slug: "versace-dylan-purple-edp",
    description: "Eau de Parfum floral frutal con notas de uva, jazmín y madera.",
    price: 360000,
    category: "versace",
    tags: ["floral", "frutal", "mujer"],
  },
  {
    title: "Versace Eros Pour Femme EDP",
    slug: "versace-eros-pour-femme-edp",
    description: "Eau de Parfum almizcle floral amaderado. Notas de limón, granada y flor de loto.",
    price: 340000,
    category: "versace",
    tags: ["almizcle", "floral", "amaderado", "mujer"],
    featured: true,
  },
  {
    title: "Versace Eros Pour Femme EDT",
    slug: "versace-eros-pour-femme-edt",
    description: "Eau de Toilette almizcle floral amaderado. Notas de limón, granada y flor de loto.",
    price: 320000,
    category: "versace",
    tags: ["almizcle", "floral", "amaderado", "mujer"],
  },

  // ── CAROLINA HERRERA ─────────────────────────────────────────────────────
  {
    title: "Carolina Herrera 212 VIP Rosé",
    slug: "carolina-herrera-212-vip-rose",
    description: "Eau de Parfum floral frutal con notas de peonía, rosa y almizcle.",
    price: 430000,
    category: "carolina-herrera",
    tags: ["floral", "frutal", "mujer"],
    featured: true,
  },
  {
    title: "Carolina Herrera 212 VIP",
    slug: "carolina-herrera-212-vip",
    description: "Eau de Parfum oriental vainilla con notas de gardenias, vainilla y heliotropo.",
    price: 360000,
    category: "carolina-herrera",
    tags: ["oriental", "vainilla", "mujer"],
  },
  {
    title: "Carolina Herrera La Bomba",
    slug: "carolina-herrera-la-bomba",
    description: "Eau de Parfum oriental floral con notas de naranja, rosa y sándalo.",
    price: 540000,
    category: "carolina-herrera",
    tags: ["oriental", "floral", "mujer"],
    featured: true,
  },
  {
    title: "Carolina Herrera CH",
    slug: "carolina-herrera-ch",
    description: "Eau de Parfum oriental floral con notas de naranja, rosa y cedro.",
    price: 440000,
    category: "carolina-herrera",
    tags: ["oriental", "floral", "mujer"],
  },

  // ── DOLCE & GABBANA ──────────────────────────────────────────────────────
  {
    title: "Dolce & Gabbana Light Blue New",
    slug: "dolce-gabbana-light-blue-new",
    description: "Eau de Toilette floral frutal con notas de siciliana, jazmín y rosa.",
    price: 380000,
    category: "dolce-gabbana",
    tags: ["floral", "frutal", "mujer"],
  },
  {
    title: "Dolce & Gabbana Q By",
    slug: "dolce-gabbana-q-by",
    description: "Eau de Parfum aromático frutal con notas de mandarina, jazmín y vainilla.",
    price: 420000,
    category: "dolce-gabbana",
    tags: ["aromatica", "frutal", "mujer"],
  },
  {
    title: "Dolce & Gabbana Devotion EDP",
    slug: "dolce-gabbana-devotion-edp",
    description: "Eau de Parfum Intenso oriental vainilla con notas de neroli, helicriso y vainilla.",
    price: 490000,
    category: "dolce-gabbana",
    tags: ["oriental", "vainilla", "mujer"],
    featured: true,
  },
  {
    title: "Dolce & Gabbana The Only One",
    slug: "dolce-gabbana-the-only-one",
    description: "Eau de Parfum oriental vainilla con notas de violeta, café y vainilla.",
    price: 480000,
    category: "dolce-gabbana",
    tags: ["oriental", "vainilla", "mujer"],
  },

  // ── HALLOWEEN ────────────────────────────────────────────────────────────
  {
    title: "Halloween Halloween",
    slug: "halloween-halloween",
    description: "Eau de Toilette oriental floral con notas de menta, jazmín y ámbar.",
    price: 230000,
    category: "halloween",
    tags: ["oriental", "floral", "mujer"],
  },
  {
    title: "Halloween Kiss",
    slug: "halloween-kiss",
    description: "Eau de Toilette olfativa floral con notas de melocotón, jazmín y sándalo.",
    price: 190000,
    category: "halloween",
    tags: ["floral", "mujer"],
  },
  {
    title: "Halloween My Wish",
    slug: "halloween-my-wish",
    description: "Eau de Parfum gourmand floral frutal con notas de fresa, caramelo y almizcle.",
    price: 240000,
    category: "halloween",
    tags: ["gourmand", "floral", "frutal", "mujer"],
  },
  {
    title: "Halloween Magic",
    slug: "halloween-magic",
    description: "Eau de Toilette floral frutal con notas de pera, rosa y almizcle.",
    price: 210000,
    category: "halloween",
    tags: ["floral", "frutal", "mujer"],
  },

  // ── JEAN PAUL GAULTIER ───────────────────────────────────────────────────
  {
    title: "Jean Paul Gaultier Scandal Le Parfum",
    slug: "jpgaultier-scandal-le-parfum",
    description: "Le Parfum oriental floral con notas de bergamota, gardenia y pachulí.",
    price: 445000,
    category: "jean-paul-gaultier",
    tags: ["oriental", "floral", "mujer"],
    featured: true,
  },
  {
    title: "Jean Paul Gaultier La Belle Le Parfum",
    slug: "jpgaultier-la-belle-le-parfum",
    description: "Le Parfum oriental vainilla con notas de pera, flor de azahar y vainilla.",
    price: 380000,
    category: "jean-paul-gaultier",
    tags: ["oriental", "vainilla", "mujer"],
  },

  // ── MOSCHINO ─────────────────────────────────────────────────────────────
  {
    title: "Moschino Fresh Gold EDP",
    slug: "moschino-fresh-gold-edp",
    description: "Eau de Parfum floral frutal con notas de lima, peonía y almizcle.",
    price: 240000,
    category: "moschino",
    tags: ["floral", "frutal", "mujer"],
  },
  {
    title: "Moschino Fresh Couture EDT",
    slug: "moschino-fresh-couture-edt",
    description: "Eau de Toilette floral frutal con notas de limón, neroli y almizcle.",
    price: 210000,
    category: "moschino",
    tags: ["floral", "frutal", "mujer"],
  },

  // ── BOND NO 9 ────────────────────────────────────────────────────────────
  {
    title: "Bond No 9 Madison Avenue EDP",
    slug: "bond-no9-madison-avenue-edp",
    description: "Eau de Parfum exclusivo de la colección New York. Fragancia sofisticada y elegante.",
    price: 1500000,
    category: "bond-no-9",
    tags: ["exclusivo", "lujo", "mujer"],
    featured: true,
  },

  // ── CREED ────────────────────────────────────────────────────────────────
  {
    title: "Creed Love In White",
    slug: "creed-love-in-white",
    description: "Eau de Parfum floral único con notas de arroz, iris y almizcle.",
    price: 1400000,
    category: "creed",
    tags: ["exclusivo", "lujo", "floral", "mujer"],
    featured: true,
  },

  // ── LOEWE ────────────────────────────────────────────────────────────────
  {
    title: "Loewe Aire Sutileza",
    slug: "loewe-aire-sutileza",
    description: "Eau de Toilette fresca y ligera con notas de mandarina, jacinto y almizcle.",
    price: 850000,
    category: "loewe",
    tags: ["fresca", "mujer"],
    featured: true,
  },

  // ── MONTALE ──────────────────────────────────────────────────────────────
  {
    title: "Montale Starry Nights",
    slug: "montale-starry-nights",
    description: "Eau de Parfum sensual con notas de rosa, jazmín y oud.",
    price: 500000,
    category: "montale",
    tags: ["floral", "oud", "mujer"],
    featured: true,
  },
];

// ─── Script ──────────────────────────────────────────────────────────────────

async function seedEssenza() {
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO "${SCHEMA}"`);

    // Verificar que el schema existe
    const { rows: schemaCheck } = await client.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [SCHEMA]
    );
    if (schemaCheck.length === 0) {
      console.error(`❌ El schema "${SCHEMA}" no existe.`);
      console.error(`   Ejecuta primero: npx tsx sql/create-tenant.ts essenza "Adriana Ossa Perfumería" <email> <password>`);
      process.exit(1);
    }

    // Categorías
    console.log("\n→ Creando categorías...");
    const catIds: Record<string, string> = {};
    for (const cat of categories) {
      const { rows } = await client.query(
        `INSERT INTO categories (name, slug, "order")
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, "order" = EXCLUDED."order"
         RETURNING id`,
        [cat.name, cat.slug, cat.order]
      );
      catIds[cat.slug] = rows[0].id;
      console.log(`  ✓ ${cat.name}`);
    }

    // Productos
    console.log("\n→ Insertando productos...");
    let inserted = 0;
    let skipped = 0;
    for (const p of products) {
      const { rowCount } = await client.query(
        `INSERT INTO products
           (title, slug, description, price, currency, category_id, tags, active, featured)
         VALUES ($1, $2, $3, $4, 'COP', $5, $6, true, $7)
         ON CONFLICT (slug) DO NOTHING`,
        [
          p.title,
          p.slug,
          p.description,
          p.price,
          catIds[p.category],
          p.tags,
          p.featured ?? false,
        ]
      );
      if (rowCount && rowCount > 0) {
        console.log(`  ✓ ${p.title} — $${p.price.toLocaleString("es-CO")}`);
        inserted++;
      } else {
        console.log(`  · ${p.title} (ya existe, sin cambios)`);
        skipped++;
      }
    }

    console.log(`
╔══════════════════════════════════════════════════════════╗
║  ✅ Seed essenza completado
╠══════════════════════════════════════════════════════════╣
║  Categorías: ${String(categories.length).padEnd(43)}
║  Productos insertados: ${String(inserted).padEnd(35)}
║  Productos omitidos (ya existían): ${String(skipped).padEnd(22)}
╚══════════════════════════════════════════════════════════╝
`);
    console.log("Nota: El catálogo de hombres debe agregarse por separado.");
    console.log("      Usa el panel admin en essenza.vermicatalogo.com/admin");
    console.log("      o crea un segundo archivo sql/seed-essenza-hombres.ts\n");

  } catch (err) {
    console.error("\n❌ Error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedEssenza();
