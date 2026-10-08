import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, FileText, LifeBuoy } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { kbArticles } from "@/lib/kb-articles";

export const dynamicParams = false;

export function generateStaticParams() {
  return kbArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = kbArticles.find((a) => a.slug === slug);
  if (!article) return {};
  return {
    title: `${article.title} | GHC Knowledge Base`,
    description: article.summary,
  };
}

export default async function KbArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = kbArticles.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8fcff]">
        <section className="bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] pb-20 pt-14 text-white">
          <div className="mx-auto max-w-3xl px-6">
            <Link href="/kb" className="mb-6 inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white transition">
              <ArrowLeft className="h-4 w-4" /> Knowledge Base
            </Link>
            <h1 className="text-3xl font-black md:text-4xl">{article.title}</h1>
            <p className="mt-3 text-slate-300">{article.summary}</p>
          </div>
        </section>

        <section className="mx-auto -mt-10 max-w-3xl px-6 pb-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-10">
            {article.sections.map((s) => (
              <div key={s.heading} className="mb-8 last:mb-0">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#0f172a]">
                  <FileText className="h-5 w-5 text-[#00b7ff]" />
                  {s.heading}
                </h2>
                <ul className="space-y-2">
                  {s.body.map((line, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00b7ff]" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="mt-10 rounded-xl border border-[#00b7ff]/20 bg-[#00b7ff]/5 p-5 text-center">
              <p className="text-sm font-semibold text-[#0f172a]">Didn&apos;t find what you needed?</p>
              <Link href="/support" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#ff3d00] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#e63700]">
                <LifeBuoy className="h-4 w-4" /> Open a support ticket
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
