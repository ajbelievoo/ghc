"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GhcFx() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Preloader
    const pre = document.getElementById("ghc-preloader");
    const hidePre = () => pre && pre.classList.add("ghc-pre-done");
    if (document.readyState === "complete") hidePre();
    else window.addEventListener("load", hidePre);
    const preT = setTimeout(hidePre, 2500);

    // Scroll progress
    const bar = document.getElementById("ghc-progress");
    const onScroll = () => {
      if (!bar) return;
      const h = document.documentElement;
      const pct = (h.scrollTop / Math.max(h.scrollHeight - h.clientHeight, 1)) * 100;
      bar.style.width = pct + "%";
      const btn = document.getElementById("ghc-top");
      if (btn) btn.style.opacity = h.scrollTop > 500 ? "1" : "0";
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Reveal on scroll
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("ghc-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".ghc-reveal").forEach((el) => io.observe(el));

    // Counters
    const cio = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          cio.unobserve(el);
          const target = parseFloat(el.dataset.count || "0");
          const suffix = el.dataset.suffix || "";
          const dec = (el.dataset.count || "").includes(".") ? 1 : 0;
          if (reduced) {
            el.textContent = target + suffix;
            return;
          }
          const t0 = performance.now();
          const dur = 1600;
          const step = (t: number) => {
            const p = Math.min((t - t0) / dur, 1);
            const v = target * (1 - Math.pow(1 - p, 3));
            el.textContent = v.toFixed(dec) + suffix;
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }),
      { threshold: 0.4 }
    );
    document.querySelectorAll("[data-count]").forEach((el) => cio.observe(el));

    // Typewriter
    const tw = document.querySelector<HTMLElement>("[data-ghc-typing]");
    if (tw) {
      const words = (tw.getAttribute("data-ghc-typing") || "").split("|").filter(Boolean);
      if (words.length) {
        if (reduced) tw.textContent = words[0];
        else {
          let wi = 0, ci = 0, del = false;
          const tick = () => {
            const w = words[wi];
            ci += del ? -1 : 1;
            tw.textContent = w.substring(0, ci);
            let d = del ? 35 : 75;
            if (!del && ci === w.length) { d = 1800; del = true; }
            else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; d = 400; }
            setTimeout(tick, d);
          };
          tick();
        }
      }
    }

    // Click ripple
    const onClick = (e: MouseEvent) => {
      if (reduced) return;
      const r = document.createElement("span");
      r.className = "ghc-ripple";
      r.style.left = e.clientX + "px";
      r.style.top = e.clientY + "px";
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 700);
    };
    document.addEventListener("click", onClick);

    // Cookie consent
    const consent = document.getElementById("ghc-consent");
    try {
      if (consent && !localStorage.getItem("ghcConsent")) consent.style.display = "flex";
    } catch {}
    document.getElementById("ghc-consent-yes")?.addEventListener("click", () => {
      try { localStorage.setItem("ghcConsent", "accepted"); } catch {}
      consent?.remove();
    });
    document.getElementById("ghc-consent-no")?.addEventListener("click", () => {
      try { localStorage.setItem("ghcConsent", "declined"); } catch {}
      consent?.remove();
    });

    return () => {
      clearTimeout(preT);
      window.removeEventListener("load", hidePre);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
      io.disconnect();
      cio.disconnect();
    };
  }, []);

  return (
    <>
      {/* Preloader */}
      <div id="ghc-preloader" aria-hidden="true">
        <div className="ghc-pre-inner">
          <img src="/images/ghc-mark.png" alt="GHC" className="ghc-pre-logo-img" />
          <div className="ghc-pre-bar"><span /></div>
        </div>
      </div>

      {/* Scroll progress */}
      <div id="ghc-progress" />

      {/* Back to top */}
      <button
        id="ghc-top"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑
      </button>

      {/* Cookie consent */}
      <div id="ghc-consent" role="dialog" aria-label="Cookie consent">
        <p>
          We use cookies to improve your experience and analyze traffic. See our{" "}
          <Link href="/support" className="text-[#00b7ff] underline hover:text-[#00f0ff]">Privacy Policy</Link>.
        </p>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button id="ghc-consent-no" type="button">Decline</button>
          <button id="ghc-consent-yes" type="button">Accept</button>
        </div>
      </div>
    </>
  );
}
