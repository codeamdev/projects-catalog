import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "allexclusive.com";
const TENANT_COOKIE = "x-test-tenant";

export function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host") || "").split(":")[0];

  // Subdomain real: perfumeria.allexclusive.com → "perfumeria"
  const subdomain = hostname
    .replace(`.${ROOT_DOMAIN}`, "")
    .replace("www.", "");

  const hasRealSubdomain =
    subdomain !== hostname &&          // se modificó algo
    subdomain !== "" &&
    subdomain !== "www";

  if (hasRealSubdomain) {
    // Acceso normal por subdominio (producción)
    const res = NextResponse.next();
    res.headers.set("x-tenant-subdomain", subdomain);
    return res;
  }

  // Sin subdominio real: localhost / dominio raíz / URL de Vercel (*.vercel.app)
  // Prioridad: 1) ?_tenant= en URL  2) cookie de sesión  3) header del cliente (fetch)
  const queryTenant = request.nextUrl.searchParams.get("_tenant");
  const cookieTenant = request.cookies.get(TENANT_COOKIE)?.value;
  const headerTenant = request.headers.get("x-tenant-subdomain");

  const tenant = queryTenant || cookieTenant || headerTenant;
  if (!tenant) return NextResponse.next();

  const res = NextResponse.next();
  res.headers.set("x-tenant-subdomain", tenant);

  // Persistir en cookie para no tener que poner ?_tenant= en cada URL
  if (queryTenant && queryTenant !== cookieTenant) {
    res.cookies.set(TENANT_COOKIE, queryTenant, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 60 * 60 * 8, // 8 horas
    });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
