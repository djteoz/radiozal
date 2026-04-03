import { StationGridSkeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-28">
      <div className="h-8 w-48 bg-stone-200 rounded mb-6 animate-pulse" />
      <StationGridSkeleton count={12} />
    </div>
  );
}
