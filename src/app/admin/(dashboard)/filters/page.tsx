import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { filterGroups, filterOptions } from "@/db/tenant-schema";
import { eq } from "drizzle-orm";
import {
  createFilterGroup,
  deleteFilterGroup,
  createFilterOption,
  deleteFilterOption,
} from "@/app/api/admin/actions";
import { DeleteButton } from "@/components/admin/DeleteButton";

const INPUT =
  "border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 flex-1 min-w-0";

async function createGroupAction(fd: FormData): Promise<void> {
  "use server";
  await createFilterGroup(fd);
}

export default async function FiltersPage() {
  const session = await auth();
  const schema = session!.user.schemaName;

  const groups = await withTenantDb(schema, async (db) => {
    const gs = await db
      .select()
      .from(filterGroups)
      .orderBy(filterGroups.order, filterGroups.name);

    const opts = await db
      .select()
      .from(filterOptions)
      .orderBy(filterOptions.order, filterOptions.name);

    return gs.map((g) => ({
      ...g,
      options: opts.filter((o) => o.groupId === g.id),
    }));
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Filtros</h1>
        <p className="text-sm text-gray-500 mt-1">
          Crea grupos de filtros (Marca, Género, Talla…) y sus opciones. Los
          asignas a cada producto al editarlo.
        </p>
      </div>

      {/* Nuevo grupo */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Nuevo grupo</h2>
        <form action={createGroupAction} className="flex gap-3">
          <input
            name="name"
            required
            placeholder="Ej: Marca, Género, Tipo de fragancia, Talla…"
            className={INPUT}
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            + Crear
          </button>
        </form>
      </section>

      {/* Lista de grupos */}
      {groups.length === 0 ? (
        <section className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-4xl mb-3">🗂️</p>
          <p className="text-sm font-medium text-gray-900">Aún no hay grupos de filtros</p>
          <p className="text-xs text-gray-400 mt-1">
            Empieza creando uno arriba — por ejemplo, &quot;Marca&quot; o &quot;Género&quot;.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            async function addOptionAction(fd: FormData): Promise<void> {
              "use server";
              await createFilterOption(group.id, fd);
            }

            return (
              <section
                key={group.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                {/* Header del grupo */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <div>
                    <p className="font-semibold text-gray-900">{group.name}</p>
                    <p className="text-xs text-gray-400">{group.options.length} opción{group.options.length !== 1 ? "es" : ""}</p>
                  </div>
                  <DeleteButton
                    deleteAction={deleteFilterGroup.bind(null, group.id)}
                    confirm={`¿Eliminar el grupo "${group.name}"? Se eliminarán todas sus opciones y se quitará de los productos.`}
                    label="Eliminar grupo"
                  />
                </div>

                {/* Opciones */}
                <div className="px-6 py-3">
                  {group.options.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">
                      Sin opciones todavía — agrégalas abajo.
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-50">
                      {group.options.map((opt) => (
                        <li key={opt.id} className="flex items-center justify-between py-2.5 gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-200 flex-shrink-0" />
                            <span className="text-sm text-gray-800">{opt.name}</span>
                            <span className="text-xs text-gray-400">· {opt.slug}</span>
                          </div>
                          <DeleteButton
                            deleteAction={deleteFilterOption.bind(null, opt.id)}
                            confirm={`¿Eliminar la opción "${opt.name}"?`}
                            label="✕"
                            small
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Agregar opción */}
                <div className="px-6 pb-4">
                  <form action={addOptionAction} className="flex gap-2">
                    <input
                      name="name"
                      required
                      placeholder={`Nueva opción en ${group.name}…`}
                      className={`${INPUT} text-xs py-2`}
                    />
                    <button
                      type="submit"
                      className="bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap"
                    >
                      + Agregar
                    </button>
                  </form>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
