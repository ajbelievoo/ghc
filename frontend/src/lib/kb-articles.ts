export type KbSection = { heading: string; body: string[] };
export type KbArticle = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  sections: KbSection[];
};

export const kbArticles: KbArticle[] = [
  {
    slug: "create-ghc-account",
    title: "How to create a GHC account",
    category: "getting-started",
    summary: "Step-by-step guide to sign up, verify email and log in.",
    sections: [
      {
        heading: "Sign up",
        body: [
          "Open https://ghc.believoo.com/register and fill in your name, email and a strong password (minimum 8 characters).",
          "Solve the CAPTCHA puzzle shown on the form — this protects the platform from automated abuse.",
          "Click Create Account. You can also sign up with Google if enabled by the admin.",
        ],
      },
      {
        heading: "Verify your email",
        body: [
          "We send a verification link to your inbox within a minute. Click it to activate the account.",
          "If the email does not arrive, check Spam/Promotions, then use 'Resend verification' on the login page.",
        ],
      },
      {
        heading: "Secure the account (recommended)",
        body: [
          "After login, open Dashboard → Security and enable Two-Factor Authentication (TOTP) with Google Authenticator, Authy or any TOTP app.",
          "Fill in your billing details under Profile → Billing Details — they appear on your GST invoices.",
        ],
      },
    ],
  },
  {
    slug: "order-a-vps",
    title: "How to order a VPS",
    category: "getting-started",
    summary: "Choose a plan, select OS, pick duration and complete payment.",
    sections: [
      {
        heading: "Pick a plan",
        body: [
          "Go to the VPS page and compare plans by vCPU, RAM, NVMe storage and bandwidth.",
          "Use the duration selector — quarterly, half-yearly and yearly billing include built-in discounts.",
        ],
      },
      {
        heading: "Configure",
        body: [
          "On the configure page choose the region/datacenter and operating system image where offered.",
          "Have a coupon? Enter the code in the coupon field and the discounted total updates instantly.",
        ],
      },
      {
        heading: "Pay and provision",
        body: [
          "Pay with Razorpay (cards/UPI/netbanking), wallet balance or another enabled gateway.",
          "After a successful payment your order provisions automatically and appears under Dashboard → Servers.",
          "Provisioning typically completes within minutes; track progress from the order detail page.",
        ],
      },
    ],
  },
  {
    slug: "connect-vps-ssh",
    title: "How to connect to your VPS via SSH",
    category: "vps",
    summary: "Use root credentials from the dashboard to connect securely.",
    sections: [
      {
        heading: "Find your credentials",
        body: [
          "Open Dashboard → Servers → your VPS. The IP address and OS are shown in the overview.",
          "The initial root password is delivered by email/notification after provisioning. Change it on first login with 'passwd'.",
        ],
      },
      {
        heading: "Connect",
        body: [
          "Linux/macOS: ssh root@YOUR_SERVER_IP",
          "Windows: use PuTTY or the built-in OpenSSH client (ssh root@YOUR_SERVER_IP in PowerShell).",
          "If the connection times out, verify the server is Running in the dashboard and that port 22 is allowed by any firewall you configured.",
        ],
      },
      {
        heading: "Harden the server",
        body: [
          "Create a non-root sudo user, set up SSH keys and disable password login.",
          "Keep the OS updated: apt update && apt upgrade (Debian/Ubuntu) or dnf update (RHEL-family).",
        ],
      },
    ],
  },
  {
    slug: "reinstall-vps-os",
    title: "How to reinstall the OS on a VPS",
    category: "vps",
    summary: "Rebuild from available templates without losing data on secondary disks.",
    sections: [
      {
        heading: "Before you reinstall",
        body: [
          "Reinstall wipes the primary disk. Take a backup or snapshot of anything you need first.",
          "Note your server's IP — it stays the same after reinstall.",
        ],
      },
      {
        heading: "Reinstall from the dashboard",
        body: [
          "Open Dashboard → Servers → your VPS → Reinstall.",
          "Pick the OS template and confirm. The server reboots and the new image is applied automatically.",
          "A fresh root password is issued — check your email/notification.",
        ],
      },
    ],
  },
  {
    slug: "resize-vps",
    title: "How to resize a VPS",
    category: "vps",
    summary: "Upgrade RAM, CPU and storage from your client dashboard.",
    sections: [
      {
        heading: "Upgrade path",
        body: [
          "Open Dashboard → Servers → your VPS → Upgrade. Choose the target plan.",
          "The order creates a service-option invoice — pay it and the upgrade applies automatically.",
          "A short reboot may be required for CPU/RAM changes; disk grows without wiping data.",
        ],
      },
      {
        heading: "After upgrading",
        body: [
          "Verify inside the OS: free -h for RAM, nproc for vCPUs, df -h for disk.",
          "If the disk did not expand automatically, resize the filesystem (growpart + resize2fs/xfs_growfs).",
        ],
      },
    ],
  },
  {
    slug: "order-dedicated-server",
    title: "How to order a dedicated server",
    category: "dedicated",
    summary: "Pick a range, configure hardware and confirm provisioning time.",
    sections: [
      {
        heading: "Choose a range",
        body: [
          "Dedicated servers are grouped by range — Scale, High Grade, Storage, Game and Advance.",
          "Compare CPU, RAM, storage type (NVMe/SATA) and network capacity on the range pages.",
        ],
      },
      {
        heading: "Configure and order",
        body: [
          "Select region, OS template and duration, then pay. Dedicated provisioning takes longer than VPS — typically minutes to a few hours.",
          "You will get an email when the server is delivered, and it appears under Dashboard → Servers.",
        ],
      },
      {
        heading: "First steps",
        body: [
          "SSH in with the delivered root credentials and change the password.",
          "Use rescue mode or IPMI from the server page for out-of-band recovery.",
        ],
      },
    ],
  },
  {
    slug: "ipmi-remote-management",
    title: "Dedicated server remote management (IPMI)",
    category: "dedicated",
    summary: "Access IPMI/KVM for out-of-band server management.",
    sections: [
      {
        heading: "What IPMI gives you",
        body: [
          "Out-of-band access to the machine even when the OS or network is down — power control, KVM console and reinstall.",
        ],
      },
      {
        heading: "Rescue mode",
        body: [
          "From Dashboard → Servers → your dedicated server → Boot rescue mode. The server reboots into a minimal rescue OS.",
          "Rescue credentials are provided after enabling; use them to mount disks, fix configs or recover data.",
          "Select 'Exit rescue mode' to boot back into the normal disk.",
        ],
      },
      {
        heading: "KVM console",
        body: [
          "Where supported, use the remote console to see the screen/keyboard of the physical machine — useful when SSH is unreachable.",
        ],
      },
    ],
  },
  {
    slug: "register-domain",
    title: "How to register a domain name",
    category: "domains",
    summary: "Search for a domain, choose TLD and complete registration.",
    sections: [
      {
        heading: "Search and order",
        body: [
          "Open the Domains page and search for your name. Available TLDs and prices come from the live upstream catalog.",
          "Add the domain, choose registration years and complete payment.",
        ],
      },
      {
        heading: "After registration",
        body: [
          "The domain appears under Dashboard → Domains with its expiry date.",
          "Enable auto-renew to protect it — we generate a renewal invoice before expiry.",
        ],
      },
      {
        heading: "Pointing the domain",
        body: [
          "Update nameservers or DNS records from the domain management section to point it to your hosting/VPS.",
        ],
      },
    ],
  },
  {
    slug: "manage-dns-records",
    title: "How to manage DNS records",
    category: "domains",
    summary: "Add A, CNAME, MX and TXT records from the domain control panel.",
    sections: [
      {
        heading: "Where to edit",
        body: [
          "If your domain uses GHC/its registrar DNS zone, open Dashboard → Domains → your domain → DNS zone.",
          "If you use external nameservers (e.g. Cloudflare), edit records there instead — our zone will not apply.",
        ],
      },
      {
        heading: "Common records",
        body: [
          "A record — points a hostname to an IPv4 (e.g. @ → your server IP).",
          "CNAME — aliases a hostname to another hostname (e.g. www → @).",
          "MX — directs email to your mail server.",
          "TXT — verification and SPF/DKIM records.",
        ],
      },
      {
        heading: "Propagation",
        body: [
          "DNS changes can take minutes up to 24h depending on TTL. Verify with: dig example.com or nslookup.",
        ],
      },
    ],
  },
  {
    slug: "add-wallet-funds",
    title: "How to add funds to your wallet",
    category: "billing",
    summary: "Use UPI, cards or net banking to add prepaid balance.",
    sections: [
      {
        heading: "Top up",
        body: [
          "Open Dashboard → Wallet → Add funds, enter the amount and pay via any enabled gateway (Razorpay supports UPI/cards/netbanking).",
          "Balance is credited as soon as the payment verifies — usually instantly.",
        ],
      },
      {
        heading: "Why use the wallet",
        body: [
          "Pay for orders and renewals without entering card details every time.",
          "Refunds and credits are returned to your wallet so you can reuse them immediately.",
        ],
      },
    ],
  },
  {
    slug: "invoices-and-renewals",
    title: "How invoices and renewals work",
    category: "billing",
    summary: "Understand billing cycles, due dates and auto-renewal.",
    sections: [
      {
        heading: "Billing cycle",
        body: [
          "Each subscription bills on the duration you picked — monthly, quarterly, half-yearly or yearly.",
          "A renewal invoice is created ~3 days before the due date and emailed to you.",
        ],
      },
      {
        heading: "Paying an invoice",
        body: [
          "Open Dashboard → Invoices → select the unpaid invoice → pay with wallet or any gateway.",
          "Download the GST-compliant PDF invoice anytime from the same page.",
        ],
      },
      {
        heading: "Overdue and suspension",
        body: [
          "If an invoice passes its due date you get one overdue reminder.",
          "Services can be suspended ~12h after the due date (when auto-suspend is enabled) and reactivate automatically on payment.",
        ],
      },
    ],
  },
  {
    slug: "ddos-protection",
    title: "How DDoS protection works",
    category: "security",
    summary: "Automatic mitigation included with every GHC plan.",
    sections: [
      {
        heading: "Always-on mitigation",
        body: [
          "Our upstream network (OVH backbone) includes automatic DDoS detection and mitigation on all IPs — no extra configuration needed.",
          "Attacks are absorbed at the network edge; your service stays reachable.",
        ],
      },
      {
        heading: "What you should still do",
        body: [
          "Keep your application updated and use application-layer protection (rate limiting, WAF) for L7 attacks.",
          "Never expose your origin IP behind a public service if you front it with a CDN.",
        ],
      },
    ],
  },
  {
    slug: "open-support-ticket",
    title: "How to open a support ticket",
    category: "general",
    summary: "Contact support through the client dashboard or email.",
    sections: [
      {
        heading: "From the dashboard",
        body: [
          "Dashboard → Support → New ticket. Pick the service, describe the issue and attach relevant logs or error messages.",
          "You will get email notifications for every reply, and the full thread stays in the dashboard.",
        ],
      },
      {
        heading: "Get faster help",
        body: [
          "Include the service name/IP, exact error text and what you already tried.",
          "For outages, also check the status page — known incidents are posted there.",
        ],
      },
      {
        heading: "Other channels",
        body: [
          "Email support@believoo.com or use the chat widget (bottom-right) for quick questions and WhatsApp when configured.",
        ],
      },
    ],
  },
  {
    slug: "ghc-sla",
    title: "GHC Service Level Agreement (SLA)",
    category: "general",
    summary: "Uptime commitment and service credit policy.",
    sections: [
      {
        heading: "Commitment",
        body: [
          "We target 99.9%+ monthly availability for VPS and dedicated services, backed by our upstream provider's SLA.",
          "The full legal text is on the /sla page.",
        ],
      },
      {
        heading: "Credits",
        body: [
          "If uptime falls below the commitment in a month, open a ticket referencing the SLA — verified downtime is credited to your wallet as a percentage of the monthly fee.",
          "Scheduled maintenance announced in advance does not count as downtime.",
        ],
      },
    ],
  },
  {
    slug: "currencies-and-gst",
    title: "Currencies and tax (GST)",
    category: "billing",
    summary: "Choose your preferred currency and understand how tax is applied at checkout.",
    sections: [
      {
        heading: "Display currency",
        body: [
          "Use the currency selector in the header to view prices in INR, USD, EUR and more. Conversion is indicative — billing happens in the invoice currency.",
        ],
      },
      {
        heading: "GST on invoices",
        body: [
          "Indian customers are charged GST as per law — the invoice shows CGST+SGST for intra-state supply or IGST for inter-state, with HSN code 9983.",
          "Add your GSTIN under Profile → Billing Details if you want it printed on invoices for input credit.",
        ],
      },
      {
        heading: "Billing address",
        body: [
          "Your billing state determines the tax type on invoices. Keep Profile → Billing Details accurate.",
        ],
      },
    ],
  },
  {
    slug: "upgrade-vps-and-add-disk",
    title: "How to upgrade your VPS and order additional disk",
    category: "servers",
    summary: "Upgrade plan, add extra disks and enable automated backup from the server page.",
    sections: [
      {
        heading: "Upgrade the VPS plan",
        body: [
          "Open Dashboard → My Servers → your VPS. If upgrades are available, a banner appears in the 'My offer' card — click Upgrade.",
          "Pick the target plan in the modal. The price shown already includes your billing margin and tax — confirm and pay via wallet or a payment gateway.",
          "Provisioning runs automatically after payment. The VPS may reboot during the upgrade task — watch the Recent tasks card.",
        ],
      },
      {
        heading: "Add an additional disk",
        body: [
          "Open the Additional disk tab on the server page. Sizes of 50, 100, 200 and 500 GB are available.",
          "Click Order on the size you want, complete payment, and the disk is provisioned by the provider — attach it inside the OS (e.g. lsblk → mkfs → mount).",
        ],
      },
      {
        heading: "Enable automated backup",
        body: [
          "The Automated backup tab shows the schedule and price. Click Enable, pay the prorated amount, and daily snapshots start automatically.",
          "Restore points appear in the same tab — use Restore to roll the VPS back to a listed checkpoint.",
        ],
      },
    ],
  },
  {
    slug: "vps-rescue-mode",
    title: "Using rescue mode on VPS and dedicated servers",
    category: "servers",
    summary: "Boot into a rescue environment to repair disks, reset passwords or recover files.",
    sections: [
      {
        heading: "Enter rescue mode",
        body: [
          "VPS: open the Management tab → 'Boot rescue mode'. The VPS is switched to network rescue and rebooted automatically.",
          "Dedicated: Management tab → 'Rescue mode' sets the rescue boot option and reboots the server.",
        ],
      },
      {
        heading: "Work inside rescue",
        body: [
          "Rescue credentials are emailed to your account address once the rescue system boots (1-2 minutes).",
          "Mount your disk, repair fstab/fsck issues, reset the root password with chroot, or copy off data before a reinstall.",
        ],
      },
      {
        heading: "Exit rescue",
        body: [
          "VPS: click 'Exit rescue mode' — netboot is set back to local disk and the VPS reboots.",
          "Dedicated: click 'Boot from disk' to restore the normal harddisk boot option, then reboot.",
        ],
      },
    ],
  },
  {
    slug: "ssh-keys-reinstall",
    title: "Manage SSH keys for OS reinstalls",
    category: "servers",
    summary: "Store public keys on your account and select them when reinstalling a server.",
    sections: [
      {
        heading: "Add a key",
        body: [
          "Open Dashboard → Security → SSH keys. Paste the full public key line (ssh-ed25519 AAAA… or ssh-rsa AAAA…) with a name.",
          "Keys are stored at the provider so reinstalls can inject them directly — no need to re-add later.",
        ],
      },
      {
        heading: "Use a key during reinstall",
        body: [
          "Management tab → OS reinstallation → pick your saved key in the SSH key dropdown before confirming.",
          "After reinstall finishes, log in as the default user/root with the matching private key — no password needed.",
        ],
      },
      {
        heading: "Remove a key",
        body: [
          "Click the trash icon next to a key. Removing it does not affect servers already installed — only future reinstalls.",
        ],
      },
    ],
  },
  {
    slug: "auto-renew-and-cancel",
    title: "Auto-renewal, renew-now and cancelling a service",
    category: "billing",
    summary: "Control automatic renewal, renew early, or terminate a service at its expiry date.",
    sections: [
      {
        heading: "Automatic renewal",
        body: [
          "Management tab → Renewal → toggle 'Automatic renewal'. Enabled means the service renews each billing cycle at the provider.",
          "Disabling auto-renew schedules the service to expire at the end of the paid period.",
        ],
      },
      {
        heading: "Renew now",
        body: [
          "When a renewal is due you can pay immediately: the banner on the server page offers 'Pay from wallet' or 'Pay online' via any gateway.",
          "Bulk renewal is available from Dashboard → Servers — select multiple services and renew them together.",
        ],
      },
      {
        heading: "Cancel a service",
        body: [
          "Management tab → Cancel service → type CANCEL to confirm. The service terminates at its expiry date — not immediately.",
          "Download all data and snapshots beforehand: everything is deleted permanently at termination.",
        ],
      },
    ],
  },
  {
    slug: "ip-geolocation-change",
    title: "Change your IP geolocation",
    category: "network",
    summary: "Register your VPS IP geolocation in an available country for geo-targeted services.",
    sections: [
      {
        heading: "When it helps",
        body: [
          "Geo-IP databases map your address to a country. Changing the registered geolocation helps with content licensing, regional SEO and CDN targeting.",
        ],
      },
      {
        heading: "How to change it",
        body: [
          "Open the Management tab → IP geolocation. Select the IP and the target country from the available list, then Update.",
          "Propagation to public geo databases can take a few days — the provider's registry updates immediately.",
        ],
      },
      {
        heading: "Note",
        body: [
          "This changes registry data only — it does not move traffic physically. Latency depends on the real datacenter region.",
        ],
      },
    ],
  },
];
