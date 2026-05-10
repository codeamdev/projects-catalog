import { config } from "dotenv";
if (!process.env.DATABASE_URL) {
  const isProd = process.argv.includes("--prod");
  config({ path: isProd ? ".env.production" : ".env" });
}
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const ssl = connectionString?.includes("supabase.com") ? { rejectUnauthorized: false } : undefined;
const pool = new Pool({ connectionString, ssl });

const SEEDS = {
  perfumeria: {
    adminEmail: "admin@perfumeria.com",
    adminPassword: "admin1234",
    adminName: "Admin Perfumeria",
    heroTitle: "Fragancias exclusivas",
    heroSubtitle: "Encuentra tu perfume ideal",
    categories: ["Hombre", "Mujer", "Unisex"],
    products: [
      { title: "Chanel N5 EDP 100ml",              price: 180, category: "Mujer",  tags: ["clasico","floral"],     description: "El clasico iconico de Chanel. Floral y aldehydico." },
      { title: "Dior Sauvage EDT 100ml",            price: 130, category: "Hombre", tags: ["fresco","intenso"],     description: "Fresco e intenso. Bergamota y ambroxan." },
      { title: "YSL Black Opium EDP 50ml",          price: 120, category: "Mujer",  tags: ["dulce","nocturno"],     description: "Cafe negro, vainilla y flor blanca." },
      { title: "Maison Margiela Replica Jazz Club", price: 200, category: "Unisex", tags: ["amaderado","unisex"],   description: "Madera, cuero y ron. Club de jazz." },
    ],
  },
  ropa: {
    adminEmail: "admin@ropa.com",
    adminPassword: "admin1234",
    adminName: "Admin Ropa",
    heroTitle: "Moda que te define",
    heroSubtitle: "Coleccion temporada actual",
    categories: ["Remeras", "Pantalones", "Accesorios"],
    products: [
      { title: "Remera Oversize Blanca",  price: 25, category: "Remeras",    tags: ["basico","oversize"], description: "100% algodon premium. Corte relajado." },
      { title: "Jean Slim Fit Negro",     price: 65, category: "Pantalones", tags: ["denim","clasico"],   description: "Denim de alta calidad. Corte slim fit." },
      { title: "Gorra Snapback Negra",    price: 20, category: "Accesorios", tags: ["streetwear"],        description: "Ajuste universal. Bordado frontal." },
    ],
  },
} as const;

async function seed() {
  const client = await pool.connect();
  try {
    for (const [schema, data] of Object.entries(SEEDS)) {
      console.log(`\n-> Seeding: ${schema}`);
      await client.query(`SET search_path TO "${schema}"`);

      const hash = await bcrypt.hash(data.adminPassword, 12);
      await client.query(
        `INSERT INTO admin_users (email, password, name, role)
         VALUES ($1,$2,$3,'ADMIN') ON CONFLICT (email) DO NOTHING`,
        [data.adminEmail, hash, data.adminName]
      );
      console.log(`  Admin: ${data.adminEmail} / ${data.adminPassword}`);

      const existing = await client.query("SELECT id FROM settings LIMIT 1");
      if (existing.rowCount === 0) {
        await client.query(
          `INSERT INTO settings (hero_title, hero_subtitle) VALUES ($1,$2)`,
          [data.heroTitle, data.heroSubtitle]
        );
      }

      const catIds: Record<string, string> = {};
      for (const cat of data.categories) {
        const slug = cat.toLowerCase().replace(/\s+/g, "-");
        const { rows } = await client.query(
          `INSERT INTO categories (name, slug) VALUES ($1,$2)
           ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
          [cat, slug]
        );
        catIds[cat] = rows[0].id;
      }

      for (const p of data.products) {
        const slug = p.title.toLowerCase().normalize("NFD")
          .replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^\w-]/g, "");
        await client.query(
          `INSERT INTO products (title, slug, description, price, currency, category_id, tags, active)
           VALUES ($1,$2,$3,$4,'USD',$5,$6,true) ON CONFLICT (slug) DO NOTHING`,
          [p.title, slug, p.description, p.price, catIds[p.category], p.tags]
        );
        console.log(`  Producto: ${p.title}`);
      }
    }

    console.log("\nSeed completo en project_catalogo.");
    console.log("  perfumeria.allexclusive.com:3000/admin -> admin@perfumeria.com / admin1234");
    console.log("  ropa.allexclusive.com:3000/admin       -> admin@ropa.com / admin1234");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
