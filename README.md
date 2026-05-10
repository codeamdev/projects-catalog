# Catálogo Digital Multi-tenant

Sistema de catálogos digitales con panel de administración, carrito de compras y envío de pedidos por WhatsApp. Cada negocio (tenant) tiene su propio subdominio, base de datos aislada y panel de administración.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS v4 |
| Base de datos | PostgreSQL |
| ORM | Drizzle ORM |
| Autenticación | NextAuth v5 (JWT, Credentials) |
| Estado cliente | Zustand (carrito) |
| Runtime | Node.js 22 |

---

## Arquitectura

Multi-tenant basado en subdominios. Cada negocio tiene un subdominio propio, un schema de PostgreSQL aislado y su propio panel en `/admin`.

### Flujo de una request

```
Browser → proxy.ts (extrae subdominio del host)
       → inyecta header x-tenant-subdomain
       → Server Component lee el header
       → withTenantDb(schemaName) → SET search_path → query
```

### Aislamiento en PostgreSQL

```
project_catalogo
├── catalogo_public.tenants     ← registro global de negocios
├── perfumeria.products
├── perfumeria.categories
├── perfumeria.admin_users
├── ropa.products
└── ...
```

---

## Estructura del proyecto

```
catalogo/
├── sql/
│   ├── 001_public_tenants.sql    # Crea catalogo_public.tenants
│   ├── 002_tenant_tables.sql     # Template tablas por tenant
│   ├── 003_add_discount.sql      # Migración: discount_percent
│   ├── migrate.ts                # Script de migraciones
│   └── seed.ts                   # Datos de prueba
│
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home del catálogo (SSR)
│   │   ├── (catalog)/product/[slug]/  # Detalle de producto
│   │   ├── admin/login/          # Login
│   │   ├── admin/(dashboard)/    # Panel protegido
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── products/         # CRUD productos
│   │   │   ├── categories/       # CRUD categorías
│   │   │   └── settings/         # Configuración
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       ├── admin/actions.ts  # Server Actions
│   │       └── upload/route.ts   # Subida de imágenes
│   │
│   ├── db/
│   │   ├── index.ts              # Pool + withTenantDb()
│   │   ├── public-schema.ts      # catalogo_public.tenants
│   │   └── tenant-schema.ts      # Tablas compartidas
│   │
│   ├── lib/
│   │   ├── auth.ts               # NextAuth config
│   │   ├── tenant.ts             # Lookup por subdominio
│   │   └── products.ts           # Queries de productos
│   │
│   ├── components/
│   │   ├── admin/                # Sidebar, ProductForm, ImageUpload...
│   │   ├── catalog/              # HeroBanner, ProductGrid, ProductCard...
│   │   └── cart/                 # CartButton, CartDrawer
│   │
│   ├── store/cart.ts             # Zustand (localStorage)
│   └── proxy.ts                  # Middleware de subdominios
│
└── public/uploads/               # Imágenes subidas (en .gitignore)
```

---

## Instalación

```bash
npm install
createdb project_catalogo
npm run db:migrate
npm run db:seed     # datos de prueba (opcional)
npm run dev
```

### Variables de entorno (.env)

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/project_catalogo"
NEXTAUTH_URL="http://perfumeria.allexclusive.com:3000"
NEXTAUTH_SECRET="secreto-aleatorio-largo"
NEXT_PUBLIC_ROOT_DOMAIN="allexclusive.com"
```

Generar NEXTAUTH_SECRET: `openssl rand -base64 32`

### Subdominios en desarrollo

**Windows** — `C:\Windows\System32\drivers\etc\hosts`:
```
127.0.0.1  perfumeria.allexclusive.com
127.0.0.1  ropa.allexclusive.com
```

**macOS/Linux** — `/etc/hosts`:
```
127.0.0.1  perfumeria.allexclusive.com
127.0.0.1  ropa.allexclusive.com
```

### Credenciales de prueba (post seed)

| Tenant | URL admin | Email | Contraseña |
|--------|-----------|-------|------------|
| Perfumería | perfumeria.allexclusive.com:3000/admin | admin@perfumeria.com | admin1234 |
| Ropa | ropa.allexclusive.com:3000/admin | admin@ropa.com | admin1234 |

---

## Migraciones

```bash
npm run db:migrate
```

Aplica en orden para cada tenant (todos son idempotentes):

1. `001_public_tenants.sql` — catalogo_public.tenants
2. `002_tenant_tables.sql` — tablas del tenant
3. `003_add_discount.sql` — columna discount_percent

### Agregar una migración nueva

1. Crear `sql/00N_descripcion.sql` con `:schema` como placeholder:

```sql
ALTER TABLE :schema.products ADD COLUMN IF NOT EXISTS nueva_col TEXT;
```

2. Registrar en `sql/migrate.ts`:

```typescript
const migrationFiles = [
  "002_tenant_tables.sql",
  "003_add_discount.sql",
  "004_nueva_migracion.sql",  // agregar acá
];
```

3. `npm run db:migrate`

---

## Agregar un nuevo tenant

```sql
-- 1. Registrar el negocio
INSERT INTO catalogo_public.tenants (subdomain, schema_name, name, primary_color, whatsapp_number)
VALUES ('mitienda', 'mitienda', 'Mi Tienda', '#E53E3E', '573001234567');
```

```typescript
// 2. sql/migrate.ts — agregar al array
const TENANT_SCHEMAS = ["perfumeria", "ropa", "mitienda"];
```

```bash
# 3. Crear las tablas del nuevo schema
npm run db:migrate
```

Crear el usuario admin con la función `createAdminUser(schema, email, password, name)` de `src/app/api/admin/actions.ts`.

Agregar el subdominio al archivo `hosts` local y a `allowedDevOrigins` en `next.config.ts`.

---

## Base de datos — Referencia de tablas

### catalogo_public.tenants

| Columna | Tipo | Descripción |
|---------|------|-------------|
| subdomain | text unique | Subdominio (ej: perfumeria) |
| schema_name | text unique | Schema de PostgreSQL |
| name | text | Nombre visible del negocio |
| active | boolean | Catálogo habilitado |
| primary_color | text | Color principal hex |
| whatsapp_number | text | Número sin + ni espacios (ej: 573001234567) |
| logo_url | text | URL del logo |

### products (por tenant)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| title | text | Nombre del producto |
| slug | text unique | URL del producto (auto-generado) |
| price | decimal(10,2) | Precio base |
| currency | text | COP, ARS, USD, EUR |
| active | boolean | Visible en catálogo |
| featured | boolean | Aparece en hero y primer lugar del grid |
| discount_percent | smallint | Descuento 0–99% (null = sin descuento) |
| tags | text[] | Palabras clave para el buscador |

### Otras tablas por tenant

- **categories** — name, slug (único), order
- **product_images** — productId (cascade delete), url, alt, order
- **admin_users** — email, password (bcrypt 12 rounds), role (SUPER_ADMIN/ADMIN/EDITOR)
- **settings** — hero_title, hero_subtitle, hero_image_url, meta_title, meta_description, footer_text

---

## Panel de administración

Acceso: `http://[subdominio].allexclusive.com/admin`

El subdominio determina el tenant automáticamente — no hay selector en el login.

| Ruta | Descripción |
|------|-------------|
| /admin | Dashboard con conteos de productos y categorías |
| /admin/products | Lista con toggle activo/inactivo por fila |
| /admin/products/new | Crear producto |
| /admin/products/[id] | Editar producto |
| /admin/categories | Crear y eliminar categorías |
| /admin/settings | Hero, SEO, WhatsApp, logo, color principal |

### Campos de un producto

| Campo | Descripción |
|-------|-------------|
| Título | Requerido |
| Precio + Moneda | COP por defecto |
| Descuento % | 0–99, muestra badge y precio tachado en el catálogo |
| Categoría | Selector de las categorías creadas |
| Imágenes | Upload múltiple o URL externa |
| Tags | Separados por coma, usados en el buscador |
| Activo | Visible en el catálogo |
| Destacado | Posición privilegiada en hero y grid |

---

## Catálogo público

### Hero

- **1 imagen**: animación Ken Burns (zoom lento continuo)
- **Varias imágenes**: carrusel automático cada 5s con crossfade + indicadores de puntos
- **Video**: URL terminada en `.mp4` o `.webm` → video de fondo en loop

El carrusel se construye automáticamente: imagen del hero (settings) + imágenes principales de productos destacados (hasta 6 total).

### Grid de productos

- 2 columnas en móvil, 4 columnas en desktop
- Primer producto destacado ocupa el ancho completo en desktop
- Filtros de categoría estilo "stories" con scroll horizontal
- Buscador por nombre o tag (filtrado en cliente, sin recarga de página)
- Cambiar de categoría no salta al inicio de la página

### Cards de producto

- Overlay degradé con nombre, precio y botón Agregar
- Badge rojo con porcentaje de descuento (si aplica)
- Precio con descuento aplicado + precio original tachado

---

## Carrito y pedidos

Estado en Zustand persistido en localStorage — sobrevive recargas.

**Flujo del pedido:**

1. Agregar productos desde cards o página de detalle
2. Abrir el carrito (FAB flotante en esquina inferior derecha)
3. Ajustar cantidades o eliminar items
4. Clic en "Pedir por WhatsApp"
5. Completar nombre y celular (requeridos) + correo (opcional)
6. WhatsApp se abre con el mensaje ya armado

**Mensaje enviado:**

```
Hola [Negocio]! Quiero hacer el siguiente pedido:

• Producto 1 x2
• Producto 2 x1

Total: $150.000

---
Nombre: Juan Pérez
Celular: 3001234567
Correo: juan@ejemplo.com
```

---

## Subida de imágenes

Endpoint `POST /api/upload` — requiere sesión autenticada.

- Formatos aceptados: JPEG, PNG, WebP, GIF, AVIF, SVG
- Tamaño máximo: 5 MB por imagen
- Almacenamiento local: `public/uploads/[schema]/`
- Respuesta: `{ url: "/uploads/[schema]/archivo.ext" }`

La carpeta `public/uploads/` está en `.gitignore`. En producción con plataformas serverless (Vercel), implementar almacenamiento externo (S3, Cloudflare R2) modificando `src/app/api/upload/route.ts`.

---

## Despliegue

### Variables de entorno

```env
DATABASE_URL="postgresql://usuario:contraseña@host/project_catalogo"
NEXTAUTH_URL="https://perfumeria.allexclusive.com"
NEXTAUTH_SECRET="secreto-largo-y-seguro"
NEXT_PUBLIC_ROOT_DOMAIN="allexclusive.com"
```

### DNS

Registro wildcard en el proveedor de DNS:
```
*.allexclusive.com  →  A  →  IP del servidor
```

### Comandos

```bash
npm run build        # Compilar para producción
npm run start        # Iniciar servidor
npm run db:migrate   # Solo cuando hay cambios de DB
```
