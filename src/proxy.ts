import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "allexclusive.com";
const TENANT_COOKIE = "x-test-tenant";
const isDev = process.env.NODE_ENV === "development";

// Solo letras, números y guiones — previene path traversal e inyección SQL
const VALID_SUBDOMAIN = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^[a-z0-9]$/;

function sanitizeTenant(value: string | null | undefined): string | null {
  if (!value) return null;
  const clean = value.trim().toLowerCase();
  return VALID_SUBDOMAIN.test(clean) ? clean : null;
}

export function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host") || "").split(":")[0];

  // ── Ruta 1: subdominio real ────────────────────────────────────
  // Ejemplos:
  //   prod:  tendencias.allexclusive.com  →  ROOT_DOMAIN=allexclusive.com  →  "tendencias"
  //   dev:   tendencias.localhost         →  ROOT_DOMAIN=localhost          →  "tendencias"
  const rawSubdomain = hostname
    .replace(`.${ROOT_DOMAIN}`, "")
    .replace("www.", "");

  const hasRealSubdomain =
    rawSubdomain !== hostname && // algo cambió al hacer replace → había subdominio
    rawSubdomain !== "" &&
    rawSubdomain !== "www";

  if (hasRealSubdomain) {
    const subdomain = sanitizeTenant(rawSubdomain);
    if (!subdomain) return NextResponse.next();
    const res = NextResponse.next();
    res.headers.set("x-tenant-subdomain", subdomain);
    return res;
  }

  // ── Ruta 2: fallback solo en desarrollo ───────────────────────
  // Útil cuando se accede a localhost:3000 directamente (sin subdominio)
  // o en previews de Vercel (*.vercel.app)
  if (!isDev) return NextResponse.next();

  // Prioridad: 1) ?_tenant= en URL  2) cookie de sesión de dev
  const queryTenant = sanitizeTenant(request.nextUrl.searchParams.get("_tenant"));
  const cookieTenant = sanitizeTenant(request.cookies.get(TENANT_COOKIE)?.value);

  const tenant = queryTenant ?? cookieTenant;
  if (!tenant) return NextResponse.next();

  const res = NextResponse.next();
  res.headers.set("x-tenant-subdomain", tenant);

  if (queryTenant && queryTenant !== cookieTenant) {
    res.cookies.set(TENANT_COOKIE, queryTenant, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      maxAge: 60 * 60 * 8,
    });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
