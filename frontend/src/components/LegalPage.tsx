import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Scale, MapPin, Building2, Mail, Phone, FileBadge } from "lucide-react";
import type { ReactNode } from "react";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

export const COMPANY = {
  name: "Believoo Private Limited",
  short: "Believoo Pvt Ltd",
  brand: "GHC — Go Host Cloud",
  cin: "U63119UP2026PTC252696",
  pan: "AAPCB1563P",
  gstin: "09AAPCB1563P1ZZ",
  address: "328KA, Plot No 152, Rajpur, Swaroopur Bisauli, Budaun, Bilsi, Budaun – 243633, Uttar Pradesh, India",
  phone: "+91-7830014237",
  support: "support@believoo.com",
  abuse: "abuse@believoo.com",
  grievance: "grievance@believoo.com",
  dmca: "copyright@believoo.com",
  privacy: "privacy@believoo.com",
  site: "ghc.believoo.com",
};

export function P({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-slate-600">{children}</p>;
}

export function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00b7ff]" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export default function LegalPage({
  title,
  subtitle,
  updated,
  sections,
  intro,
}: {
  title: string;
  subtitle: string;
  updated: string;
  sections: LegalSection[];
  intro?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      <Navbar />

      {/* hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0b1020] via-[#131b3a] to-[#0b1020] text-white">
        <div className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-[#00b7ff]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-[#7b2ff7]/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#00b7ff]">
            <Scale className="h-4 w-4" /> Legal — {COMPANY.brand}
          </div>
          <h1 className="mt-3 text-3xl font-black md:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">{subtitle}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-white/60">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Last updated: {updated}</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 flex items-center gap-1.5">
              <Building2 className="h-3 w-3" /> {COMPANY.name}
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          {/* TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">On this page</p>
              <nav className="space-y-1">
                {sections.map((s, i) => (
                  <a key={s.id} href={`#${s.id}`} className="block rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-[#00b7ff]/5 hover:text-[#0050d7] transition">
                    {i + 1}. {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* content */}
          <div className="min-w-0">
            {intro && <div className="mb-8 rounded-2xl border border-[#00b7ff]/20 bg-[#00b7ff]/5 p-5">{intro}</div>}
            <div className="space-y-10">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="flex items-baseline gap-3 text-xl font-black text-[#0f172a]">
                    <span className="text-sm font-bold text-[#00b7ff]">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </h2>
                  <div className="mt-3 space-y-3 border-l-2 border-slate-100 pl-5">{s.body}</div>
                </section>
              ))}
            </div>

            {/* company card */}
            <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-black text-[#0f172a]">
                <FileBadge className="h-4 w-4 text-[#00b7ff]" /> About the company
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                <b>{COMPANY.brand}</b> is operated by <b>{COMPANY.name}</b>, a private limited company incorporated
                under the Companies Act, 2013 by the Ministry of Corporate Affairs, Government of India.
              </p>
              <div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="font-bold text-[#0f172a]">Corporate identity</p>
                  <p className="mt-1.5">CIN: <span className="font-mono">{COMPANY.cin}</span></p>
                  <p>PAN: <span className="font-mono">{COMPANY.pan}</span></p>
                  <p>GSTIN: <span className="font-mono">{COMPANY.gstin}</span></p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="font-bold text-[#0f172a] flex items-center gap-1"><MapPin className="h-3 w-3" /> Registered office</p>
                  <p className="mt-1.5 leading-relaxed">{COMPANY.address}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3.5 sm:col-span-2 flex flex-wrap gap-x-8 gap-y-2">
                  <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-[#00b7ff]" /> {COMPANY.phone}</span>
                  <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-[#00b7ff]" /> {COMPANY.support}</span>
                  <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-[#00b7ff]" /> {COMPANY.abuse}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
