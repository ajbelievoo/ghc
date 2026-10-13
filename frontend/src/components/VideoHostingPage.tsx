"use client";

import { useState } from "react";
import {
  Check, ChevronDown, Play, Pause, Square, Sparkles, MonitorSmartphone,
  MousePointerClick, ShieldCheck, Upload, Palette, BadgeCheck, Cloud,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";

const FIT_CHECKS = [
  "Multiple quality encoding",
  "Simple integration on any website",
  "Customizable player to your brand guidelines",
  "Ad-free viewing experience",
  "Real-time adjustment of video quality",
  "All data hosted in our datacenters",
];

const FEATURES = [
  {
    title: "Smooth playback, on any device, anytime",
    text: "Managing multiple codecs, services and bandwidth can be complex, not to mention video buffering issues. GHC Video Center takes care of transcoding for you. Your videos are automatically encoded in several resolutions, and delivered with adaptive bitrate streaming — visitors always get the best quality their connection allows.",
    bullets: [
      "A smooth playback experience on every screen: desktop, tablet and mobile.",
      "Adaptive bitrate streaming that adjusts quality in real time.",
      "A lightweight player that loads fast and never slows your pages down.",
    ],
    icon: MonitorSmartphone,
    flip: false,
  },
  {
    title: "Simple integration on any website",
    text: "Embedding videos on the web has never been easier or more flexible — integration can be tedious work, involving copying and dealing with iframes which can quickly become time consuming. Our goal is to make integration as straightforward as adding an image.",
    bullets: [
      "Upload your video, copy the embed code, and paste it on any website.",
      "Use it on WordPress, PrestaShop or a plain HTML page — it just works.",
      "The responsive player adapts to all pages and all screens.",
    ],
    icon: MousePointerClick,
    flip: true,
  },
  {
    title: "Privacy first",
    text: "Your website may need to respect strict privacy rules. We don't sell your videos or your visitors' data, you don't have to worry — our cloud is trusted as a privacy-friendly alternative.",
    bullets: [
      "No third-party trackers or advertising scripts injected into your pages.",
      "Hosting and analytics stay under your control.",
      "No algorithm recommending competitors' videos to your audience — your visitors stay on your website.",
    ],
    icon: ShieldCheck,
    flip: false,
  },
];

const FAQS: [string, string][] = [
  ["What is GHC Video Center?", "A video hosting add-on for GHC web hosting. Upload your videos, embed them on your website with our ad-free, privacy-friendly player, and keep full control over your content."],
  ["How do I embed a video on my website?", "Upload the video to your hosting, copy the generated embed snippet, and paste it into your page — works on WordPress, PrestaShop or plain HTML."],
  ["Does the player show ads or recommendations?", "Never. The player is clean and customizable to your brand — no ads, no third-party logos, no recommendations sending visitors away."],
  ["Which video formats are supported?", "Common formats (MP4, WebM, MOV) are automatically transcoded to multiple resolutions for adaptive streaming on any device."],
  ["Is viewer tracking used?", "No third-party tracking. You keep your own analytics under your control — privacy-first by design."],
];

export default function VideoHostingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero — dark blue band + CSS video player */}
      <section className="bg-[#000e9c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-14">
          <p className="text-xs text-white/70">GHC Video Center</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/web-hosting" className="hover:underline">Web hosting</a> &gt; Video Center</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">Your videos, Your brand<br />No ads. No third party tracking</h1>
              <p className="mt-5 text-sm text-white/85 leading-7">Upload your videos, embed them on your website and keep full control over your content.</p>
              <ul className="mt-6 space-y-2.5">
                {["Easy upload", "Simple integration on any website", "Customizable player", "Best quality delivery"].map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm font-semibold">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            </div>
            {/* CSS video player mock */}
            <div className="flex items-center justify-center md:justify-end">
              <div className="relative w-full max-w-md">
                <Sparkles className="absolute -top-5 -left-4 w-7 h-7 text-white/70" />
                <div className="rounded-xl border-4 border-white/90 bg-[#0a1fd4] p-4 shadow-2xl">
                  <div className="flex gap-1.5 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/80" />
                  </div>
                  <div className="flex items-center justify-center py-8">
                    <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
                      <Play className="w-9 h-9 fill-white" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-white/30 relative">
                      <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-white" />
                      <div className="absolute -top-1 left-1/3 w-3.5 h-3.5 rounded-full bg-white" />
                    </div>
                    <Pause className="w-4 h-4" />
                    <Square className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grey intro band + 3 icons */}
      <section className="bg-[#f6f8fc] py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-[#0f172a] leading-snug">With GHC Video Center, you can publish your videos on an ad-free, privacy-friendly platform, fully integrated into your web hosting</h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: Sparkles, t: "Less friction, more publishing. Upload & Embed: Done!" },
              { icon: Play, t: "A video experience that finally matches your brand standards" },
              { icon: BadgeCheck, t: "No more intrusive or distractive Ads. Keep your visitors on your website" },
            ].map((b) => (
              <div key={b.t} className="flex flex-col items-center">
                <b.icon className="w-10 h-10 text-[#0050d7]" />
                <p className="mt-3 text-sm font-semibold text-[#0f172a] leading-6">{b.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Good fit + checklist */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-14 text-center">
        <h2 className="text-xl md:text-2xl font-black text-[#0f172a]">When mainstream platforms aren't always a good fit</h2>
        <p className="mt-5 text-sm text-slate-600 leading-7">
          We built video hosting as an add-on to GHC Web Hosting to help you publish videos on your own website, without ads, without tracking, and without needing a developer.
          No more intrusive logos, competitor's ads or external recommendations that send visitors away from your website.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-left max-w-2xl mx-auto">
          {FIT_CHECKS.map((c) => (
            <p key={c} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="w-4 h-4 text-[#0050d7] shrink-0 mt-0.5" /> {c}
            </p>
          ))}
        </div>
      </section>

      {/* Alternating features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 space-y-16">
        {FEATURES.map((f) => (
          <div key={f.title} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className={f.flip ? "order-1 md:order-2" : "order-1"}>
              <h2 className="text-2xl font-black text-[#0f172a]">{f.title}</h2>
              <p className="mt-4 text-sm text-slate-600 leading-7">{f.text}</p>
              <ul className="mt-4 space-y-2.5">
                {f.bullets.map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-[#0050d7] shrink-0 mt-2" />{pt}</li>
                ))}
              </ul>
              <a href="/web-hosting" className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#0050d7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0043b0]">Learn more →</a>
            </div>
            <div className={`rounded-2xl bg-[#e6e6fa] p-10 flex items-center justify-center min-h-[240px] ${f.flip ? "order-2 md:order-1" : "order-2"}`}>
              <f.icon className="w-16 h-16 text-[#0050d7]" />
            </div>
          </div>
        ))}
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="rounded-2xl bg-gradient-to-r from-[#0050d7] via-[#7b2ff7] to-[#ff7ab8] py-12 px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white">Publish videos on your own terms</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/web-hosting" className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#0050d7] hover:bg-slate-100">Get a hosting plan</a>
            <a href="/support" className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10">Contact us</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-black text-[#0f172a]">FAQ</h2>
        <div className="mt-5 divide-y divide-slate-200 border-t border-b border-slate-200">
          {FAQS.map(([q, a], i) => (
            <div key={i}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between py-4 text-left gap-4">
                <span className={`text-sm font-semibold ${faqOpen === i ? "text-[#0050d7]" : "text-[#0f172a]"}`}>{i + 1} - {q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${faqOpen === i ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === i && <p className="pb-5 text-sm text-slate-600 leading-7 pr-8">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
