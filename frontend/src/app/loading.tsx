export default function Loading() {
  return (
    <div className="min-h-[60vh] bg-[#f4f6fb] p-6 lg:p-10 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-white border border-slate-200" />
      </div>
    </div>
  );
}
