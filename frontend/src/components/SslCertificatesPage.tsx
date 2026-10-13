"use client";

import {
  Lock, TrendingUp, Search, ShieldCheck, Headphones, Award,
  Store, Building2, ArrowRight, Gauge, KeyRound,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";

const WHY = [
  { icon: Lock, t: "Strengthen your website's security", d: "Premium SSL certificates offer enhanced security with the latest encryption technologies, which are essential for protecting sensitive user data." },
  { icon: TrendingUp, t: "Increase your sales", d: "A secure connection via SSL strengthens customers' trust in your site. This can lead to better conversion rates and increased revenue for your business." },
  { icon: Search, t: "Improve your SEO", d: "SSL certificates improve your website's visibility on search engines, attracting more organic traffic and increasing your chances of acquiring new customers." },
  { icon: ShieldCheck, t: "Get financial protection", d: "These certificates include guarantees that can cover significant potential losses, offering financial protection and peace of mind in the event of a problem." },
  { icon: Headphones, t: "Access dedicated support", d: "Get premium support to resolve issues quickly and increase your operational efficiency with peace of mind." },
  { icon: Award, t: "Trust a well-known industry player", d: "Get optimal protection for your website, backed by the proven expertise and reliability of Sectigo, the world leader in digital security." },
];

const USE_CASES = [
  {
    icon: Store, t: "Small business websites",
    d1: "Local small businesses often allow customers to sign up for newsletters or fill in a contact form.",
    d2: "A paid SSL certificate provides a secure connection without the need for in-depth technical knowledge. It prevents warnings of \"unsecure sites\", thus reinforcing customers' trust in the brand.",
  },
  {
    icon: TrendingUp, t: "Online stores (e-commerce)",
    d1: "Online shops process payments and collect information about their customers.",
    d2: "A paid SSL certificate enables encrypted online transactions, protects against phishing attacks and ensures compliance with PCI DSS requirements, providing a secure shopping experience and protecting your customers' data.",
  },
  {
    icon: Building2, t: "An organisation collecting sensitive data",
    d1: "Organisations handling sensitive data must protect their users' information with advanced security technologies.",
    d2: "A paid SSL certificate ensures strong encryption, verified identity, and regulatory compliance, protecting data against breaches and reducing the risk of legal liability.",
  },
];

const TABLE: [string, string, string][] = [
  ["Recommended usage", "Small business showcase", "E-commerce, large companies"],
  ["Level of verification", "Domain verification only", "Domain and company verification"],
  ["Provider", "Sectigo", "Sectigo"],
  ["Security and trust", "Enhanced trust, HTTPS padlock", "Maximum trust, name shown in the address bar"],
  ["\"Green\" address bar", "No", "Yes"],
  ["Key length", "2,048 bits", "2,048 bits"],
  ["Customer support", "Yes (24/7)", "Yes (24/7)"],
  ["Level of guarantee", "Up to $500,000**", "Up to $1,750,000**"],
  ["Multiple domains", "Yes", "Yes"],
  ["FQDN included", "www.mydomain.uk + mydomain.uk", "www.mydomain.uk + mydomain.uk"],
  ["Browser compatibility", "99.9%", "99.9%"],
  ["Eligibility", "Accessible to all", "Reserved for companies (documents required)"],
  ["Issue turnaround time***", "1 hour", "15 days (after receipt of all documents)"],
  ["Price", "₹4,850 ex. taxes/year", "₹9,702 ex. taxes/year"],
];

function BrowserMock({ mode }: { mode: "insecure" | "dv" | "ev" }) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white shadow-sm overflow-hidden max-w-xs">
      <div className="flex gap-1.5 px-3 py-2 border-b border-slate-200 bg-slate-50">
        <span className="w-2 h-2 rounded-full bg-slate-300" />
        <span className="w-2 h-2 rounded-full bg-slate-300" />
        <span className="w-2 h-2 rounded-full bg-slate-300" />
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">
        {mode === "insecure" && (
          <><span className="w-4 h-4 rounded-sm bg-red-500 flex items-center justify-center text-white text-[8px] font-black">!</span>
            <span className="text-[11px] text-slate-600"><span className="text-red-600 font-semibold">Not secure</span> http://example.co</span></>
        )}
        {mode === "dv" && (
          <><Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] text-slate-600"><span className="text-emerald-700 font-semibold">https://</span>www.example.com</span></>
        )}
        {mode === "ev" && (
          <><Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] text-slate-600"><span className="text-emerald-700 font-bold">GHC SAS [FR]</span> | <span className="text-emerald-700 font-semibold">https://</span>www.example.com</span></>
        )}
      </div>
    </div>
  );
}

export default function SslCertificatesPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#000e9c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-32">
          <p className="text-xs text-white/70">SSL certificates</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/web-hosting" className="hover:underline">Web hosting</a> &gt; SSL certificates</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">Secure your GHC website effectively with a premium SSL certificate</h1>
              <p className="mt-5 text-sm text-white/85 leading-7">Strengthen your website's security and gain your customers' trust by choosing from our wide range of premium SSL certificates, offering rigorous validation and high data protection.</p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-8">
              <div className="flex items-center gap-3">
                <Lock className="w-9 h-9" />
                <div>
                  <p className="text-2xl font-black">Let's Encrypt</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest">Free · included on all plans</p>
                </div>
              </div>
              <p className="text-4xl font-black tracking-tight">SECTIGO<span className="text-lg align-top">®</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Price cards overlapping hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 -mt-24 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            { name: "Sectigo DV SSL certificate", sub: "A verified, guaranteed domain name included", price: "₹4,850" },
            { name: "Sectigo EV SSL certificate", sub: "Domain and company verified, warranty included", price: "₹9,702" },
          ].map((c) => (
            <div key={c.name} className="rounded-xl bg-[#0043b0] text-white p-6 text-center shadow-xl">
              <p className="text-sm font-bold">{c.name}</p>
              <p className="mt-1 text-[11px] text-white/70">{c.sub}</p>
              <p className="mt-4 text-3xl font-black">{c.price}</p>
              <p className="text-[10px] text-white/60">ex. taxes/year</p>
              <p className="mt-4 text-[11px] text-white/80 leading-5">Exclusively with your GHC Web Hosting plan.<br />Enabled via the GHC Control Panel</p>
              <a href="/web-hosting" className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-white border-b border-white/50 pb-0.5 hover:border-white">Choosing a Web Hosting plan <ArrowRight className="w-3 h-3" /></a>
            </div>
          ))}
        </div>
      </section>

      {/* Why paid SSL */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <h2 className="text-xl font-black text-[#0f172a]">Why choose a paid SSL certificate?</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
          {WHY.map((w) => (
            <div key={w.t}>
              <w.icon className="w-9 h-9 text-[#0050d7]" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-bold text-[#0f172a]">{w.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{w.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* When do you use */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-black text-[#0f172a]">When do you use an SSL certificate?</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {USE_CASES.map((u) => (
            <div key={u.t} className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-bold text-[#0f172a] border-l-2 border-[#0050d7] pl-3">{u.t}</p>
              <p className="mt-4 text-xs text-slate-500 leading-5">{u.d1}</p>
              <p className="mt-3 text-xs text-slate-500 leading-5">{u.d2}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Advantages / how to choose */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 space-y-16">
        <div>
          <h2 className="text-xl font-black text-[#0f172a]">SSL certificate: what are the advantages and how to choose?</h2>
          <p className="mt-3 text-xs font-bold text-[#0050d7]">Ensure your company's website and its visitors are kept safe with GHCcloud.</p>
          <p className="mt-4 max-w-4xl text-xs text-slate-500 leading-6">
            Your brand image is closely linked to the level of security offered by your website. To gain credibility, your website should be accessible via a secure HTTPS connection. This connection is active when a green padlock appears in the browser's address bar (Chrome, Firefox, etc.) next to the website's URL. This informs users that the content of the pages they are viewing comes from a secure and protected source, because their data is protected by encryption. Bear in mind that SSL certificates vary for each security level.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1"><BrowserMock mode="insecure" /></div>
          <div className="order-1 md:order-2">
            <h3 className="text-lg font-black text-[#0f172a]">First level of security: HTTPS connection</h3>
            <p className="mt-3 text-xs text-slate-500 leading-6">
              Without an SSL certificate, your website address won't have a secure HTTPS connection. Your visitors could get alerts from their browser, highlighting the lack of security on your pages. Activating a valid SSL certificate will display a padlock in your browser's address bar. Its presence indicates that the connection is secure by encrypting the data exchanged. This is the first level of security.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-lg font-black text-[#0f172a]">DV SSL certificates: The domain has been verified</h3>
            <p className="mt-3 text-xs text-slate-500 leading-6">
              Premium SSL certificates offer different levels of verification and ensure the confidentiality of the data that passes between the browser and the website. To do this, a certification authority must first validate the website's SSL certificate. Google's algorithm now includes this parameter in its assessment criteria. The DV SSL certificate by Sectigo guarantees that the domain owner has proven their control over it.
            </p>
          </div>
          <div><BrowserMock mode="dv" /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1"><BrowserMock mode="ev" /></div>
          <div className="order-1 md:order-2">
            <h3 className="text-lg font-black text-[#0f172a]">EV SSL certificates: The website publisher has been verified</h3>
            <p className="mt-3 text-xs text-slate-500 leading-6">
              Only EV SSL certificates can guarantee that the website visited is administered by the company that owns it, and that the company exists legally. This is the highest level of security and guarantee. When you visit web pages secured by an EV SSL certificate, the certificate will display the name of the company in addition to the padlock icon. This allows you to check who is behind a website's IP address.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-lg font-black text-[#0f172a]">Guaranteed security for your customers</h3>
            <p className="mt-3 text-xs text-slate-500 leading-6">
              Protecting your customers' data and transactions with encryption is an essential step in reassuring your visitors about the security of your e-commerce platform. By securing exchanges with your web server, you boost your credibility and inspire confidence at each login.
            </p>
          </div>
          <div className="flex justify-center"><ShieldCheck className="w-20 h-20 text-[#0050d7]" strokeWidth={1.2} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center order-2 md:order-1"><Gauge className="w-20 h-20 text-[#7b2ff7]" strokeWidth={1.2} /></div>
          <div className="order-1 md:order-2">
            <h3 className="text-lg font-black text-[#0f172a]">Boost your SEO</h3>
            <p className="mt-3 text-xs text-slate-500 leading-6">
              A website that can be accessed via HTTPS not only secures the exchange of information — it also boosts your SEO ranking on search engines such as Google, which alone represents more than 97% of searches in France.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-lg font-black text-[#0f172a]">Your free Let's Encrypt DV SSL certificate is installed by default on all GHC web hosting plans.</h3>
            <p className="mt-3 text-xs text-slate-500 leading-6">
              Let's Encrypt is an open-source project supported by multiple companies, including GHC cloud. The certificate is recognised by the most popular web browsers. The advantage for you is that you don't need any technical skills to configure the certificate: the HTTPS protocol is already enabled when you create your website and subdomains. With visibility rates of the top 1%, Let's Encrypt DV SSL certificates will be renewed automatically and free of charge without you needing to do anything. So you can easily ensure that your website is secure.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <KeyRound className="w-10 h-10 text-[#0050d7]" />
            <p className="text-2xl font-black text-[#0f172a]">Let's Encrypt</p>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-black text-[#0f172a]">Key characteristics of DV and EV certificates</h2>
        <p className="mt-2 text-xs text-slate-500">The type of certificate you need depends on your website's purpose and traffic.</p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 text-left font-semibold text-slate-500"></th>
                <th className="py-3 text-center font-bold text-[#0f172a]">Sectigo DV SSL<br /><span className="text-[10px] font-normal text-[#0050d7] underline">Choosing a Web Hosting plan</span></th>
                <th className="py-3 text-center font-bold text-[#0f172a]">Sectigo® EV SSL<br /><span className="text-[10px] font-normal text-[#0050d7] underline">Choosing a Web Hosting plan</span></th>
              </tr>
            </thead>
            <tbody>
              {TABLE.map(([k, dv, ev]) => (
                <tr key={k} className="border-b border-slate-100">
                  <td className="py-2.5 font-semibold text-slate-600">{k}</td>
                  <td className="py-2.5 text-center text-slate-600">{dv}</td>
                  <td className="py-2.5 text-center text-slate-600">{ev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[10px] text-slate-400 leading-4">
          * If you do not already have a hosting solution linked to your domain name, you can use an SSL certificate on its own.<br />
          ** At the end of the signature process on the purchase order.<br />
          *** The turnaround time may vary depending on each hosting plan.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-[#000e9c] py-14 text-center text-white">
        <h2 className="text-2xl font-black">Explore our web hosting plans</h2>
        <p className="mt-3 max-w-2xl mx-auto text-sm text-white/80 px-4">Want to start building a dynamic, more elaborate website? Our web hosting solutions are designed to meet all your needs. See our comparison page to find out which hosting plan is best suited to your project.</p>
        <a href="/web-hosting" className="mt-6 inline-block rounded-lg border border-white px-6 py-2.5 text-sm font-bold hover:bg-white/10">View detailed comparison</a>
      </section>

      <Footer />
    </div>
  );
}
