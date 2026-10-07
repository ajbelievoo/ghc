"use client";

import { useEffect } from "react";
import { useGhcSettings } from "@/lib/ghcSettings";

export default function GhcHead() {
  const settings = useGhcSettings();

  useEffect(() => {
    if (!settings) return;
    if (settings.meta_title) document.title = settings.meta_title;
    if (settings.meta_description) {
      const meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (meta) meta.content = settings.meta_description;
    }
    if (settings.meta_keywords) {
      let kw = document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null;
      if (!kw) { kw = document.createElement("meta"); kw.name = "keywords"; document.head.appendChild(kw); }
      kw.content = settings.meta_keywords;
    }
    if (settings.favicon_url) {
      let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = settings.favicon_url;
    }
    if (settings.og_image_url) {
      let og = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
      if (!og) { og = document.createElement("meta"); og.setAttribute("property", "og:image"); document.head.appendChild(og); }
      og.content = settings.og_image_url;
    }
  }, [settings]);

  return null;
}
