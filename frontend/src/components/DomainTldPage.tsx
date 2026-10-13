"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ChevronDown, Search, Loader2, Globe, ShoppingCart, Tag,
  Flame, ChevronRight, SlidersHorizontal,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import { useCurrency, getCurrencySymbol } from "@/components/CurrencyProvider";

interface TldPrice { tld: string; price: number; currency: string }

const PROMO = new Set("io pro info me ac academy actor adult agency app archi army art associates baby band bargains beer best bet bike bio black blog blue boutique broker bzh cafe capital care careers casa cash casino cat center chat cheap church city claims click clinic cloud coach codes coffee college computer consulting cool coupons courses credit dance dating delivery dev digital direct directory doctor dog email energy engineering enterprises estate eus events exchange expert express farm finance financial fitness forex forsale foundation fun fund furniture gal garden gay global gold golf green group guru haus help house icu ie immo ink institute international investments irish kim kitchen land lgbt life live loans lol love ltd makeup marketing markets mba media mobi mom money movie network news ninja online org organic partners parts pet photography photos pics pink pizza plus poker porn productions promo properties property recipes red rent rentals repair report restaurant rocks run sale services sex sh shiksha show singles site ski social software solutions space store studio study style support surf systems tattoo tax taxi team tech technology tips today tools tours town toys training travel uno ventures video vin vote voto watch website wiki wine works world wtf xxx zone spa".split(" "));
const BEST = new Set("com in net org co io es shop store online site tech xyz app dev cloud".split(" "));

const CATEGORIES: { name: string; match: (t: string) => boolean }[] = [
  { name: "Art and culture", match: (t) => /^(art|arts|band|dance|gallery|museum|music|fm|theater|theatre|film|movie|photography|photos|pictures|studio|tattoo|ink|pics|video|mov)$/.test(t) },
  { name: "Business and services", match: (t) => /^(biz|business|company|consulting|enterprises|holdings|industries|international|limited|ltd|management|marketing|partners|productions|services|solutions|ventures|agency|accountants|accountant|attorney|lawyer|legal|finance|financial|mortgage|tax|insure|claims|law|capital|ventures|consulting|associates|company|enterprises|industries|management|markets)$/.test(t) },
  { name: "Business founders", match: (t) => /^(ai|app|cloud|dev|io|tech|technology|software|systems|digital|codes|tools|computer|host|hosting|network|one|uno|pro|co|ws|cc|tv|me)$/.test(t) },
  { name: "Creative project", match: (t) => /^(art|design|studio|fashion|graphics|ink|pics|pink|style|boutique|photography|photos|gallery|makeup|moda|salon|beauty|hair|skin)$/.test(t) },
  { name: "Education", match: (t) => /^(academy|college|courses|degree|education|institute|mba|school|schule|science|study|training|university|wiki|shiksha|phd|edu|ac|guru|expert|guide|how)$/.test(t) },
  { name: "Health and wellness", match: (t) => /^(bio|care|clinic|dental|dentist|doctor|fitness|healthcare|hospital|pharma|rehab|surgery|vet|vision|yoga|fit|physio)$/.test(t) },
  { name: "Food and restaurants", match: (t) => /^(bar|beer|cafe|coffee|cooking|kitchen|pizza|pub|recipes|restaurant|vin|vodka|wine|fish|menu|tienda|catering|chef)$/.test(t) },
  { name: "Sport and leisure", match: (t) => /^(bike|cricket|fishing|fit|football|game|games|golf|hockey|juegos|rodeo|run|ski|soccer|surf|tennis|toys|yoga|gym|fitness|futbol|racing|tickets|sport)$/.test(t) },
  { name: "Shopping and deals", match: (t) => /^(bargains|boutique|cheap|coupons|deals|discount|forsale|gift|gifts|market|promo|sale|shop|shopping|store|tires|auction|cards|market|supply|supplies|parts|repair|rent|rentals|equipment|shoes|clothing|diamonds|jewelry|watch|furniture|florist|flowers|plumbing|cleaning)$/.test(t) },
  { name: "Community and lifestyle", match: (t) => /^(blog|chat|club|community|dating|family|fans|gay|gives|lgbt|life|live|lol|love|mom|social|soy|wedding|world|faith|rip|memorial|singles|vip|ceo|ninja|earth|army|navy|airforce|democrat|republican|vote|voto|rocks|wtf|sucks|country|zone|today|news|press|review|reviews|report|help|support|works|work|jobs|careers|career|contact|direct|directory|links?|stream|tube|download|audio|video|show|email|fyi|plus|space|media|page|top|one|website|online|site|click|link|digital|world|land|world|global|international|wiki|info)$/.test(t) },
];

const GEO: Record<string, string> = {};
function addGeo(list: string[], region: string) { list.forEach((t) => { GEO[t] = region; }); }
addGeo(["ng", "za", "tn", "ht", "sn", "mg", "gy", "af", "ke", "ma", "dz", "eg", "africa"], "Africa");
addGeo(["us", "ca", "mx", "br", "ar", "cl", "co", "pe", "ve", "uy", "py", "bo", "ec", "cr", "pa", "do", "gt", "hn", "ni", "sv", "bz", "jm", "tt", "bs", "bb", "ag", "gd", "lc", "vc", "ms", "ky", "vg", "bm", "pr", "vi", "gp", "mq", "gf", "pm", "sx", "nyc", "miami", "vegas", "boston", "quebec", "lat", "ki", "nf", "so"], "America");
addGeo(["in", "cn", "jp", "kr", "sg", "hk", "tw", "my", "th", "vn", "ph", "id", "pk", "bd", "lk", "np", "mn", "ae", "sa", "qa", "kw", "bh", "om", "iq", "il", "jo", "lb", "tr", "ge", "am", "az", "kz", "uz", "asia", "tokyo", "osaka", "nagoya", "kyoto", "yokohama", "okinawa", "ryukyu", "taipei", "desi", "shiksha"], "Asia");
addGeo(["uk", "de", "fr", "es", "it", "nl", "be", "ch", "at", "pl", "cz", "sk", "hu", "ro", "bg", "hr", "si", "pt", "ie", "gr", "se", "no", "dk", "fi", "is", "ee", "lv", "lt", "lu", "li", "mc", "sm", "va", "mt", "cy", "by", "ua", "ru", "md", "al", "rs", "ba", "mk", "me", "xk", "gg", "je", "im", "gi", "fo", "ax", "eu", "berlin", "london", "paris", "amsterdam", "barcelona", "madrid", "brussels", "vienna", "warsaw", "hamburg", "cologne", "koeln", "munich", "istanbul", "ist", "ruhr", "saarland", "bayern", "tirol", "wales", "cymru", "scot", "irish", "eus", "cat", "gal", "bzh", "corsica", "alsace", "vlaanderen", "swiss", "luxe", "gmbh", "srl", "ltda", "boo"], "Europe");
addGeo(["au", "nz", "fj", "pg", "ws", "to", "tv", "fm", "mh", "pw", "ki", "nr", "nu", "tk", "vu", "sb", "nc", "pf", "wf", "ck", "cx", "cc", "hm", "nf", "sydney", "melbourne", "kiwi", "oceania"], "Oceania");

const FAQS: [string, string][] = [
  ["What is a domain name?", "A domain name is your address on the internet — the name visitors type into their browser to reach your website. Each name is unique and registered for a fixed period."],
  ["What is the price of a domain name?", "Every extension has its own creation price and renewal price, shown before you order. Prices vary by extension — from budget TLDs like .online and .site to premium ones."],
  ["How do I register a domain name?", "Search for the name you want, pick an available extension, and complete the order — your domain is usually active within minutes."],
  ["How do I transfer a domain name?", "Unlock the domain at your current registrar, get the auth/EPP code and start the transfer on our transfer page — a one-year renewal is included with most extensions."],
  ["Why buy a domain name?", "It protects your brand online, makes your website and email look professional, and ensures nobody else can take your name."],
  ["How do I find a domain name holder?", "Use a WHOIS lookup — it shows public registration data for the domain. If the owner uses WHOIS privacy, contact details are hidden but the registrar is shown."],
];

const PAGE = 80;

export default function DomainTldPage() {
  const router = useRouter();
  const { currency } = useCurrency();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [tlds, setTlds] = useState<TldPrice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // filters
  const [kw, setKw] = useState("");
  const [minP, setMinP] = useState("");
  const [maxP, setMaxP] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [geo, setGeo] = useState<string[]>([]);
  const [flags, setFlags] = useState<string[]>([]);
  const [sort, setSort] = useState<"az" | "lo" | "hi">("az");
  const [showAllCats, setShowAllCats] = useState(false);
  const [visible, setVisible] = useState(PAGE);

  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());
  const fmt = (v: number, c: string) => `${sym(c)}${v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  useEffect(() => {
    api.server.domains().then((list: any) => {
      if (Array.isArray(list)) setTlds(list.map((t: any) => ({ tld: (t.tld || "").replace(/^\./, ""), price: t.finalPrice ?? t.price ?? 0, currency: t.currency || "USD" })));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const searchDomain = () => {
    const d = query.trim().toLowerCase();
    if (!d) return;
    setSearching(true);
    router.push(`/domain?q=${encodeURIComponent(d)}`);
  };

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const filtered = useMemo(() => {
    const k = kw.trim().toLowerCase().replace(/^\./, "");
    const mn = parseFloat(minP) || 0;
    const mx = parseFloat(maxP) || Infinity;
    let out = tlds.filter((t) =>
      (!k || t.tld.includes(k)) &&
      t.price >= mn && t.price <= mx &&
      (cats.length === 0 || cats.some((c) => CATEGORIES.find((x) => x.name === c)?.match(t.tld))) &&
      (geo.length === 0 || geo.includes(GEO[t.tld] || "")) &&
      (flags.length === 0 || flags.some((f) => (f === "Promotion" ? PROMO.has(t.tld) : BEST.has(t.tld))))
    );
    out = out.slice().sort((a, b) => sort === "az" ? a.tld.localeCompare(b.tld) : sort === "lo" ? a.price - b.price : b.price - a.price);
    return out;
  }, [tlds, kw, minP, maxP, cats, geo, flags, sort]);

  useEffect(() => { setVisible(PAGE); }, [kw, minP, maxP, cats, geo, flags, sort]);
  const shownCats = showAllCats ? CATEGORIES : CATEGORIES.slice(0, 5);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-16">
          <p className="text-xs text-white/70">All domain name extensions</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/" className="hover:underline">Home</a> &gt; <a href="/domain" className="hover:underline">Domain names</a> &gt; All domain name extensions</p>
          <div className="mt-10 text-center">
            <h1 className="text-3xl md:text-4xl font-black">Our domain name extension prices</h1>
            <p className="mt-4 text-sm text-white/80 max-w-xl mx-auto">Find the perfect domain name, with more than {tlds.length || 900} available extensions to choose from.</p>
          </div>
        </div>
      </section>

      {/* Search bar */}
      <section className="bg-sky-50/70 border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
          <div className="bg-white rounded-full shadow-md p-2 flex gap-2 border border-slate-200">
            <div className="flex items-center pl-3 text-slate-400"><Search className="w-4 h-4" /></div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchDomain()}
              placeholder="mydomain"
              className="flex-1 min-w-0 rounded-full px-2 py-2.5 text-sm outline-none text-[#0f172a] bg-transparent"
            />
            <button onClick={searchDomain} className="rounded-full bg-[#ff3d00] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#e63700] flex items-center gap-1.5 shrink-0">
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Search
            </button>
          </div>
          <div className="mt-3 flex justify-center gap-6 text-xs">
            <a href="/domain" className="font-bold text-[#0284c7] hover:underline">Multiple search →</a>
            <a href="/domain-transfer" className="font-bold text-[#0284c7] hover:underline">Transfer your domain name →</a>
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sidebar filters */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 bg-white p-5 space-y-6">
              <p className="flex items-center gap-2 text-sm font-black text-[#0f172a]"><SlidersHorizontal className="w-4 h-4 text-[#0284c7]" /> Filters</p>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keyword Search</p>
                <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="e.g. shop, dev…" className="mt-2 w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00b7ff]" />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price ({sym("USD")}/yr)</p>
                <div className="mt-2 flex items-center gap-2">
                  <input value={minP} onChange={(e) => setMinP(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Min" className="w-full min-w-0 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#00b7ff]" />
                  <span className="text-slate-300">—</span>
                  <input value={maxP} onChange={(e) => setMaxP(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Max" className="w-full min-w-0 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#00b7ff]" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categories</p>
                <div className="mt-2 space-y-1.5">
                  {shownCats.map((c) => (
                    <label key={c.name} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-[#0284c7]">
                      <input type="checkbox" checked={cats.includes(c.name)} onChange={() => toggle(cats, setCats, c.name)} className="accent-[#0284c7]" />
                      {c.name}
                    </label>
                  ))}
                  <button onClick={() => setShowAllCats(!showAllCats)} className="text-[11px] font-bold text-[#0284c7] hover:underline">{showAllCats ? "Show less" : "Show more"}</button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Geographic Area</p>
                <div className="mt-2 space-y-1.5">
                  {["Africa", "America", "Asia", "Europe", "Oceania"].map((g) => (
                    <label key={g} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-[#0284c7]">
                      <input type="checkbox" checked={geo.includes(g)} onChange={() => toggle(geo, setGeo, g)} className="accent-[#0284c7]" />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">On display</p>
                <div className="mt-2 space-y-1.5">
                  {["Promotion", "Best-seller"].map((f) => (
                    <label key={f} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-[#0284c7]">
                      <input type="checkbox" checked={flags.includes(f)} onChange={() => toggle(flags, setFlags, f)} className="accent-[#0284c7]" />
                      {f === "Promotion" ? <Tag className="w-3 h-3 text-emerald-600" /> : <Flame className="w-3 h-3 text-[#ff3d00]" />} {f}
                    </label>
                  ))}
                </div>
              </div>

              {(cats.length + geo.length + flags.length > 0 || kw || minP || maxP) && (
                <button onClick={() => { setKw(""); setMinP(""); setMaxP(""); setCats([]); setGeo([]); setFlags([]); }} className="w-full rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50">Clear all filters</button>
              )}
            </div>
          </aside>

          {/* List */}
          <div className="lg:col-span-9">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500">{loaded ? `${filtered.length} extensions` : "Loading extensions…"}</p>
              <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none">
                <option value="az">Name: A → Z</option>
                <option value="lo">Price: low → high</option>
                <option value="hi">Price: high → low</option>
              </select>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span className="col-span-7">Extension</span>
                <span className="col-span-3 text-right">Creation (price per year)</span>
                <span className="col-span-2"></span>
              </div>
              {!loaded ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#0284c7]" /></div>
              ) : filtered.length === 0 ? (
                <p className="py-16 text-center text-sm text-slate-500">No extensions match your filters.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filtered.slice(0, visible).map((t) => (
                    <div key={t.tld} className="grid grid-cols-12 items-center px-5 py-3 hover:bg-sky-50/50 transition-colors">
                      <div className="col-span-7 flex items-center gap-2.5 min-w-0">
                        <a href={`/domain?q=yourname.${t.tld}`} className="text-sm font-bold text-[#0284c7] hover:underline truncate">.{t.tld}</a>
                        {PROMO.has(t.tld) && <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide shrink-0">Promotion</span>}
                        {BEST.has(t.tld) && <span className="rounded-full bg-[#ff3d00]/10 text-[#ff3d00] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide shrink-0">Best-seller</span>}
                      </div>
                      <p className="col-span-3 text-sm font-black text-[#0f172a] text-right">{fmt(t.price, t.currency)}</p>
                      <div className="col-span-2 flex justify-end">
                        <a href={`/domain?q=yourname.${t.tld}`} title={`Search a .${t.tld} domain`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-[#ff3d00] hover:text-[#ff3d00] transition-colors">
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {filtered.length > visible && (
              <div className="mt-5 text-center">
                <button onClick={() => setVisible((v) => v + PAGE)} className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold text-[#0f172a] hover:border-[#00b7ff]">
                  Show more <span className="text-slate-400 font-normal">({filtered.length - visible} remaining)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-10">
        <h2 className="text-xl font-black text-[#0f172a]">Your questions answered</h2>
        <div className="mt-5 divide-y divide-slate-200 border-t border-b border-slate-200">
          {FAQS.map(([q, a], i) => (
            <div key={i}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between py-4 text-left gap-4">
                <span className={`text-sm font-semibold ${faqOpen === i ? "text-[#0284c7]" : "text-[#0f172a]"}`}>{q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${faqOpen === i ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === i && <p className="pb-5 text-sm text-slate-600 leading-7 pr-8">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Editorial */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16 space-y-10">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
          <h2 className="text-lg font-black text-[#0f172a]">Find a relevant domain name.</h2>
          <div className="mt-3 space-y-3 text-xs text-slate-600 leading-6">
            <p>Choosing the right domain name can be a complex task.</p>
            <p>Since it has one or more domain names, the name you choose must be memorable, reflect your brand and be consistent with the services or products sold — or the projects carried out. In the same way, it is useful to choose a domain name that is easy to spell, ideal if your brand name or company name is also slightly tricky to write.</p>
            <p>A good domain name is not too long, and therefore quick to read and to type. To strengthen your online presence and avoid spelling variations, secure the main extension as well as the most popular alternatives — it is well worth it to reserve your existence on the internet.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
          <h2 className="text-lg font-black text-[#0f172a]">The domain name market</h2>
          <div className="mt-3 space-y-3 text-xs text-slate-600 leading-6">
            <p>Several hundred million domain names are registered or reserved around the world. It is a constantly growing market: several million new domain names appear every day. With this democratised market, you too can register the domain name of your choice — provided it has not already been taken. You can also buy and sell domains on the secondary market.</p>
            <p>To have access to the full reserved list, all you have to do is submit a request or use our availability check to instantly know whether your project name is available.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
