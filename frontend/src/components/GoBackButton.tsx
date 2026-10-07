"use client";

export default function GoBackButton() {
  return (
    <button
      onClick={() => history.back()}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-3.5 text-sm font-bold text-[#0f172a] transition hover:border-[#00B7FF]/40"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      Go back
    </button>
  );
}
