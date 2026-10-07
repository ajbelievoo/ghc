"use client";

import { useEffect, useState } from "react";

export type GhcSettings = {
  name: string;
  tagline: string;
  logo_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  support_email: string;
  primary_color: string;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  announce_text: string;
  announce_url: string;
};

const DEFAULTS: GhcSettings = {
  name: "GHC",
  tagline: "Go Host Cloud",
  logo_url: null,
  favicon_url: null,
  og_image_url: null,
  meta_title: "VPS Hosting, Dedicated Servers & Cloud Hosting India | GHC - Go Host Cloud",
  meta_description: "GHC (Go Host Cloud) by Believoo — NVMe VPS hosting, dedicated servers, web hosting & domains in India. Instant setup, free DDoS protection, 99.99% uptime & 24/7 expert support.",
  meta_keywords: "vps hosting india, dedicated servers india, cloud hosting india, web hosting india, cheap vps hosting, nvme vps, domain registration india, managed cloud hosting, go host cloud, ghc hosting, believoo hosting",
  support_email: "support@believoo.com",
  primary_color: "#00f0ff",
  hero_badge: "Go Host Cloud",
  hero_title: "Cloud, hosting and servers built for serious projects.",
  hero_subtitle:
    "Deploy virtual servers, bare metal and web hosting with instant provisioning, transparent pricing and 24/7 support.",
  announce_text: "",
  announce_url: "",
};

let cache: GhcSettings | null = null;

export function useGhcSettings(): GhcSettings {
  const [s, setS] = useState<GhcSettings>(cache || DEFAULTS);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    const settingsUrl = process.env.NEXT_PUBLIC_SETTINGS_URL || "https://believoo.com/api/ghc-settings";
    fetch(settingsUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        const merged: GhcSettings = { ...DEFAULTS, ...data };
        cache = merged;
        setS(merged);
        // Apply branding live
        document.title = merged.meta_title;
        document
          .querySelector('meta[name="description"]')
          ?.setAttribute("content", merged.meta_description);
        let kw = document.querySelector('meta[name="keywords"]');
        if (!kw) {
          kw = document.createElement("meta");
          kw.setAttribute("name", "keywords");
          document.head.appendChild(kw);
        }
        kw.setAttribute("content", merged.meta_keywords);
        if (merged.primary_color)
          document.documentElement.style.setProperty("--ghc-primary", merged.primary_color);
        // Favicon
        if (merged.favicon_url) {
          let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
          if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
          link.href = merged.favicon_url;
        }
        // OG image
        if (merged.og_image_url) {
          let og = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
          if (!og) { og = document.createElement("meta"); og.setAttribute("property", "og:image"); document.head.appendChild(og); }
          og.content = merged.og_image_url;
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return s;
}
