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

const SCHEMA = "essenza";

const categories = [
  { name: "Versace", slug: "versace", order: 1 },
  { name: "Carolina Herrera", slug: "carolina-herrera", order: 2 },
  { name: "Dolce & Gabbana", slug: "dolce-gabbana", order: 3 },
  { name: "Halloween", slug: "halloween", order: 4 },
  { name: "Jean Paul Gaultier", slug: "jean-paul-gaultier", order: 5 },
  { name: "Moschino", slug: "moschino", order: 6 },
  { name: "Bond No 9", slug: "bond-no-9", order: 7 },
  { name: "Creed", slug: "creed", order: 8 },
  { name: "Loewe", slug: "loewe", order: 9 },
  { name: "Montale", slug: "montale", order: 10 },
];

const products: Array<{
  title: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  featured: boolean;
}> = [
  // VERSACE
  {
    title: "Versace Bright Crystal",
    slug: "versace-bright-crystal",
    description: "Fragancia floral frutal con notas de granada, peonía y almizcle blanco.",
    price: 360000,
    category: "versace",
    tags: ["floral", "frutal", "mujer"],
    featured: false,
  },
  {
    title: "Versace Crystal Noir",
    slug: "versace-crystal-noir",
    description: "Fragancia floral frutal oscura con notas de gardenia, coco y ámbar.",
    price: 360000,
    category: "versace",
    tags: ["floral", "frutal", "mujer"],
    featured: false,
  },
  {
    title: "Versace Pour Femme Dylan Blue",
    slug: "versace-pour-femme-dylan-blue",
    description: "Fragancia floral frutal con notas de jazmín, campanilla y madera de cedro.",
    price: 350000,
    category: "versace",
    tags: ["floral", "frutal", "mujer"],
    featured: false,
  },
  {
    title: "Versace Yellow Diamond",
    slug: "versace-yellow-diamond",
    description: "Fragancia floral luminosa con notas de bergamota, fresia y pera.",
    price: 300000,
    category: "versace",
    tags: ["floral", "mujer"],
    featured: false,
  },
  {
    title: "Versace Crystal Emerald",
    slug: "versace-crystal-emerald",
    description: "Fragancia floral frutal con notas de rosa, jazmín y madera de sándalo.",
    price: 380000,
    category: "versace",
    tags: ["floral", "frutal", "mujer"],
    featured: true,
  },
  {
    title: "Versace Dylan Purple EDP",
    slug: "versace-dylan-purple-edp",
    description: "Fragancia floral frutal intensa con notas de violeta, ciruela y vainilla.",
    price: 360000,
    category: "versace",
    tags: ["floral", "frutal", "mujer"],
    featured: false,
  },
  {
    title: "Versace Eros Pour Femme",
    slug: "versace-eros-pour-femme",
    description: "Fragancia almizcle floral amaderada con notas de limón, jazmín y madera de cedro.",
    price: 340000,
    category: "versace",
    tags: ["almizcle", "floral", "amaderado", "mujer"],
    featured: false,
  },
  {
    title: "Versace Eros Pour Femme EDT",
    slug: "versace-eros-pour-femme-edt",
    description: "Fragancia almizcle floral amaderada en eau de toilette con notas de lima, jazmín y sándalo.",
    price: 320000,
    category: "versace",
    tags: ["almizcle", "floral", "amaderado", "mujer"],
    featured: false,
  },

  // CAROLINA HERRERA
  {
    title: "Carolina Herrera 212 VIP Rosé",
    slug: "carolina-herrera-212-vip-rose",
    description: "Fragancia floral frutal elegante con notas de pétalos de rosa, maracuyá y almizcle.",
    price: 430000,
    category: "carolina-herrera",
    tags: ["floral", "frutal", "mujer"],
    featured: false,
  },
  {
    title: "Carolina Herrera 212 VIP",
    slug: "carolina-herrera-212-vip",
    description: "Fragancia oriental vainilla sofisticada con notas de gardenia, almizcle y vainilla.",
    price: 360000,
    category: "carolina-herrera",
    tags: ["oriental", "vainilla", "mujer"],
    featured: false,
  },
  {
    title: "Carolina Herrera La Bomba",
    slug: "carolina-herrera-la-bomba",
    description: "Fragancia oriental floral explosiva con notas de hibisco, mandarina y madera.",
    price: 540000,
    category: "carolina-herrera",
    tags: ["oriental", "floral", "mujer"],
    featured: true,
  },
  {
    title: "Carolina Herrera CH",
    slug: "carolina-herrera-ch",
    description: "Fragancia oriental floral clásica con notas de mandarina, rosa y pachulí.",
    price: 440000,
    category: "carolina-herrera",
    tags: ["oriental", "floral", "mujer"],
    featured: false,
  },

  // DOLCE & GABBANA
  {
    title: "Dolce Gabbana Light Blue New",
    slug: "dolce-gabbana-light-blue-new",
    description: "Fragancia floral frutal fresca con notas de manzana siciliana, azahar y bambú.",
    price: 380000,
    category: "dolce-gabbana",
    tags: ["floral", "frutal", "mujer"],
    featured: false,
  },
  {
    title: "Dolce Gabbana Q By",
    slug: "dolce-gabbana-q-by",
    description: "Fragancia aromática frutal con notas de bergamota, lirio del valle y madera de cedro.",
    price: 420000,
    category: "dolce-gabbana",
    tags: ["aromatica", "frutal", "mujer"],
    featured: false,
  },
  {
    title: "Dolce Gabbana Devotion EDP",
    slug: "dolce-gabbana-devotion-edp",
    description: "Fragancia oriental vainilla cálida con notas de neroli, jazmín y benjuí.",
    price: 490000,
    category: "dolce-gabbana",
    tags: ["oriental", "vainilla", "mujer"],
    featured: true,
  },
  {
    title: "Dolce Gabbana The Only One",
    slug: "dolce-gabbana-the-only-one",
    description: "Fragancia oriental vainilla seductora con notas de violeta, café y vainilla.",
    price: 480000,
    category: "dolce-gabbana",
    tags: ["oriental", "vainilla", "mujer"],
    featured: false,
  },

  // HALLOWEEN
  {
    title: "Halloween Halloween",
    slug: "halloween-halloween",
    description: "Fragancia oriental floral misteriosa con notas de orquídea, madera y almizcle.",
    price: 230000,
    category: "halloween",
    tags: ["oriental", "floral", "mujer"],
    featured: false,
  },
  {
    title: "Halloween Kiss",
    slug: "halloween-kiss",
    description: "Fragancia olfativa floral sensual con notas de jazmín, rosa y sándalo.",
    price: 190000,
    category: "halloween",
    tags: ["olfativa", "floral", "mujer"],
    featured: false,
  },
  {
    title: "Halloween My Wish",
    slug: "halloween-my-wish",
    description: "Fragancia gourmand floral frutal con notas de frambuesa, flor de azahar y vainilla.",
    price: 240000,
    category: "halloween",
    tags: ["gourmand", "floral", "frutal", "mujer"],
    featured: true,
  },
  {
    title: "Halloween Magic",
    slug: "halloween-magic",
    description: "Fragancia floral frutal encantadora con notas de melocotón, magnolia y madera.",
    price: 210000,
    category: "halloween",
    tags: ["floral", "frutal", "mujer"],
    featured: false,
  },

  // JEAN PAUL GAULTIER
  {
    title: "Jean Paul Gaultier Scandal Le Parfum",
    slug: "jean-paul-gaultier-scandal-le-parfum",
    description: "Fragancia oriental floral intensa con notas de miel, gardenia y pachulí.",
    price: 445000,
    category: "jean-paul-gaultier",
    tags: ["oriental", "floral", "mujer"],
    featured: true,
  },
  {
    title: "Jean Paul Gaultier La Belle Le Parfum",
    slug: "jean-paul-gaultier-la-belle-le-parfum",
    description: "Fragancia oriental vainilla gourmand con notas de pera, vainilla y madera de cedro.",
    price: 380000,
    category: "jean-paul-gaultier",
    tags: ["oriental", "vainilla", "mujer"],
    featured: false,
  },

  // MOSCHINO
  {
    title: "Moschino Fresh Gold EDP",
    slug: "moschino-fresh-gold-edp",
    description: "Fragancia floral frutal luminosa con notas de pera, rosa y madera de sándalo.",
    price: 240000,
    category: "moschino",
    tags: ["floral", "frutal", "mujer"],
    featured: true,
  },
  {
    title: "Moschino Fresh Couture EDT",
    slug: "moschino-fresh-couture-edt",
    description: "Fragancia floral frutal fresca con notas de limón, fresia y almizcle blanco.",
    price: 210000,
    category: "moschino",
    tags: ["floral", "frutal", "mujer"],
    featured: false,
  },

  // BOND NO 9
  {
    title: "Bond No 9 Madison Avenue EDP",
    slug: "bond-no-9-madison-avenue-edp",
    description: "Fragancia floral sofisticada con notas de iris, rosa y madera de sándalo.",
    price: 1500000,
    category: "bond-no-9",
    tags: ["floral", "mujer"],
    featured: true,
  },

  // CREED
  {
    title: "Creed Love In White",
    slug: "creed-love-in-white",
    description: "Fragancia floral blanca delicada con notas de iris, arroz y madera de sándalo.",
    price: 1400000,
    category: "creed",
    tags: ["floral", "mujer"],
    featured: true,
  },

  // LOEWE
  {
    title: "Loewe Aire Sutileza",
    slug: "loewe-aire-sutileza",
    description: "Fragancia floral aérea con notas de limón, jazmín y almizcle blanco.",
    price: 850000,
    category: "loewe",
    tags: ["floral", "mujer"],
    featured: true,
  },

  // MONTALE
  {
    title: "Montale Starry Nights",
    slug: "montale-starry-nights",
    description: "Fragancia floral oriental con notas de rosa, oud y almizcle.",
    price: 500000,
    category: "montale",
    tags: ["floral", "oriental", "mujer"],
    featured: true,
  },
];

// ─── Script ──────────────────────────────────────────────────────────────────

async function seedEssenza() {
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO "${SCHEMA}"`);

    const { rows: schemaCheck } = await client.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [SCHEMA]
    );
    if (schemaCheck.length === 0) {
      console.error(`❌ El schema "${SCHEMA}" no existe.`);
      console.error(`   Ejecuta primero: npx tsx sql/create-tenant.ts essenza "Adriana Ossa Perfumería" <email> <password>`);
      process.exit(1);
    }

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

    console.log("\n→ Insertando productos...");
    let inserted = 0;
    let skipped = 0;
    for (const p of products) {
      const { rowCount } = await client.query(
        `INSERT INTO products
           (title, slug, description, price, currency, category_id, tags, active, featured)
         VALUES ($1, $2, $3, $4, 'COP', $5, $6, true, $7)
         ON CONFLICT (slug) DO NOTHING`,
        [p.title, p.slug, p.description, p.price, catIds[p.category], p.tags, p.featured]
      );
      if (rowCount && rowCount > 0) {
        console.log(`  ✓ ${p.title} — $${p.price.toLocaleString("es-CO")}`);
        inserted++;
      } else {
        console.log(`  · ${p.title} (ya existe, omitido)`);
        skipped++;
      }
    }

    console.log(`
╔══════════════════════════════════════════════════════════╗
║  ✅ Seed essenza completado
╠══════════════════════════════════════════════════════════╣
║  Categorías : ${String(categories.length).padEnd(42)}║
║  Insertados : ${String(inserted).padEnd(42)}║
║  Omitidos   : ${String(skipped).padEnd(42)}║
╚══════════════════════════════════════════════════════════╝
`);
  } catch (err) {
    console.error("\n❌ Error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedEssenza();
