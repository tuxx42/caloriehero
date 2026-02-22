export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative">
        <div className="h-8 w-8 rounded-full border-[3px] border-emerald-200" />
        <div className="absolute inset-0 h-8 w-8 rounded-full border-[3px] border-emerald-600 border-t-transparent animate-spin" />
      </div>
    </div>
  );
}
