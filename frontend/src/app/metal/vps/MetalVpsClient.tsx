"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import {
  Check, ChevronDown, ShoppingCart, Server, Cpu, Shield, Gauge,
  HardDrive, Globe, Lock, RefreshCw, Settings2, Network, Database,
  Zap, Flame, Layers, Terminal,
} from "lucide-react";

function money(value?: number, currency?: string) {
  const cur = (currency || "USD").toUpperCase();
  const sym = getCurrencySymbol(cur);
  const decimals = ["JPY", "KRW", "IDR", "VND"].includes(cur) ? 0 : 2;
  if (typeof value !== "number") return "Contact us";
  return `${sym}${value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

const REGION_NAMES: Record<string, string> = {
  gra: "France (Gravelines)", sbg: "France (Strasbourg)", rbx: "France (Roubaix)",
  bhs: "Canada (Beauharnois)", waw: "Poland (Warsaw)", de: "Germany (Limburg)",
  eri: "UK (Erith)", mil: "Italy (Milan)", prg: "Czech Republic (Prague)",
  mad: "Spain (Madrid)", ams: "Netherlands (Amsterdam)", bru: "Belgium (Brussels)",
  mrs: "France (Marseille)", vie: "Austria (Vienna)", zrh: "Switzerland (Zurich)",
  sgp: "Singapore", syd: "Australia (Sydney)", bom: "India (Mumbai)",
  mum: "India (Mumbai)", uk: "UK (London)",
};

const SERVICE_TABS: Record<string, { title: string; desc: string; tag: string }[]> = {
  HARDWARE: [
    { title: "1-click scaling", desc: "Get a new VPS instance instantly, with no service disruption or data migration. This keeps your configuration aligned with your project's changing needs.", tag: "Included" },
    { title: "Advanced backup options", desc: "Opt for Premium automatic backup, offering 7-day rotations and secure external storage, tailored to your business requirements.", tag: "Optional" },
  ],
  SOFTWARE: [
    { title: "Ultra-fast NVMe storage", desc: "All our Metal servers come with NVMe disks, delivering speeds up to five times faster than standard SSDs. They are well-suited to high-speed applications.", tag: "Included" },
    { title: "Wide choice of distributions", desc: "Ubuntu, Debian, AlmaLinux, Rocky Linux, Fedora, Windows Server and popular apps like Docker, Plesk and cPanel — deployable in one click.", tag: "Included" },
  ],
  "NETWORK & IP": [
    { title: "Unlimited traffic", desc: "Your Metal VPS includes unlimited inbound and outbound traffic with bandwidth up to 1.5 Gbps — no hidden metering.", tag: "Included" },
    { title: "IPv4 + IPv6", desc: "Each VPS gets a dedicated public IPv4 address and an IPv6 range, with failover IP options for high availability.", tag: "Included" },
  ],
  SERVICES: [
    { title: "Daily automatic backup", desc: "Rest easy knowing your data is automatically backed up daily. A single restore of your VPS is just a click away if needed.", tag: "Included" },
    { title: "Anti-DDoS protection", desc: "Every Metal VPS is protected by always-on DDoS mitigation at the network edge — included at no extra cost.", tag: "Included" },
  ],
};

const USE_CASES = [
  { icon: Globe, title: "Web hosting", desc: "Host your websites on a flexible, high-powered VPS, with dedicated resources and high availability to deliver fast load times and a smooth user experience." },
  { icon: Layers, title: "Software hosting", desc: "Deploy your applications on a secure, scalable VPS, with configurations tailored to your business development and usage." },
  { icon: Database, title: "Database hosting", desc: "Store and manage your databases on our fast and reliable VPS, designed to scale and adapt to the most demanding workloads." },
  { icon: Network, title: "WordPress multisite", desc: "Build and manage your multisite platform on the cloud, at the very best price." },
  { icon: Flame, title: "Game hosting", desc: "Host your online games on a scalable, secure VPS. It's the perfect solution for creating private servers for Minecraft, Counter-Strike, Rust, and many other titles." },
  { icon: Terminal, title: "Test deployments", desc: "In just a few seconds, create a dynamic virtual sandbox to accelerate your workflow from concept to production." },
  { icon: Gauge, title: "Trading applications", desc: "Run your Forex trading strategies on a high-performing and stable VPS built to handle market demands." },
  { icon: Zap, title: "AI & automation", desc: "Run n8n workflows, AI agents and automation pipelines on dedicated resources with full root control." },
];

const METAL_FAMILIES: Record<string, {
  crumb: string; rangeTitle: string; title: string; subtitle: string; bullets: string[];
  exploreTitle?: string; exploreSub?: string;
  benefits?: { t: string; d: string }[];
  whyTitle?: string; whyIntro?: string;
  whyChoose?: { t: string; d: string }[];
  howTo?: { title: string; body: string };
  heroNote?: string;
  platforms?: { label: string; d: string }[];
  faqs?: { q: string; a: string }[];
}> = {
  "": {
    crumb: "VPS",
    rangeTitle: "Metal VPS 2027",
    title: "Metal VPS — Virtual Private Servers",
    subtitle: "A simple, powerful cloud platform tailored to your needs",
    bullets: ["Maximised value for money, whatever the use", "Enhanced security with anti-DDoS and daily backup included", "Unlimited bandwidth, up to 1.5 Gbps*"],
  },
  "n8n": {
    crumb: "n8n VPS",
    rangeTitle: "Metal n8n VPS",
    title: "Metal n8n VPS: a solution for your workflow automations",
    subtitle: "Transform your business operations with n8n, the flexible workflow automation tool. Design complex integrations and automate repetitive tasks with ease. Most conveniently, install it on a range of GHC Metal VPS plans.",
    bullets: ["n8n pre-installed and ready to use", "Automate workflows without coding", "Connect 400+ integrations"],
    exploreTitle: "Explore Metal VPS solutions for n8n",
    exploreSub: "Don't worry about complex manual server configuration — instead, get started with our range of powerful VPS servers that come with n8n pre-installed. You have plenty of choices, too, with several plans offering the perfect balance of CPU, RAM and storage to meet your automation needs.",
    benefits: [
      { t: "Unmatched Customisation", d: "Gain complete root access to your n8n environment. This allows you to install popular n8n versions, add custom community nodes, modify server configurations, and tailor the setup precisely to your unique automation and integration requirements." },
      { t: "Dedicated Performance", d: "Your n8n instance runs on resources allocated specifically to you (CPU, RAM). This isolation ensures consistent and predictable performance, as well as enhanced reliability for your critical workflows, even under heavy load." },
      { t: "Enhanced Security", d: "Take full command of your n8n installation. Implement custom safety measures, manage OS updates directly, and configure network rules to ensure optimal security. Working with GHC Metal ensures your workflow remains under your control, aiding compliance with data privacy regulations." },
    ],
    whyChoose: [
      { t: "Optimized Performance and Reliability", d: "Our Metal VPS solutions are built with enterprise-grade hardware, fast NVMe SSDs, and a high-performance global network with low latency. This ensures your n8n instance runs smoothly, and your workflows execute quickly and reliably — with excellent uptime for mission-critical automation." },
      { t: "Flexible Scalability and Global Presence", d: "Starting with an entry Metal VPS hosting plan is simple — then scale your VPS resources (CPU, RAM, storage) as needed. With our global network of data centres, you can deploy close to your users or integrated services, reducing latency and addressing data sovereignty requirements." },
      { t: "Exceptional Value with Included Security", d: "Benefit from our commitment to providing robust security and outstanding value. All our VPS offerings include powerful anti-DDoS protection at no additional cost. Coupled with transparent pricing and generous resource allocations, you get a cost-effective and secure foundation for your n8n solution." },
    ],
    howTo: {
      title: "How to Update n8n on a VPS",
      body: "Keeping your n8n instance updated on your server is vital for maintaining robust security, accessing the latest features, and ensuring the overall stability of your automations. For detailed step-by-step instructions, we recommend consulting the official n8n documentation, which provides comprehensive upgrade guides tailored to your specific installation method (e.g. Docker, npm). Regularly performing updates ensures your workflows remain secure and efficient.",
    },
    faqs: [
      { q: "What is n8n hosting?", a: "n8n hosting refers to running your own instance of the n8n workflow tool on a server, such as a VPS Linux or VPS Debian. Specifically, an n8n server refers to deploying n8n on a Virtual Private Server, providing dedicated resources, complete control over the n8n installation (including versioning and custom nodes), and enhanced data privacy compared to shared or multi-tenant solutions." },
      { q: "How to set up n8n on a VPS?", a: "Setting up n8n on GHC generally involves: Choosing and provisioning your Metal VPS plan. Connecting to your server via SSH and performing initial server setup (like updating the OS). Installing n8n, typically with Docker (recommended for ease of management and updates) or npm. Configuring n8n with a domain name, SSL certificate for HTTPS, and any necessary environment variables for databases or settings. While GHC provides a robust VPS platform, you can find detailed n8n installation guides in the official n8n documentation." },
      { q: "Is n8n VPS hosting secure?", a: "When we consider what a virtual private server (VPS) is, security questions naturally arise. Yes, hosting n8n on an GHC VPS can be very secure, leveraging a shared responsibility model. GHC ensures the security of the underlying infrastructure, including hardware and network, and provides features such as anti-DDoS protection. You are responsible for securing your VPS operating system (including updates and firewall rules) and the n8n application itself (using strong credentials, enabling HTTPS, keeping n8n updated, and managing user access). By following best practices, you can create a highly secure n8n environment." },
      { q: "Can I build AI apps with n8n on VPS?", a: "Absolutely. Using n8n on an GHC VPS provides the flexibility and resources needed to build AI-powered applications. You can integrate n8n with various AI services and APIs (like OpenAI, Hugging Face, or other model providers) using its HTTP request node or dedicated community nodes. Furthermore, a cheap VPS provides the control to install dependencies and run smaller, self-hosted AI models directly on the server if your server plan has sufficient CPU, RAM, and storage." },
      { q: "Is n8n better than Zapier?", a: "n8n and Zapier are both robust automation solutions, but they cater to different needs and preferences. n8n, especially when self-hosted, offers greater flexibility, control, and data sovereignty. It's open source, highly customizable (allowing for custom code and nodes), and can be more cost-effective for high-volume or complex workflows as you're utilising your VPS resources. Zapier is known for its ease of use, a vast library of pre-built integrations, and being a fully managed SaaS solution. The 'better' choice depends on your technical comfort, specific feature requirements, budget, and desire for mastery over your data." },
      { q: "What support is available for n8n VPS hosting?", a: "GHC provides comprehensive support for the VPS infrastructure itself. This includes assistance with hardware issues, network connectivity, virtualization platform stability, and questions related to your GHC control panel. For support concerning the n8n application, such as workflow design, troubleshooting specific errors, node configurations, or n8n software updates, you would typically turn to the extensive resources provided by the n8n community (e.g., forums, Discord) or the official n8n documentation and support channels." },
      { q: "Does n8n offer an Enterprise version for organizations with advanced security, compliance, or collaboration needs?", a: "Yes, for organizations with advanced requirements in compliance, security, or team collaboration, n8n offers a dedicated Enterprise plan. This includes, among other features: Audit logs for full traceability, SSO/SAML for centralized authentication, Encryption of credentials at rest, Advanced team management and collaboration capabilities. You can find out more on the n8n website." },
    ],
  },
  "plesk": {
    crumb: "Plesk VPS",
    rangeTitle: "Metal Plesk VPS Offer",
    title: "Explore Metal Plesk VPS servers",
    subtitle: "Combine powerful hosting and ease of use by unleashing the power of Plesk's user-friendly control panel alongside the exceptional power and flexibility of Metal VPS.",
    bullets: [
      "Enhanced performance: Metal's high-performance servers deliver allocated resources, ensuring your websites and applications run smoothly.",
      "Global accessibility: Deploy your VPS in any of our 10 data centres worldwide, providing low-latency access for your audience.",
      "Unwavering security: Benefit from the industry's best anti-DDoS protection, a 99.9% uptime guarantee, and unlimited traffic.",
      "Scalable solutions: Tailor your configuration and upgrade resources independently, adapting to your evolving needs effortlessly.",
    ],
    heroNote: "You have the flexibility to choose from different levels of Plesk licences to suit your specific needs. These include Plesk Web Admin for managing up to 10 domains, Plesk Web Pro for up to 30 domains, and Plesk Web Host for an unlimited number of domains.",
    exploreTitle: "Metal Plesk VPS Offer",
    exploreSub: "Effortlessly manage websites, domains, and emails with Plesk's user-friendly control panel on high-performance Metal VPS. Enjoy global accessibility, robust security, and scalable solutions. Perfect for businesses, developers, and online entrepreneurs.",
    whyChoose: [
      { t: "Unmatched power and flexibility", d: "Metal's Plesk VPS options are built for speed and reliability. Our servers, assembled and configured in-house, give you the latest architecture, NVMe SSD storage, and a highly resilient infrastructure. Enjoy optimal speeds and resource efficiency, empowering you to focus on scaling your projects." },
      { t: "Your dedicated virtual space", d: "With GHC, you get a fully isolated Plesk environment dedicated to your web projects and business applications. Enjoy full admin access and complete control over your virtual server, tailoring it to your specific needs. Scale resources effortlessly as your projects grow without hardware constraints holding you back." },
      { t: "Simplicity meets control", d: "Say goodbye to hardware worries. Our server solution eliminates concerns about component upgrades and technical faults while still granting you full administrative control over your Plesk VPS solution." },
      { t: "Unlimited possibilities with unlimited traffic", d: "Host bandwidth-intensive services and applications without worry. Our VPS solutions offer unlimited traffic with a maximum bandwidth of 3 Gbps unlimited, ensuring optimal user experiences and eliminating surprise costs." },
      { t: "Safeguard your valuable data with backup options", d: "Protect your valuable data with our robust backup solutions. Choose automated, scheduled backups for peace of mind or take snapshot backups on demand via the GHC Control Panel. Your data's safety is our priority." },
      { t: "Always-on availability", d: "GHC's infrastructure guarantees minimal latency and hardware availability backed by an 99.9% SLA. Deploy your business applications confidently, knowing they'll benefit from constant, stable service, even in demanding production environments." },
    ],
    platforms: [
      { label: "Cheap VPS", d: "Our cheap VPS delivers budget-friendly virtual private servers, perfect for those seeking cost-effective solutions for projects requiring specific configurations or testing environments." },
      { label: "VPS for gaming", d: "Experience smooth gameplay and scalability for growing communities with our affordable solutions, tailor-made for hosting game servers." },
      { label: "VPS PrestaShop", d: "Our scalable and secure VPS hosting is specifically designed for e-commerce websites built on PrestaShop, ensuring your online store thrives." },
      { label: "VPS Linux", d: "Enjoy full root access and a wide range of Linux distributions with our scalable Linux VPS, featuring unlimited traffic and NVMe SSD storage for lightning-fast speeds." },
      { label: "VPS cPanel", d: "Simplify website management with VPS hosting featuring the intuitive cPanel control panel, providing a dedicated environment for enhanced control and scalability." },
      { label: "VPS Ubuntu", d: "Our VPS hosting supports the popular Ubuntu Linux distribution — affordable, user-friendly, and secure, making it an ideal choice for beginners and experienced users alike." },
      { label: "VPS WordPress", d: "Experience dedicated and scalable hosting specifically designed for WordPress, ensuring optimal performance and handling traffic spikes with ease, thanks to unlimited traffic." },
      { label: "VPS Windows", d: "Host Windows-based applications and services with our flexible and scalable VPS hosting, offering full control and customisation within a dedicated environment." },
      { label: "VPS Debian", d: "Choose stable, secure, and customisable VPS hosting powered by the Debian Linux distribution, which is suitable for a wide variety of applications and workloads." },
    ],
    faqs: [
      { q: "Why choose a Metal VPS?", a: "Metal VPS hosting is the ideal choice because our high-performance servers are meticulously designed and configured to deliver optimal speeds, empowering your projects to thrive. You'll also enjoy global accessibility with the ability to deploy your VPS in any of our 10 strategically located data centres for low-latency access and a seamless experience for your users worldwide. Robust security is a priority, so we safeguard your online presence with industry-leading anti-DDoS protection and backed by a 99.9% SLA. Flexibility and scalability are built-in, allowing you to tailor your configuration and upgrade resources independently, adapting to your evolving needs effortlessly." },
      { q: "What is Plesk VPS?", a: "Plesk VPS is a powerful combination of Plesk's intuitive control panel and the power and flexibility of a virtual private server. It provides a dedicated environment for your web projects, along with an easy-to-use interface for managing websites, domains, email accounts, and DNS settings, making it an ideal solution for users of all technical levels." },
      { q: "How to install Plesk on VPS?", a: "With GHC, Plesk comes pre-installed on our Plesk VPS solutions, making the setup process incredibly simple. You can choose from different Plesk licences depending on the number of domains you need to manage, ensuring you have the right tools for your specific needs." },
      { q: "Why deploy Plesk on a Metal VPS?", a: "Deploying Plesk on a Metal server offers a multitude of advantages. Our servers guarantee that your websites and applications run smoothly, delivering optimal performance. Our global reach, with 10 data centres, ensures low-latency access and a seamless experience for your users worldwide." },
    ],
  },
  "cpanel": {
    crumb: "VPS cPanel",
    rangeTitle: "Metal cPanel VPS Offer",
    title: "Discover our cPanel-compatible VPS range",
    subtitle: "",
    bullets: ["Centralised multi-site management", "Reliable, scalable web hosting", "Transparent and predictable pricing"],
    exploreTitle: "Metal cPanel VPS Offer",
    exploreSub: "Combine the power of cPanel & WHM with dedicated resources — host unlimited websites, manage clients, and scale effortlessly on NVMe-backed Metal VPS.",
    whyTitle: "Why deploy cPanel on a Metal VPS?",
    whyIntro: "Our VPS solutions are designed to give you even more freedom when it comes to hosting your websites. The main advantage is that you can add resources to it as needed — so you can keep control over your budget. To make managing your websites even easier, you can deploy the cPanel management platform on our VPS solutions. With its user-friendly interface, you can manage your websites and online shops with just a few clicks. It offers a range of features, including centralised multi-site management. What's more, when you receive your VPS in your Control Panel, cPanel is already pre-installed to save you time.",
    whyChoose: [
      { t: "Optimised resources at the best price", d: "Get smooth performance without breaking the bank. Our VPS solutions are equipped with a powerful next-gen architecture and NVMe storage, guaranteeing speed and reliability." },
      { t: "An isolated, scalable environment", d: "Host your projects in an isolated, flexible environment and upgrade your configuration in one click via the Control Panel." },
      { t: "Simplicity and total control", d: "Gain full control over your VPS via root access and the Control Panel. Choose and install your preferred distribution, then use tools like Plesk or cPanel to manage your resources." },
      { t: "Unlimited traffic", d: "With your VPS server, you get unlimited traffic* and bandwidth of up to 3 Gbps. This is perfect for services that require high data flows, such as hosting a website, streaming or gaming." },
      { t: "Backup options", d: "Your data is automatically backed up for protection. You can also choose additional options, such as Premium backup and snapshots." },
      { t: "Availability", d: "Backed by a 99.9% SLA, our VPS solutions ensure reliable hosting for your websites, applications, and critical projects." },
    ],
    faqs: [
      { q: "What is cPanel?", a: "It's a graphical management interface based on a Linux OS (operating system). It simplifies the way you manage your projects, with features that centralise management in one interface. It's compatible with our shared hosting plans, VPS plans, and dedicated servers." },
      { q: "What is the difference between cPanel Hosting and a cPanel VPS?", a: "cPanel hosting is generally a solution for hosting a website or application that uses cPanel, for example, at GHC. cPanel is used on our shared hosting servers. The main difference between a VPS and a shared hosting plan is the freedom of management. With shared hosting, the resources are distributed between the different users of the hosting solution, and you can then perform your configurations via the solution. You can't customise it. A VPS, on the other hand, offers a dedicated environment. By definition, it's a virtual server that is cut from a physical machine, so you have allocated hosting space. You can add resources as your business grows. These solutions are hosted in our own datacentres, and help you stay online worldwide." },
      { q: "What is the difference between the cPanel dedicated server and the cPanel VPS?", a: "A cPanel dedicated server is an entire server managed with this interface. All of its resources are allocated to you (CPU, RAM, storage space, bandwidth, etc.). It's best suited for advanced web projects, intensive usage, and companies that require increased security. Although your VPS has a lot in common with the dedicated server in terms of administration, some of its resources are shared. Your environment stays private, giving you excellent balance between your hosted solutions, strong scalability and greater management flexibility." },
      { q: "What are the specific features of cPanel?", a: "cPanel offers various possibilities and options you can manage your website however you want: file, database, and domain management; email management, including contact and security controls; metrics, which allow you to view your website visitors and resource usage; security options with several control tools, such as 2FA and SSL; application installation, platform management and PHP; Softaculous App Installer, which allows you to install hundreds of applications directly from cPanel; advanced tools, such as cron task management and error pages." },
      { q: "How do I install cPanel on a VPS?", a: "You must have a VPS compatible with the cPanel interface, and a GHC customer account. Once you have this, please refer to our step-by-step guide on 'How to install cPanel on my VPS'." },
      { q: "Which hosting solution should I use with cPanel?", a: "Shared hosting, VPS or dedicated server at GHC, all of these solutions are cPanel-compatible. They each offer their own advantages, depending on the nature and growth of your project: Shared hosting is a managed solution (monitoring, updates, etc.); Virtual Private Server offers unlimited monthly traffic, anti-DDoS protection, multisite management, PHP management, regular backup options, a dedicated environment, dedicated resources and customisation; Dedicated Server adds full hardware isolation and maximum performance. Remember that before you choose a hosting plan, you need to have a domain name." },
      { q: "Which operating systems are compatible with a VPS?", a: "Our virtual private servers are compatible with a wide range of operating systems. You can have a VPS on Windows or Linux (including the Debian and Ubuntu VPS options). This includes Linux distributions that you're already familiar with. Please note that Windows licences are not included with our solutions and are billed separately. Linux licences are not subject to additional billing, so there are no surprises. You can choose the OS you want to use when ordering your VPS from the Control Panel." },
    ],
  },
  "wordpress": {
    crumb: "VPS for WordPress",
    rangeTitle: "Metal WordPress VPS",
    title: "Explore Metal VPS servers, compatible with WordPress",
    subtitle: "",
    bullets: ["Performance at a competitive price", "A customisable and scalable VPS, compatible with WordPress", "Up to 3 Gbps unlimited bandwidth*"],
    exploreTitle: "Metal VPS for WordPress",
    exploreSub: "Launch WordPress sites on dedicated resources — predictable performance, daily backups and one-click scaling on every Metal VPS.",
    benefits: [
      { t: "Total scalability", d: "Manage your budget with a virtual private server (VPS) — designed to match your needs, and adapt to your growing activity and requirements. Only pay for what you need by adding the exact resources you want, with no need to provision them in advance." },
    ],
    whyChoose: [
      { t: "Optimised resources at the best price", d: "Get ample resources without breaking the bank. Our VPS solutions, equipped with next-generation architecture and NVMe storage, guarantee speed and reliability." },
      { t: "An isolated, scalable environment", d: "Host your projects in an isolated, flexible environment, and upgrade your configuration in one click via your Control Panel." },
      { t: "Simplicity and total control", d: "Gain full control over your VPS via root access and the Control Panel. Choose and install your preferred distribution, then use tools like Plesk or cPanel to manage your resources." },
      { t: "Unlimited traffic", d: "With your VPS server, you get unlimited traffic* and bandwidth of up to 3 Gbps. This is perfect for services that require high throughput, and does not incur extra costs. *Excluding our datacentres in Asia-Pacific." },
      { t: "Backup options", d: "Your data is protected thanks to the automatic backup included. You can also opt for additional options, such as Premium backup and snapshots." },
      { t: "Availability", d: "Backed by a 99.9% SLA, our VPS solutions ensure reliable hosting for your websites, applications, and critical projects." },
    ],
    faqs: [
      { q: "What is a WordPress VPS?", a: "A virtual private server, otherwise known as a VPS, is a virtual machine. It gives you an environment with dedicated resources for your website and business application projects. The RAM and CPU capacities of our VPS platforms make them particularly well adapted to hosting websites that are built using WordPress. You can adapt them to fit growing needs for your web projects by adding resources via the GHC Control Panel." },
      { q: "How do I install WordPress on a VPS?", a: "WordPress is quick and easy to install on a VPS: 1. First of all, configure your machine with a web environment and database. 2. Next, go to the official WordPress website to download the latest CMS version. 3. Finally, upload the files to your VPS, then launch the configuration process — i.e. creating the administrator account, linking to the database, etc. There you go, your VPS for WordPress is ready! Need help setting up your machine? Please read our dedicated guide on the topic 'Getting started with a VPS'." },
      { q: "What is the best hosting plan for a WordPress website?", a: "If you have technical knowledge of server administration, a WordPress VPS will be the best option for you. It gives you full control over your virtual machine. You can quickly and easily increase your allocated resources via the GHC Control Panel, and your website will experience minimal latency with high availability." },
      { q: "What are the advantages of using a VPS to host a WordPress website?", a: "With our virtual machines, you get high performance to host your WordPress websites. Because of their RAM, CPU, storage capacity and scalability, you can manage traffic spikes and adapt your VPS to suit your needs." },
      { q: "Does a VPS platform offer optimal speed for a WordPress website?", a: "With a dedicated environment and allocated resources, your WordPress website would have higher performance metrics compared to a basic web hosting plan. Our WordPress VPS solutions can also be hosted in one of our datacentres — in France and in the rest of Europe. Choose a location closest to your users in order to minimise latency, offering an optimal browsing experience. Our physical servers are also equipped with next-generation components, and RAM that offers quick access to your website or application." },
      { q: "What are the differences between a VPS and shared hosting?", a: "The best hosting solution for you will depend on both your requirements, and your technical skill level. GHC's web hosting plans are designed for people who do not have much experience with server configuration. It is a turnkey solution, but it has shared resources — i.e. resources shared between several users. A VPS offers a dedicated environment with dedicated resources, but requires technical knowledge of server administration and management. It is fully configurable, and can be used with a number of different operating systems — so you can create and manage your web hosting platform to suit your needs." },
    ],
  },
};

const FAQS = [
  { q: "Can I easily upgrade my Metal VPS to a higher or downgrade to a lower configuration?", a: "Yes. You can scale your Metal VPS up or down at any time from your control panel — upgrades apply instantly and billing is adjusted pro-rata." },
  { q: "Is automatic backup included with my Metal VPS?", a: "Yes — daily automatic backup is included free with every Metal VPS. Premium backup rotations and snapshots are available as paid options." },
  { q: "What is a VPS, and what is it used for?", a: "A Virtual Private Server is a virtualised environment with dedicated resources (CPU, RAM, NVMe storage) on shared hardware. It's ideal for websites, apps, game servers, VPNs and dev environments." },
  { q: "Who are Metal VPS solutions designed for?", a: "Developers, agencies, resellers and businesses who want dedicated performance at a predictable monthly price — with the flexibility to scale." },
  { q: "Can I host several websites on a Metal VPS?", a: "Absolutely. A single Metal VPS can host unlimited websites — add a control panel like Plesk or cPanel to manage them easily." },
  { q: "How do I choose between a Metal VPS and a web hosting plan?", a: "Choose a Metal VPS when you need root access, custom software or dedicated resources. Web hosting suits simple sites that don't need server-level control." },
  { q: "What are the advantages of a Metal VPS compared to a dedicated server?", a: "Metal VPS gives you dedicated resources at a fraction of the cost of bare metal — instant deployment, easy scaling and no hardware management." },
];

export default function MetalVpsClient({ initialPlans }: { initialPlans: any[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const sub = (params.get("s") || "").toLowerCase();
  const fam = METAL_FAMILIES[sub] || METAL_FAMILIES[""];
  const { currency } = useCurrency();
  const [plans, setPlans] = useState<any[]>(initialPlans || []);
  const [svcTab, setSvcTab] = useState<keyof typeof SERVICE_TABS>("HARDWARE");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    api.server.metalVpsPlans()
      .then((p: any[]) => { if (alive && Array.isArray(p) && p.length) setPlans(p); })
      .catch(() => {});
    return () => { alive = false; };
  }, [currency]);

  const { sorted, lzPlans } = useMemo(() => {
    const price = (p: any) => {
      const d = (p.durations || []).find((x: any) => x.durationLabel === "1_month") || p.durations?.[0];
      return d?.monthlyPrice ?? d?.finalPrice ?? Infinity;
    };
    // Only the current-gen VPS 2027 range is sold under Metal — older families
    // (starter/value/essential/comfort/elite/le) stay hidden per product decision.
    const all = [...(plans || [])]
      .filter((p) => price(p) !== Infinity && String(p.planCode).startsWith("vps-2027"))
      .sort((a, b) => price(a) - price(b));
    return {
      sorted: all.filter((p) => !/\.lz$/i.test(String(p.planCode))),
      lzPlans: all.filter((p) => /\.lz$/i.test(String(p.planCode))),
    };
  }, [plans]);

  const regions = useMemo(() => {
    const seen = new Set<string>();
    for (const p of sorted) for (const r of p.regions || []) seen.add(String(r).toLowerCase());
    return Array.from(seen);
  }, [sorted]);

  const configure = (planCode: string) => {
    router.push(`/configure?category=VPS&plan=${encodeURIComponent(planCode)}&brand=metal`);
  };

  return (
    <div className="ghc-metal-bg min-h-screen">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="ghc-metal-grid relative overflow-hidden bg-gradient-to-br from-[#0a0a10] via-[#14090a] to-[#1c0d04] text-white">
        <div className="ghc-metal-orb ghc-metal-orb-a -left-24 top-10 h-96 w-96" />
        <div className="ghc-metal-orb ghc-metal-orb-b right-0 top-1/3 h-[28rem] w-[28rem]" />
        <div className="ghc-metal-orb ghc-metal-orb-c left-1/3 bottom-0 h-72 w-72" />
        <div className="relative mx-auto max-w-7xl px-6 pt-4 pb-16">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/60">
            <span className="ghc-metal-text-grad">Metal</span><span className="text-white/30">›</span><span className="text-white/90">{fam.crumb}</span>
            <span className="ml-auto hidden gap-6 text-[11px] normal-case tracking-normal md:flex">
              <a href="#plans" className="hover:text-[#ffb347] transition-colors">Our prices</a>
              <a href="#services" className="hover:text-[#ffb347] transition-colors">Services and options</a>
              <a href="#locations" className="hover:text-[#ffb347] transition-colors">Our locations</a>
              <a href="#usecases" className="hover:text-[#ffb347] transition-colors">Use cases</a>
            </span>
          </div>
          <div className="mt-10 grid items-center gap-10 md:grid-cols-[1.25fr_1fr]">
            <div className="ghc-metal-fade">
              <span className="ghc-metal-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#ffb347]">
                <Flame className="h-3 w-3" /> Molten-grade infrastructure
              </span>
              <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">{fam.title}</h1>
              <p className="mt-3 max-w-xl text-lg text-white/70">{fam.subtitle}</p>
              <ul className="mt-6 space-y-2.5 text-sm text-white/85">
                {fam.bullets.map((b, i) => (
                  <li key={b} className="ghc-metal-fade flex items-center gap-2.5" style={{ ["--d" as any]: `${120 + i * 90}ms` }}>
                    <Check className="h-4 w-4 shrink-0 text-[#ffb347]" /> {b}
                  </li>
                ))}
              </ul>
              {fam.heroNote && <p className="mt-6 max-w-2xl text-xs leading-5 text-white/50">{fam.heroNote}</p>}
              <a href="#plans" className="ghc-metal-btn mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold">
                <Zap className="h-4 w-4" /> Deploy in seconds
              </a>
            </div>
            <div className="hidden justify-center md:flex">
              {/* glowing server stack */}
              <div className="ghc-metal-scan space-y-2 rounded-2xl p-4">
                {[0, 1, 2, 3, 4].map((s) => (
                  <div key={s} className="ghc-metal-card ghc-metal-fade flex h-11 w-80 items-center gap-2.5 rounded-md px-3" style={{ ["--d" as any]: `${200 + s * 110}ms` }}>
                    <span className="ghc-metal-led h-2 w-2 rounded-full bg-emerald-400 text-emerald-400" />
                    <span className="ghc-metal-led h-2 w-2 rounded-full bg-[#ff8a2a] text-[#ff8a2a]" style={{ animationDelay: `${s * 220}ms` }} />
                    <div className="ml-2 flex gap-1">
                      {[0, 1, 2, 3].map((b) => <span key={b} className="h-5 w-3 rounded-sm border border-white/10 bg-white/5" />)}
                    </div>
                    <span className="flex-1" />
                    <span className="h-1.5 w-10 rounded bg-[#ff8a2a]/25" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <hr className="ghc-metal-hr relative" />
      </section>

      {/* ─── Plan cards ─── */}
      <section id="plans" className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="ghc-metal-orb ghc-metal-orb-b -right-40 top-20 h-80 w-80 opacity-25" />
        <h2 className="relative text-center text-2xl font-black md:text-3xl">
          <span className="ghc-metal-text-grad">{fam.exploreTitle || fam.rangeTitle}</span>
        </h2>
        <p className="relative mx-auto mt-2 max-w-2xl text-center text-sm text-white/55">
          {fam.exploreSub || "Choose the configuration that fits your needs — web hosting, gaming, VPNs, development and more."}
        </p>
        {sorted.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/50">Plans are loading — please check back shortly.</p>
        ) : (
          <div className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((p, i) => {
              const d = (p.durations || []).find((x: any) => x.durationLabel === "1_month") || p.durations?.[0];
              const specs: string[] = [
                p.cpuCores ? `${p.cpuCores} vCores` : "",
                p.ramGb ? `${p.ramGb} GB RAM` : "",
                p.diskGb ? `${p.diskGb} GB ${p.diskType || "NVMe SSD"}` : "",
                p.bandwidthMbps ? `${p.bandwidthMbps >= 1000 ? `${(p.bandwidthMbps / 1000).toFixed(1)} Gbps` : `${p.bandwidthMbps} Mbps`} unlimited` : "Unlimited bandwidth",
                "Anti-DDoS protection",
              ].filter(Boolean);
              return (
                <div key={p.planCode} className="ghc-metal-card ghc-metal-fade flex flex-col rounded-xl overflow-hidden" style={{ ["--d" as any]: `${i * 80}ms` }}>
                  <div className="ghc-metal-scan p-5 pb-4">
                    <span className="rounded bg-[#ff7a18]/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-[#ffb347]">Metal</span>
                    <h3 className="mt-2.5 text-lg font-bold text-white">{p.displayName || p.invoiceName || p.planCode}</h3>
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-white/40">From</p>
                    <p className="ghc-metal-text-grad text-3xl font-black">{money(d?.monthlyPrice ?? d?.finalPrice, d?.currency)}</p>
                    <p className="text-[11px] text-white/35">ex. taxes/month</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {["Priority deploy", "Daily backup", "Metal care"].map((perk) => (
                        <span key={perk} className="rounded bg-[#ff7a18]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#ffb347]">{perk}</span>
                      ))}
                    </div>
                    <button onClick={() => configure(p.planCode)} className="ghc-metal-btn mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold">
                      <ShoppingCart className="h-4 w-4" /> Configure
                    </button>
                  </div>
                  <ul className="mt-auto space-y-2 border-t border-white/10 p-5 pt-4">
                    {specs.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-xs text-white/70">
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#ff8a2a]" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* Local Zone variants */}
        {lzPlans.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-white">Also available in Local Zones</h3>
              <span className="rounded-full bg-[#ff7a18]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#ffb347]">Lower latency</span>
            </div>
            <p className="mt-1 text-xs text-white/50">Same Metal VPS hardware deployed in city-edge zones — pick during configuration for the closest location to your users.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lzPlans.map((p) => {
                const d = (p.durations || []).find((x: any) => x.durationLabel === "1_month") || p.durations?.[0];
                return (
                  <div key={p.planCode} className="ghc-metal-card flex flex-col rounded-xl border-dashed p-5" style={{ borderStyle: "dashed", borderColor: "rgba(255,154,46,.45)" }}>
                    <span className="w-fit rounded bg-[#ff7a18]/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#ffb347]">Local Zone</span>
                    <h3 className="mt-2 text-base font-bold text-white">{p.displayName || p.invoiceName || p.planCode}</h3>
                    <p className="ghc-metal-text-grad mt-1 text-xl font-black">{money(d?.monthlyPrice ?? d?.finalPrice, d?.currency)}<span className="text-[10px] font-normal text-white/40"> ex. taxes/month</span></p>
                    <p className="mt-1 text-[11px] text-white/50">{p.cpuCores} vCores · {p.ramGb} GB RAM · {p.diskGb} GB {p.diskType || "NVMe"}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {["Priority deploy", "Daily backup", "Metal care"].map((perk) => (
                        <span key={perk} className="rounded bg-[#ff7a18]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#ffb347]">{perk}</span>
                      ))}
                    </div>
                    <button onClick={() => configure(p.planCode)} className="ghc-metal-btn mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold">
                      <ShoppingCart className="h-3.5 w-3.5" /> Configure
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ─── Family-specific content ─── */}
      {fam.benefits && (
        <section className="relative mx-auto max-w-4xl px-6 py-14">
          <h2 className="text-2xl font-black"><span className="ghc-metal-text-grad">Key Benefits of Hosting {fam.crumb.replace(" VPS", "")} on a VPS</span></h2>
          <div className="mt-8 space-y-7">
            {fam.benefits.map((b) => (
              <div key={b.t} className="ghc-metal-card rounded-xl p-6">
                <h3 className="text-sm font-black uppercase tracking-wide text-[#ffb347]">{b.t}</h3>
                <p className="mt-1.5 text-sm leading-6 text-white/65">{b.d}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {fam.whyChoose && (
        <section className="mx-auto max-w-7xl px-6 pb-14">
          <h2 className="text-center text-2xl font-black"><span className="ghc-metal-text-grad">{fam.whyTitle || `Why Choose GHC for Your ${fam.crumb.replace(" VPS", "")} VPS?`}</span></h2>
          {fam.whyIntro && <p className="mx-auto mt-4 max-w-3xl text-center text-sm leading-6 text-white/55">{fam.whyIntro}</p>}
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {fam.whyChoose.map((c) => (
              <div key={c.t} className="ghc-metal-card rounded-xl p-6">
                <h3 className="text-sm font-black text-white">{c.t}</h3>
                <p className="mt-2 text-xs leading-6 text-white/60">{c.d}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {fam.howTo && (
        <section className="mx-auto max-w-4xl px-6 pb-14">
          <div className="ghc-metal-card flex items-start gap-5 rounded-xl p-7">
            <RefreshCw className="h-10 w-10 shrink-0 text-[#ff8a2a]" />
            <div>
              <h2 className="text-lg font-black text-white">{fam.howTo.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">{fam.howTo.body}</p>
            </div>
          </div>
        </section>
      )}

      {/* ─── Essentials ─── */}
      <section className="relative border-t border-white/5 bg-[#0d0c12]">
        <div className="ghc-metal-orb ghc-metal-orb-c left-10 top-10 h-64 w-64 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-black"><span className="ghc-metal-text-grad">New Metal range: the essentials included, with added peace of mind</span></h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Our Metal range is designed to focus on the essentials: configurations calibrated for your actual usage, automatic daily backups included to protect your data, and NVMe-level performance. You get high security without the premium price tag.
              </p>
            </div>
            <div className="hidden justify-center md:flex">
              <div className="ghc-metal-card ghc-metal-card-glow flex h-36 w-36 items-center justify-center rounded-3xl">
                <Shield className="h-20 w-20 text-[#ff8a2a] drop-shadow-[0_0_25px_rgba(255,122,24,.55)]" />
              </div>
            </div>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Gauge, t: "Performance at the right price" },
              { icon: Lock, t: "Isolated environment" },
              { icon: Settings2, t: "Scalable configuration" },
              { icon: RefreshCw, t: "Advanced management" },
            ].map((f, i) => (
              <div key={f.t} className="ghc-metal-card ghc-metal-fade flex flex-col items-center rounded-xl p-6 text-center" style={{ ["--d" as any]: `${i * 90}ms` }}>
                <f.icon className="h-8 w-8 text-[#ff8a2a] drop-shadow-[0_0_14px_rgba(255,122,24,.5)]" />
                <p className="mt-3 text-sm font-bold text-white/90">{f.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Services & options tabs ─── */}
      <section id="services" className="relative overflow-hidden border-t border-white/5 bg-gradient-to-b from-[#0a0a10] to-[#120a06] py-16">
        <div className="ghc-metal-orb ghc-metal-orb-a right-0 bottom-0 h-80 w-80 opacity-25" />
        <div className="relative mx-auto max-w-7xl px-6">
          <h2 className="text-center text-2xl font-black"><span className="ghc-metal-text-grad">Our services and options included with your Metal VPS</span></h2>
          <div className="mt-8 flex flex-wrap justify-center gap-1 border-b border-white/10">
            {(Object.keys(SERVICE_TABS) as (keyof typeof SERVICE_TABS)[]).map((t) => (
              <button key={t} onClick={() => setSvcTab(t)} className={`ghc-metal-tab px-5 py-2.5 text-xs font-bold uppercase tracking-wide ${svcTab === t ? "ghc-metal-tab-active" : "text-white/50 hover:text-white"}`}>{t}</button>
            ))}
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SERVICE_TABS[svcTab].map((c) => (
              <div key={c.title} className="ghc-metal-card rounded-xl p-5">
                <p className="text-sm font-bold text-white">{c.title}</p>
                <p className="mt-2 text-xs leading-5 text-white/60">{c.desc}</p>
                <span className={`mt-3 inline-block rounded px-2 py-0.5 text-[10px] font-black uppercase ${c.tag === "Included" ? "bg-[#ff7a18]/15 text-[#ffb347]" : "bg-white/10 text-white/70"}`}>{c.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Locations ─── */}
      <section id="locations" className="relative mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-2xl font-black"><span className="ghc-metal-text-grad">Your data, hosted wherever you need it</span></h2>
        <p className="mt-2 max-w-2xl text-sm text-white/55">Deploy your Metal VPS in one of our worldwide datacenters — close to your users for the lowest latency.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {(regions.length ? regions : Object.keys(REGION_NAMES)).map((r) => (
            <span key={r} className="ghc-metal-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/85">
              <Globe className="h-3 w-3 text-[#ff8a2a]" /> {REGION_NAMES[r] || r.toUpperCase()}
            </span>
          ))}
        </div>
      </section>

      {/* ─── Compatible options ─── */}
      <section className="border-t border-white/5 bg-[#0d0c12]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-center text-2xl font-black"><span className="ghc-metal-text-grad">Options compatible with our Metal VPS solutions</span></h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { t: "Standard automatic backup", d: "Effortlessly protect your data every day.", p: "Included", cta: null },
              { t: "Premium automatic backup", d: "Your custom backups, with rotating 7-day restores.", p: "Optional add-on", cta: "Select at checkout" },
              { t: "Snapshots", d: "Easily back up and restore your data at any time.", p: "Optional add-on", cta: "Select at checkout" },
            ].map((o, i) => (
              <div key={o.t} className="ghc-metal-card ghc-metal-fade rounded-xl p-6 text-center" style={{ ["--d" as any]: `${i * 90}ms` }}>
                <p className="text-xs font-bold uppercase tracking-wide text-white/50">{o.t}</p>
                <p className="mt-1 text-xs text-white/45">{o.d}</p>
                <p className="ghc-metal-text-grad mt-4 text-xl font-black">{o.p}</p>
                <p className="mt-3 text-xs font-bold text-[#ffb347]">{o.cta || "Free with every Metal VPS"}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-white/45">
            You can also customise your environment with additional IPs, a Load Balancer, and external storage.
          </p>
        </div>
      </section>

      {/* ─── Use cases ─── */}
      <section id="usecases" className="relative mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-2xl font-black"><span className="ghc-metal-text-grad">Use cases</span></h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.map((u, i) => (
            <div key={u.title} className="ghc-metal-card ghc-metal-fade rounded-xl p-5" style={{ ["--d" as any]: `${i * 60}ms` }}>
              <u.icon className="h-5 w-5 text-[#ff8a2a]" />
              <p className="mt-3 text-sm font-bold text-white">{u.title}</p>
              <p className="mt-2 text-xs leading-5 text-white/55">{u.desc}</p>
            </div>
          ))}
        </div>
        <div className="ghc-metal-scan relative mt-12 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1c0d04] via-[#2a1206] to-[#3d1608] px-8 py-12 text-center ring-1 ring-[#ff7a18]/30">
          <div className="ghc-metal-orb ghc-metal-orb-a -left-20 -top-20 h-64 w-64 opacity-40" />
          <h3 className="relative text-2xl font-black"><span className="ghc-metal-text-grad">Take your business to the next level!</span></h3>
          <a href="#plans" className="ghc-metal-btn relative mt-6 inline-block rounded-lg px-7 py-3 text-sm font-bold">Choose a Metal VPS</a>
        </div>
      </section>

      {/* ─── Other platforms ─── */}
      {fam.platforms && (
        <section className="mx-auto max-w-4xl px-6 pb-14">
          <h2 className="text-xl font-black"><span className="ghc-metal-text-grad">For which other platforms does GHC provide VPS?</span></h2>
          <p className="mt-2 text-sm text-white/55">At GHC, we offer immense flexibility — it doesn't matter which VPS distributions you need. Some of our offerings include:</p>
          <ul className="mt-4 space-y-3">
            {fam.platforms.map((pl) => (
              <li key={pl.label} className="text-sm leading-6 text-white/65"><span className="font-bold text-[#ffb347]">● {pl.label}:</span> {pl.d}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── FAQ ─── */}
      <section className="border-t border-white/5">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-black"><span className="ghc-metal-text-grad">{fam.faqs ? `Frequently Asked Questions about ${fam.crumb} Hosting` : "Your questions answered"}</span></h2>
          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {(fam.faqs || FAQS).map((f, i) => (
              <div key={f.q}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-bold text-[#ffb347] hover:text-[#ffc966] transition-colors">
                  {f.q}
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <p className="pb-4 text-sm leading-6 text-white/60">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
