"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, Link as LinkIcon } from "lucide-react";

interface Props {
  /** Nombre del campo oculto (URLs separadas por \n) */
  name: string;
  defaultValue?: string | null;
}

export function MultiImageUpload({ name, defaultValue = "" }: Props) {
  const [urls, setUrls] = useState<string[]>(
    (defaultValue ?? "").split("\n").map((u) => u.trim()).filter(Boolean)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList) {
    setLoading(true);
    setError("");
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) added.push(data.url);
      else setError(data.error ?? "Error al subir");
    }
    setUrls((prev) => [...prev, ...added]);
    setLoading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  function remove(i: number) {
    setUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addUrl() {
    const v = urlInput.trim();
    if (v) { setUrls((prev) => [...prev, v]); setUrlInput(""); }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Imágenes del producto
      </label>

      {/* Input oculto con todas las URLs */}
      <input type="hidden" name={name} value={urls.join("\n")} />

      {/* Grilla de previews */}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {urls.map((u, i) => (
            <div
              key={`${u}-${i}`}
              className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group"
            >
              <img src={u} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                <X className="w-3 h-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Zona de drop / selección */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
        ) : (
          <>
            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
            <p className="text-sm font-medium text-gray-500">
              {urls.length > 0 ? "Agregar más imágenes" : "Subir imágenes"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              JPG, PNG, WebP · Máx 5 MB por imagen · podés seleccionar varias
            </p>
          </>
        )}
      </div>

      {/* URL externa */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }}
            placeholder="O pegá una URL de imagen…"
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>
        <button
          type="button"
          onClick={addUrl}
          className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
        >
          Agregar
        </button>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); }}
      />
    </div>
  );
}
