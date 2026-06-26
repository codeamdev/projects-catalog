"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";

interface ImportResult {
  ok: boolean;
  created: number;
  updated: number;
  total: number;
  errors: { row: number; title: string; error: string }[];
}

export default function ImportProductsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError("");
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/products/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al importar"); return; }
      setResult(data);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  const hasErrors = result && result.errors.length > 0;
  const allErrors = result && result.errors.length === result.total;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importar / Exportar productos</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestión masiva de productos mediante Excel</p>
        </div>
      </div>

      {/* Export */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900">Exportar productos</h2>
            <p className="text-sm text-gray-500 mt-1">
              Descarga todos los productos actuales en un archivo Excel. Podés editarlo y volver a importarlo para actualizar en masa.
            </p>
            <a
              href="/api/admin/products/export"
              className="inline-flex items-center gap-2 mt-4 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Descargar Excel
            </a>
          </div>
        </div>
      </section>

      {/* Import */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Importar productos</h2>
            <p className="text-sm text-gray-500 mt-1">
              Cargá un Excel con tus productos. Si el <strong>ID</strong> está presente, actualiza el existente. Si no, crea uno nuevo.
            </p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            file ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <FileSpreadsheet className={`w-10 h-10 mx-auto mb-3 ${file ? "text-blue-500" : "text-gray-300"}`} />
          {file ? (
            <>
              <p className="text-sm font-medium text-blue-700">{file.name}</p>
              <p className="text-xs text-blue-500 mt-1">{(file.size / 1024).toFixed(1)} KB — clic para cambiar</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">Seleccioná o arrastrá tu archivo Excel</p>
              <p className="text-xs text-gray-400 mt-1">Formatos: .xlsx, .xls</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="mt-4 w-full py-3 rounded-xl font-semibold text-white text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? "Importando…" : "Importar productos"}
        </button>

        {/* Result */}
        {result && (
          <div className="mt-5 space-y-3">
            {/* Summary */}
            <div className={`rounded-xl p-4 ${allErrors ? "bg-red-50 border border-red-100" : "bg-green-50 border border-green-100"}`}>
              <div className="flex items-center gap-2 mb-2">
                {allErrors
                  ? <XCircle className="w-5 h-5 text-red-500" />
                  : <CheckCircle className="w-5 h-5 text-green-600" />
                }
                <span className="font-semibold text-sm text-gray-900">
                  {allErrors ? "Importación con errores" : "Importación completada"}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-700"><strong>{result.created}</strong> creados</span>
                <span className="text-blue-700"><strong>{result.updated}</strong> actualizados</span>
                {hasErrors && <span className="text-red-600"><strong>{result.errors.length}</strong> con errores</span>}
              </div>
            </div>

            {/* Errors detail */}
            {hasErrors && (
              <div className="bg-red-50 border border-red-100 rounded-xl overflow-hidden">
                <p className="text-xs font-semibold text-red-700 px-4 py-2.5 border-b border-red-100">
                  Filas con error
                </p>
                <div className="divide-y divide-red-100 max-h-48 overflow-y-auto">
                  {result.errors.map((e) => (
                    <div key={e.row} className="px-4 py-2.5 flex items-start gap-3 text-xs">
                      <span className="bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded font-mono flex-shrink-0">F{e.row}</span>
                      <div>
                        <span className="font-medium text-gray-800">{e.title}</span>
                        <span className="text-red-600 ml-2">— {e.error}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!allErrors && (
              <Link
                href="/admin/products"
                className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700 py-2"
              >
                Ver productos →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Tips */}
      <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 space-y-1">
        <p className="font-semibold mb-1.5">Tips para importar correctamente:</p>
        <p>• Exportá primero para obtener la plantilla con el formato correcto.</p>
        <p>• Para <strong>actualizar</strong> productos existentes, conservá la columna <strong>ID</strong>.</p>
        <p>• Para <strong>crear</strong> nuevos productos, dejá la columna ID en blanco.</p>
        <p>• El campo <strong>Título</strong> es obligatorio. Los demás son opcionales.</p>
        <p>• La <strong>Categoría</strong> debe existir en el sistema. Si no existe, la fila se marca como error.</p>
        <p>• Las imágenes se gestionan individualmente desde la edición de cada producto.</p>
      </div>
    </div>
  );
}
