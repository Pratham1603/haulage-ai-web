import {
  Inbox,
  Phone,
  Truck,
  ScanLine,
  FileCheck2,
  Radar,
  Undo2,
  MailWarning,
  PhoneCall,
  RotateCcw,
  ReceiptText,
} from "lucide-react";

export const MODULES = [
  {
    slug: "back-office-automation",
    name: "Back-Office Automation",
    icon: Inbox,
    line: "Emails, LR copies and PODs become clean TMS entries on their own.",
    bullets: ["Email-to-TMS entry", "Auto-tracking and proactive updates", "Exception-only escalation"],
  },
  {
    slug: "voice-ai",
    name: "Voice AI",
    icon: Phone,
    line: "Answers and makes calls in Hindi and Gujarati, around the clock.",
    bullets: ["Hindi and Gujarati calls", "Status queries", "Rate negotiation within your limits", "Booking"],
  },
  {
    slug: "freight-capacity-matching",
    name: "Freight and Capacity Matching",
    icon: Truck,
    line: "Matches loads to trucks and fills spare pallet space.",
    bullets: ["Spot loads", "Load-to-truck matching", "Part-load fill"],
  },
  {
    slug: "warehouse-vision",
    name: "Warehouse Vision",
    icon: ScanLine,
    line: "Camera checks catch labeling and packing errors before dispatch.",
    bullets: ["Tablet and camera checks", "Labeling, packing, palletization", "Photo proof on every dispatch"],
  },
  {
    slug: "compliance-finance",
    name: "Compliance and Finance",
    icon: FileCheck2,
    line: "Audits every invoice against the retailer manual before it goes out.",
    bullets: ["Retailer-manual checks", "Invoice audit and billing errors", "Collections follow-up"],
  },
  {
    slug: "control-tower",
    name: "Control Tower",
    icon: Radar,
    line: "One screen to plan, dispatch, track and adjust the whole operation.",
    bullets: ["Plan, dispatch, track, adjust", "Disruption handling", "Routing"],
  },
  {
    slug: "reverse-logistics",
    name: "Reverse Logistics",
    icon: Undo2,
    line: "Returns, claims and return-leg matching without the paperwork.",
    bullets: ["Returns coordination", "Claim recovery", "Return-leg matching"],
  },
];

export const moduleBySlug = (slug) => MODULES.find((m) => m.slug === slug);

export const ROLES = [
  {
    slug: "transporters-fleet-owners",
    name: "Transporters and Fleet Owners",
    tab: "Fleet Owners",
    pain: "Trucks idle in Bhiwandi while rates are negotiated over phone calls.",
    modules: ["freight-capacity-matching", "voice-ai", "back-office-automation"],
  },
  {
    slug: "shippers-brands",
    name: "Shippers and Brands",
    tab: "Shippers and Brands",
    pain: "Status chasing and retailer chargebacks eat the operations week.",
    modules: ["control-tower", "compliance-finance", "back-office-automation"],
  },
  {
    slug: "3pls-warehouses",
    name: "3PLs and Warehouses",
    tab: "3PLs and Warehouses",
    pain: "Dispatch errors are found after the truck has already left Narela.",
    modules: ["warehouse-vision", "control-tower", "reverse-logistics"],
  },
  {
    slug: "finance-teams",
    name: "Finance Teams",
    tab: "Finance Teams",
    pain: "Invoices leak money through billing errors and slow collections.",
    modules: ["compliance-finance", "back-office-automation", "control-tower"],
  },
];

export const NAV_GROUPS = [
  {
    label: "Product",
    children: [
      { label: "Overview", to: "/product" },
      ...MODULES.map((m) => ({ label: m.name, to: `/product/${m.slug}` })),
    ],
  },
  {
    label: "Solutions",
    children: ROLES.map((r) => ({ label: r.name, to: `/solutions/${r.slug}` })),
  },
  { label: "How It Works", to: "/how-it-works" },
  { label: "Case Study", to: "/case-study" },
  { label: "Pricing", to: "/pricing" },
  {
    label: "Resources",
    children: [
      { label: "Blog", to: "/resources/blog" },
      { label: "ROI Calculator", to: "/resources/roi-calculator" },
      { label: "Guides", to: "/resources/guides" },
    ],
  },
];

export const FOOTER_COLS = [
  {
    title: "Product",
    links: [
      { label: "Overview", to: "/product" },
      ...MODULES.map((m) => ({ label: m.name, to: `/product/${m.slug}` })),
      { label: "Integrations", to: "/integrations" },
      { label: "Trust and Security", to: "/trust-security" },
    ],
  },
  {
    title: "Solutions",
    links: ROLES.map((r) => ({ label: r.name, to: `/solutions/${r.slug}` })),
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Resources", to: "/resources" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/legal/privacy" },
      { label: "Terms of Service", to: "/legal/terms" },
    ],
  },
];

export const PROBLEMS = [
  {
    icon: MailWarning,
    title: "Manual data entry from emails",
    text: "Orders arrive as emails and attachments. Someone re-keys every one into the TMS.",
  },
  {
    icon: PhoneCall,
    title: "Endless phone calls for status and rates",
    text: "Where is the truck? What is the rate to Delhi? The same calls, every day.",
  },
  {
    icon: RotateCcw,
    title: "Empty return trips",
    text: "Trucks come back empty from Mumbai to Delhi because matching happens too late.",
  },
  {
    icon: ReceiptText,
    title: "Chargebacks and billing errors",
    text: "Retailer manuals are long. Mistakes in labeling or invoicing come back as deductions.",
  },
];

export const STEPS = [
  { title: "Plan", line: "Orders are read, matched and scheduled." },
  { title: "Dispatch", line: "Trucks confirmed, documents checked." },
  { title: "Track", line: "Status updates flow without phone calls." },
  { title: "Adjust", line: "Delays and returns handled as exceptions." },
];

export const HOME_FAQS = [
  {
    q: "Do I need to replace my TMS?",
    a: "No. Haulage AI sits on top of your current TMS, email and WhatsApp. It reads from them and writes back to them.",
  },
  {
    q: "Can I start with one module?",
    a: "Yes. Most teams start with Back-Office Automation or Voice AI, prove the hours saved, then add modules.",
  },
  {
    q: "Which languages and channels are supported?",
    a: "Voice calls in Hindi, Gujarati and English. Messages over WhatsApp and SMS. Documents over email.",
  },
  {
    q: "How long does onboarding take?",
    a: "Most teams go live in 2 to 4 weeks, starting with one lane or one warehouse. (Placeholder timeline.)",
  },
  {
    q: "How is my data protected?",
    a: "Data is encrypted in transit and at rest, access is role-based, and every AI action is logged. See the Trust and Security page.",
  },
  {
    q: "What does my team still do?",
    a: "Your team handles exceptions and approvals. Anything above your limits on money or risk comes to a human with full context.",
  },
];

export const PRODUCT_FAQS = [
  {
    q: "Do I need to replace my TMS?",
    a: "No. The platform connects to your existing TMS, email and WhatsApp and works on top of them.",
  },
  {
    q: "Can I start with one module?",
    a: "Yes. Each module stands alone. Start where the pain is highest and add modules over time.",
  },
  {
    q: "How long does onboarding take?",
    a: "Typically 2 to 4 weeks for the first module, including connecting your email, TMS and GPS feeds. (Placeholder timeline.)",
  },
  {
    q: "Which languages and channels are supported?",
    a: "Voice in Hindi, Gujarati and English. WhatsApp, SMS and email for written updates.",
  },
  {
    q: "How is my data protected?",
    a: "Encryption in transit and at rest, role-based access, and a full audit trail of every AI action. Details on the Trust and Security page.",
  },
];

export const CONTACT_FAQS = [
  {
    q: "Does the demo cost anything?",
    a: "No. The 30-minute walkthrough is free and there is no commitment.",
  },
  {
    q: "Do I need a TMS or API to get started?",
    a: "No. For the demo we use a sample email or lane you share. Integrations come later, during onboarding.",
  },
  {
    q: "How long until we can go live?",
    a: "Most teams go live in 2 to 4 weeks after the demo, starting with one module. (Placeholder timeline.)",
  },
  {
    q: "How do you handle our data security?",
    a: "Data is encrypted in transit and at rest, access is role-based, and you can ask us to delete your demo data at any time.",
  },
  {
    q: "Can the demo be held in Hindi or Gujarati?",
    a: "Yes. Pick your preferred language in the form and the walkthrough, including the Voice AI demo, will be in that language.",
  },
];

export const METRICS = [
  { value: "30+", label: "hours of coordination saved per week" },
  { value: "18%", label: "empty-run reduction" },
  { value: "Rs 4.2L", label: "chargebacks prevented per year" },
  { value: "9 days", label: "faster invoice collection" },
];

export const TESTIMONIALS = [
  {
    quote:
      "We stopped re-keying orders from email in the first week. My dispatchers now only touch the shipments that actually need them.",
    name: "Placeholder Name",
    role: "Fleet Owner, Bhiwandi (Placeholder)",
  },
  {
    quote:
      "The Hindi voice calls alone saved us a full-time role. Drivers answer the AI because it speaks their language.",
    name: "Placeholder Name",
    role: "Logistics Head, FMCG Shipper, Mumbai (Placeholder)",
  },
];
