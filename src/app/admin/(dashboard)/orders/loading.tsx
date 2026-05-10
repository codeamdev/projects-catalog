export default function OrdersLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-28 bg-gray-200 rounded-xl" />
      <div className="bg-white rounded-2xl border overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-t border-gray-100 first:border-0">
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="flex-1 h-4 bg-gray-200 rounded" />
            <div className="w-20 h-4 bg-gray-200 rounded hidden sm:block" />
            <div className="w-28 h-8 bg-gray-200 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
