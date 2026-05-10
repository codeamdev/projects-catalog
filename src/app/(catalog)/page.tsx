// Este archivo es shadowed por app/page.tsx — Next.js usa app/page.tsx para la ruta /.
// Se mantiene actualizado solo para que TypeScript no genere errores.

import { notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/tenant";

export default async function CatalogHome() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  notFound(); // Nunca se sirve — app/page.tsx toma precedencia
}
