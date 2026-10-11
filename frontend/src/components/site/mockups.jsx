import { Phone, Truck, PackageCheck, Inbox, Mic } from "lucide-react";
import { StatusTag } from "./ui";
import { MODULES } from "../../content/site";

export const MockupCard = ({ title, right, children, className = "", testId }) => (
  <div data-testid={testId} className={`overflow-hidden rounded-xl border bg-card shadow-sm ${className}`}>
    <div className="flex items-center gap-1.5 border-b px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" aria-hidden="true" />
      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" aria-hidden="true" />
      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" aria-hidden="true" />
      <span className="ml-2 truncate text-xs font-medium text-muted-foreground">{title}</span>
      {right && <span className="ml-auto shrink-0">{right}</span>}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const KPIS = [
  { label: "On-time", value: "96%" },
  { label: "Active trucks", value: "42" },
  { label: "Exceptions", value: "3" },
  { label: "Approvals", value: "2" },
];

const EXCEPTIONS = [
  { id: "LR-8841", text: "POD uploaded, invoice drafted", tag: "ai" },
  { id: "LR-8836", text: "Detention claim Rs 4,500 at Bhiwandi", tag: "approval" },
  { id: "LR-8829", text: "Driver unreachable for 3 hours", tag: "human" },
];

const FEED = [
  "Voice AI confirmed driver for LR-8844 (Hindi)",
  "Email order parsed: 18 pallets, Mumbai to Delhi",
  "Return load matched for empty leg to Mumbai",
];

export const ControlTowerMockup = ({ testId = "control-tower-mockup" }) => (
  <MockupCard title="Control Tower · Live" right={<StatusTag variant="ai" />} testId={testId}>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {KPIS.map((k) => (
        <div key={k.label} className="rounded-lg border bg-surface p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{k.label}</p>
          <p className="font-heading text-lg font-bold text-heading">{k.value}</p>
        </div>
      ))}
    </div>
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Exceptions and approvals
        </p>
        <ul className="space-y-2">
          {EXCEPTIONS.map((e) => (
            <li key={e.id} className="rounded-lg bg-surface p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-heading">{e.id}</span>
                <StatusTag variant={e.tag} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{e.text}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border p-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Live map</p>
          <svg viewBox="0 0 220 90" className="w-full text-muted-foreground" role="img" aria-label="Route map from Mumbai to Delhi">
            <path d="M25 70 C 80 75, 120 55, 195 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="25" cy="70" r="4" className="fill-heading" stroke="none" />
            <circle cx="195" cy="22" r="4" className="fill-heading" stroke="none" />
            <circle cx="118" cy="52" r="5" className="fill-status-ai" stroke="none" />
            <text x="14" y="86" fontSize="9" fill="currentColor">Mumbai</text>
            <text x="180" y="14" fontSize="9" fill="currentColor">Delhi</text>
            <text x="104" y="44" fontSize="8" fill="currentColor">LR-8839</text>
          </svg>
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Agent activity</p>
          <ul className="space-y-1.5">
            {FEED.map((f) => (
              <li key={f} className="flex gap-1.5 text-xs text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-status-ai" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
    <p className="mt-2 text-[10px] text-muted-foreground">Placeholder data.</p>
  </MockupCard>
);

export const VoiceCallMockup = ({ testId = "voice-call-mockup" }) => (
  <MockupCard title="Voice AI · Live call · Gujarati" right={<StatusTag variant="ai" />} testId={testId}>
    <div className="flex items-center gap-3 rounded-lg border bg-surface p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Phone className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-heading">+91 98XXX XX210 · Driver, LR-8844</p>
        <p className="text-xs text-muted-foreground">00:42 · Answered by Voice AI</p>
      </div>
      <span className="ml-auto flex items-end gap-0.5" aria-hidden="true">
        {[8, 14, 6, 16, 10, 14, 7].map((h, i) => (
          <span key={i} className="w-1 rounded-full bg-status-ai/70" style={{ height: `${h}px` }} />
        ))}
      </span>
    </div>
    <div className="mt-3 space-y-2.5">
      <div className="max-w-[85%] rounded-lg border bg-surface p-3">
        <p className="text-sm text-foreground">"सर, ट्रक नरेला कब पहुंचेगा? लोडिंग की टीम इंतज़ार कर रही है।"</p>
        <p className="mt-1 text-xs text-muted-foreground">Sir, when will the truck reach Narela? The loading team is waiting.</p>
      </div>
      <div className="ml-auto max-w-[85%] rounded-lg border border-status-ai/30 bg-status-ai/10 p-3">
        <p className="text-sm text-foreground">"ट्रक शाम 6 बजे तक पहुंच जाएगा। मैंने ड्राइवर से पुष्टि कर ली है।"</p>
        <p className="mt-1 text-xs text-muted-foreground">The truck will arrive by 6 PM. I have confirmed with the driver.</p>
      </div>
    </div>
    <p className="mt-2 text-[10px] text-muted-foreground">Illustrative transcript.</p>
  </MockupCard>
);

const NODE_POS = [
  { left: "50%", top: "14.3%" },
  { left: "78.7%", top: "27.7%" },
  { left: "85.7%", top: "58%" },
  { left: "65.9%", top: "82.2%" },
  { left: "34.1%", top: "82.2%" },
  { left: "14.3%", top: "58%" },
  { left: "21.4%", top: "27.7%" },
];

export const PlatformDiagram = ({ testId = "platform-diagram" }) => (
  <div data-testid={testId}>
    <div className="relative mx-auto hidden aspect-[600/420] w-full max-w-xl md:block">
      <svg viewBox="0 0 600 420" className="absolute inset-0 h-full w-full text-border" aria-hidden="true">
        {NODE_POS.map((p, i) => (
          <line
            key={i}
            x1="300"
            y1="210"
            x2={(parseFloat(p.left) / 100) * 600}
            y2={(parseFloat(p.top) / 100) * 420}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
        ))}
      </svg>
      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-primary bg-card text-center shadow-sm">
        <span className="font-heading text-sm font-bold text-heading">Haulage AI</span>
        <span className="text-[10px] text-muted-foreground">AI agents core</span>
      </div>
      {MODULES.map((m, i) => (
        <div
          key={m.slug}
          className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-xl border bg-card p-2 text-center shadow-sm"
          style={{ left: NODE_POS[i].left, top: NODE_POS[i].top }}
        >
          <m.icon className="h-4 w-4 text-heading" aria-hidden="true" />
          <span className="text-[10px] font-semibold leading-tight text-heading">{m.name}</span>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-3 md:hidden">
      <div className="col-span-2 flex items-center justify-center rounded-xl border-2 border-primary bg-card p-3 text-center font-heading text-sm font-bold text-heading">
        Haulage AI
      </div>
      {MODULES.map((m) => (
        <div key={m.slug} className="flex items-center gap-2 rounded-xl border bg-card p-3">
          <m.icon className="h-4 w-4 shrink-0 text-heading" aria-hidden="true" />
          <span className="text-xs font-semibold text-heading">{m.name}</span>
        </div>
      ))}
    </div>
  </div>
);

export const ExceptionCardMockup = ({ testId = "exception-card-mockup" }) => (
  <MockupCard title="Exception · LR-8836" right={<StatusTag variant="approval" />} testId={testId}>
    <p className="text-sm font-semibold text-heading">Detention claim above your limit</p>
    <p className="mt-1.5 text-sm text-muted-foreground">
      Receiver at Bhiwandi claims 6 hours of detention, Rs 4,500. Your auto-approve limit is Rs 2,000.
    </p>
    <div className="mt-3 rounded-lg border bg-surface p-3 text-xs text-muted-foreground">
      Context attached: GPS wait-time log, gate-in photo, WhatsApp thread with receiver.
    </div>
    <div className="mt-4 flex gap-2">
      <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Approve Rs 4,500</span>
      <span className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-heading">Counter at Rs 2,500</span>
    </div>
  </MockupCard>
);

export const EmailToOrderThumb = () => (
  <MockupCard title="Inbox → TMS" testId="thumb-email-to-order">
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border bg-surface p-2.5">
        <Inbox className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-heading">Order: 18 pallets, Mumbai → Delhi</p>
          <p className="text-[10px] text-muted-foreground">purchase-order.pdf attached</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-status-ai/30 bg-status-ai/10 p-2.5">
        <PackageCheck className="h-4 w-4 shrink-0 text-status-ai" aria-hidden="true" />
        <p className="text-xs font-medium text-heading">TMS entry created · LR-8844</p>
      </div>
    </div>
  </MockupCard>
);

export const VoiceThumb = () => (
  <MockupCard title="Voice AI" testId="thumb-voice-call">
    <div className="flex items-center gap-2.5 rounded-lg border bg-surface p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Mic className="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-semibold text-heading">"ट्रक शाम 6 बजे पहुंचेगा।"</p>
        <p className="text-[10px] text-muted-foreground">Status call answered in Hindi</p>
      </div>
    </div>
  </MockupCard>
);

export const MatchThumb = () => (
  <MockupCard title="Capacity matching" testId="thumb-truck-match">
    <div className="rounded-lg border bg-surface p-3">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-heading" aria-hidden="true" />
        <p className="text-xs font-semibold text-heading">32-ft MXL · Delhi → Mumbai</p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full w-[86%] rounded-full bg-status-ai" />
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">Part-load fill: spare 4 pallets matched</p>
    </div>
  </MockupCard>
);

export const InboxThumb = () => (
  <MockupCard title="Exception inbox" testId="thumb-exception-inbox">
    <ul className="space-y-2">
      {[
        { t: "Rate above limit, needs approval", tag: "approval" },
        { t: "POD received, invoice sent", tag: "ai" },
        { t: "Vehicle breakdown on NH48", tag: "human" },
      ].map((r) => (
        <li key={r.t} className="flex items-center justify-between gap-2 rounded-lg border bg-surface p-2">
          <span className="text-xs text-muted-foreground">{r.t}</span>
          <StatusTag variant={r.tag} />
        </li>
      ))}
    </ul>
  </MockupCard>
);
