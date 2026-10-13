"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

type Row = { type: string; family: string; version: string; options?: string; price: string };
type Section = { id: string; title: string; desc: string; foot?: string; rows: Row[] };
type Group = { title: string; sections: Section[] };

const GROUPS: Group[] = [
  {
    title: "Operating systems",
    sections: [
      {
        id: "linux-unix",
        title: "Operating systems",
        desc: "Get the latest, most efficient operating system versions, perfect for your VPS. These are available to pre-install on our virtual private servers.",
        rows: [],
      },
      {
        id: "fedora",
        title: "Fedora*",
        desc: "Renowned for its fast development cycle and its engagement with open-source software, Fedora aims to provide a cutting-edge development platform and technologies. This distribution can be used on both personal computers and servers, and it offers all of the latest Linux features and technologies.",
        foot: "* Not available on a Local Zone VPS.",
        rows: [
          { type: "Linux/Unix", family: "Fedora", version: "Fedora 43", price: "Included" },
          { type: "Linux/Unix", family: "Fedora", version: "Fedora 44", price: "Included" },
        ],
      },
      {
        id: "almalinux",
        title: "AlmaLinux",
        desc: "This open-source distribution is also based on the Red Hat Enterprise Linux (RHEL) source code and aims to offer a stable alternative compatible with CentOS. Users can migrate from CentOS to AlmaLinux without having to make many changes to their applications or infrastructure.",
        rows: [
          { type: "Linux/Unix", family: "AlmaLinux", version: "AlmaLinux 8", price: "Included" },
          { type: "Linux/Unix", family: "AlmaLinux", version: "AlmaLinux 9", price: "Included" },
          { type: "Linux/Unix", family: "AlmaLinux", version: "AlmaLinux 10", price: "Included" },
        ],
      },
      {
        id: "cloudlinux",
        title: "CloudLinux",
        desc: "CloudLinux is a Linux distribution specifically designed for multi-user hosting. With its LVE, CageFS, and MySQL Governor technologies, it isolates resources to ensure stability, security, and consistent performance, particularly under heavy traffic. CloudLinux is ideal for hosting providers and web agencies.",
        rows: [
          { type: "Linux/Unix", family: "CloudLinux", version: "CloudLinux 9", price: "Included" },
        ],
      },
      {
        id: "debian",
        title: "Debian",
        desc: "Debian is a stable and free open-source distribution that is widely used in the IT world. It is known for its robustness, security, and wide range of available applications.",
        rows: [
          { type: "Linux/Unix", family: "Debian", version: "Debian 11", price: "Included" },
          { type: "Linux/Unix", family: "Debian", version: "Debian 12", price: "Included" },
          { type: "Linux/Unix", family: "Debian", version: "Debian 13", price: "Included" },
        ],
      },
      {
        id: "rocky",
        title: "Rocky Linux",
        desc: "Rocky Linux is a distribution designed to deliver stability and security, and is suited to a variety of applications, including servers and business environments.",
        rows: [
          { type: "Linux/Unix", family: "Rocky Linux", version: "Rocky Linux 8", price: "Included" },
          { type: "Linux/Unix", family: "Rocky Linux", version: "Rocky Linux 9", price: "Included" },
          { type: "Linux/Unix", family: "Rocky Linux", version: "Rocky Linux 10", price: "Included" },
        ],
      },
      {
        id: "ubuntu",
        title: "Ubuntu",
        desc: "A popular Linux distribution based on Debian, Rocky Linux is used for both personal computers and servers, IoT (Internet of Things) devices and cloud environments. Easy to use, accessible, and offering a vast ecosystem of software, Ubuntu delivers stability and regular updates.",
        rows: [
          { type: "Linux/Unix", family: "Ubuntu", version: "Ubuntu 22.04", price: "Included" },
          { type: "Linux/Unix", family: "Ubuntu", version: "Ubuntu 24.04", price: "Included" },
          { type: "Linux/Unix", family: "Ubuntu", version: "Ubuntu 25.04", price: "Included" },
        ],
      },
      {
        id: "freebsd",
        title: "FreeBSD*",
        desc: "Known for its robustness and network performance, FreeBSD is a UNIX-like system equipped with advanced tools such as jails (isolation) or ZFS (storage). It is designed for demanding environments, network appliances, and projects where granular control and proven stability are crucial.",
        foot: "* Not available on a Local Zone VPS.",
        rows: [
          { type: "FreeBSD", family: "FreeBSD", version: "FreeBSD 14.3", price: "Included" },
          { type: "FreeBSD", family: "FreeBSD", version: "FreeBSD 15-ufs — UEFI", price: "Included" },
          { type: "FreeBSD", family: "FreeBSD", version: "FreeBSD 15-zfs — UEFI", price: "Included" },
        ],
      },
      {
        id: "windows",
        title: "Windows Server*",
        desc: "Windows Server is a Microsoft-developed operating system, optimised for virtual use. This OS offers a stable, secure and scalable environment for running your applications and websites.",
        foot: "* Not available on a Local Zone VPS.",
        rows: [
          { type: "Windows", family: "Windows Server", version: "Windows Server 2022", price: "Licence billed separately" },
          { type: "Windows", family: "Windows Server", version: "Windows Server 2025", price: "Licence billed separately" },
        ],
      },
    ],
  },
  {
    title: "Administration interfaces",
    sections: [
      {
        id: "admin-intro",
        title: "Administration interfaces",
        desc: "Set up, manage, and control your virtual private server with the intuitive and efficient administration interface of your choice. You can monitor your resources, install your software and easily manage your users by installing a control panel on your VPS.",
        rows: [],
      },
      {
        id: "cpanel",
        title: "cPanel*",
        desc: "The most popular control panel on the market. With cPanel, you get access to a user and server management interface for smooth and intuitive administration. Simplify common web hosting operations without needing advanced technical knowledge.",
        foot: "* Not available on a Local Zone VPS.",
        rows: [
          { type: "cPanel", family: "Solo® Cloud (1 account)", version: "cPanel Solo", price: "₹1,625 exc. GST/month" },
          { type: "cPanel", family: "Admin (5 accounts)", version: "cPanel Admin", price: "₹2,404 exc. GST/month" },
          { type: "cPanel", family: "Pro (30 accounts)", version: "cPanel Pro", price: "₹3,575 exc. GST/month" },
        ],
      },
      {
        id: "plesk",
        title: "Plesk*",
        desc: "With its various licences, Plesk is the administration interface of choice for many system administrators. Simplify the management of your infrastructure, from configuring your databases and monitoring performances to securing your VPS and more.",
        foot: "* Not available on a Local Zone VPS.",
        rows: [
          { type: "Plesk", family: "Plesk", version: "Web Admin", price: "₹913 exc. GST/month" },
          { type: "Plesk", family: "Plesk", version: "Web Pro", price: "₹1,532 exc. GST/month" },
          { type: "Plesk", family: "Plesk", version: "Web Host", price: "₹3,146 exc. GST/month" },
        ],
      },
    ],
  },
  {
    title: "OS with application",
    sections: [
      {
        id: "os-app-intro",
        title: "OS with application",
        desc: "Manage your VPS's hardware resources whilst running your software applications thanks to a comprehensive software environment offered by the OS with application.",
        rows: [],
      },
      {
        id: "docker",
        title: "Docker*",
        desc: "Run your applications in complete isolation from each other with the Docker containerisation platform.",
        foot: "* Not available on a Local Zone VPS.",
        rows: [
          { type: "OS / APP", family: "Docker", version: "Docker", price: "Included" },
        ],
      },
      {
        id: "n8n",
        title: "n8n*",
        desc: "Automate your processes without writing code with n8n. Using the platform, you can design visual workflows, link APIs, and orchestrate webhooks and scheduled tasks. Its user-friendly web interface makes it a flexible solution for designing and monitoring your automations independently.",
        foot: "* Not available on a Local Zone VPS.",
        rows: [
          { type: "OS Type", family: "n8n", version: "Debian 12", price: "Included" },
        ],
      },
    ],
  },
];

const USE_CASE_CARDS = [
  { t: "Host a complex website or application", d: "Whether you're looking to build a web project or customer project, a VPS is your best ally. You can ensure maximum accessibility by increasing your resources to keep up with the growth of your website or application.", href: "/metal/vps/?s=wordpress" },
  { t: "Hosting a pre-production environment", d: "With a 99.9% Service Level Agreement (SLA) and automatic or manual backup options, our VPS solutions are an essential part of your cloud infrastructure. Our low-cost, high-performance solutions are optimised for hosting a test, pre-production or database environment.", href: "/metal/vps" },
  { t: "Hosting online games", d: "Host game servers with your group or community on a stable, secure solution. Whether you are playing Minecraft, Rust, ARK, Valheim or V Rising, enjoy a unique gaming experience with low latency, included anti-DDoS protection and excellent availability.", href: "/metal/vps" },
];

const LICENSE_CARDS = [
  { t: "WordPress VPS", d: "Discover easy website design with our WordPress VPS. With this solution, you can handle traffic spikes on your website thanks to the scalability of our virtual private servers.", href: "/metal/vps/?s=wordpress" },
  { t: "PrestaShop VPS", d: "Launch your online store. Our PrestaShop VPS solutions are configured to offer optimal performance for e-commerce websites.", href: "/metal/vps" },
  { t: "Linux VPS", d: "Get a range of Linux distributions for managing your VPS. Your virtual machine will grow with your needs.", href: "/metal/vps" },
  { t: "Ubuntu VPS", d: "Create, host and manage all your web projects with our Ubuntu VPS solutions. Fast deployment for your websites, applications and more.", href: "/metal/vps" },
  { t: "Debian VPS", d: "Configure your virtual machine to suit your needs with our Debian VPS range. Ideal for the most advanced Linux users.", href: "/metal/vps" },
];

const FAQS = [
  { q: "Can I buy a licence after buying my VPS?", a: "Licences need to be purchased when you place an order for a Windows operating system. For VPS with Linux operating systems, you can manage your licences via your GHC Control Panel. To find out more, check out this guide." },
  { q: "Which OS should I choose for my VPS?", a: "GHC VPS are offered with Linux or Windows. The benefits and drawbacks of each operating system (OS) vary depending on usage, requirements, and user behaviour. Windows servers come with a graphical interface and are suitable for Microsoft programs and applications, and for using .net and .asp. Because Linux servers do not have a graphical interface, they are generally faster and use fewer resources. The most widely used OSs are Debian/Ubuntu and CentOS." },
  { q: "How do I update the operating system installed on my VPS?", a: "To update your VPS' OS, you must have root access and have backed up your instance to avoid data loss in the event of a software configuration failure." },
  { q: "How do I reinstall the OS on my VPS?", a: "To reinstall the OS on your VPS, please refer to the reinstall guide in your GHC Control Panel — you can pick any of the distributions listed above during the process." },
  { q: "How does a VPS work?", a: "A VPS is virtualised using resources from a dedicated server. It provides an isolated and autonomous environment. The user can then allocate resources to their virtual machines according to their needs." },
  { q: "Why choose a VPS?", a: "A VPS lets you run a variety of applications: from websites and databases to email servers, custom applications, online games, and much more. It's versatile and can be configured according to your needs." },
  { q: "How do I log in to my VPS?", a: "You can log in to your VPS in SSH using the username and password you received when installing (or reinstalling) your VPS. To access your server, you can use the KVM tool directly in your GHC Control Panel, a command line terminal (Linux or Mac) or third-party software on Windows (we recommend using PuTTY)." },
  { q: "What is a VPS?", a: "A VPS — a virtual private server — is created from a physical server. Using virtualisation technology, the host's resources are divided into virtual machines. Each virtual machine's resources are isolated and managed independently of one another." },
  { q: "What can I do with a VPS?", a: "A virtual private server (VPS) is a solution that brings all types of web projects, websites and software applications to life. All of the data on a VPS is dedicated to the user, who gets access to a reliable and scalable virtual machine, without having to worry about hardware management for their hosting system." },
  { q: "What is the difference between a VPS and a dedicated server?", a: "A VPS is created from a dedicated server. With a dedicated server, the user has complete control over the management of their machine. In contrast, the user of a virtual private server does not handle the hardware management of their solution." },
  { q: "What is the best OS for VPS?", a: "The best OS for a VPS depends on how it is used, along with the user's knowledge level and needs. You can view the list of OSs available to pre-install on GHC VPS above on this page." },
];

function SpecTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return null;
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[560px] text-xs">
        <thead>
          <tr className="bg-slate-50 text-left">
            <th className="px-4 py-2.5 font-black text-slate-500">OS Type</th>
            <th className="px-4 py-2.5 font-black text-slate-500">Family</th>
            <th className="px-4 py-2.5 font-black text-slate-500">Version</th>
            <th className="px-4 py-2.5 font-black text-slate-500">Options</th>
            <th className="px-4 py-2.5 font-black text-slate-500">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.version} className="hover:bg-sky-50/40">
              <td className="px-4 py-2.5 text-slate-500">{r.type}</td>
              <td className="px-4 py-2.5 text-slate-500">{r.family}</td>
              <td className="px-4 py-2.5 font-semibold text-[#0f172a]">{r.version}</td>
              <td className="px-4 py-2.5 text-slate-400">{r.options || ""}</td>
              <td className="px-4 py-2.5 text-slate-600">{r.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MetalOsDistributionsPage() {
  const [open, setOpen] = useState<string>("Operating systems");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0b1a45] via-[#0f2566] to-[#12308f] text-white">
        <div className="mx-auto max-w-7xl px-6 pt-4 pb-12">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">VPS Distributions</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/" className="hover:underline">Home</a> &gt; <a href="/metal/vps" className="hover:underline">VPS</a> &gt; VPS Distributions</p>
          <h1 className="mt-8 text-center text-2xl md:text-3xl font-black">Available operating systems and software programs for your VPS</h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/70">We offer more than 30 operating systems, applications and web hosting control panels pre-installed on your VPS.</p>
        </div>
      </section>

      {/* Sidebar + content */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
        <aside className="hidden lg:block">
          <nav className="sticky top-24">
            <ul className="space-y-1 text-xs font-bold text-[#0050d7]">
              {GROUPS.map((g) => (
                <li key={g.title}>
                  <button onClick={() => setOpen(open === g.title ? "" : g.title)} className="flex w-full items-center justify-between py-2 text-left text-[#0f172a] hover:text-[#0050d7]">
                    {g.title}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open === g.title ? "rotate-180" : ""}`} />
                  </button>
                  {open === g.title && (
                    <ul className="mb-2 border-l-2 border-[#0050d7]/20 pl-3">
                      {g.sections.filter((sec) => sec.rows.length).map((sec) => (
                        <li key={sec.id}><a href={`#${sec.id}`} className="block py-1.5 text-[#0050d7] hover:underline">{sec.title}</a></li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0">
          {GROUPS.map((g) => (
            <div key={g.title}>
              {g.sections.map((sec) => (
                <section key={sec.id} id={sec.id} className="scroll-mt-24 pb-8">
                  <h2 className={`font-black text-[#0f172a] ${sec.id.endsWith("-intro") || sec.id === "linux-unix" ? "text-xl" : "text-lg"}`}>{sec.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{sec.desc}</p>
                  <SpecTable rows={sec.rows} />
                  {sec.foot && <p className="mt-2 text-[10px] text-slate-400">{sec.foot}</p>}
                </section>
              ))}
            </div>
          ))}

          {/* Use cases */}
          <section className="pt-6">
            <h2 className="text-xl font-black">Use cases</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {USE_CASE_CARDS.map((c) => (
                <a key={c.t} href={c.href} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-[#0050d7] hover:shadow-md transition-all">
                  <p className="text-sm font-black text-[#0f172a]">{c.t}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{c.d}</p>
                </a>
              ))}
            </div>
          </section>

          {/* Licences cards */}
          <section className="pt-12">
            <h2 className="text-xl font-black">Interested in our VPS licences, operating systems and compatible software?</h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">Your VPS opens up a range of possibilities thanks to the multiple distributions and compatible software that you can install. You can also opt for a licenced VPS, such as Windows or cPanel.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {LICENSE_CARDS.map((c) => (
                <a key={c.t} href={c.href} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-[#0050d7] hover:shadow-md transition-all flex flex-col">
                  <p className="text-sm font-black text-[#0f172a]">{c.t}</p>
                  <p className="mt-2 flex-1 text-xs leading-5 text-slate-500">{c.d}</p>
                  <ChevronRight className="mt-3 h-4 w-4 text-[#0050d7]" />
                </a>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="pt-12 pb-10">
            <h2 className="text-xl font-black">Your questions answered</h2>
            <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
              {FAQS.map((f, i) => (
                <div key={f.q}>
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-bold text-[#0050d7] hover:text-[#00b7ff]">
                    {f.q}
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${faqOpen === i ? "rotate-180" : ""}`} />
                  </button>
                  {faqOpen === i && <p className="pb-4 text-sm leading-6 text-slate-600">{f.a}</p>}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
