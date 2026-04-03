export function StationGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl bg-white border border-stone-200 animate-pulse"
        >
          <div className="w-12 h-12 rounded-lg bg-stone-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-stone-200 rounded w-3/4" />
            <div className="h-3 bg-stone-200 rounded w-1/2" />
          </div>
          <div className="w-8 h-8 rounded-full bg-stone-200 shrink-0" />
        </div>
      ))}
    </div>
  );
}
