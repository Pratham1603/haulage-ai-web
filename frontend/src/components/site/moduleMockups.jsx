import { ArrowRight, Phone, Mail, FileText, CheckCircle2, XCircle, AlertTriangle, Truck, MapPin, Camera, RotateCcw } from "lucide-react";
import { MockupCard, ControlTowerMockup } from "./mockups";
import { StatusTag } from "./ui";

/* ---- small primitives ---- */
const Row = ({ children, className = "" }) => (
  <div className={`flex items-center justify-between gap-2 rounded-lg border bg-surface px-3 py-2 ${className}`}>{children}</div>
);
const Pill = ({ children, tone = "neutral" }) => {
  const tones = {
    neutral: "border bg-card text-muted-foreground",
    good: "border-status-ai/40 bg-status-ai/10 text-status-ai",
    warn: "border-status-approval/40 bg-status-approval/10 text-status-approval",
    bad: "border-status-human/40 bg-status-human/10 text-status-human",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tones[tone]}`}>{children}</span>;
};
const Conf = ({ pct, tone }) => (
  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
    <span className={`h-1.5 w-1.5 rounded-full ${tone === "good" ? "bg-status-ai" : tone === "warn" ? "bg-status-approval" : "bg-status-human"}`} />
    {pct}%
  </span>
);
const Field = ({ k, v, conf }) => (
  <div className="flex items-center justify-between gap-2 rounded-md bg-surface px-2.5 py-1.5">
    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</span>
    <span className="flex items-center gap-2 text-xs font-medium text-heading">{v}{conf && <Conf pct={conf[0]} tone={conf[1]} />}</span>
  </div>
);
const Btn = ({ children, primary = false }) => (
  <span className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${primary ? "bg-primary text-primary-foreground" : "border text-heading"}`}>{children}</span>
);
const MiniTable = ({ head, rows, highlight = [] }) => (
  <div className="overflow-hidden rounded-lg border text-xs">
    <div className="grid bg-surface px-3 py-2 font-semibold text-heading" style={{ gridTemplateColumns: `repeat(${head.length}, 1fr)` }}>
      {head.map((h) => <span key={h}>{h}</span>)}
    </div>
    {rows.map((r, i) => (
      <div key={i} className={`grid px-3 py-2 ${highlight.includes(i) ? "bg-status-approval/10" : ""}`} style={{ gridTemplateColumns: `repeat(${head.length}, 1fr)` }}>
        {r.map((c, j) => <span key={j} className={j === 0 ? "font-medium text-foreground" : "text-muted-foreground"}>{c}</span>)}
      </div>
    ))}
  </div>
);
const Hl = ({ children }) => <mark className="rounded bg-status-ai/15 px-0.5 text-heading">{children}</mark>;

/* ---- Back-Office Automation ---- */
const BoaHero = () => (
  <MockupCard title="Email → TMS" testId="mockup-boa-hero">
    <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
      <div className="rounded-lg border bg-surface p-3">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><Mail className="h-3 w-3" /> Email · 9:12 AM</p>
        <p className="mt-2 text-xs font-semibold text-heading">Order: 18 pallets to Delhi</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Please book pickup from Bhiwandi warehouse, Friday 10 AM. PO attached.</p>
        <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground"><FileText className="h-3 w-3" /> purchase-order.pdf</p>
      </div>
      <ArrowRight className="h-4 w-4 self-center text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1.5 rounded-lg border p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">TMS order · LR-8844</p>
        <Field k="Customer" v="Acme Foods" />
        <Field k="Route" v="Bhiwandi → Delhi" />
        <Field k="Load" v="18 pallets" />
        <div className="pt-1"><StatusTag variant="ai" /></div>
      </div>
    </div>
  </MockupCard>
);

const BoaExtract = () => (
  <MockupCard title="Field extraction" testId="mockup-boa-extract">
    <p className="rounded-lg border bg-surface p-3 text-[11px] leading-relaxed text-muted-foreground">
      Hi, please book <Hl>18 pallets</Hl>, <Hl>4.2 tonnes</Hl>, pickup <Hl>Bhiwandi WH-3</Hl> on <Hl>Friday 10 AM-12 PM</Hl>, delivery <Hl>Acme Foods, Okhla Delhi</Hl>.
    </p>
    <div className="mt-2.5 grid grid-cols-2 gap-1.5">
      <Field k="Customer" v="Acme Foods" conf={[99, "good"]} />
      <Field k="Pickup" v="Bhiwandi WH-3" conf={[98, "good"]} />
      <Field k="Drop" v="Okhla, Delhi" conf={[96, "good"]} />
      <Field k="Pallets" v="18" conf={[99, "good"]} />
      <Field k="Weight" v="4.2 t" conf={[94, "good"]} />
      <Field k="Window" v="Fri 10-12" conf={[71, "warn"]} />
    </div>
  </MockupCard>
);

const BoaReview = () => (
  <MockupCard title="Confidence lanes" testId="mockup-boa-review">
    <div className="space-y-2">
      <Row><span className="text-xs text-foreground">LR-8844 · all fields above 90%</span><StatusTag variant="ai" /></Row>
      <Row><span className="text-xs text-foreground">LR-8845 · pickup window unclear — confirm Fri 10 AM?</span><StatusTag variant="approval" /></Row>
      <Row><span className="text-xs text-foreground">LR-8846 · two customers with same name — which one?</span><StatusTag variant="human" /></Row>
    </div>
  </MockupCard>
);

const BoaTracking = () => (
  <MockupCard title="LR-8844 · Timeline" testId="mockup-boa-tracking">
    <ol className="space-y-2.5">
      {[
        { t: "Loaded, Bhiwandi · Fri 11:40 AM", m: "WhatsApp update sent to customer", done: true },
        { t: "In transit · crossed Vadodara", m: "Auto-update: on schedule", done: true },
        { t: "Delayed · 2 hrs near Udaipur", m: "Auto-update sent with new ETA", done: true, warn: true },
        { t: "Delivered · Mon 4:15 PM", m: "POD shared with customer", done: false },
      ].map((s) => (
        <li key={s.t} className="flex gap-2.5">
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${s.warn ? "bg-status-approval" : s.done ? "bg-status-ai" : "bg-border"}`} aria-hidden="true" />
          <div>
            <p className="text-xs font-medium text-heading">{s.t}</p>
            <p className="text-[10px] text-muted-foreground">{s.m}</p>
          </div>
        </li>
      ))}
    </ol>
  </MockupCard>
);

const BoaExceptions = () => (
  <MockupCard title="Exception inbox" testId="mockup-boa-exceptions">
    <div className="space-y-2">
      {[
        { p: "Customer changed drop to Gurugram", tried: "AI re-quoted rate, needs your OK", tag: "approval" },
        { p: "Weight mismatch: 4.2 t vs 5.8 t on PO", tried: "Asked customer to confirm by email", tag: "human" },
        { p: "Duplicate order from two email threads", tried: "Merged, kept earliest PO", tag: "ai" },
      ].map((e) => (
        <div key={e.p} className="rounded-lg border bg-surface p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-heading">{e.p}</p>
            <StatusTag variant={e.tag} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">{e.tried}</p>
          <div className="mt-2 flex gap-1.5"><Btn primary>Approve</Btn><Btn>Edit</Btn><Btn>Take over</Btn></div>
        </div>
      ))}
    </div>
  </MockupCard>
);

/* ---- Voice AI ---- */
const VoiceHero = () => (
  <MockupCard title="Live call · Hindi" right={<StatusTag variant="ai" />} testId="mockup-voice-hero">
    <div className="flex items-center gap-2.5 rounded-lg border bg-surface p-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Phone className="h-4 w-4" /></span>
      <div><p className="text-xs font-semibold text-heading">+91 98XXX XX210 · Carrier, Ahmedabad</p><p className="text-[10px] text-muted-foreground">01:12 · Negotiating Mumbai–Delhi rate</p></div>
      <span className="ml-auto flex items-end gap-0.5" aria-hidden="true">{[8, 14, 6, 16, 10, 14, 7, 12].map((h, i) => <span key={i} className="w-1 rounded-full bg-status-ai/70" style={{ height: `${h}px` }} />)}</span>
    </div>
    <div className="mt-2.5 grid grid-cols-2 gap-2">
      <div className="rounded-lg border bg-surface p-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Hindi transcript</p>
        <p className="mt-1 text-[11px] text-foreground">"क्या ₹74,500 भाड़ा ठीक रहेगा?"</p>
      </div>
      <div className="rounded-lg border p-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">English</p>
        <p className="mt-1 text-[11px] text-foreground">"Would a freight rate of Rs 74,500 work?"</p>
      </div>
    </div>
  </MockupCard>
);

const VoiceStatus = () => (
  <MockupCard title="Incoming status call" testId="mockup-voice-status">
    <Row><span className="text-xs text-foreground">Customer: "Where is my truck?"</span><Pill>24/7</Pill></Row>
    <div className="mt-2 rounded-lg border border-status-ai/30 bg-status-ai/10 p-2.5">
      <p className="text-xs font-medium text-heading">AI: "LR-8839 is 40 km from Delhi, on schedule for 6 PM."</p>
      <p className="mt-1 text-[10px] text-muted-foreground">Source: live GPS · updated 2 min ago</p>
    </div>
    <p className="mt-2 text-[10px] text-muted-foreground">WhatsApp tracking link sent after the call.</p>
  </MockupCard>
);

const VoiceCheckins = () => (
  <MockupCard title="Scheduled check-ins" testId="mockup-voice-checkins">
    <ul className="space-y-2">
      {[
        { t: "09:30 · Pickup confirmation · Ramesh (driver)", tag: "ai", note: "Confirmed, loading started" },
        { t: "13:00 · Mid-route · Suresh (driver)", tag: "ai", note: "On time, crossed Vapi" },
        { t: "15:30 · Delay reason · Mahesh (carrier)", tag: "human", note: "Unreachable 3 attempts" },
        { t: "18:00 · Delivery confirmation · consignee", tag: "ai", note: "Slot confirmed 6 PM" },
      ].map((c) => (
        <li key={c.t} className="rounded-lg border bg-surface p-2.5">
          <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-heading">{c.t}</p><StatusTag variant={c.tag} /></div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{c.note}</p>
        </li>
      ))}
    </ul>
  </MockupCard>
);

const VoiceNegotiation = () => (
  <MockupCard title="Negotiation · Mumbai → Delhi" testId="mockup-voice-negotiation">
    <div className="flex gap-2 text-[10px]">
      <span className="rounded-lg border bg-surface px-2.5 py-1.5">Benchmark <b className="text-heading">Rs 78,000</b></span>
      <span className="rounded-lg border bg-surface px-2.5 py-1.5">Ceiling <b className="text-heading">Rs 80,000</b></span>
    </div>
    <ol className="mt-2.5 space-y-1.5 text-[11px]">
      <li className="flex justify-between rounded-md bg-surface px-2.5 py-1.5"><span className="text-muted-foreground">Carrier opens</span><span className="font-medium text-heading">Rs 82,000</span></li>
      <li className="flex justify-between rounded-md bg-surface px-2.5 py-1.5"><span className="text-muted-foreground">AI counters</span><span className="font-medium text-heading">Rs 72,000</span></li>
      <li className="flex justify-between rounded-md bg-surface px-2.5 py-1.5"><span className="text-muted-foreground">Carrier offers</span><span className="font-medium text-heading">Rs 74,500</span></li>
    </ol>
    <div className="mt-2.5 rounded-lg border border-status-approval/40 bg-status-approval/10 p-2.5">
      <div className="flex items-center justify-between"><p className="text-xs font-medium text-heading">Rate Rs 74,500 vs benchmark Rs 78,000</p><StatusTag variant="approval" /></div>
      <div className="mt-2 flex gap-1.5"><Btn primary>Approve</Btn><Btn>Counter</Btn><Btn>Take over</Btn></div>
    </div>
  </MockupCard>
);

const VoiceBooking = () => (
  <MockupCard title="Booking confirmed" testId="mockup-voice-booking">
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-lg border bg-surface p-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">WhatsApp to carrier</p>
        <p className="mt-1 text-[11px] text-foreground">Booking confirmed: MH-04-XX-1234, pickup Fri 10 AM, Bhiwandi WH-3.</p>
        <p className="mt-1 text-[10px] text-muted-foreground">Docs: LR copy, e-way bill, driver ID</p>
      </div>
      <div className="space-y-1.5 rounded-lg border p-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">TMS booking</p>
        <Field k="Truck" v="MH-04-XX-1234" />
        <Field k="Rate" v="Rs 74,500" />
        <Field k="Slot" v="Fri 10 AM" />
        <StatusTag variant="ai" />
      </div>
    </div>
  </MockupCard>
);

/* ---- Freight & Capacity Matching ---- */
const MatchHero = () => (
  <MockupCard title="Matching screen" right={<StatusTag variant="ai" />} testId="mockup-match-hero">
    <div className="grid grid-cols-2 gap-2">
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Open loads</p>
        <div className="space-y-1.5">
          {["Mumbai → Delhi · 18 plt", "Bhiwandi → Jaipur · 4 plt", "Narela → Pune · 9 plt"].map((l) => (
            <p key={l} className="rounded-lg border bg-surface px-2.5 py-2 text-[11px] font-medium text-heading">{l}</p>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ranked trucks</p>
        <div className="space-y-1.5">
          {[["MH-04-XX-1234 · 32 ft", "96"], ["GJ-01-YY-5678 · 32 ft", "88"], ["MH-46-ZZ-9012 · 24 ft", "71"]].map(([t, s], i) => (
            <div key={t} className={`flex items-center justify-between rounded-lg border px-2.5 py-2 ${i === 0 ? "border-status-ai/40 bg-status-ai/10" : "bg-surface"}`}>
              <span className="text-[11px] font-medium text-heading">{t}</span><Pill tone={i === 0 ? "good" : "neutral"}>{s}</Pill>
            </div>
          ))}
        </div>
      </div>
    </div>
  </MockupCard>
);

const MatchSpot = () => (
  <MockupCard title="Spot loads · scored" testId="mockup-match-spot">
    <div className="space-y-1.5">
      {[
        { l: "Mumbai → Delhi · FMCG · Fri 10 AM · Rs 76,000", s: "94 · high margin", hot: true },
        { l: "Bhiwandi → Jaipur · Pharma · Fri 2 PM · Rs 31,000", s: "88 · fills return leg", hot: true },
        { l: "Pune → Indore · Auto parts · Sat · Rs 28,500", s: "61 · off corridor", hot: false },
      ].map((x) => (
        <div key={x.l} className={`rounded-lg border px-2.5 py-2 ${x.hot ? "border-status-ai/40 bg-status-ai/10" : "bg-surface opacity-70"}`}>
          <p className="text-[11px] font-medium text-heading">{x.l}</p>
          <p className="text-[10px] text-muted-foreground">Score {x.s}</p>
        </div>
      ))}
    </div>
  </MockupCard>
);

const MatchTrucks = () => (
  <MockupCard title="Load LR-8847 · 3 suggestions" testId="mockup-match-trucks">
    <div className="space-y-2">
      {[
        { t: "MH-04-XX-1234", why: "12 km away, free 4 PM, 32 ft, est. Rs 74,800", best: true },
        { t: "GJ-01-YY-5678", why: "26 km away, free 6 PM, 32 ft, est. Rs 75,600", best: false },
        { t: "MH-46-ZZ-9012", why: "9 km away, 24 ft — 4 pallets would spill", best: false },
      ].map((x) => (
        <div key={x.t} className={`rounded-lg border p-2.5 ${x.best ? "border-status-ai/40 bg-status-ai/10" : "bg-surface"}`}>
          <div className="flex items-center justify-between"><p className="text-xs font-semibold text-heading">{x.t}</p>{x.best && <Pill tone="good">Best fit</Pill>}</div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Why: {x.why}</p>
          <div className="mt-1.5 flex gap-1.5"><Btn primary>Approve</Btn><Btn>Take over</Btn></div>
        </div>
      ))}
    </div>
  </MockupCard>
);

const MatchFill = () => (
  <MockupCard title="32 ft MXL · Mumbai → Delhi" testId="mockup-match-fill">
    <div className="flex h-6 w-full overflow-hidden rounded-full bg-border text-[9px] font-semibold">
      <span className="flex w-[82%] items-center justify-center bg-status-ai text-white">18 pallets booked</span>
      <span className="flex w-[18%] items-center justify-center bg-status-approval/80 text-white">4 spare</span>
    </div>
    <div className="mt-2 rounded-lg border border-status-approval/40 bg-status-approval/10 p-2.5">
      <p className="text-xs font-medium text-heading">Part-load matched: 4 pallets, Jaipur-side drop</p>
      <p className="text-[10px] text-muted-foreground">Weight OK · pallet type OK · timing OK</p>
    </div>
    <svg viewBox="0 0 220 40" className="mt-2 w-full text-muted-foreground" role="img" aria-label="Route with part-load drop">
      <path d="M15 28 H205" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
      <circle cx="15" cy="28" r="4" className="fill-heading" stroke="none" /><circle cx="110" cy="28" r="4" className="fill-status-approval" stroke="none" /><circle cx="205" cy="28" r="4" className="fill-heading" stroke="none" />
      <text x="6" y="14" fontSize="8" fill="currentColor">Mumbai</text><text x="96" y="14" fontSize="8" fill="currentColor">Jaipur drop</text><text x="192" y="14" fontSize="8" fill="currentColor">Delhi</text>
    </svg>
  </MockupCard>
);

const MatchLoop = () => (
  <MockupCard title="Coordination loop" testId="mockup-match-loop">
    <ol className="space-y-2">
      {[
        { s: "Matched", who: "ai" }, { s: "Carrier contacted (Gujarati call)", who: "ai" },
        { s: "Rate agreed at Rs 74,500", who: "approval" }, { s: "Booked in TMS", who: "ai" }, { s: "In transit, tracked", who: "ai" },
      ].map((x, i) => (
        <li key={x.s} className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-bold text-muted-foreground">{i + 1}</span>
          <span className="flex-1 text-xs font-medium text-heading">{x.s}</span>
          <StatusTag variant={x.who} />
        </li>
      ))}
    </ol>
  </MockupCard>
);

/* ---- Warehouse Vision ---- */
const WhHero = () => (
  <MockupCard title="Tablet · Packing bench 3" right={<StatusTag variant="ai" />} testId="mockup-wh-hero">
    <div className="relative rounded-lg border bg-surface p-3">
      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Camera className="h-3 w-3" /> Camera view · pallet #PLT-2214</p>
      <div className="relative mt-2 h-32 rounded-md border-2 border-dashed border-muted-foreground/30">
        <span className="absolute left-3 top-3 h-8 w-14 rounded border-2 border-status-ai bg-status-ai/10" aria-hidden="true" />
        <span className="absolute right-4 top-8 h-8 w-14 rounded border-2 border-status-human bg-status-human/10" aria-hidden="true" />
        <span className="absolute inset-x-0 top-2 border-t-2 border-status-approval/70" aria-hidden="true" />
        <span className="absolute right-1 top-0 text-[9px] font-semibold text-status-approval">1.6 m limit</span>
      </div>
      <div className="mt-2 flex gap-1.5"><Pill tone="good">Label position OK</Pill><Pill tone="bad">Label missing, side B</Pill></div>
    </div>
  </MockupCard>
);

const WhLabel = () => (
  <MockupCard title="Label verification" testId="mockup-wh-label">
    <div className="relative rounded-lg border bg-surface p-3">
      <div className="relative mx-auto h-24 w-40 rounded border border-muted-foreground/40 bg-card">
        <span className="absolute left-2 top-2 h-10 w-16 rounded border-2 border-status-ai" aria-hidden="true" />
        <span className="absolute bottom-2 right-2 h-3 w-20 rounded border-2 border-status-ai" aria-hidden="true" />
        <span className="absolute left-2.5 top-3 text-[8px] text-muted-foreground">SSCC label</span>
        <span className="absolute bottom-2.5 right-3 text-[8px] text-muted-foreground">barcode</span>
      </div>
    </div>
    <ul className="mt-2 space-y-1 text-[11px]">
      {[["Position: top-left face", true], ["Barcode readable", true], ["Content matches order 8847", true]].map(([c, ok]) => (
        <li key={c} className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-status-ai" />{c}</li>
      ))}
    </ul>
  </MockupCard>
);

const WhPacking = () => (
  <MockupCard title="SKU checklist · live" testId="mockup-wh-packing">
    <ul className="space-y-1.5">
      {[
        { s: "Carton count 24/24", done: true }, { s: "Orientation arrows up", done: true },
        { s: "No visible damage", done: true }, { s: "Seals intact", done: false }, { s: "Photo captured", done: true },
      ].map((x) => (
        <li key={x.s} className="flex items-center gap-2 rounded-lg border bg-surface px-2.5 py-1.5 text-[11px]">
          {x.done ? <CheckCircle2 className="h-3.5 w-3.5 text-status-ai" /> : <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40" />}
          <span className={x.done ? "text-heading" : "text-muted-foreground"}>{x.s}</span>
        </li>
      ))}
    </ul>
    <p className="mt-2 text-[10px] text-muted-foreground">Packer guided step by step · scan to advance</p>
  </MockupCard>
);

const WhPallet = () => (
  <MockupCard title="Pallet build check" testId="mockup-wh-pallet">
    <div className="flex gap-3">
      <div className="relative h-28 w-24 shrink-0 rounded border bg-surface">
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className="absolute inset-x-2 rounded-sm border border-muted-foreground/40 bg-card" style={{ bottom: `${6 + i * 18}%`, height: "14%" }} />)}
        <span className="absolute inset-x-0 border-t-2 border-status-ai" style={{ bottom: "76%" }} aria-hidden="true" />
        <span className="absolute -right-1 text-[8px] font-semibold text-status-ai" style={{ bottom: "78%" }}>1.6 m</span>
        <span className="absolute -top-5 left-0 text-[9px] font-semibold text-status-human">Flag: 1.8 m</span>
      </div>
      <div className="flex-1 space-y-1.5">
        <Pill tone="bad">Height 1.8 m exceeds 1.6 m rule</Pill>
        <p className="text-[10px] leading-relaxed text-muted-foreground">Fix: move top layer (6 cartons, SKU-A31) to pallet PLT-2215. Rebuild keeps weight balanced.</p>
        <Pill tone="good">Mixed-SKU rule OK</Pill>
      </div>
    </div>
  </MockupCard>
);

const WhRules = () => (
  <MockupCard title="Rule behind the flag" testId="mockup-wh-rules">
    <div className="rounded-lg border bg-surface p-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Retailer manual excerpt · p. 42</p>
      <p className="mt-1 text-[11px] italic leading-relaxed text-foreground">"Pallets must not exceed 1.6 m including pallet. Labels required on two adjacent faces."</p>
    </div>
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-status-human/40 bg-status-human/10 p-2.5">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-human" />
      <p className="text-[11px] text-heading"><b>Why flagged:</b> pallet 1.8 m and label on one face only — violates the two rules above.</p>
    </div>
    <p className="mt-2 text-[10px] text-muted-foreground">Manual v12 uploaded 4 Mar · rules re-indexed automatically</p>
  </MockupCard>
);

/* ---- Compliance & Finance ---- */
const FinHero = () => (
  <MockupCard title="Invoice audit · INV-2211" testId="mockup-fin-hero">
    <MiniTable
      head={["Line", "Contract", "Actual", "Variance"]}
      rows={[
        ["Freight, Mumbai–Delhi", "Rs 72,000", "Rs 72,000", "—"],
        ["Detention, Bhiwandi", "Rs 800/hr", "Rs 4,000", "+2 hrs"],
        ["Loading charge", "Included", "Rs 1,500", "+Rs 1,500"],
      ]}
      highlight={[1, 2]}
    />
    <div className="mt-2 flex items-center justify-between">
      <Pill tone="warn">2 variances flagged</Pill>
      <Pill tone="good">Packing compliance: pass</Pill>
    </div>
  </MockupCard>
);

const FinManual = () => (
  <MockupCard title="Manual check · dispatch gate" testId="mockup-fin-manual">
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-lg border bg-surface p-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Manual rule · p. 17</p>
        <p className="mt-1 text-[11px] italic text-foreground">"Max 24 cartons per pallet for SKU group B."</p>
      </div>
      <ul className="space-y-1 text-[11px]">
        {[["Cartons per pallet", true], ["Label faces", true], ["ASN sent before dispatch", false]].map(([c, ok]) => (
          <li key={c} className={`flex items-center gap-1.5 ${ok ? "text-muted-foreground" : "text-status-human"}`}>
            {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-status-ai" /> : <XCircle className="h-3.5 w-3.5" />}{c}
          </li>
        ))}
      </ul>
    </div>
    <p className="mt-2 text-[10px] text-muted-foreground">Every result cites the rule it came from.</p>
  </MockupCard>
);

const FinAudit = () => (
  <MockupCard title="Audit table" testId="mockup-fin-audit">
    <MiniTable
      head={["Invoice line", "Contract", "Actual", "Evidence"]}
      rows={[
        ["INV-2211 · detention 5h", "gate log: 2h", "Rs 4,000", "timestamps"],
        ["INV-2209 · freight", "Rs 68,000", "Rs 68,000", "matched"],
        ["INV-2204 · duplicate", "billed twice", "Rs 71,500", "PO + ledger"],
      ]}
      highlight={[0, 2]}
    />
    <div className="mt-2 flex gap-1.5"><Btn primary>Approve clean lines</Btn><Btn>Dispute flagged</Btn></div>
  </MockupCard>
);

const FinAnomaly = () => (
  <MockupCard title="Billing anomalies" testId="mockup-fin-anomaly">
    <ul className="space-y-1.5">
      {[
        { a: "Wrong rate applied: Mumbai–Delhi at old contract", s: "high" },
        { a: "Invoice without POD attached", s: "high" },
        { a: "Duplicate invoice number from carrier", s: "high" },
        { a: "GST rate mismatch: 18% vs 5% GTA", s: "medium" },
      ].map((x) => (
        <li key={x.a} className="flex items-center justify-between gap-2 rounded-lg border bg-surface px-2.5 py-2">
          <span className="text-[11px] text-heading">{x.a}</span>
          <Pill tone={x.s === "high" ? "bad" : "warn"}>{x.s}</Pill>
        </li>
      ))}
    </ul>
  </MockupCard>
);

const FinCollections = () => (
  <MockupCard title="Receivables aging" testId="mockup-fin-collections">
    <div className="flex gap-1.5 text-[10px]">
      {[["0-30d", "Rs 8.2L"], ["30-60d", "Rs 3.1L"], ["60+d", "Rs 1.4L"]].map(([k, v]) => (
        <span key={k} className="rounded-lg border bg-surface px-2.5 py-1.5">{k} <b className="text-heading">{v}</b></span>
      ))}
    </div>
    <ol className="mt-2.5 space-y-1.5">
      {[
        { t: "Day 1 · polite email reminder", tag: "ai" },
        { t: "Day 7 · WhatsApp with UPI link", tag: "ai" },
        { t: "Day 14 · Hindi call from Voice AI", tag: "ai" },
        { t: "Day 21 · escalation to your team", tag: "human" },
      ].map((x) => (
        <li key={x.t} className="flex items-center justify-between gap-2 rounded-lg border bg-surface px-2.5 py-1.5">
          <span className="text-[11px] text-heading">{x.t}</span><StatusTag variant={x.tag} />
        </li>
      ))}
    </ol>
  </MockupCard>
);

/* ---- Control Tower ---- */
const CtLive = () => (
  <MockupCard title="Control Tower · now" testId="mockup-ct-live">
    <div className="space-y-2">
      {[
        { t: "Breakdown near Beawar · LR-8841 at risk", tag: "human" },
        { t: "Gate delay 40 min, Okhla · 2 shipments", tag: "approval" },
        { t: "Weather watch: heavy rain, NH48", tag: "ai" },
      ].map((x) => (
        <Row key={x.t}><span className="text-xs text-heading">{x.t}</span><StatusTag variant={x.tag} /></Row>
      ))}
      <p className="rounded-lg border border-dashed px-3 py-2 text-center text-[11px] text-muted-foreground">39 on-track shipments collapsed · nothing needed from you</p>
    </div>
  </MockupCard>
);

const CtAlerts = () => (
  <MockupCard title="Disruption feed" testId="mockup-ct-alerts">
    <ul className="space-y-2">
      {[
        { a: "Traffic jam, NH48 near Surat", aff: "LR-8839, LR-8842 · slots at 6 PM", tone: "warn" },
        { a: "Breakdown reported, Beawar", aff: "LR-8841 · delivery slot at risk", tone: "bad" },
        { a: "Rain alert, Mumbai region", aff: "3 pickups may slip 1-2 hrs", tone: "warn" },
      ].map((x) => (
        <li key={x.a} className="rounded-lg border bg-surface p-2.5">
          <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-heading">{x.a}</p><Pill tone={x.tone}>{x.tone === "bad" ? "critical" : "watch"}</Pill></div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Affects: {x.aff}</p>
        </li>
      ))}
    </ul>
  </MockupCard>
);

const CtSolver = () => (
  <MockupCard title="Re-plan · LR-8841" testId="mockup-ct-solver">
    <div className="space-y-2">
      {[
        { o: "Replacement truck from Beawar", c: "+Rs 9,500", s: "Slot saved", rec: true },
        { o: "Cross-dock at next hub", c: "+Rs 14,200", s: "Slot saved", rec: false },
        { o: "Keep truck, wait for repair", c: "+Rs 0", s: "Slot missed by 5 hrs", rec: false },
      ].map((x) => (
        <div key={x.o} className={`rounded-lg border p-2.5 ${x.rec ? "border-status-ai/40 bg-status-ai/10" : "bg-surface"}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-heading">{x.o}</p>
            {x.rec ? <Pill tone="good">Recommended</Pill> : null}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Cost {x.c} · SLA: {x.s}</p>
        </div>
      ))}
    </div>
    <div className="mt-2 flex gap-1.5"><Btn primary>Approve recommended</Btn><Btn>Take over</Btn></div>
  </MockupCard>
);

const CtProcure = () => (
  <MockupCard title="Recovery in progress" testId="mockup-ct-procure">
    <Row><span className="text-xs text-heading"><Truck className="mr-1 inline h-3.5 w-3.5" />Replacement truck RJ-14-XX-3321 booked</span><StatusTag variant="ai" /></Row>
    <div className="mt-2 space-y-1.5">
      <p className="rounded-lg border bg-surface px-2.5 py-2 text-[11px] text-muted-foreground">Customer: "Delivery rebooked to 8 PM, same day. Sorry for the delay."</p>
      <p className="rounded-lg border bg-surface px-2.5 py-2 text-[11px] text-muted-foreground">Consignee: new slot confirmed by WhatsApp.</p>
    </div>
    <p className="mt-2 text-[10px] text-muted-foreground">All parties notified automatically · decision log attached</p>
  </MockupCard>
);

/* ---- Reverse Logistics ---- */
const RlHero = () => (
  <MockupCard title="Returns pipeline" testId="mockup-rl-hero">
    <div className="grid grid-cols-4 gap-1.5">
      {[
        { c: "Requested", n: ["RMA-118 · 6 ctns"] },
        { c: "In transit", n: ["RMA-114 · Delhi → Mumbai"] },
        { c: "Claim filed", n: ["CLM-092 · Rs 18,400"] },
        { c: "Credited", n: ["CN-051 · Rs 12,900"] },
      ].map((col) => (
        <div key={col.c} className="rounded-lg border bg-surface p-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{col.c}</p>
          {col.n.map((x) => <p key={x} className="mt-1.5 rounded border bg-card p-1.5 text-[9px] font-medium text-heading">{x}</p>)}
        </div>
      ))}
    </div>
  </MockupCard>
);

const RlRma = () => (
  <MockupCard title="RMA-118" testId="mockup-rl-rma">
    <div className="space-y-1.5">
      <Field k="Reason" v="Damaged at delivery" />
      <Field k="Quantity" v="6 cartons of 24" />
      <Field k="Pickup" v="Okhla, Delhi" />
      <Field k="Opened" v="Same day, from POD note" />
    </div>
    <div className="mt-2 flex items-center gap-2"><StatusTag variant="ai" /><span className="text-[10px] text-muted-foreground">Customer and supplier notified</span></div>
  </MockupCard>
);

const RlClaim = () => (
  <MockupCard title="Claim packet · CLM-092" testId="mockup-rl-claim">
    <ul className="space-y-1 text-[11px]">
      {["POD with rejection note", "4 photos of damaged cartons", "Original invoice Rs 18,400", "Gate timestamps"].map((x) => (
        <li key={x} className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-status-ai" />{x}</li>
      ))}
    </ul>
    <div className="mt-2.5">
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>Filed with carrier</span><span>Credit note pending</span></div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-border"><div className="h-full w-2/3 rounded-full bg-status-ai" /></div>
    </div>
  </MockupCard>
);

const RlReturn = () => (
  <MockupCard title="Return-leg match" testId="mockup-rl-return">
    <svg viewBox="0 0 220 80" className="w-full text-muted-foreground" role="img" aria-label="Truck returning from Delhi to Mumbai picks up returned cartons">
      <path d="M195 15 C 130 25, 90 40, 25 60" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
      <circle cx="195" cy="15" r="4" className="fill-heading" stroke="none" /><circle cx="25" cy="60" r="4" className="fill-heading" stroke="none" />
      <circle cx="118" cy="37" r="5" className="fill-status-ai" stroke="none" />
      <text x="180" y="10" fontSize="8" fill="currentColor">Delhi</text><text x="10" y="74" fontSize="8" fill="currentColor">Mumbai</text>
      <text x="92" y="28" fontSize="8" fill="currentColor">6 cartons on board</text>
    </svg>
    <p className="mt-1 text-[10px] text-muted-foreground"><RotateCcw className="mr-1 inline h-3 w-3" />Matched to a truck already returning — no full-fare return trip.</p>
  </MockupCard>
);

const RlLoss = () => (
  <MockupCard title="Value recovered vs written off" testId="mockup-rl-loss">
    <div className="flex h-6 w-full overflow-hidden rounded-full bg-border text-[9px] font-semibold text-white">
      <span className="flex w-[72%] items-center justify-center bg-status-ai">Recovered Rs 6.5L</span>
      <span className="flex w-[28%] items-center justify-center bg-status-human/80">Written off</span>
    </div>
    <ul className="mt-2.5 space-y-1.5">
      {[["Damage in transit", "41%"], ["Shortage at delivery", "33%"], ["Wrong SKU shipped", "26%"]].map(([r, p]) => (
        <li key={r} className="flex items-center justify-between rounded-lg border bg-surface px-2.5 py-1.5 text-[11px]">
          <span className="text-heading">{r}</span><span className="text-muted-foreground">{p} of returns</span>
        </li>
      ))}
    </ul>
  </MockupCard>
);

export const MODULE_MOCKUPS = {
  "boa-hero": BoaHero, "boa-extract": BoaExtract, "boa-review": BoaReview, "boa-tracking": BoaTracking, "boa-exceptions": BoaExceptions,
  "voice-hero": VoiceHero, "voice-status": VoiceStatus, "voice-checkins": VoiceCheckins, "voice-negotiation": VoiceNegotiation, "voice-booking": VoiceBooking,
  "match-hero": MatchHero, "match-spot": MatchSpot, "match-trucks": MatchTrucks, "match-fill": MatchFill, "match-loop": MatchLoop,
  "wh-hero": WhHero, "wh-label": WhLabel, "wh-packing": WhPacking, "wh-pallet": WhPallet, "wh-rules": WhRules,
  "fin-hero": FinHero, "fin-manual": FinManual, "fin-audit": FinAudit, "fin-anomaly": FinAnomaly, "fin-collections": FinCollections,
  "ct-hero": () => <ControlTowerMockup testId="mockup-ct-hero" />, "ct-live": CtLive, "ct-alerts": CtAlerts, "ct-solver": CtSolver, "ct-procure": CtProcure,
  "rl-hero": RlHero, "rl-rma": RlRma, "rl-claim": RlClaim, "rl-return": RlReturn, "rl-loss": RlLoss,
};
