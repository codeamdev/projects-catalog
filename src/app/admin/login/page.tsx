import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantBySubdomain } from "@/lib/tenant";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage() {
  // Si ya hay sesión activa, redirigir directo al admin
  const session = await auth();
  if (session) redirect("/admin");

  // Detectar el tenant desde el subdominio de la URL
  const headersList = await headers();
  const subdomain = headersList.get("x-tenant-subdomain");
  const tenant = subdomain ? await getTenantBySubdomain(subdomain) : null;

  // Si el subdominio no corresponde a ningún catálogo, mostrar error
  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-2xl mb-2">⚠️</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Catálogo no encontrado</h1>
          <p className="text-gray-500 text-sm">
            El subdominio <strong>{subdomain ?? "desconocido"}</strong> no tiene un catálogo asociado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Panel de administración</p>
          <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
        </div>
        {/* El subdominio se pasa al form como prop — el usuario no lo ve ni lo escribe */}
        <LoginForm subdomain={tenant.subdomain} />
      </div>
    </div>
  );
}
