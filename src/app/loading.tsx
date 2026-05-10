export default function CatalogLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Hero skeleton */}
      <div className="w-full bg-gray-200" style={{ height: "100svh", minHeight: "560px" }} />

      {/* Grid skeleton */}
      <div className="px-2 sm:px-3 py-6">
        {/* Categorías */}
        <div className="flex gap-3 overflow-hidden py-4 mb-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gray-200" />
              <div className="w-10 h-2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        {/* Buscador */}
        <div className="h-10 w-full bg-gray-200 rounded-2xl mb-4" />
        {/* Grid de productos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`rounded-2xl bg-gray-200 ${i === 0 ? "aspect-[16/9] col-span-2 sm:col-span-4" : "aspect-[3/4]"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
