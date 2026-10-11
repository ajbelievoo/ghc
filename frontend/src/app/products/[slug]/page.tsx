import { notFound } from "next/navigation";
import ProductInfoPage, { ProductInfo } from "@/components/ProductInfoPage";

const PRODUCTS: Record<string, ProductInfo> = {
  "anti-ddos": {
    badge: "Security",
    title: "Anti-DDoS Protection",
    subtitle: "Always-on mitigation included free with every GHC server. Volumetric, protocol and application-layer attacks are filtered automatically before they reach you.",
    features: [
      { title: "Always-on detection", desc: "Traffic is analysed in real time. Mitigation kicks in automatically — no manual activation needed." },
      { title: "Multi-layer filtering", desc: "L3/L4 volumetric attacks plus L7 application attacks handled at the edge, upstream of your server." },
      { title: "Unmetered mitigation", desc: "Attack traffic is absorbed on the backbone — you never pay for malicious bandwidth." },
    ],
    highlights: [
      "Included free on every VPS and dedicated server",
      "Edge network firewall with per-IP rules from your dashboard",
      "Auto-mitigation for UDP, TCP, SYN and ICMP floods",
      "Game-specific protection profiles on Game range servers",
      "Optional permanent mitigation mode",
      "Detailed attack logs via your control panel",
    ],
    cta: { label: "Get a protected server", href: "/dedicated-servers" },
    secondaryCta: { label: "View VPS plans", href: "/vps" },
  },
  "load-balancer": {
    badge: "Public Cloud — Network",
    title: "Managed Load Balancer",
    subtitle: "Distribute traffic across your instances with health checks, SSL termination and multi-protocol support — deployed in minutes.",
    features: [
      { title: "Layer 4 & 7", desc: "TCP and HTTP farms with path- and host-based routing for modern web apps." },
      { title: "Health checks", desc: "Automatic backend health monitoring removes unhealthy instances from rotation instantly." },
      { title: "SSL termination", desc: "Terminate TLS at the balancer or pass through end-to-end — your choice." },
    ],
    highlights: [
      "Public and private (vRack) frontends",
      "Sticky sessions / source-IP affinity",
      "HTTP/2 and WebSocket support",
      "Per-second billing — resize any time",
      "API-driven: fully automatable",
      "Multi-region deployment",
    ],
    cta: { label: "Deploy a Load Balancer", href: "/public-cloud?s=loadbalancer" },
    secondaryCta: { label: "Network products", href: "/network" },
  },
  vrack: {
    badge: "Private Network",
    title: "vRack — Private Network",
    subtitle: "Connect your VPS, dedicated servers and cloud instances over an isolated Layer-2 private network spanning multiple regions — free private traffic included.",
    features: [
      { title: "Isolated L2 network", desc: "Your traffic never touches the public internet — a dedicated VLAN across all your services." },
      { title: "Multi-region", desc: "Stretch one private network across datacentres and regions for resilient architectures." },
      { title: "Hybrid by design", desc: "Mix VPS, bare metal and Public Cloud instances on the same private segment." },
    ],
    highlights: [
      "Up to 4000 VLANs per vRack",
      "Private bandwidth unmetered",
      "Attach/detach services from the dashboard",
      "Works with managed Kubernetes node pools",
      "Ideal for DB replication and internal APIs",
      "No extra cost for the vRack itself",
    ],
    cta: { label: "Explore private networking", href: "/public-cloud?s=vrack" },
    secondaryCta: { label: "Contact sales", href: "/support" },
  },
  "ip-failover": {
    badge: "Network — Additional IPs",
    title: "Failover & Additional IPs",
    subtitle: "Moveable public IPv4 addresses you can route between your services in seconds — for high availability, migrations and multi-homing.",
    features: [
      { title: "Instant failover", desc: "Re-route an IP to another server in seconds from the dashboard or API — no downtime during migrations." },
      { title: "Geolocation options", desc: "Register IP geolocation in different countries to match your audience." },
      { title: "Block support", desc: "Single IPs or routed blocks — announce on your hypervisor or cloud instances." },
    ],
    highlights: [
      "Keep one IP across hardware swaps",
      "Reverse DNS fully editable",
      "Multiple geolocation countries available",
      "Attach to VPS, dedicated or cloud",
      "API automatable",
      "Monthly rental, cancel anytime",
    ],
    cta: { label: "Order additional IPs", href: "/dashboard" },
    secondaryCta: { label: "View servers", href: "/vps" },
  },
  "object-storage": {
    badge: "Public Cloud — Storage",
    title: "Object Storage",
    subtitle: "S3-compatible, infinitely scalable object storage for backups, media, logs and application data — pay only for what you use.",
    features: [
      { title: "S3-compatible API", desc: "Works with your existing S3 tooling — s3cmd, aws-cli, SDKs and backup software." },
      { title: "High durability", desc: "Data is replicated across the storage fabric for 99.999999999% durability." },
      { title: "Versioning & lifecycle", desc: "Object versioning, retention rules and lifecycle policies to cold/archive tiers." },
    ],
    highlights: [
      "Public or private (vRack) containers",
      "Static website hosting capable",
      "CORS, ACL and pre-signed URL support",
      "No egress fees within region",
      "Cold storage tier for archives",
      "Pay-as-you-go per GB",
    ],
    cta: { label: "Create a container", href: "/public-cloud?s=object" },
    secondaryCta: { label: "All storage products", href: "/public-cloud?s=block" },
  },
  "block-storage": {
    badge: "Public Cloud — Storage",
    title: "Block Storage",
    subtitle: "High-performance network volumes for your instances — attach, detach and resize on demand, with snapshot support.",
    features: [
      { title: "Elastic volumes", desc: "Create volumes from 10 GB to 12 TB and attach them to any instance in the same region." },
      { title: "High-Speed & Classic tiers", desc: "Choose NVMe-class performance for databases or classic HDD-backed volumes for capacity." },
      { title: "Snapshots & clones", desc: "Point-in-time snapshots and instant clones for testing and rollback." },
    ],
    highlights: [
      "Attach up to 25 volumes per instance",
      "Triple-replicated backend",
      "Resize online without detaching",
      "Volume backups to object storage",
      "Boot-from-volume supported",
      "Charged per GB-hour",
    ],
    cta: { label: "Create a volume", href: "/public-cloud?s=block" },
    secondaryCta: { label: "File storage", href: "/public-cloud?s=file" },
  },
  gpu: {
    badge: "Public Cloud — Compute",
    title: "Cloud GPU Instances",
    subtitle: "NVIDIA GPU-accelerated instances for AI training, inference, rendering and scientific compute — billed per second.",
    features: [
      { title: "Latest NVIDIA GPUs", desc: "Ampere and Ada-generation cards with dedicated vGPU or passthrough." },
      { title: "AI-ready images", desc: "Pre-built images with CUDA, cuDNN, PyTorch and TensorFlow ready to boot." },
      { title: "Scale on demand", desc: "Spin up for training runs and delete when done — no idle GPU spend." },
    ],
    highlights: [
      "Single and multi-GPU flavors",
      "NVLink on multi-GPU SKUs",
      "Compatible with AI Training & Notebooks",
      "Local NVMe scratch storage",
      "Per-second billing",
      "API + CLI automation",
    ],
    cta: { label: "Launch a GPU instance", href: "/public-cloud?s=gpu" },
    secondaryCta: { label: "AI Notebooks", href: "/public-cloud?s=ai-notebooks" },
  },
  kubernetes: {
    badge: "Public Cloud — Containers",
    title: "Managed Kubernetes",
    subtitle: "CNCF-certified Kubernetes with a fully managed control plane — you ship containers, we run etcd, the API server and upgrades.",
    features: [
      { title: "Managed control plane", desc: "Free, HA control plane operated by us — patches, upgrades and etcd backups included." },
      { title: "Node pools", desc: "Mix general-purpose, memory and GPU node pools; autoscale them on load." },
      { title: "Cloud integrations", desc: "Native Load Balancer, Block Storage CSI, and vRack private networking out of the box." },
    ],
    highlights: [
      "CNCF conformant — standard kubectl works",
      "Cluster autoscaler support",
      "Private cluster endpoints via vRack",
      "Managed Private Registry integration",
      "Rancher integration available",
      "Free control plane — pay only for nodes",
    ],
    cta: { label: "Create a cluster", href: "/public-cloud?s=k8s" },
    secondaryCta: { label: "Private Registry", href: "/public-cloud?s=registry" },
  },
  "ai-ml": {
    badge: "AI & Machine Learning",
    title: "AI Platform — Notebooks, Training & Deploy",
    subtitle: "A complete managed AI toolchain: launch Jupyter/VS Code notebooks, run distributed training jobs and serve models behind autoscaling endpoints.",
    features: [
      { title: "AI Notebooks", desc: "One-click JupyterLab or VS Code environments on CPU or GPU — connect your object storage and code." },
      { title: "AI Training", desc: "Submit containerised training jobs across multi-GPU workers; pay only while jobs run." },
      { title: "AI Deploy & Endpoints", desc: "Serve models behind autoscaling HTTPS endpoints with rolling updates and token auth." },
    ],
    highlights: [
      "Pre-built ML framework images",
      "Mount object storage datasets directly",
      "Job scheduling + retention policies",
      "Token-secured inference endpoints",
      "Observability and logs built in",
      "Per-second billing for GPU time",
    ],
    cta: { label: "Start an AI notebook", href: "/public-cloud?s=ai-notebooks" },
    secondaryCta: { label: "GPU instances", href: "/public-cloud?s=gpu" },
  },
  quantum: {
    badge: "Quantum Computing",
    title: "Quantum Notebooks & QPUs",
    subtitle: "Explore quantum computing on real hardware and emulators — managed notebooks with Qiskit, Cirq and Pennylane pre-installed.",
    features: [
      { title: "Quantum Notebooks", desc: "Managed notebook environments wired to quantum SDKs and emulators — no setup." },
      { title: "Real QPUs", desc: "Submit circuits to partner quantum processing units for hands-on research." },
      { title: "Hybrid workflows", desc: "Combine classical GPU compute with quantum jobs in the same project." },
    ],
    highlights: [
      "Qiskit, Cirq, Pennylane ready",
      "Emulator + real hardware backends",
      "Integrated with cloud storage",
      "Ideal for research and education",
      "Usage-based pricing",
      "API access for automated experiments",
    ],
    cta: { label: "Launch a Quantum notebook", href: "/public-cloud?s=q-notebooks" },
    secondaryCta: { label: "QPU access", href: "/public-cloud?s=qpu" },
  },
};

export function generateStaticParams() {
  return Object.keys(PRODUCTS).map((slug) => ({ slug }));
}

export const dynamicParams = false;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = PRODUCTS[slug];
  if (!info) notFound();
  return <ProductInfoPage info={info} />;
}
