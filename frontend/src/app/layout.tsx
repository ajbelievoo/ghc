import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import GhcFx from "@/components/GhcFx";
import GhcHead from "@/components/GhcHead";
import BrandStyle from "@/components/BrandStyle";
import AiAssistant from "@/components/AiAssistant";
import SupportWidget from "@/components/SupportWidget";
import CookieConsent from "@/components/CookieConsent";
import { LanguageProvider } from "@/components/LanguageProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

async function getGhcSettings() {
  try {
    const res = await fetch("https://believoo.com/api/ghc-settings", { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function cleanKeywords(input?: string): string {
  const fallback = "vps hosting india, dedicated servers india, cloud hosting india, web hosting india, nvme vps, domain registration india, managed cloud hosting, go host cloud, ghc hosting, believoo hosting";
  if (!input) return fallback;
  return input
    .split(/,\s*/)
    .map((k) => k.trim())
    .filter((k) => k && !/\bovh\b/i.test(k) && !/\bcheap\b/i.test(k))
    .join(", ") || fallback;
}

function cleanText(input?: string, fallback: string = ""): string {
  if (!input) return fallback;
  return input.replace(/\bovh\b/gi, "cloud").replace(/\bOVH\b/g, "Cloud").trim() || fallback;
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getGhcSettings();
  const titleFallback = "VPS Hosting, Dedicated Servers & Cloud Hosting India | GHC - Go Host Cloud";
  const descFallback = "GHC (Go Host Cloud) by Believoo — NVMe VPS hosting, dedicated servers, web hosting & domains in India. Instant setup, free DDoS protection, 99.99% uptime & 24/7 expert support.";
  const ogTitle = cleanText(s?.meta_title, titleFallback);
  const ogDesc = cleanText(s?.meta_description, descFallback);
  return {
    title: ogTitle,
    description: ogDesc,
    keywords: cleanKeywords(s?.meta_keywords),
    icons: s?.favicon_url
      ? { icon: [{ url: s.favicon_url, sizes: "32x32", type: "image/png" }] }
      : { icon: "/favicon.ico" },
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      url: "https://ghc.believoo.com",
      siteName: "GHC - Go Host Cloud",
      type: "website",
      images: [{ url: s?.og_image_url || "https://ghc.believoo.com/og-image.png", width: 1200, height: 630, alt: "GHC - Go Host Cloud" }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDesc,
      images: [s?.og_image_url || "https://ghc.believoo.com/og-image.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f8fcff] text-[#0f172a]">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ghc-theme');var d=t?t:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.add(d);document.querySelectorAll('.ghc-reveal').forEach(function(el){el.classList.add('ghc-in');});}catch(e){document.documentElement.classList.add('light');}`,
          }}
        />
        <GhcFx />
        <GhcHead />
        <BrandStyle />
        <LanguageProvider>
          <CurrencyProvider>
            <ToastProvider>{children}</ToastProvider>
          </CurrencyProvider>
        </LanguageProvider>
        <AiAssistant />
        <SupportWidget />
        <CookieConsent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "GHC - Go Host Cloud",
                  url: "https://ghc.believoo.com",
                  logo: "https://ghc.believoo.com/og-image.png",
                  sameAs: ["https://ghc.believoo.com"],
                  parentOrganization: { "@type": "Organization", name: "Believoo Pvt Ltd", url: "https://believoo.com" },
                },
                {
                  "@type": "WebSite",
                  name: "GHC - Go Host Cloud",
                  url: "https://ghc.believoo.com",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: "https://ghc.believoo.com/domain?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
