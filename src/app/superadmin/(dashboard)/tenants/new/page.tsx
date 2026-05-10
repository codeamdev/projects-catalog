"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTenant } from "@/app/api/superadmin/actions";

export default function NewTenantPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createTenant(formData);
      if (result.ok) {
        toast.success(`Tenant "${result.data.subdomain}" creado correctamente.`);
        router.push("/superadmin/tenants");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo tenant</h1>
        <p className="text-sm text-gray-500 mt-1">Crear una nueva empresa en el catálogo</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border divide-y max-w-2xl">
        <section className="px-6 py-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Empresa</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subdominio <span className="text-red-500">*</span>
              </label>
              <input
                name="subdomain"
                type="text"
                required
                placeholder="tendencias"
                pattern="^[a-z][a-z0-9-]{0,60}[a-z0-9]$|^[a-z0-9]$"
                title="Solo letras minúsculas, números y guiones"
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <p className="text-xs text-gray-400 mt-1">Solo letras minúsculas, números y guiones</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la empresa <span className="text-red-500">*</span>
              </label>
              <input
                name="tenantName"
                type="text"
                required
                placeholder="Tendencias Ropa"
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color primario</label>
              <div className="flex items-center gap-3">
                <input
                  name="primaryColor"
                  type="color"
                  defaultValue="#1a1a1a"
                  className="h-10 w-16 rounded-lg border cursor-pointer"
                />
                <span className="text-xs text-gray-400">Usado en botones y acentos</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input
                name="whatsappNumber"
                type="text"
                placeholder="+57 300 123 4567"
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL del logo</label>
            <input
              name="logoUrl"
              type="url"
              placeholder="https://..."
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </section>

        <section className="px-6 py-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
            Administrador inicial
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email admin <span className="text-red-500">*</span>
              </label>
              <input
                name="adminEmail"
                type="email"
                required
                placeholder="admin@empresa.com"
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                name="adminPassword"
                type="password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          </div>
        </section>

        <div className="px-6 py-5 flex items-center justify-between">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className={`flex gap-3 ${error ? "" : "ml-auto"}`}>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creando…
                </>
              ) : (
                "Crear tenant"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
