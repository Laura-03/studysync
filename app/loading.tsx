export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-slate-600">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
        <span className="text-sm font-medium">Loading StudySync…</span>
      </div>
    </div>
  );
}