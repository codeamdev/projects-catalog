"use client";

import { useState, useTransition } from "react";
import { deleteSubscriber } from "@/app/api/admin/actions";
import type { Subscriber } from "@/db/tenant-schema";

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export function SubscribersTable({ subscribers }: { subscribers: Subscriber[] }) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteSubscriber(id);
      setConfirmId(null);
    });
  }

  if (subscribers.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-gray-500 font-medium">Aún no hay suscriptores</p>
        <p className="text-gray-400 text-sm mt-1">Activá el popup de bienvenida en Ajustes</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nombre</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Código</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Usado</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {subscribers.map((s) => (
              <tr key={s.id} className={s.unsubscribedAt ? "opacity-40" : "hover:bg-gray-50/50"}>
                <td className="px-5 py-3.5 font-medium text-gray-800">{s.name || <span className="text-gray-300">—</span>}</td>
                <td className="px-5 py-3.5 text-gray-600">{s.email}</td>
                <td className="px-5 py-3.5">
                  {s.discountCode
                    ? <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-700">{s.discountCode}</span>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  {s.discountUsedAt
                    ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ {fmtDate(s.discountUsedAt)}</span>
                    : <span className="text-gray-300 text-xs">No</span>}
                </td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{fmtDate(s.subscribedAt)}</td>
                <td className="px-5 py-3.5">
                  {s.unsubscribedAt
                    ? <span className="text-xs text-gray-400">Dado de baja</span>
                    : <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">Activo</span>}
                </td>
                <td className="px-4 py-3.5 text-right">
                  {confirmId === s.id ? (
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-gray-500">¿Eliminar?</span>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={isPending}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                        Sí
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(s.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
