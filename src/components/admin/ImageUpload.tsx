"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, Link as LinkIcon } from "lucide-react";

interface Props {
  /** Nombre del campo oculto que lee el Server Action */
  name: string;
  defaultValue?: string | null;
  label?: string;
}

export function ImageUpload({ name, defaultValue = "", label }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setUrl(data.url);
    else setError(data.error ?? "Error al subir el archivo");
    setLoading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  function applyUrl() {
    const v = urlInput.trim();
    if (v) { setUrl(v); setUrlInput(""); }
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Input oculto para el Server Action */}
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative inline-block">
          <img src={url} alt="" className="h-36 rounded-xl object-cover border border-gray-200 bg-gray-50" />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
          ) : (
            <>
              <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">Arrastrá o hacé clic para subir</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, GIF · Máx 5 MB</p>
            </>
          )}
        </div>
      )}

      {/* URL externa como alternativa */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyUrl(); } }}
            placeholder="O pegá una URL externa…"
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>
        <button
          type="button"
          onClick={applyUrl}
          className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
        >
          Usar
        </button>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
      />
    </div>
  );
}
