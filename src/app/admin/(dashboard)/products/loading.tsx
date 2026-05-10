export default function ProductsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded-xl" />
          <div className="h-3 w-20 bg-gray-200 rounded mt-2" />
        </div>
        <div className="h-9 w-36 bg-gray-200 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="bg-gray-50 px-4 py-3">
          <div className="h-3 w-48 bg-gray-200 rounded" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-t border-gray-100">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 h-4 bg-gray-200 rounded" />
            <div className="w-24 h-4 bg-gray-200 rounded hidden sm:block" />
            <div className="w-20 h-4 bg-gray-200 rounded hidden sm:block" />
            <div className="w-9 h-5 bg-gray-200 rounded-full" />
            <div className="w-10 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
