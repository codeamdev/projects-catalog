import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "allexclusive.com";

export function proxy(request: NextRequest) {
  // Separamos el puerto del hostname (ej: "perfumeria.allexclusive.com:3000" → "perfumeria.allexclusive.com")
  const hostname = (request.headers.get("host") || "").split(":")[0];

  // Extrae el subdominio quitando el dominio raíz
  const subdomain = hostname
    .replace(`.${ROOT_DOMAIN}`, "")
    .replace("www.", "");

  const isRootDomain =
    hostname === ROOT_DOMAIN ||
    hostname === `www.${ROOT_DOMAIN}` ||
    hostname === "localhost";

  if (isRootDomain) {
    // En localhost: el cliente puede enviar x-tenant-subdomain directamente en el fetch
    const clientSubdomain = request.headers.get("x-tenant-subdomain");
    if (!clientSubdomain) return NextResponse.next();
    const response = NextResponse.next();
    response.headers.set("x-tenant-subdomain", clientSubdomain);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-tenant-subdomain", subdomain);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
