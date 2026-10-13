"use client";

import { useState } from "react";
import { ChevronDown, LayoutGrid, Users, ShoppingBag, Globe, MessageSquare, AppWindow } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { PlanGrid } from "./HostingRangePage";

const TYPES = [
  { icon: LayoutGrid, t: "Showcase website", d: "A showcase site presents your business, your services and your contact details. Ideal to strengthen your online presence and portray a professional image.", href: "/solutions/wordpress" },
  { icon: MessageSquare, t: "Blog", d: "To share articles, tips or news. A blog is a great way to attract regular traffic and improve SEO.", href: "/solutions/wordpress" },
  { icon: ShoppingBag, t: "E-commerce website", d: "A website with an online sales feature (shopping basket, payment options and management tools). Ideal for online shops.", href: "/solutions/prestashop" },
  { icon: Users, t: "Community portal", d: "Allows you to build a community around a topic, with forums or discussion spaces. Promotes interaction and engagement.", href: "/web-hosting" },
  { icon: AppWindow, t: "Membership site", d: "Allows you to offer exclusive content to registered members. Suitable for online training, digital magazines or private clubs.", href: "/web-hosting" },
  { icon: Globe, t: "Web application", d: "Dynamic features for online services such as bookings or management tools.", href: "/web-hosting/business" },
];

const WHY = [
  { t: "It improves visibility and credibility:", d: "a well-designed website acts as an online shop window, that's accessible 24/7. It showcases your products, services, customer testimonials, photos and videos, and gives visitors confidence and boosts your company's reputation." },
  { t: "It generates leads and sales:", d: "an e-commerce site makes it easy to shop online, while a showcase website captures leads by integrating contact forms, special offers, or strategic calls to action." },
  { t: "It allows you to share information and content:", d: "integrating a blog into your site allows you to publish tips, articles or news items, which can improve natural referencing (SEO) and make your site more visible on search engines." },
  { t: "It reinforces branding:", d: "customising the site design with distinctive elements such as your logo, colour palette and fonts helps create a strong and consistent visual identity that customers can easily identify." },
];

const CMS_CARDS = [
  { logo: "WORDPRESS", t: "Create your blog with WordPress", d: "With a blog, you can set up an online diary and enrich it with photos, videos and audio. WordPress was originally designed to help you create and manage news — but you can also use it to sell your products or services. The tool has become popular with millions of users worldwide. You can choose from a wide range of pre-installed and customisable templates to quickly build an attractive showcase for it — considered to be the most intuitive CMS.", cta: "Create a WordPress website", href: "/web-hosting/wordpress" },
  { logo: "PrestaShop", t: "Sell online with PrestaShop", d: "Want to launch your e-commerce website? Create your online shop with PrestaShop. It will integrate the features you need to manage your product catalogue, secure purchases, organise special offers and set up marketing campaigns. Whether you're a beginner or an experienced user, PrestaShop can meet all your needs to create an effective e-commerce website. Need help? Our detailed documentation will guide you step by step on how to make your online shop a success.", cta: "Create your online shop with PrestaShop", href: "/solutions/prestashop" },
  { logo: "Joomla! & Drupal", t: "Build your showcase website with the Joomla! and Drupal CMS", d: "A showcase website reflects your brand image, and gives you an online presence. With Joomla! or Drupal, you can create a website without needing to master programming languages. Both CMSs support a large number of customisable extensions, and offer many of the same features: scalable and modular architecture, user-friendly administration, flexible categorisation of content, and large communities of users and developers.", cta: "Launch your web project", href: "/web-hosting" },
];

const CMS_TABLE: [string, string, string, string, string][] = [
  ["Popularity (average downloads/week)", "1 million", "N/A", "112,000", "54,000"],
  ["CMS market share", "59.2%", "1.3%", "4.2%", "4.9%"],
  ["Number of free themes", "2,000+", "N/A", "900+", "2,800+"],
  ["Number of free plugins", "77,000+", "7,030+", "7,000+", "50,000+"],
  ["Frequency of updates", "42 days", "N/A", "36 days", "51 days"],
  ["Level of skill required", "*", "**", "**", "**"],
];

const STEP4_OPTIONS = [
  { t: "SSL certificates.", d: "A free SSL Let's Encrypt certificate is included with your Web Hosting plan. To boost customer confidence, you can opt for an EV SSL certificate, which displays the company name and padlock in all web browsers, ensuring enhanced security and a secure site." },
  { t: "Anti-DDoS protection.", d: "With our Anti-DDoS solution, we protect your website in the event of a server attack. The security service is included with all of our hosting plans, ensuring your website remains accessible." },
  { t: "Private or shared SQL.", d: "Create as many databases as you need to ensure the performance of your website. Each web hosting plan includes a database for storing files that are essential for the website to work properly, and you can add them as required from the customer area (option available with the PERFORMANCE plan only)." },
  { t: "Backup and restore.", d: "You can configure the module, save your data and recover it if you need to. Each web hosting plan includes a backup option, which you can use to restore your website from the latest backup version. Remove anything non-vital." },
  { t: "Multi-domain management.", d: "With the multisite option, you can host multiple websites on the same web hosting plan, and easily manage them from your customer area. This option is ideal for companies that need an online presence for multiple activities or services." },
];

const FAQS: [string, string][] = [
  ["How do I manage a website?", "Everything is managed from the GHC Control Panel — files via FTP/SSH, databases via phpMyAdmin, email accounts, SSL, DNS and CMS updates. No command line required."],
  ["How do I create multiple websites?", "Use the multisite option on your hosting plan — attach additional domains and install a CMS per site, all managed from one dashboard."],
  ["How do I optimise my website?", "Enable the CDN, compress images, keep your CMS and plugins updated, use caching, and review slow queries in your database logs."],
  ["Do I need to know how to code to create a website?", "No — the 1-click CMS installers (WordPress, PrestaShop, Joomla, Drupal) give you a working website with zero coding. Custom themes and plugins cover almost every need."],
  ["Do I need to register multiple domain name extensions?", "Registering your name on several extensions (.com, .in, .net) protects your brand and prevents competitors from taking them. You can point all of them to the same website."],
  ["How important is design in a website?", "Very — visitors judge a business by its website in seconds. A clean, fast, mobile-friendly design builds trust and improves conversions."],
  ["Why include a blog on a showcase website?", "Blog posts bring organic search traffic, demonstrate expertise, and keep your site fresh — one of the cheapest marketing channels you can run."],
];

export default function CreateWebsitePage({ plans }: { plans: any[] }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const hostingPlans = ["hosting-startup", "hosting-pro", "hosting-performance-1"]
    .map((c) => plans.find((p) => p.planCode === c))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-14">
          <p className="text-xs text-white/70">How to create a website</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/web-hosting" className="hover:underline">Web hosting</a> &gt; How to create a website</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">How do I create a website? Detailed steps</h1>
              <p className="mt-5 text-sm text-white/85 leading-7">Want to start building your first website? Build your website quickly using content management systems (CMSs) that are recognised and recommended by our teams, such as WordPress, PrestaShop, Drupal and Joomla!</p>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#0891b2] to-[#00b7ff] p-10 flex items-center justify-center">
                <LayoutGrid className="w-20 h-20 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why create a website */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-14">
        <h2 className="text-xl font-black text-[#0f172a]">Why create a website?</h2>
        <p className="mt-3 text-xs text-slate-600">Nowadays, having a website is essential, whether you are a business, an independent contractor or an individual. Here are the main advantages of a website:</p>
        <ul className="mt-5 space-y-3 list-none">
          {WHY.map((w) => (
            <li key={w.t} className="flex items-start gap-2 text-xs text-slate-600 leading-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" />
              <span><strong className="text-[#0f172a]">{w.t}</strong> {w.d}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Types of websites */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">Types of websites</h2>
        <p className="mt-2 text-xs text-slate-600">Depending on your goals, choose the type of site that aligns best with your project.</p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TYPES.map((t) => (
            <a key={t.t} href={t.href} className="rounded-xl border border-slate-200 p-5 hover:border-[#0284c7] hover:shadow-md transition-all block">
              <p className="text-sm font-bold text-[#0f172a]">{t.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{t.d}</p>
            </a>
          ))}
        </div>
      </section>

      {/* 5 steps */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">How to create a website in 5 steps</h2>
        <p className="mt-2 text-xs text-slate-600">To help you as much as possible with creating your website and publishing your first webpages, we recommend following these steps.</p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {["Book a domain name", "Choose a hosting plan", "Install your CMS in 1 click", "Configure & add options", "Publish your pages"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#0f172a] shadow-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b1020] text-[10px] font-black text-[#00b7ff]">{i + 1}</span>
                {s}
              </span>
              {i < 4 && <span className="text-slate-300 font-bold hidden sm:inline">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Step 1 */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="border-l-4 border-[#00b7ff] pl-5 md:pl-6">
        <h2 className="flex items-center gap-3 text-lg font-black text-[#0f172a]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1020] text-sm font-black text-[#00b7ff]">1</span>Book a domain name: more than 800 extensions available</h2>
        <div className="mt-4 space-y-4 text-xs text-slate-600 leading-6">
          <p>Your domain name represents the reputation of your business on the internet and what visitors will remember when they visit your website. It must be unique, memorable, and align with your brand, business, and the needs of your target customers. Choosing a domain name is therefore a crucial step in creating your website, as it symbolises your online identity and makes it easier to access your services.</p>
          <p>Once you have chosen a domain name, it is vital to select the best domain extension to optimise your website's SEO ranking, and its related pages. Here are the main types of extensions:</p>
          <ul className="space-y-2 pl-4">
            <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" /><span><strong>Generic:</strong> the most popular extensions, such as .com, .in, .org recognised worldwide, reassuring visitors about your website's credibility.</span></li>
            <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" /><span><strong>Geographical:</strong> ideal for targeting internet users from a specific geographical area, such as .in, .us, .fr, .ca or .uk, these extensions improve your company's local exposure.</span></li>
            <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" /><span><strong>Customised:</strong> ideal for providing more information on your website's activity. Extensions such as .blog or .shop specify the type of content or services offered to users.</span></li>
          </ul>
          <p>To maximise the impact of your domain name, it is important that it is short, easy to remember and write. This allows web users to quickly access your content online, while making it easier for them to share your site online.</p>
          <p>Once you have found the perfect domain name and verified its availability with our WHOIS tool, register it to become the official domain name holder. By doing so, you ensure that no one else will be able to use it, which is essential to protect your brand and maintain the consistency of your online presence.</p>
          <p>Browse all of our solutions, and <a href="/domain" className="text-[#0284c7] font-bold underline">book your domain name now</a> to see your online project become a reality.</p>
        </div>
        </div>
      </section>

      {/* Step 2 */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="border-l-4 border-[#00b7ff] pl-5 md:pl-6">
        <h2 className="flex items-center gap-3 text-lg font-black text-[#0f172a]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1020] text-sm font-black text-[#00b7ff]">2</span>Choose a web hosting plan to suit the traffic you expect for your website</h2>
        <div className="mt-4 space-y-4 text-xs text-slate-600 leading-6">
          <p>A website is bound on many elements, such as programming tools, images, databases and scripts. Once you have created your website, it must be accessible to all internet users. This is where web hosting comes in.</p>
          <p>Web hosting is essential to ensure your website's online availability. It involves using an infrastructure, such as a server, to display your website and make the files accessible to each visitor. You can choose between two types of servers: the cloud, which is an ideal solution for low-cost hosting, while ensuring continuous availability. Unlike some website creation platforms, a web hosting plan ensures that your website stays online without any unwanted advertising.</p>
          <p>Our hosting solutions vary depending on the resources allocated, including storage capacity, expected traffic, and the number of sites to deploy. Evaluate your business needs and the goals of your web project to select the hosting plan that best suits you.</p>
          <p>If your business grows, your web hosting plan can evolve accordingly. We offer flexible solutions that adapt to your goals, so you can develop your websites and applications without constraints.</p>
          <p>In today's environment, your company's online presence is more critical than ever. With our hosting services, your website will benefit from optimal speed and security, with options suitable for companies of all sizes, whether you are a startup or they account.</p>
          <p>Explore our range of <a href="/web-hosting" className="text-[#0284c7] font-bold underline">web hosting plans</a>, including three attractive rates, and choose the solution that fits your goals.</p>
          <p>Whether you want to host your personal website, business website or e-commerce website, our comparison tool will help you find the best cloud hosting package.</p>
        </div>
        </div>
      </section>

      {/* Hosting band + plans */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] py-12 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-xl md:text-2xl font-black text-white">Explore our other web hosting plans</h2>
          <p className="mt-3 max-w-2xl mx-auto text-sm text-white/80">We offer different types of hosting to suit all your needs. Whether you want to host your personal website, business website or online store, our comparison page will help you find the best cloud hosting package</p>
          <a href="/compare" className="mt-5 inline-block rounded-lg border border-white px-6 py-2.5 text-sm font-bold text-white hover:bg-white/10">Compare hosting plans</a>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <PlanGrid plans={hostingPlans} recommended="hosting-pro" sub="business" />
      </section>

      {/* Step 3 */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="border-l-4 border-[#00b7ff] pl-5 md:pl-6">
        <h2 className="flex items-center gap-3 text-lg font-black text-[#0f172a]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1020] text-sm font-black text-[#00b7ff]">3</span>Choose a module (CMS) and install it in just one click</h2>
        <p className="mt-4 text-xs text-slate-600 leading-6">With content management systems (CMS) such as WordPress, Joomla! and PrestaShop, you can easily create a dynamic website without needing any programming knowledge. Here are their main advantages:</p>
        <ul className="mt-4 space-y-2 text-xs text-slate-600 leading-6">
          <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" /><span><strong>User-friendly interface:</strong> design web pages, publish articles and customise the look of your site with ease, even as a beginner.</span></li>
          <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" /><span><strong>Multiple features:</strong> include product specifications, contact forms, image galleries and other options to adapt the site to your specific needs.</span></li>
          <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" /><span><strong>Community support:</strong> get advice and resources from large French-speaking communities who share tips and extensions to improve your website performance.</span></li>
          <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" /><span><strong>Optimised SEO:</strong> CMSs are designed to promote organic SEO by focusing on content and loading speed, increasing your online exposure.</span></li>
        </ul>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {CMS_CARDS.map((c) => (
            <div key={c.logo} className="rounded-xl border border-slate-200 p-5 flex flex-col">
              <p className="text-center text-lg font-black text-[#0f172a] tracking-wide">{c.logo}</p>
              <p className="mt-4 text-sm font-bold text-[#0f172a]">{c.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5 flex-1">{c.d}</p>
              <a href={c.href} className="mt-4 inline-block rounded-lg bg-[#ff3d00] px-4 py-2 text-xs font-bold text-white text-center hover:bg-[#e63700]">{c.cta}</a>
            </div>
          ))}
        </div>
        <h3 className="mt-10 text-base font-black text-[#0f172a]">Choose the CMS that best suits your project using our comparison table</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-2.5 px-3 text-left font-bold text-slate-600 border-b border-slate-200">Interest</th>
                {["WordPress", "PrestaShop", "Joomla!", "Drupal"].map((h) => (
                  <th key={h} className="py-2.5 px-3 text-center font-bold text-[#0284c7] border-b border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CMS_TABLE.map((row) => (
                <tr key={row[0]} className="border-b border-slate-100">
                  <td className="py-2 px-3 font-semibold text-slate-600">{row[0]}</td>
                  {row.slice(1).map((v, i) => (
                    <td key={i} className="py-2 px-3 text-center text-slate-600">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-slate-400">Source data: WordPress, PrestaShop, Joomla and Drupal official marketplaces.</p>
        </div>
      </section>

      {/* Step 4 */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="border-l-4 border-[#00b7ff] pl-5 md:pl-6">
        <h2 className="flex items-center gap-3 text-lg font-black text-[#0f172a]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1020] text-sm font-black text-[#00b7ff]">4</span>Configure the website and add options to improve its performance</h2>
        <p className="mt-4 text-xs text-slate-600 leading-6">To create the ideal website and performance levels, you can improve the best information if you don't want to have to worry about installation or technical updates, you can improve the performance of your website by enabling the following options:</p>
        <ul className="mt-4 space-y-3 text-xs text-slate-600 leading-6">
          {STEP4_OPTIONS.map((o) => (
            <li key={o.t} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" />
              <span><strong className="text-[#0f172a]">{o.t}</strong> {o.d}</span>
            </li>
          ))}
        </ul>
        </div>
      </section>

      {/* Step 5 */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="border-l-4 border-[#00b7ff] pl-5 md:pl-6">
        <h2 className="flex items-center gap-3 text-lg font-black text-[#0f172a]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1020] text-sm font-black text-[#00b7ff]">5</span>Publish pages directly to your CMS</h2>
        <div className="mt-4 space-y-4 text-xs text-slate-600 leading-6">
          <p>Once you have chosen your domain and installed the CMS modules, log in using the credentials provided in the confirmation email. Now is the time to create your webpages, work on design, and write quality content for each of your site.</p>
          <p>Choose a layout that optimises the presentation of your content, whether in text, images or videos, while highlighting key elements. Align with a graphic charter that includes fonts, colours, images and logos. This will allow you to easily customise themes and templates, adapted to your business, while maintaining visual consistency across your entire website.</p>
          <p>Visitors to your website have specific expectations for your content. Your task is to respond to these needs quickly, providing a seamless user experience. To do this, take care of your homepage and ensure that all the navigation is clear and user-friendly. Use strategic call-to-action for your visitors to efficiently guide actions.</p>
          <p>Once you have created your web pages, it is crucial to promote your website to increase its exposure. Use tools such as Google My Business for local businesses so potential customers can find your website and get your contact information, including phone number, opening hours and physical address. You can also boost your website presence by sharing links on social media.</p>
          <p>Explore our <strong>Visibility Pro</strong> solution, which gives you a simple, easy-to-use interface for promoting your website.</p>
          <p>Once you have created your website, it's vital to keep feeding it regularly with new content, to keep your visitors interested and ensure good exposure. <em>Also improve your site's natural referencing ranking (SEO) on other search engines to achieve the best position on search results pages, which will increase traffic.</em></p>
          <p>To do this, periodically check your website's structure and the internal mesh between pages. Optimum organisation will help search engines to better understand your site, which will help its ranking.</p>
        </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
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

      <Footer />
    </div>
  );
}
