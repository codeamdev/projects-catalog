import { auth } from "@/lib/auth";
import { withTenantDb, publicDb } from "@/db";
import { settings } from "@/db/tenant-schema";
import { tenants } from "@/db/public-schema";
import { eq } from "drizzle-orm";
import { updateSettings, updateTenantConfig } from "@/app/api/admin/actions";
import { ImageUpload } from "@/components/admin/ImageUpload";

// Wrappers void para <form action> en Server Components
async function updateSettingsAction(formData: FormData): Promise<void> {
  "use server";
  await updateSettings(formData);
}
async function updateTenantConfigAction(formData: FormData): Promise<void> {
  "use server";
  await updateTenantConfig(formData);
}

const INPUT = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

interface Props {
  searchParams: Promise<{ guardado?: string }>;
}

export default async function SettingsPage({ searchParams }: Props) {
  const session = await auth();
  const { guardado } = await searchParams;

  const [[s], [tenant]] = await Promise.all([
    withTenantDb(session!.user.schemaName, (db) => db.select().from(settings).limit(1)),
    publicDb
      .select()
      .from(tenants)
      .where(eq(tenants.schemaName, session!.user.schemaName))
      .limit(1),
  ]);

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Ajustes del catálogo</h1>

      {/* Banner de confirmación */}
      {guardado && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl">
          <span>✓</span>
          <span>Cambios guardados correctamente.</span>
        </div>
      )}

      {/* ── Sección 1: General ── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">General</h2>
          <p className="text-xs text-gray-400 mt-0.5">WhatsApp, color de marca y logo</p>
        </div>

        <form action={updateTenantConfigAction} className="space-y-5">
          {/* Logo */}
          <ImageUpload
            name="logo_url"
            defaultValue={tenant?.logoUrl}
            label="Logo"
          />

          {/* WhatsApp */}
          <div>
            <label className={LABEL}>Número de WhatsApp</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">
                +
              </span>
              <input
                name="whatsapp_number"
                defaultValue={tenant?.whatsappNumber ?? ""}
                placeholder="5491112345678"
                className={`${INPUT} pl-7`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Código de país + número sin espacios ni guiones (ej: 5491112345678)
            </p>
          </div>

          {/* Color principal */}
          <div>
            <label className={LABEL}>Color principal</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="primary_color"
                defaultValue={tenant?.primaryColor ?? "#1a1a1a"}
                className="h-10 w-16 rounded-xl border border-gray-200 cursor-pointer p-1"
              />
              <span className="text-xs text-gray-400">
                Se usa en el hero y en la identidad visual del catálogo
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Guardar configuración general
          </button>
        </form>
      </section>

      {/* ── Sección 2: Hero + SEO ── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Hero y SEO</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Pantalla de bienvenida y metadatos para buscadores
          </p>
        </div>

        <form action={updateSettingsAction} className="space-y-5">
          <div>
            <label className={LABEL}>Título del hero *</label>
            <input
              name="hero_title"
              defaultValue={s?.heroTitle ?? "Bienvenidos"}
              required
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Subtítulo del hero</label>
            <input
              name="hero_subtitle"
              defaultValue={s?.heroSubtitle ?? ""}
              className={INPUT}
            />
          </div>

          {/* Imagen/video del hero con uploader */}
          <ImageUpload
            name="hero_image_url"
            defaultValue={s?.heroImageUrl}
            label="Imagen de fondo del hero"
          />
          <p className="text-xs text-gray-400 -mt-1">
            La imagen se muestra con efecto Ken Burns o en carrusel junto a productos destacados.
            Para video de fondo usá una URL directa <code className="bg-gray-100 px-1 rounded">.mp4</code> o <code className="bg-gray-100 px-1 rounded">.webm</code>.
          </p>

          <hr className="border-gray-100" />

          <h3 className="text-sm font-semibold text-gray-700">SEO</h3>

          <div>
            <label className={LABEL}>Meta título</label>
            <input name="meta_title" defaultValue={s?.metaTitle ?? ""} className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Meta descripción</label>
            <textarea
              name="meta_description"
              defaultValue={s?.metaDescription ?? ""}
              rows={2}
              className={`${INPUT} resize-none`}
            />
          </div>

          <div>
            <label className={LABEL}>Texto del footer</label>
            <input name="footer_text" defaultValue={s?.footerText ?? ""} className={INPUT} />
          </div>

          <button
            type="submit"
            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Guardar hero y SEO
          </button>
        </form>
      </section>

      {/* ── Sección 3: Código de descuento ── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Código de descuento</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Si configuras un código, el cliente podrá ingresarlo en el carrito antes de pedir.
            Déjalo vacío para desactivar.
          </p>
        </div>

        <form action={updateSettingsAction} className="space-y-4">
          {/* Campos ocultos para preservar otros valores */}
          <input type="hidden" name="hero_title" value={s?.heroTitle ?? "Bienvenidos"} />
          <input type="hidden" name="hero_subtitle" value={s?.heroSubtitle ?? ""} />
          <input type="hidden" name="hero_image_url" value={s?.heroImageUrl ?? ""} />
          <input type="hidden" name="meta_title" value={s?.metaTitle ?? ""} />
          <input type="hidden" name="meta_description" value={s?.metaDescription ?? ""} />
          <input type="hidden" name="footer_text" value={s?.footerText ?? ""} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Código</label>
              <input
                name="discount_code"
                defaultValue={s?.discountCode ?? ""}
                placeholder="Ej: VERANO25"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Descuento (%)</label>
              <input
                name="discount_code_percent"
                type="number"
                min={1}
                max={99}
                defaultValue={s?.discountCodePercent ?? ""}
                placeholder="Ej: 15"
                className={INPUT}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            El código no es sensible a mayúsculas. El porcentaje se aplica al total del carrito.
          </p>

          <button
            type="submit"
            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Guardar código de descuento
          </button>
        </form>
      </section>
    </div>
  );
}
