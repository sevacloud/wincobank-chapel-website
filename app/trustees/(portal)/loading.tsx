export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500" role="status" aria-live="polite">
      <div className="h-8 w-8 rounded-full border-2 border-gray-300 border-t-chapel-400 animate-spin mb-3" aria-hidden />
      <p className="text-sm">Loading from QuickFile…</p>
    </div>
  );
}
