"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, Link as LinkIcon } from "lucide-react";

interface Props {
  name: string;
  defaultValue?: string | null;
  label?: string;
}

export function VideoUpload({ name, defaultValue = "", label = "Video" }: Props) {
  const [url, setUrl] = useState((defaultValue ?? "").trim());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setUrl(data.url);
    else setError(data.error ?? "Error al subir");
    setLoading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function addUrl() {
    const v = urlInput.trim();
    if (v) { setUrl(v); setUrlInput(""); }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black">
          <video
            src={url}
            controls
            muted
            playsInline
            className="w-full max-h-48 object-contain"
          />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
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
              <p className="text-sm font-medium text-gray-500">Subir video</p>
              <p className="text-xs text-gray-400 mt-0.5">MP4, WebM · Máx 200 MB</p>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }}
            placeholder="O pegá una URL de video…"
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
        accept="video/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }}
      />
    </div>
  );
}
