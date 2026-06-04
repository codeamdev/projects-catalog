"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Pause, Play, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string | null;
  images?: string[];
  imagesMobile?: string[];
  videoUrl?: string | null;
  videoUrlMobile?: string | null;
  primaryColor: string;
  imagePosition?: "top" | "center" | "bottom";
}

const OBJECT_POSITION: Record<string, string> = {
  top: "object-top",
  center: "object-center",
  bottom: "object-bottom",
};

export function HeroBanner({
  title,
  subtitle,
  images = [],
  imagesMobile = [],
  videoUrl,
  videoUrlMobile,
  primaryColor,
  imagePosition = "center",
}: Props) {
  const [current, setCurrent] = useState(0);
  const [currentMobile, setCurrentMobile] = useState(0);
  const [videoPaused, setVideoPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoMobileRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  // Pausa el auto-avance 6s después de interacción manual
  const pauseUntil = useRef(0);

  const mobileVideo = videoUrlMobile || null;
  const mobileImgs  = imagesMobile.length > 0 ? imagesMobile : [];

  const hasCarousel       = images.length > 1;
  const hasSingleImage    = images.length === 1;
  const hasMobileCarousel = mobileImgs.length > 1;
  const hasMobileSingle   = mobileImgs.length === 1;
  const posClass = OBJECT_POSITION[imagePosition] ?? "object-center";

  // ── Navegación desktop ────────────────────────────────────────
  const goDesktop = useCallback((dir: 1 | -1) => {
    pauseUntil.current = Date.now() + 6000;
    setCurrent((c) => (c + dir + images.length) % images.length);
  }, [images.length]);

  // ── Navegación móvil ──────────────────────────────────────────
  const goMobile = useCallback((dir: 1 | -1) => {
    pauseUntil.current = Date.now() + 6000;
    setCurrentMobile((c) => (c + dir + mobileImgs.length) % mobileImgs.length);
  }, [mobileImgs.length]);

  // ── Auto-avance desktop ───────────────────────────────────────
  useEffect(() => {
    if (!hasCarousel) return;
    const id = setInterval(() => {
      if (Date.now() < pauseUntil.current) return;
      setCurrent((c) => (c + 1) % images.length);
    }, 5000);
    return () => clearInterval(id);
  }, [hasCarousel, images.length]);

  // ── Auto-avance móvil ─────────────────────────────────────────
  useEffect(() => {
    if (!hasMobileCarousel) return;
    const id = setInterval(() => {
      if (Date.now() < pauseUntil.current) return;
      setCurrentMobile((c) => (c + 1) % mobileImgs.length);
    }, 5000);
    return () => clearInterval(id);
  }, [hasMobileCarousel, mobileImgs.length]);

  // ── Swipe táctil ──────────────────────────────────────────────
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    // Solo procesa swipes predominantemente horizontales
    if (Math.abs(dx) < 40 || dy > Math.abs(dx)) return;
    const dir = dx > 0 ? 1 : -1;
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      if (hasMobileCarousel) goMobile(dir);
      else if (hasCarousel) goDesktop(dir);
    } else {
      if (hasCarousel) goDesktop(dir);
    }
  }

  // ── Pausa de video ────────────────────────────────────────────
  function toggleVideoPause() {
    const isMobileBreakpoint = window.innerWidth < 640;
    const v = isMobileBreakpoint
      ? (videoMobileRef.current ?? videoRef.current)
      : (videoRef.current ?? videoMobileRef.current);
    if (!v) return;
    if (videoPaused) { v.play(); setVideoPaused(false); }
    else { v.pause(); setVideoPaused(true); }
  }

  // ── Estilos comunes de flechas ────────────────────────────────
  const arrowBase =
    "absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center " +
    "w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/60 " +
    "text-white backdrop-blur-sm transition-all active:scale-90 select-none";

  return (
    <section
      className="relative w-full flex items-end h-dvh sm:h-[75vh] lg:h-screen overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Capa de fondo ─────────────────────────────────────────── */}
      <div className="absolute inset-0">
        <div className="relative w-full h-full overflow-hidden">

          {/* ════ MÓVIL (< sm) ════════════════════════════════════════ */}

          {mobileVideo && (
            <video ref={videoMobileRef} autoPlay muted loop playsInline
              className={`sm:hidden absolute inset-0 w-full h-full object-contain ${posClass}`}
              src={mobileVideo} />
          )}

          {!mobileVideo && hasMobileCarousel && mobileImgs.map((src, i) => (
            <div key={src}
              className={`sm:hidden absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${
                i === currentMobile ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image src={src} alt="" fill sizes="100vw" unoptimized
                className={`object-cover ${posClass} scale-110 blur-2xl opacity-70`}
                priority={i === 0} aria-hidden />
              <Image src={src} alt="" fill sizes="100vw" unoptimized
                className={`object-contain ${posClass}`} priority={i === 0} />
            </div>
          ))}

          {!mobileVideo && hasMobileSingle && (
            <div className="sm:hidden absolute inset-0">
              <Image src={mobileImgs[0]} alt="" fill sizes="100vw" unoptimized
                className={`object-cover ${posClass} scale-110 blur-2xl opacity-70 animate-ken-burns origin-center`}
                aria-hidden priority />
              <Image src={mobileImgs[0]} alt="" fill sizes="100vw" unoptimized
                className={`object-contain ${posClass} animate-ken-burns origin-center`} priority />
            </div>
          )}

          {/* Fallback móvil → usa contenido desktop */}
          {!mobileVideo && mobileImgs.length === 0 && (videoUrl || images.length > 0) && (
            <>
              {videoUrl && (
                <video autoPlay muted loop playsInline
                  className={`sm:hidden absolute inset-0 w-full h-full object-contain ${posClass}`}
                  src={videoUrl} />
              )}
              {!videoUrl && hasCarousel && images.map((src, i) => (
                <div key={src}
                  className={`sm:hidden absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${
                    i === current ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="100vw" unoptimized
                    className={`object-cover ${posClass} scale-110 blur-2xl opacity-70`}
                    priority={i === 0} aria-hidden />
                  <Image src={src} alt="" fill sizes="100vw" unoptimized
                    className={`object-contain ${posClass}`} priority={i === 0} />
                </div>
              ))}
              {!videoUrl && hasSingleImage && (
                <div className="sm:hidden absolute inset-0">
                  <Image src={images[0]} alt="" fill sizes="100vw" unoptimized
                    className={`object-cover ${posClass} scale-110 blur-2xl opacity-70 animate-ken-burns origin-center`}
                    aria-hidden priority />
                  <Image src={images[0]} alt="" fill sizes="100vw" unoptimized
                    className={`object-contain ${posClass} animate-ken-burns origin-center`} priority />
                </div>
              )}
            </>
          )}

          {/* ════ DESKTOP / TABLET (≥ sm) ════════════════════════════ */}

          {videoUrl && (
            <video ref={videoRef} autoPlay muted loop playsInline
              className={`hidden sm:block absolute inset-0 w-full h-full object-cover ${posClass}`}
              src={videoUrl} />
          )}

          {!videoUrl && hasCarousel && images.map((src, i) => (
            <div key={src}
              className={`hidden sm:block absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image src={src} alt="" fill sizes="100vw" unoptimized
                className={`object-cover ${posClass} scale-110 blur-2xl opacity-70`}
                priority={i === 0} aria-hidden />
              <Image src={src} alt="" fill sizes="70vw" unoptimized
                className={`object-contain ${posClass}`} priority={i === 0} />
            </div>
          ))}

          {!videoUrl && hasSingleImage && (
            <div className="hidden sm:block absolute inset-0">
              <Image src={images[0]} alt="" fill sizes="100vw" unoptimized
                className={`object-cover ${posClass} scale-110 blur-2xl opacity-70 animate-ken-burns origin-center`}
                aria-hidden priority />
              <Image src={images[0]} alt="" fill sizes="70vw" unoptimized
                className={`object-contain ${posClass} animate-ken-burns origin-center`} priority />
            </div>
          )}

          {!videoUrl && images.length === 0 && !mobileVideo && mobileImgs.length === 0 && (
            <div className="absolute inset-0"
              style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, #000 80%)` }} />
          )}
        </div>
      </div>

      {/* ── Overlay de profundidad ───────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/35 pointer-events-none" />

      {/* ── Flechas desktop (solo si hay carrusel) ───────────────── */}
      {hasCarousel && !videoUrl && (
        <>
          <button onClick={() => goDesktop(-1)} aria-label="Imagen anterior"
            className={`hidden sm:flex ${arrowBase} left-4`}>
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button onClick={() => goDesktop(1)} aria-label="Imagen siguiente"
            className={`hidden sm:flex ${arrowBase} right-4`}>
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* ── Flechas móvil (carrusel móvil propio o fallback desktop) */}
      {(hasMobileCarousel || (!mobileVideo && mobileImgs.length === 0 && hasCarousel)) && !videoUrl && !mobileVideo && (
        <>
          <button
            onClick={() => hasMobileCarousel ? goMobile(-1) : goDesktop(-1)}
            aria-label="Imagen anterior"
            className={`sm:hidden ${arrowBase} left-3`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => hasMobileCarousel ? goMobile(1) : goDesktop(1)}
            aria-label="Imagen siguiente"
            className={`sm:hidden ${arrowBase} right-3`}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ── Contenido editorial ──────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-5 sm:px-8 pb-8 sm:pb-20 lg:pb-28">
        <p className="hidden sm:block text-white/45 text-[11px] uppercase tracking-[0.35em] font-medium mb-4">
          Colección exclusiva
        </p>
        <h1 className="text-3xl sm:text-6xl lg:text-8xl font-bold text-white leading-tight sm:leading-none mb-3 sm:mb-5 max-w-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/60 text-xs sm:text-lg mb-4 sm:mb-8 max-w-md leading-relaxed line-clamp-2 sm:line-clamp-none">
            {subtitle}
          </p>
        )}
        <a
          href="#feed"
          className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm hover:bg-gray-100 active:scale-95 transition-all"
        >
          Ver productos
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </div>

      {/* ── Botón pausa de video ─────────────────────────────────── */}
      {(videoUrl || mobileVideo) && (
        <button onClick={toggleVideoPause}
          aria-label={videoPaused ? "Reproducir video" : "Pausar video"}
          className={`absolute bottom-6 right-5 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors ${
            mobileVideo && !videoUrl ? "sm:hidden" : videoUrl && !mobileVideo ? "hidden sm:flex" : ""
          }`}>
          {videoPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
      )}

      {/* ── Dots carrusel móvil ──────────────────────────────────── */}
      {hasMobileCarousel && (
        <div className="sm:hidden absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {mobileImgs.map((_, i) => (
            <button key={i} onClick={() => { pauseUntil.current = Date.now() + 6000; setCurrentMobile(i); }}
              aria-label={`Ir a imagen ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentMobile ? "bg-white w-6" : "bg-white/35 w-1.5 hover:bg-white/60"
              }`} />
          ))}
        </div>
      )}

      {/* ── Dots carrusel desktop ────────────────────────────────── */}
      {hasCarousel && (
        <div className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 gap-2 z-10">
          {images.map((_, i) => (
            <button key={i} onClick={() => { pauseUntil.current = Date.now() + 6000; setCurrent(i); }}
              aria-label={`Ir a imagen ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "bg-white w-6" : "bg-white/35 w-1.5 hover:bg-white/60"
              }`} />
          ))}
        </div>
      )}

      {/* ── Indicador de scroll ──────────────────────────────────── */}
      {!hasCarousel && !videoUrl && (
        <div className="absolute bottom-6 right-5 flex flex-col items-center gap-1.5 text-white/30 z-10">
          <span className="text-[9px] uppercase tracking-[0.3em]">scroll</span>
          <div className="w-px h-7 bg-gradient-to-b from-white/40 to-transparent animate-bounce" />
        </div>
      )}
    </section>
  );
}
