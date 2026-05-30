/**
 * Seed completo para el tenant "essenza" (Adriana Ossa Perfumería).
 * ⚠️  RESET TOTAL — borra y re-crea categorías, filtros y productos.
 *
 * Uso:
 *   npx tsx sql/seed-essenza.ts            (usa .env)
 *   npx tsx sql/seed-essenza.ts --prod     (usa .env.production)
 */

import { config } from "dotenv";
if (!process.env.DATABASE_URL) {
  const isProd = process.argv.includes("--prod");
  config({ path: isProd ? ".env.production" : ".env" });
}
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const SCHEMA = "essenza";

// ─── Categorías (marca) ───────────────────────────────────────────────────────

const CATEGORIES = [
  { name: "Versace",            slug: "versace",            order: 1  },
  { name: "Carolina Herrera",   slug: "carolina-herrera",   order: 2  },
  { name: "Dolce & Gabbana",    slug: "dolce-gabbana",      order: 3  },
  { name: "Halloween",          slug: "halloween",           order: 4  },
  { name: "Jean Paul Gaultier", slug: "jean-paul-gaultier", order: 5  },
  { name: "Moschino",           slug: "moschino",            order: 6  },
  { name: "Bond No 9",          slug: "bond-no-9",           order: 7  },
  { name: "Creed",              slug: "creed",               order: 8  },
  { name: "Loewe",              slug: "loewe",               order: 9  },
  { name: "Montale",            slug: "montale",             order: 10 },
];

// ─── Grupos de filtros ────────────────────────────────────────────────────────

const FILTER_GROUPS = [
  {
    name: "Género", slug: "genero", order: 1,
    options: [
      { name: "Mujer",  slug: "mujer",  order: 1 },
      { name: "Hombre", slug: "hombre", order: 2 },
      { name: "Unisex", slug: "unisex", order: 3 },
    ],
  },
  {
    name: "Marca", slug: "marca", order: 2,
    options: [
      { name: "Versace",            slug: "versace",            order: 1  },
      { name: "Carolina Herrera",   slug: "carolina-herrera",   order: 2  },
      { name: "Dolce & Gabbana",    slug: "dolce-gabbana",      order: 3  },
      { name: "Halloween",          slug: "halloween",           order: 4  },
      { name: "Jean Paul Gaultier", slug: "jean-paul-gaultier", order: 5  },
      { name: "Moschino",           slug: "moschino",            order: 6  },
      { name: "Bond No 9",          slug: "bond-no-9",           order: 7  },
      { name: "Creed",              slug: "creed",               order: 8  },
      { name: "Loewe",              slug: "loewe",               order: 9  },
      { name: "Montale",            slug: "montale",             order: 10 },
      { name: "Paco Rabanne",       slug: "paco-rabanne",        order: 11 },
      { name: "Dior",               slug: "dior",                order: 12 },
      { name: "Chanel",             slug: "chanel",              order: 13 },
      { name: "Yves Saint Laurent", slug: "yves-saint-laurent",  order: 14 },
    ],
  },
  {
    name: "Tipo de fragancia", slug: "tipo-fragancia", order: 3,
    options: [
      { name: "Floral Frutal",       slug: "floral-frutal",       order: 1 },
      { name: "Oriental Floral",     slug: "oriental-floral",     order: 2 },
      { name: "Oriental Vainilla",   slug: "oriental-vainilla",   order: 3 },
      { name: "Almizcle Amaderado",  slug: "almizcle-amaderado",  order: 4 },
      { name: "Aromática Frutal",    slug: "aromatica-frutal",    order: 5 },
      { name: "Aromática Acuática",  slug: "aromatica-acuatica",  order: 6 },
      { name: "Amaderado Especiado", slug: "amaderado-especiado", order: 7 },
      { name: "Gourmand Floral",     slug: "gourmand-floral",     order: 8 },
      { name: "Olfativa Floral",     slug: "olfativa-floral",     order: 9 },
      { name: "Floral Oriental",     slug: "floral-oriental",     order: 10 },
      { name: "Floral",              slug: "floral",              order: 11 },
    ],
  },
  {
    name: "Concentración", slug: "concentracion", order: 4,
    options: [
      { name: "Eau de Parfum (EDP)",   slug: "edp", order: 1 },
      { name: "Eau de Toilette (EDT)", slug: "edt", order: 2 },
      { name: "Le Parfum",             slug: "le-parfum", order: 3 },
      { name: "Parfum",                slug: "parfum",    order: 4 },
    ],
  },
];

// ─── Productos ────────────────────────────────────────────────────────────────
// filters: { genero, marca, "tipo-fragancia", concentracion } → slugs de las opciones

type Product = {
  title: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  featured: boolean;
  filters: {
    genero: string;
    marca: string;
    "tipo-fragancia": string;
    concentracion: string;
  };
};

const PRODUCTS: Product[] = [
  // ── VERSACE MUJER ─────────────────────────────────────────────────────────
  {
    title: "Versace Bright Crystal",
    slug: "versace-bright-crystal",
    description: "Fragancia floral frutal con notas de granada, peonía y almizcle blanco.",
    price: 360000, category: "versace", tags: ["floral", "frutal", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "versace", "tipo-fragancia": "floral-frutal", concentracion: "edt" },
  },
  {
    title: "Versace Crystal Noir",
    slug: "versace-crystal-noir",
    description: "Fragancia floral frutal oscura con notas de gardenia, coco y ámbar.",
    price: 360000, category: "versace", tags: ["floral", "frutal", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "versace", "tipo-fragancia": "floral-frutal", concentracion: "edp" },
  },
  {
    title: "Versace Pour Femme Dylan Blue",
    slug: "versace-pour-femme-dylan-blue",
    description: "Fragancia floral frutal con notas de jazmín, campanilla y madera de cedro.",
    price: 350000, category: "versace", tags: ["floral", "frutal", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "versace", "tipo-fragancia": "floral-frutal", concentracion: "edp" },
  },
  {
    title: "Versace Yellow Diamond",
    slug: "versace-yellow-diamond",
    description: "Fragancia floral luminosa con notas de bergamota, fresia y pera.",
    price: 300000, category: "versace", tags: ["floral", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "versace", "tipo-fragancia": "floral", concentracion: "edt" },
  },
  {
    title: "Versace Crystal Emerald",
    slug: "versace-crystal-emerald",
    description: "Fragancia floral frutal con notas de rosa, jazmín y madera de sándalo.",
    price: 380000, category: "versace", tags: ["floral", "frutal", "mujer"], featured: true,
    filters: { genero: "mujer", marca: "versace", "tipo-fragancia": "floral-frutal", concentracion: "edp" },
  },
  {
    title: "Versace Dylan Purple EDP",
    slug: "versace-dylan-purple-edp",
    description: "Fragancia floral frutal intensa con notas de violeta, ciruela y vainilla.",
    price: 360000, category: "versace", tags: ["floral", "frutal", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "versace", "tipo-fragancia": "floral-frutal", concentracion: "edp" },
  },
  {
    title: "Versace Eros Pour Femme",
    slug: "versace-eros-pour-femme",
    description: "Fragancia almizcle floral amaderada con notas de limón, jazmín y madera de cedro.",
    price: 340000, category: "versace", tags: ["almizcle", "floral", "amaderado", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "versace", "tipo-fragancia": "almizcle-amaderado", concentracion: "edp" },
  },
  {
    title: "Versace Eros Pour Femme EDT",
    slug: "versace-eros-pour-femme-edt",
    description: "Fragancia almizcle floral amaderada en eau de toilette con notas de lima, jazmín y sándalo.",
    price: 320000, category: "versace", tags: ["almizcle", "floral", "amaderado", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "versace", "tipo-fragancia": "almizcle-amaderado", concentracion: "edt" },
  },

  // ── CAROLINA HERRERA MUJER ────────────────────────────────────────────────
  {
    title: "Carolina Herrera 212 VIP Rosé",
    slug: "carolina-herrera-212-vip-rose",
    description: "Fragancia floral frutal elegante con notas de pétalos de rosa, maracuyá y almizcle.",
    price: 430000, category: "carolina-herrera", tags: ["floral", "frutal", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "carolina-herrera", "tipo-fragancia": "floral-frutal", concentracion: "edp" },
  },
  {
    title: "Carolina Herrera 212 VIP",
    slug: "carolina-herrera-212-vip",
    description: "Fragancia oriental vainilla sofisticada con notas de gardenia, almizcle y vainilla.",
    price: 360000, category: "carolina-herrera", tags: ["oriental", "vainilla", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "carolina-herrera", "tipo-fragancia": "oriental-vainilla", concentracion: "edp" },
  },
  {
    title: "Carolina Herrera La Bomba",
    slug: "carolina-herrera-la-bomba",
    description: "Fragancia oriental floral explosiva con notas de hibisco, mandarina y madera.",
    price: 540000, category: "carolina-herrera", tags: ["oriental", "floral", "mujer"], featured: true,
    filters: { genero: "mujer", marca: "carolina-herrera", "tipo-fragancia": "oriental-floral", concentracion: "edp" },
  },
  {
    title: "Carolina Herrera CH",
    slug: "carolina-herrera-ch",
    description: "Fragancia oriental floral clásica con notas de mandarina, rosa y pachulí.",
    price: 440000, category: "carolina-herrera", tags: ["oriental", "floral", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "carolina-herrera", "tipo-fragancia": "oriental-floral", concentracion: "edp" },
  },

  // ── DOLCE & GABBANA MUJER ─────────────────────────────────────────────────
  {
    title: "Dolce Gabbana Light Blue New",
    slug: "dolce-gabbana-light-blue-new",
    description: "Fragancia floral frutal fresca con notas de manzana siciliana, azahar y bambú.",
    price: 380000, category: "dolce-gabbana", tags: ["floral", "frutal", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "dolce-gabbana", "tipo-fragancia": "floral-frutal", concentracion: "edt" },
  },
  {
    title: "Dolce Gabbana Q By",
    slug: "dolce-gabbana-q-by",
    description: "Fragancia aromática frutal con notas de bergamota, lirio del valle y madera de cedro.",
    price: 420000, category: "dolce-gabbana", tags: ["aromatica", "frutal", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "dolce-gabbana", "tipo-fragancia": "aromatica-frutal", concentracion: "edp" },
  },
  {
    title: "Dolce Gabbana Devotion EDP",
    slug: "dolce-gabbana-devotion-edp",
    description: "Fragancia oriental vainilla cálida con notas de neroli, jazmín y benjuí.",
    price: 490000, category: "dolce-gabbana", tags: ["oriental", "vainilla", "mujer"], featured: true,
    filters: { genero: "mujer", marca: "dolce-gabbana", "tipo-fragancia": "oriental-vainilla", concentracion: "edp" },
  },
  {
    title: "Dolce Gabbana The Only One",
    slug: "dolce-gabbana-the-only-one",
    description: "Fragancia oriental vainilla seductora con notas de violeta, café y vainilla.",
    price: 480000, category: "dolce-gabbana", tags: ["oriental", "vainilla", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "dolce-gabbana", "tipo-fragancia": "oriental-vainilla", concentracion: "edp" },
  },

  // ── HALLOWEEN MUJER ───────────────────────────────────────────────────────
  {
    title: "Halloween Halloween",
    slug: "halloween-halloween",
    description: "Fragancia oriental floral misteriosa con notas de orquídea, madera y almizcle.",
    price: 230000, category: "halloween", tags: ["oriental", "floral", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "halloween", "tipo-fragancia": "oriental-floral", concentracion: "edt" },
  },
  {
    title: "Halloween Kiss",
    slug: "halloween-kiss",
    description: "Fragancia olfativa floral sensual con notas de jazmín, rosa y sándalo.",
    price: 190000, category: "halloween", tags: ["olfativa", "floral", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "halloween", "tipo-fragancia": "olfativa-floral", concentracion: "edt" },
  },
  {
    title: "Halloween My Wish",
    slug: "halloween-my-wish",
    description: "Fragancia gourmand floral frutal con notas de frambuesa, flor de azahar y vainilla.",
    price: 240000, category: "halloween", tags: ["gourmand", "floral", "frutal", "mujer"], featured: true,
    filters: { genero: "mujer", marca: "halloween", "tipo-fragancia": "gourmand-floral", concentracion: "edp" },
  },
  {
    title: "Halloween Magic",
    slug: "halloween-magic",
    description: "Fragancia floral frutal encantadora con notas de melocotón, magnolia y madera.",
    price: 210000, category: "halloween", tags: ["floral", "frutal", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "halloween", "tipo-fragancia": "floral-frutal", concentracion: "edt" },
  },

  // ── JEAN PAUL GAULTIER MUJER ──────────────────────────────────────────────
  {
    title: "Jean Paul Gaultier Scandal Le Parfum",
    slug: "jean-paul-gaultier-scandal-le-parfum",
    description: "Fragancia oriental floral intensa con notas de miel, gardenia y pachulí.",
    price: 445000, category: "jean-paul-gaultier", tags: ["oriental", "floral", "mujer"], featured: true,
    filters: { genero: "mujer", marca: "jean-paul-gaultier", "tipo-fragancia": "oriental-floral", concentracion: "le-parfum" },
  },
  {
    title: "Jean Paul Gaultier La Belle Le Parfum",
    slug: "jean-paul-gaultier-la-belle-le-parfum",
    description: "Fragancia oriental vainilla gourmand con notas de pera, vainilla y madera de cedro.",
    price: 380000, category: "jean-paul-gaultier", tags: ["oriental", "vainilla", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "jean-paul-gaultier", "tipo-fragancia": "oriental-vainilla", concentracion: "le-parfum" },
  },

  // ── MOSCHINO MUJER ────────────────────────────────────────────────────────
  {
    title: "Moschino Fresh Gold EDP",
    slug: "moschino-fresh-gold-edp",
    description: "Fragancia floral frutal luminosa con notas de pera, rosa y madera de sándalo.",
    price: 240000, category: "moschino", tags: ["floral", "frutal", "mujer"], featured: true,
    filters: { genero: "mujer", marca: "moschino", "tipo-fragancia": "floral-frutal", concentracion: "edp" },
  },
  {
    title: "Moschino Fresh Couture EDT",
    slug: "moschino-fresh-couture-edt",
    description: "Fragancia floral frutal fresca con notas de limón, fresia y almizcle blanco.",
    price: 210000, category: "moschino", tags: ["floral", "frutal", "mujer"], featured: false,
    filters: { genero: "mujer", marca: "moschino", "tipo-fragancia": "floral-frutal", concentracion: "edt" },
  },

  // ── BOND NO 9 ─────────────────────────────────────────────────────────────
  {
    title: "Bond No 9 Madison Avenue EDP",
    slug: "bond-no-9-madison-avenue-edp",
    description: "Fragancia floral sofisticada con notas de iris, rosa y madera de sándalo.",
    price: 1500000, category: "bond-no-9", tags: ["floral", "mujer"], featured: true,
    filters: { genero: "mujer", marca: "bond-no-9", "tipo-fragancia": "floral", concentracion: "edp" },
  },

  // ── CREED ─────────────────────────────────────────────────────────────────
  {
    title: "Creed Love In White",
    slug: "creed-love-in-white",
    description: "Fragancia floral blanca delicada con notas de iris, arroz y madera de sándalo.",
    price: 1400000, category: "creed", tags: ["floral", "mujer"], featured: true,
    filters: { genero: "mujer", marca: "creed", "tipo-fragancia": "floral", concentracion: "edp" },
  },

  // ── LOEWE ─────────────────────────────────────────────────────────────────
  {
    title: "Loewe Aire Sutileza",
    slug: "loewe-aire-sutileza",
    description: "Fragancia floral aérea con notas de limón, jazmín y almizcle blanco.",
    price: 850000, category: "loewe", tags: ["floral", "mujer"], featured: true,
    filters: { genero: "mujer", marca: "loewe", "tipo-fragancia": "floral", concentracion: "edt" },
  },

  // ── MONTALE ───────────────────────────────────────────────────────────────
  {
    title: "Montale Starry Nights",
    slug: "montale-starry-nights",
    description: "Fragancia floral oriental con notas de rosa, oud y almizcle.",
    price: 500000, category: "montale", tags: ["floral", "oriental", "mujer"], featured: true,
    filters: { genero: "mujer", marca: "montale", "tipo-fragancia": "floral-oriental", concentracion: "edp" },
  },

  // ── HOMBRES ───────────────────────────────────────────────────────────────
  // TODO: agregar productos de hombres aquí
];

// ─── Script ───────────────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();
  try {
    // Verificar que el schema existe
    const { rows } = await client.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [SCHEMA]
    );
    if (rows.length === 0) {
      console.error(`❌ Schema "${SCHEMA}" no existe. Crea el tenant primero.`);
      process.exit(1);
    }

    await client.query(`SET search_path TO "${SCHEMA}"`);

    // ── 1. Reset total ─────────────────────────────────────────────────────
    console.log("\n→ Limpiando datos anteriores...");
    await client.query(`DELETE FROM product_filters`);
    await client.query(`DELETE FROM product_images`);
    await client.query(`DELETE FROM products`);
    await client.query(`DELETE FROM categories`);
    await client.query(`DELETE FROM filter_options`);
    await client.query(`DELETE FROM filter_groups`);
    console.log("  ✓ Reset completo");

    // ── 2. Categorías ──────────────────────────────────────────────────────
    console.log("\n→ Insertando categorías...");
    const catIds: Record<string, string> = {};
    for (const cat of CATEGORIES) {
      const { rows } = await client.query(
        `INSERT INTO categories (name, slug, "order") VALUES ($1,$2,$3) RETURNING id`,
        [cat.name, cat.slug, cat.order]
      );
      catIds[cat.slug] = rows[0].id;
      console.log(`  ✓ ${cat.name}`);
    }

    // ── 3. Grupos y opciones de filtros ────────────────────────────────────
    console.log("\n→ Insertando grupos de filtros...");
    const optionIds: Record<string, string> = {}; // "grupo-slug/opcion-slug" → id

    for (const group of FILTER_GROUPS) {
      const { rows: gRows } = await client.query(
        `INSERT INTO filter_groups (name, slug, "order") VALUES ($1,$2,$3) RETURNING id`,
        [group.name, group.slug, group.order]
      );
      const groupId = gRows[0].id;
      console.log(`  ✓ Grupo: ${group.name}`);

      for (const opt of group.options) {
        const { rows: oRows } = await client.query(
          `INSERT INTO filter_options (group_id, name, slug, "order") VALUES ($1,$2,$3,$4) RETURNING id`,
          [groupId, opt.name, opt.slug, opt.order]
        );
        optionIds[`${group.slug}/${opt.slug}`] = oRows[0].id;
      }
    }

    // ── 4. Productos ───────────────────────────────────────────────────────
    console.log("\n→ Insertando productos...");
    let inserted = 0;
    for (const p of PRODUCTS) {
      const { rows: pRows } = await client.query(
        `INSERT INTO products
           (title, slug, description, price, currency, category_id, tags, active, featured)
         VALUES ($1,$2,$3,$4,'COP',$5,$6,true,$7)
         RETURNING id`,
        [p.title, p.slug, p.description, p.price, catIds[p.category], p.tags, p.featured]
      );
      const productId = pRows[0].id;

      // Asignar filtros
      for (const [groupSlug, optionSlug] of Object.entries(p.filters)) {
        const optionId = optionIds[`${groupSlug}/${optionSlug}`];
        if (optionId) {
          await client.query(
            `INSERT INTO product_filters (product_id, option_id) VALUES ($1,$2)`,
            [productId, optionId]
          );
        } else {
          console.warn(`  ⚠️  Opción no encontrada: ${groupSlug}/${optionSlug} (${p.title})`);
        }
      }

      console.log(`  ✓ ${p.title} — $${p.price.toLocaleString("es-CO")}`);
      inserted++;
    }

    // ── Resumen ────────────────────────────────────────────────────────────
    const mujer  = PRODUCTS.filter((p) => p.filters.genero === "mujer").length;
    const hombre = PRODUCTS.filter((p) => p.filters.genero === "hombre").length;

    console.log(`
╔══════════════════════════════════════════════════════════╗
║  ✅ Seed essenza completado
╠══════════════════════════════════════════════════════════╣
║  Categorías : ${String(CATEGORIES.length).padEnd(42)}║
║  Grupos filtros: ${String(FILTER_GROUPS.length).padEnd(39)}║
║  Productos  : ${String(inserted).padEnd(42)}║
║    · Mujer  : ${String(mujer).padEnd(42)}║
║    · Hombre : ${String(hombre).padEnd(42)}║
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

seed();
