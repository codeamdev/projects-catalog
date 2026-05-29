# Informe de Auditoría — Catálogo Multi-Tenant
**Fecha:** 2026-05-25  
**Auditor:** Claude Sonnet 4.6  
**Rama:** master  
**Estado:** Fase 1 completa — pendiente aprobación del usuario para aplicar correcciones

---

## Resumen Ejecutivo

El proyecto es una plataforma SaaS de catálogos multi-tenant construida sobre Next.js 16 App Router, PostgreSQL (por esquema) y NextAuth v5 beta. La arquitectura central es sólida: aislamiento por esquema Postgres, ORM Drizzle (previene SQL injection), bcrypt con 12 rondas, y un patrón `ActionResult` consistente. Sin embargo, existen **3 hallazgos críticos** que impiden el despliegue en producción de forma segura, y **6 hallazgos de severidad alta** que representan riesgos reales de explotación.

**No desplegar en producción sin resolver los hallazgos CRÍTICO y ALTO.**

---

## Hallazgos por Severidad

---

### 🔴 CRÍTICO

---

#### C-1: `NEXTAUTH_SECRET` con valor placeholder en `.env`

**Archivo:** `.env` (no versionado, pero presente en el servidor)  
**Línea:** Variable `NEXTAUTH_SECRET`

**Problema:**  
El archivo `.env` contiene `NEXTAUTH_SECRET=CAMBIA_ESTO_EN_PRODUCCION` (o valor similar). NextAuth usa este secreto para firmar y verificar todos los JWT de sesión. Con un valor predecible o vacío, cualquier atacante puede forjar tokens de sesión válidos y hacerse pasar por cualquier usuario, incluyendo administradores.

**Riesgo concreto:**  
Compromiso total de todas las cuentas de todos los tenants. Un atacante puede generar un JWT firmado con el secreto conocido que incluya `role: "ADMIN"` y `schemaName` de cualquier tenant.

**Solución recomendada:**  
```bash
# Generar secreto criptográficamente seguro
openssl rand -base64 32
```
Establecer ese valor en las variables de entorno del servidor de producción (Vercel → Settings → Environment Variables). Nunca commitear `.env` con secretos reales.

Crear `.env.example` con valores ficticios para documentar las variables requeridas.

---

#### C-2: Tipo de archivo `image/svg+xml` permitido en uploads (vector XSS)

**Archivo:** [src/app/api/upload/route.ts](src/app/api/upload/route.ts)  
**Línea:** ~15 (array `ALLOWED_IMAGES`)

**Problema:**  
Los SVG son documentos XML que pueden contener JavaScript embebido (`<script>`, event handlers, `xlink:href` con `javascript:`). Si un atacante sube un SVG malicioso y ese SVG se sirve directamente desde el servidor (no a través de un CDN con sanitización), el JS se ejecuta en el contexto del dominio del catálogo.

**Riesgo concreto:**  
XSS almacenado. El atacante sube `malicious.svg` como imagen de producto, el SVG se muestra en el catálogo de todos los clientes del tenant, y se puede robar cookies de sesión, redirigir a phishing, o ejecutar acciones en nombre del usuario.

**Solución recomendada:**  
Eliminar `"image/svg+xml"` del array `ALLOWED_IMAGES`. SVG no es necesario para fotos de productos. Si se necesita soporte vectorial en el futuro, sanitizar con DOMPurify antes de guardar.

```typescript
const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Eliminar: "image/svg+xml"
```

---

#### C-3: Sin validación de variables de entorno al inicio

**Archivo:** `src/db/index.ts`, `src/lib/auth.ts`, `src/proxy.ts`  
**Línea:** múltiples — uso de `process.env.DATABASE_URL!`, `process.env.NEXTAUTH_SECRET!`

**Problema:**  
El operador `!` suprime el error de TypeScript pero no ejecuta ninguna validación en runtime. Si `DATABASE_URL` está vacía o mal configurada, el servidor arranca sin error y falla en la primera query con un mensaje críptico. No hay ningún chequeo de "entorno completo" al inicio.

**Riesgo concreto:**  
Despliegue silencioso roto: el servidor arranca en producción, las métricas de health check pasan, pero todas las operaciones de DB fallan. Difícil de diagnosticar en producción.

**Solución recomendada:**  
Agregar validación explícita en un módulo `src/lib/env.ts`:

```typescript
const required = ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}
```
Importar este módulo desde `src/db/index.ts` para que falle rápido y con mensaje claro.

---

### 🟠 ALTO

---

#### A-1: Sin rate limiting en endpoints críticos

**Archivos:**  
- [src/app/api/upload/route.ts](src/app/api/upload/route.ts) — subida de archivos  
- [src/app/admin/login/page.tsx](src/app/admin/login/page.tsx) — autenticación  
- [src/app/api/orders/route.ts](src/app/api/orders/route.ts) — creación de pedidos

**Problema:**  
Ninguno de estos endpoints tiene rate limiting. Cualquier cliente puede enviar peticiones ilimitadas sin consecuencias.

**Riesgo concreto:**  
- **Upload:** Un atacante puede llenar el disco del servidor en minutos subiendo archivos de 10MB repetidamente (el límite actual es 10MB por request, pero no hay límite de requests/minuto ni límite de almacenamiento total por tenant).
- **Login:** Ataque de fuerza bruta sin obstáculos contra cuentas de admin.
- **Orders:** Spam de pedidos falsos que satura el WhatsApp del comerciante.

**Solución recomendada:**  
Usar `@upstash/ratelimit` (integración nativa con Vercel Edge) o implementar rate limiting basado en IP con `x-forwarded-for`:

```typescript
// Ejemplo con Upstash
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, "60 s") });
```

Para login: máx. 5 intentos/minuto por IP. Para upload: máx. 20/hora por tenant. Para orders: máx. 10/minuto por IP.

---

#### A-2: `schemaName` del JWT no re-validado contra la base de datos

**Archivo:** [src/app/api/admin/actions.ts](src/app/api/admin/actions.ts)  
**Línea:** `requireRole` → `session.user.schemaName` usado directamente

**Problema:**  
El `schemaName` se extrae del JWT sin verificar que el tenant todavía existe y está activo en la tabla `public.tenants`. Si un tenant es desactivado o eliminado del sistema, sus JWT firmados siguen siendo válidos hasta que expiren (por defecto NextAuth: 30 días). Durante ese período, el usuario puede seguir ejecutando acciones sobre su esquema de DB.

**Riesgo concreto:**  
Un tenant eliminado o suspendido por impago puede seguir usando la aplicación. También: si un `schemaName` del JWT es manipulado (aunque esté firmado, un bug futuro podría introducir una vulnerabilidad), accedería a datos de otro tenant.

**Solución recomendada:**  
En `requireRole`, verificar que el tenant existe y está activo:

```typescript
const tenant = await publicDb.select({ active: tenants.active })
  .from(tenants).where(eq(tenants.schemaName, session.user.schemaName)).limit(1);
if (!tenant[0]?.active) throw new Error("Tenant inactivo o inexistente");
```
Cachear con `React.cache()` para no agregar latencia a cada server action.

---

#### A-3: Sin límite de almacenamiento total por tenant

**Archivo:** [src/app/api/upload/route.ts](src/app/api/upload/route.ts)

**Problema:**  
El endpoint de upload verifica el tamaño de cada archivo individual (10MB) pero no verifica el almacenamiento total acumulado por tenant. Un tenant puede subir miles de archivos y consumir todo el espacio en disco.

**Riesgo concreto:**  
DoS del servidor por agotamiento de espacio en disco. Afecta a todos los tenants (single server, shared filesystem).

**Solución recomendada:**  
Calcular el tamaño total del directorio `public/uploads/{schemaName}/` antes de aceptar el archivo:

```typescript
import { statSync, readdirSync } from "fs";
const MAX_TENANT_STORAGE = 500 * 1024 * 1024; // 500MB por tenant
// Sumar tamaños de archivos existentes antes de guardar
```
O migrar uploads a un servicio externo (Cloudflare R2, Vercel Blob) con cuotas configurables.

---

#### A-4: Sin cabeceras de seguridad HTTP

**Archivo:** [next.config.ts](next.config.ts) (o `next.config.js`)

**Problema:**  
La aplicación no envía cabeceras de seguridad estándar: no hay `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, ni `Permissions-Policy`.

**Riesgo concreto:**  
- Sin `X-Frame-Options: DENY`: la app puede embeberse en iframes para ataques de clickjacking.
- Sin `X-Content-Type-Options: nosniff`: el navegador puede inferir tipos MIME incorrectos (vector de XSS).
- Sin CSP: si se introduce XSS en el futuro, no hay segunda línea de defensa.

**Solución recomendada:**  
En `next.config.ts`, agregar:

```typescript
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
// En headers() de la config de Next.js
```
CSP requiere más trabajo para no bloquear recursos legítimos (inline styles de Tailwind, etc.) — dejarlo para la siguiente iteración con modo report-only primero.

---

#### A-5: Archivos subidos accesibles públicamente sin autenticación

**Archivo:** [src/app/api/upload/route.ts](src/app/api/upload/route.ts)  
**Ruta de archivos:** `public/uploads/{schemaName}/filename`

**Problema:**  
Los archivos se guardan en la carpeta `public/` de Next.js, que sirve todo su contenido estáticamente sin autenticación. Cualquiera que conozca (o adivine) la URL de un archivo puede descargarlo. No hay protección por tenant.

**Riesgo concreto:**  
Un usuario de un tenant puede acceder a imágenes de productos de otro tenant si adivina el `schemaName` y el nombre del archivo (UUIDs son difíciles de adivinar, pero `{timestamp}-{nanoid}` podría ser enumerado). También: archivos de tenants "privados" son públicos por defecto.

**Solución recomendada:**  
Para catálogos públicos esto puede ser aceptable (los productos son públicos). Documentar esta decisión explícitamente. Si se necesita privacidad, migrar a un bucket privado con URLs firmadas (Cloudflare R2 signed URLs).

---

#### A-6: Contraseñas sin política robusta

**Archivo:** [src/app/superadmin/(dashboard)/tenants/page.tsx](src/app/superadmin/(dashboard)/tenants/page.tsx) y formularios de creación de usuarios

**Problema:**  
La validación de contraseñas acepta cualquier cadena de 8+ caracteres sin requerir complejidad (mayúsculas, números, caracteres especiales). Contraseñas como `"12345678"` son válidas.

**Riesgo concreto:**  
Cuentas de administrador con contraseñas débiles son el vector de ataque más común en aplicaciones web. Un ataque de diccionario básico puede comprometer cuentas en minutos (especialmente sin rate limiting — ver A-1).

**Solución recomendada:**  
```typescript
const passwordSchema = z.string()
  .min(10, "Mínimo 10 caracteres")
  .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
  .regex(/[0-9]/, "Debe contener al menos un número");
```

---

### 🟡 MEDIO

---

#### M-1: Sin audit log de acciones administrativas

**Archivos:** [src/app/api/admin/actions.ts](src/app/api/admin/actions.ts)

**Problema:**  
Ninguna acción administrativa (crear/editar/eliminar productos, cambiar ajustes, crear usuarios) genera un registro de auditoría. No hay forma de saber quién hizo qué y cuándo.

**Riesgo concreto:**  
Imposible investigar incidentes. Si un producto es eliminado o un ajuste es cambiado incorrectamente, no hay trazabilidad. Requerido para cumplimiento en muchos contextos regulatorios.

**Solución recomendada:**  
Tabla `audit_log` por tenant con campos `(id, userId, action, entityType, entityId, before, after, createdAt)`. Insertar en cada server action dentro de la transacción existente.

---

#### M-2: Tabla `settings` sin restricción UNIQUE — puede tener múltiples filas

**Archivo:** [src/db/tenant-schema.ts](src/db/tenant-schema.ts)  
**Archivo:** [src/lib/tenant-ddl.ts](src/lib/tenant-ddl.ts)

**Problema:**  
La tabla `settings` se usa con `SELECT ... LIMIT 1` y `INSERT si no existe / UPDATE si existe`. No tiene ninguna restricción `UNIQUE` o `PRIMARY KEY` que garantice una sola fila. Una race condition (dos requests simultáneos al mismo tiempo cuando `settings` está vacío) puede crear múltiples filas, y el `UPDATE` solo actualiza la primera.

**Riesgo concreto:**  
Configuración silenciosamente perdida: el admin guarda los ajustes, parecen guardarse, pero la próxima vez se lee la fila "vieja" porque hay dos filas y `LIMIT 1` puede devolver cualquiera.

**Solución recomendada:**  
Agregar una columna `singleton` con restricción única:

```sql
ALTER TABLE settings ADD COLUMN singleton BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE settings ADD CONSTRAINT settings_singleton_unique UNIQUE (singleton);
```
O simplemente usar `INSERT ... ON CONFLICT DO UPDATE` (upsert) con una columna PK fija.

---

#### M-3: `console.error` con stack traces visibles en logs de producción

**Archivo:** [src/app/api/admin/actions.ts](src/app/api/admin/actions.ts), múltiples archivos

**Problema:**  
Los errores se loguean con `console.error(err)` que incluye el stack trace completo (rutas de archivo, nombres de función, líneas de código). En producción, estos logs pueden ser accesibles a través de servicios de logging compartidos.

**Riesgo concreto:**  
Los stack traces revelan la estructura interna del código (rutas de archivo, framework versions) que facilita el targeting de vulnerabilidades conocidas.

**Solución recomendada:**  
Usar un logger estructurado que en producción solo emita mensaje + código de error, sin stack trace:

```typescript
if (process.env.NODE_ENV === "production") {
  console.error({ message: err.message, code: err.code });
} else {
  console.error(err);
}
```

---

#### M-4: Sin verificación de `tenant.active` en el catálogo público

**Archivo:** [src/app/page.tsx](src/app/page.tsx)  
**Archivo:** [src/lib/tenant.ts](src/lib/tenant.ts)

**Problema:**  
`getCurrentTenant()` devuelve el tenant si existe en la tabla `tenants`, sin verificar si tiene un campo `active` (o equivalente) que indique si está en funcionamiento. Un tenant suspendido seguiría mostrando su catálogo.

**Riesgo concreto:**  
Tenants morosos o suspendidos siguen en producción sin forma de desactivarlos a nivel de catálogo público.

**Solución recomendada:**  
Si la tabla `tenants` tiene campo `active`, agregar `AND active = true` en `getCurrentTenant()`. Si no existe el campo, añadirlo en la próxima migración.

---

#### M-5: Sin `.env.example` — incorporación de nuevos desarrolladores difícil

**Archivos:** `.gitignore` (excluye `.env`), sin `.env.example`

**Problema:**  
No existe un archivo `.env.example` que documente qué variables de entorno son necesarias. Un nuevo desarrollador (o un despliegue nuevo) no sabe qué configurar.

**Riesgo concreto:**  
Configuración incorrecta por omisión → errores crípticos → presión para hardcodear valores → vulnerabilidades.

**Solución recomendada:**  
Crear `.env.example`:
```bash
DATABASE_URL=postgresql://user:password@host:5432/db
NEXTAUTH_SECRET=<generar con: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_DOMAIN=localhost:3000
```

---

#### M-6: Sin validación CORS explícita en API routes

**Archivo:** [src/app/api/orders/route.ts](src/app/api/orders/route.ts), [src/app/api/upload/route.ts](src/app/api/upload/route.ts)

**Problema:**  
Las API routes no establecen cabeceras CORS. Next.js por defecto no permite CORS cross-origin, pero esto no está explícitamente configurado. Si se agrega un cliente móvil o una integración de terceros en el futuro, el comportamiento podría ser inesperado.

**Solución recomendada:**  
Agregar cabeceras CORS explícitas con lista blanca de orígenes permitidos, o documentar que las API solo se consumen desde el mismo origen.

---

### 🔵 BAJO

---

#### B-1: Sin suite de tests (unit, integration, e2e)

**Archivos:** sin `__tests__/`, sin `*.test.ts`, sin `cypress/`, sin `playwright/`

**Problema:**  
El proyecto no tiene ningún test automatizado. Los cambios se verifican manualmente.

**Riesgo concreto:**  
Regresiones silenciosas. Un cambio en `actions.ts` puede romper el flujo de checkout sin que nadie lo note hasta que un cliente reporta el problema.

**Solución recomendada:**  
Comenzar con tests de integración para los server actions más críticos (crear producto, guardar ajustes, crear pedido). Usar Vitest + Playwright para e2e del flujo de checkout por WhatsApp.

---

#### B-2: `package.json` con dependencias potencialmente desactualizadas

**Archivo:** [package.json](package.json)

**Problema:**  
No se realizó un `npm audit` durante la auditoría. Las dependencias pueden tener vulnerabilidades conocidas.

**Solución recomendada:**  
```bash
npm audit
npm audit fix
```
Revisar los hallazgos y priorizar los de severidad high/critical.

---

#### B-3: Timer de sesión solo en cliente — puede ser eludido

**Archivo:** [src/components/admin/AdminShell.tsx](src/components/admin/AdminShell.tsx)

**Problema:**  
El timeout de sesión inactiva se implementa con `setTimeout` en el cliente. Un atacante con acceso a la consola del navegador puede limpiar el timer y mantener la sesión activa indefinidamente sin hacer requests.

**Riesgo concreto:**  
Bajo en la práctica (requiere acceso físico al navegador), pero el timer no ofrece la protección que aparenta.

**Solución recomendada:**  
La expiración real de sesión debe configurarse en NextAuth (`maxAge` en la sesión JWT). El timer del cliente es solo UX (mostrar aviso antes de expirar), no seguridad.

---

#### B-4: Nombres de archivos subidos predecibles

**Archivo:** [src/app/api/upload/route.ts](src/app/api/upload/route.ts)  
**Línea:** Generación de nombre: `${Date.now()}-{nanoid(6)}.ext`

**Problema:**  
El nombre incluye el timestamp Unix en milisegundos. Aunque `nanoid(6)` agrega aleatoriedad, el timestamp reduce el espacio de búsqueda si un atacante conoce la fecha aproximada de subida.

**Solución recomendada:**  
Usar solo `nanoid(21)` o `crypto.randomUUID()` como nombre, sin timestamp. El timestamp en el nombre de archivo es innecesario (la metadata de creación está en la DB).

---

## Mejoras Sugeridas (no bloqueantes)

Estas mejoras no son bugs ni vulnerabilidades, pero mejorarían significativamente la experiencia y mantenibilidad:

### UX / Funcionalidad

**S-1: Paginación en el grid de productos**  
Actualmente se cargan todos los productos activos en memoria en cada request. Con catálogos grandes (>200 productos) esto degradará el tiempo de carga. Implementar paginación cursor-based o virtual scroll.

**S-2: Búsqueda de productos en el catálogo**  
No hay búsqueda por texto. Agregar un `input` de búsqueda que filtre por `title` e `description` (puede ser client-side para catálogos pequeños, o server-side con `ILIKE` para catálogos grandes).

**S-3: Confirmación antes de eliminar productos/categorías**  
Los botones de eliminar actúan directamente sin confirmación. Un click accidental elimina datos permanentemente.

**S-4: Imagen de "sin stock" o badge de agotado**  
Cuando `trackStock: true` y `stock: 0`, el producto se muestra igual que los disponibles en el catálogo. Agregar un badge/overlay visual de "Agotado".

### DevOps / Operaciones

**S-5: Health check endpoint**  
Agregar `GET /api/health` que verifica conectividad a la DB y retorna `{ status: "ok", timestamp }`. Necesario para monitoring y load balancers.

**S-6: Migraciones en startup automático**  
Actualmente las migraciones deben ejecutarse manualmente. Agregar un mecanismo de migración automática en el startup del servidor (o como paso de build en Vercel).

**S-7: Backup de base de datos**  
No hay procedimiento documentado de backup. Para datos de producción, configurar pg_dump automático o usar el backup automático del proveedor de PostgreSQL.

### Código

**S-8: Duplicación en `updateSettings` y `updateCategoriesStyle`**  
Ambas acciones hacen el mismo patrón "select existing → upsert". Extraer a un helper `upsertSettings(schema, values)`.

**S-9: `toSlug()` no maneja caracteres especiales del español completamente**  
La función `normalize("NFD").replace(/[̀-ͯ]/g, "")` es el enfoque correcto, pero el regex actual `/[̀-ͯ]/g` usa un rango de caracteres impreciso. Usar el rango Unicode estándar de diacríticos.

---

## Checklist — ¿Listo para Producción?

| # | Área | Estado | Prioridad |
|---|------|--------|-----------|
| ✅ | Aislamiento por esquema Postgres | Implementado | — |
| ✅ | ORM Drizzle (previene SQL injection) | Implementado | — |
| ✅ | bcrypt 12 rounds en contraseñas | Implementado | — |
| ✅ | Validación Zod en orders API | Implementado | — |
| ✅ | Whitelist de tipos de archivo en uploads | Implementado | — |
| ✅ | Autenticación requerida en upload endpoint | Implementado | — |
| ✅ | Roles EDITOR/ADMIN/SUPER_ADMIN | Implementado | — |
| ✅ | `ActionResult` pattern consistente | Implementado | — |
| ❌ | `NEXTAUTH_SECRET` con valor seguro | **PENDIENTE** | 🔴 CRÍTICO |
| ❌ | Eliminar SVG de tipos permitidos | **PENDIENTE** | 🔴 CRÍTICO |
| ❌ | Validación de env vars al startup | **PENDIENTE** | 🔴 CRÍTICO |
| ❌ | Rate limiting en login/upload/orders | **PENDIENTE** | 🟠 ALTO |
| ❌ | Re-validar tenant activo en JWT | **PENDIENTE** | 🟠 ALTO |
| ❌ | Límite de almacenamiento por tenant | **PENDIENTE** | 🟠 ALTO |
| ❌ | Cabeceras de seguridad HTTP | **PENDIENTE** | 🟠 ALTO |
| ❌ | Política de contraseñas robusta | **PENDIENTE** | 🟠 ALTO |
| ❌ | Restricción UNIQUE en tabla settings | **PENDIENTE** | 🟡 MEDIO |
| ❌ | Audit log de acciones admin | **PENDIENTE** | 🟡 MEDIO |
| ❌ | Archivo `.env.example` | **PENDIENTE** | 🟡 MEDIO |
| ❌ | Tests automatizados | **PENDIENTE** | 🔵 BAJO |
| ❌ | Health check endpoint | **PENDIENTE** | Mejora |
| ❌ | Paginación de productos | **PENDIENTE** | Mejora |

**Resultado: NO listo para producción.** Resolver los 3 hallazgos CRÍTICOS y los 5 ALTOS antes del despliegue.

---

*Informe generado automáticamente. Fase 2 (correcciones) se inicia solo tras aprobación explícita del usuario.*
