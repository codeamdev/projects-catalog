"use client";

import { useState, useEffect } from "react";

interface Props {
  title: string;
  subtitle?: string | null;
  /** Array de URLs para el carrusel automático */
  images?: string[];
  /** URL de video local (.mp4 / .webm) para fondo de video */
  videoUrl?: string | null;
  primaryColor: string;
}

export function HeroBanner({ title, subtitle, images = [], videoUrl, primaryColor }: Props) {
  const [current, setCurrent] = useState(0);
  const hasCarousel = images.length > 1;
  const hasSingleImage = images.length === 1;

  // Avance automático del carrusel cada 5 s
  useEffect(() => {
    if (!hasCarousel) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % images.length), 5000);
    return () => clearInterval(id);
  }, [hasCarousel, images.length]);

  return (
    <section
      className="relative w-full flex items-end overflow-hidden"
      style={{ height: "100svh", minHeight: "560px" }}
    >
      {/* ── Fondo ── */}
      <div className="absolute inset-0 overflow-hidden">

        {/* Video local */}
        {videoUrl && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src={videoUrl}
          />
        )}

        {/* Carrusel de imágenes — crossfade */}
        {!videoUrl && hasCarousel && images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Imagen única con efecto Ken Burns */}
        {!videoUrl && hasSingleImage && (
          <img
            src={images[0]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover animate-ken-burns origin-center"
          />
        )}

        {/* Sin imagen — degradé de color del tenant */}
        {!videoUrl && images.length === 0 && (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, #000 80%)` }}
          />
        )}
      </div>

      {/* Overlay en capas para profundidad */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/35" />

      {/* ── Contenido editorial — abajo izquierda ── */}
      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
        <p className="text-white/45 text-[11px] uppercase tracking-[0.35em] font-medium mb-4">
          Colección exclusiva
        </p>
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white leading-none mb-5 max-w-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/60 text-base sm:text-lg mb-8 max-w-md leading-relaxed">
            {subtitle}
          </p>
        )}
        <a
          href="#feed"
          className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-3 rounded-full text-sm hover:bg-gray-100 active:scale-95 transition-all"
        >
          Ver productos
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </div>

      {/* Dots del carrusel */}
      {hasCarousel && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Ir a imagen ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "bg-white w-6" : "bg-white/35 w-1.5 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Indicador de scroll (solo sin carrusel) */}
      {!hasCarousel && (
        <div className="absolute bottom-7 right-5 flex flex-col items-center gap-1.5 text-white/30 z-10">
          <span className="text-[9px] uppercase tracking-[0.3em]">scroll</span>
          <div className="w-px h-7 bg-gradient-to-b from-white/40 to-transparent animate-bounce" />
        </div>
      )}
    </section>
  );
}
