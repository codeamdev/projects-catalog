export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Greeting */}
      <div className="space-y-1.5">
        <div className="h-7 w-48 bg-gray-200 rounded-xl" />
        <div className="h-3 w-32 bg-gray-200 rounded" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 space-y-3">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-6 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Chart + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="flex items-end gap-1.5 h-28">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gray-100 rounded-t-lg" style={{ height: `${30 + i * 10}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="h-4 w-36 bg-gray-200 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-4 bg-gray-200 rounded" />
                <div className="flex-1 h-4 bg-gray-200 rounded" />
                <div className="w-14 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-t border-gray-50">
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-200 rounded" />
            </div>
            <div className="text-right space-y-1.5">
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-3 w-12 bg-gray-200 rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
