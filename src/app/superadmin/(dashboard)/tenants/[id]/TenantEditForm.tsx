"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleTenantActive } from "@/app/api/superadmin/actions";
import type { TenantRow } from "@/app/api/superadmin/actions";

interface Props {
  tenant: TenantRow;
  updateAction: (formData: FormData) => Promise<void>;
}

function toDateInput(d: Date | null): string {
  if (!d) return "";
  const dt = new Date(d);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TenantEditForm({ tenant, updateAction }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [togglePending, startToggle] = useTransition();
  const [active, setActive] = useState(tenant.active);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateAction(formData);
        toast.success("Tenant actualizado correctamente.");
        router.push("/superadmin/tenants");
      } catch {
        setError("Error al guardar los cambios.");
      }
    });
  }

  function handleToggle() {
    startToggle(async () => {
      const result = await toggleTenantActive(tenant.id);
      if (result.ok) {
        setActive((v) => !v);
        toast.success(active ? "Tenant desactivado." : "Tenant activado.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border divide-y max-w-2xl">

      {/* ── Estado ── */}
      <section className="px-6 py-5 space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Estado</h2>
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Catálogo {active ? "activo" : "inactivo"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {active
                ? "El catálogo y el panel admin están accesibles."
                : "El catálogo y el panel admin muestran página de suspensión."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            disabled={togglePending}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60 ${
              active ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                active ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* ── Plan / fechas de publicación ── */}
      <section className="px-6 py-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Plan</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Dejá vacío para no aplicar restricción de fechas.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inicio de publicación</label>
            <input
              name="published_from"
              type="date"
              defaultValue={toDateInput(tenant.publishedFrom)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fin de publicación</label>
            <input
              name="published_until"
              type="date"
              defaultValue={toDateInput(tenant.publishedUntil)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            {tenant.publishedUntil && (
              <p className={`text-xs mt-1 ${
                new Date(tenant.publishedUntil) < new Date()
                  ? "text-red-500"
                  : new Date(tenant.publishedUntil) < new Date(Date.now() + 30 * 86400000)
                  ? "text-amber-500"
                  : "text-gray-400"
              }`}>
                {new Date(tenant.publishedUntil) < new Date()
                  ? "Vencido"
                  : `Vence ${new Date(tenant.publishedUntil).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}`}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Configuración ── */}
      <section className="px-6 py-5 space-y-4">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Configuración</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subdominio</label>
          <input
            type="text"
            value={tenant.subdomain}
            disabled
            className="w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">El subdominio no puede cambiarse</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la empresa <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={tenant.name}
            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color primario</label>
            <div className="flex items-center gap-3">
              <input
                name="primaryColor"
                type="color"
                defaultValue={tenant.primaryColor}
                className="h-10 w-16 rounded-lg border cursor-pointer"
              />
              <span className="text-xs text-gray-400">Botones y acentos</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input
              name="whatsappNumber"
              type="text"
              defaultValue={tenant.whatsappNumber ?? ""}
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
            defaultValue={tenant.logoUrl ?? ""}
            placeholder="https://..."
            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
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
                Guardando…
              </>
            ) : (
              "Guardar cambios"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
