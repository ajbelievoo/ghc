"use client";

import { useEffect, useState } from "react";

interface Branding {
  siteName?: string;
  companyName?: string;
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  customCss?: string;
}

export default function BrandStyle() {
  const [brand, setBrand] = useState<Branding | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
    fetch(`${apiUrl}/branding`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setBrand(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!brand) return;
    const style = document.createElement("style");
    style.id = "ghc-brand-style";

    let css = "";
    if (brand.primaryColor) {
      css += `
        :root {
          --ghc-primary: ${brand.primaryColor};
          --ghc-accent: ${brand.accentColor || "#00ff88"};
        }
        .ghc-gradient { background: linear-gradient(135deg, #002a5c 0%, color-mix(in srgb, ${brand.primaryColor} 60%, #002a5c) 50%, ${brand.primaryColor} 100%); }
        .ghc-pre-logo, .ghc-pre-bar span, .ghc-faq-icon, .ghc-announce, #ghc-progress, #ghc-top { color: ${brand.primaryColor}; }
      `;
    }
    if (brand.customCss) {
      css += brand.customCss;
    }

    style.innerHTML = css;
    document.head.appendChild(style);
    if (brand.siteName) {
      document.title = document.title ? `${document.title} — ${brand.siteName}` : brand.siteName;
    }

    return () => {
      const existing = document.getElementById("ghc-brand-style");
      if (existing) existing.remove();
    };
  }, [brand]);

  return null;
}
