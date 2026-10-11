import { createContext, useContext, useState } from "react";
import { toast } from "sonner";

/* Seed story: 18 pallets, Bhiwandi (Mumbai) -> Narela (Delhi), ~1,400 km.
   Cast: Meera (Aarav Consumer Products), Imran (dispatcher), Hasmukhbhai (truck owner, Ahmedabad),
   Ramesh (driver), Mr. Gupta (Gupta Trading Co.). All fictional demo data. */

const ACTIVITY_SEED = [
  { id: "a1", time: "09:42", agent: "Control Tower", action: "Flagged breakdown near Beawar; LR-8839 slot at risk", tag: "human" },
  { id: "a2", time: "09:40", agent: "Matching agent", action: "Ranked 3 trucks for LD-201, best fit MH-04-XX-4471", tag: "ai" },
  { id: "a3", time: "09:38", agent: "Voice AI", action: "Driver check-in with Ramesh (Hindi); breakdown reported", tag: "human" },
  { id: "a4", time: "09:31", agent: "Finance agent", action: "Flagged detention variance Rs 3,600 on INV-2211", tag: "approval" },
  { id: "a5", time: "09:24", agent: "Back-Office agent", action: "ORD-1042 parsed; weight field needs review", tag: "approval" },
  { id: "a6", time: "09:12", agent: "Back-Office agent", action: "ORD-1041 auto-created in TMS (97% confidence)", tag: "ai" },
  { id: "a7", time: "10:05", agent: "Voice AI", action: "Closed rate Rs 74,500 with Hasmukhbhai (Gujarati)", tag: "approval" },
  { id: "a8", time: "08:55", agent: "Warehouse Vision", action: "Pallet 7 flagged: height 1.8 m over 1.6 m rule", tag: "human" },
];

const EXCEPTIONS_SEED = [
  {
    id: "breakdown",
    title: "Breakdown near Beawar — LR-8839 at risk",
    problem: "Truck MH-04-XX-1234 broke down near Beawar on the Bhiwandi to Narela trip. The 8-10 AM delivery slot at Gupta Trading Co. is at risk.",
    tried: "Voice AI reached Ramesh (Hindi) at 09:38. Solver generated 3 re-plan options below.",
    tag: "human",
    kind: "options",
    selected: "B",
    options: [
      { id: "A", label: "Wait for repair", cost: "Rs 0 extra", sla: "Misses the 8-10 AM slot", note: "Cheapest" },
      { id: "B", label: "Transship to a partner truck 45 km away", cost: "+Rs 9,000", sla: "Slot saved; avoids Rs 15,000 slot penalty", note: "Recommended", recommended: true },
      { id: "C", label: "Split the load across two trucks", cost: "+Rs 21,000", sla: "Slot saved", note: "Highest cost" },
    ],
  },
  {
    id: "rate",
    title: "Rate above benchmark needs approval",
    problem: "Hasmukhbhai's truck for LD-201 closed at Rs 74,500. Benchmark for Mumbai to Delhi is Rs 78,000 — under benchmark, but policy requires a tap.",
    tried: "Voice AI negotiated down from Rs 82,000 across 3 turns in Gujarati.",
    tag: "approval",
    kind: "simple",
  },
  {
    id: "ord1042",
    title: "ORD-1042: one field needs fixing",
    problem: "Weight reads 14.2 t on the invoice but 14.5 t in the Excel sheet from Meera at Aarav Consumer Products.",
    tried: "All other 7 fields extracted at 87-99% confidence.",
    tag: "approval",
    kind: "link",
    link: "/app/orders",
    linkLabel: "Open order",
  },
  {
    id: "detention",
    title: "Detention claim variance Rs 3,600",
    problem: "Carrier claims 5 hours detention at Bhiwandi. Gate timestamps show 2 hours beyond free time.",
    tried: "Evidence packet assembled: gate log, POD timestamps, invoice line.",
    tag: "approval",
    kind: "link",
    link: "/app/finance",
    linkLabel: "Open audit",
  },
  {
    id: "driver",
    title: "Driver unreachable for check-in",
    problem: "Mid-route check-in for LR-8836 (Bhiwandi to Jaipur) failed 3 times over 45 minutes.",
    tried: "Voice AI called at 13:00, 13:15 and 13:30. WhatsApp message sent, unread.",
    tag: "human",
    kind: "simple",
  },
  {
    id: "slot",
    title: "Retailer slot rebooking needs confirmation",
    problem: "Narela DC offered a new slot: tomorrow 14:00-16:00 instead of 8-10 AM, due to dock congestion.",
    tried: "Control Tower checked downstream impact: no other deliveries affected.",
    tag: "approval",
    kind: "simple",
  },
];

const HANDLED_SEED = [
  "ORD-1041 created from Excel, 97% confidence",
  "Status call answered for Meera (English, 41 sec)",
  "POD for LR-8831 received and invoice drafted",
  "Return leg matched for empty truck to Mumbai",
  "GST check passed on INV-2208",
  "WhatsApp ETA sent to Gupta Trading Co.",
  "Pallet 3 passed all checks",
  "Carrier GJ-01-YY-5678 confirmed Friday slot",
  "Duplicate invoice INV-2204 flagged and merged",
];

const ORDERS_SEED = [
  { id: "ORD-1042", customer: "Aarav Consumer Products", route: "Bhiwandi WH-3 → Narela", source: "Email", confidence: 71, tag: "approval" },
  { id: "ORD-1041", customer: "Kedia Polymers", route: "Bhiwandi → Pune", source: "Excel", confidence: 97, tag: "ai" },
  { id: "ORD-1040", customer: "Shree Packaging", route: "Vashi → Ahmedabad", source: "WhatsApp", confidence: 94, tag: "ai" },
  { id: "ORD-1039", customer: "Aarav Consumer Products", route: "Bhiwandi WH-3 → Jaipur", source: "Email", confidence: 88, tag: "ai" },
  { id: "ORD-1038", customer: "Gupta Trading Co.", route: "Narela → Ludhiana", source: "WhatsApp", confidence: 63, tag: "human" },
];

export const ORD_1042_FIELDS = [
  { k: "Customer", v: "Aarav Consumer Products", conf: 99, src: "email line 1" },
  { k: "Pickup", v: "Bhiwandi WH-3", conf: 98, src: "email line 3" },
  { k: "Drop", v: "Gupta Trading Co., Narela", conf: 96, src: "email line 3" },
  { k: "Pallets", v: "18", conf: 99, src: "attachment, row 4" },
  { k: "Weight", v: "14.2 t", conf: 58, src: "invoice vs Excel conflict", low: true },
  { k: "Pickup window", v: "Thursday 08:00-12:00", conf: 91, src: "email line 4" },
  { k: "Vehicle requirement", v: "32 ft MXL", conf: 95, src: "attachment, row 5" },
  { k: "Invoice refs", v: "PO-7712, INV-2211", conf: 87, src: "attachment, header" },
];

const LOADS_SEED = [
  { id: "LD-201", lane: "Bhiwandi → Narela (Delhi)", cargo: "18 pallets packaged goods", window: "Thu 08:00-12:00", rate: "Rs 76,000 offered" },
  { id: "LD-202", lane: "Bhiwandi → Jaipur", cargo: "4 pallets pharma", window: "Thu 14:00-16:00", rate: "Rs 31,000 offered" },
  { id: "LD-203", lane: "Narela → Pune", cargo: "9 pallets auto parts", window: "Fri 09:00-11:00", rate: "Rs 42,500 offered" },
];

const TRUCK_SUGGESTIONS = {
  "LD-201": [
    { truck: "MH-04-XX-4471", score: 96, location: "Bhiwandi, 6 km", capacity: "32 ft MXL · 22 spaces", free: "Today 4 PM", cost: "Rs 74,800", why: "Closest, right size, strong Delhi-lane history" },
    { truck: "GJ-01-YY-5678", score: 88, location: "Vapi, 38 km", capacity: "32 ft MXL · 22 spaces", free: "Today 6 PM", cost: "Rs 75,600", why: "Good lane record, slightly farther" },
    { truck: "MH-46-ZZ-9012", score: 71, location: "Bhiwandi, 4 km", capacity: "24 ft · 16 spaces", free: "Now", cost: "Rs 72,100", why: "Too small: 4 pallets would spill" },
  ],
  "LD-202": [
    { truck: "MH-04-XX-4471", score: 91, location: "Bhiwandi, 6 km", capacity: "4 spare spaces", free: "After LD-201 pickup", cost: "Rs 9,200", why: "Same corridor, fills spare pallet space" },
    { truck: "RJ-14-XX-3321", score: 79, location: "Thane, 22 km", capacity: "20 ft · 10 spaces", free: "Tomorrow", cost: "Rs 28,900", why: "Dedicated run, no part-load needed" },
  ],
  "LD-203": [
    { truck: "MH-12-XX-7788", score: 93, location: "Narela, 3 km", capacity: "32 ft · 22 spaces", free: "Fri 7 AM", cost: "Rs 41,000", why: "Already in Delhi after LD-201 delivery" },
  ],
};

const FLEET_SEED = [
  { truck: "MH-04-XX-1234", driver: "Ramesh Yadav", location: "Beawar (breakdown)", status: "human", utilisation: 82, nextFree: "After repair" },
  { truck: "MH-04-XX-4471", driver: "Suresh Patel", location: "Bhiwandi", status: "ai", utilisation: 91, nextFree: "Today 4 PM" },
  { truck: "GJ-01-YY-5678", driver: "Hasmukhbhai's fleet", location: "Vapi", status: "ai", utilisation: 88, nextFree: "Today 6 PM" },
  { truck: "MH-46-ZZ-9012", driver: "Imran (standby)", location: "Bhiwandi", status: "ai", utilisation: 64, nextFree: "Now" },
  { truck: "RJ-14-XX-3321", driver: "Partner truck", location: "Beawar, 45 km", status: "approval", utilisation: 77, nextFree: "On approval" },
  { truck: "MH-12-XX-7788", driver: "Devendra Singh", location: "Narela", status: "ai", utilisation: 85, nextFree: "Fri 7 AM" },
];

const PALLETS_SEED = [
  { id: 1, status: "pass", tag: "ai", checks: { label: true, barcode: true, cartons: true, seal: true, height: true } },
  { id: 3, status: "pass", tag: "ai", checks: { label: true, barcode: true, cartons: true, seal: true, height: true } },
  { id: 7, status: "fail", tag: "human", flag: "Height 1.8 m exceeds 1.6 m rule", fix: "Move top layer (6 cartons, SKU-A31) to pallet 9.", checks: { label: true, barcode: true, cartons: true, seal: true, height: false } },
  { id: 9, status: "pass", tag: "ai", checks: { label: true, barcode: true, cartons: true, seal: true, height: true } },
  { id: 12, status: "fail", tag: "human", flag: "Label on one side only", fix: "Print second SSCC label and apply to adjacent face.", checks: { label: false, barcode: true, cartons: true, seal: true, height: true } },
];

const INVOICES_SEED = [
  { id: "INV-2211", line: "Detention, Bhiwandi · 5 hrs claimed", contract: "2 hrs beyond free time (gate log)", actual: "Rs 4,500", variance: "Rs 3,600", evidence: "Gate timestamps", tag: "approval" },
  { id: "INV-2209", line: "Freight, Mumbai → Delhi", contract: "Rs 68,000", actual: "Rs 68,000", variance: "—", evidence: "Contract matched", tag: "ai" },
  { id: "INV-2204", line: "Freight, Bhiwandi → Pune", contract: "Rs 71,500", actual: "Rs 71,500 (billed twice)", variance: "Duplicate", evidence: "PO + ledger", tag: "human" },
  { id: "INV-2201", line: "Loading charge", contract: "Included in rate", actual: "Rs 1,500", variance: "+Rs 1,500", evidence: "Rate card p.2", tag: "approval" },
];

const RETURNS_SEED = {
  columns: [
    { name: "Requested", cards: [] },
    {
      name: "In transit",
      cards: [
        {
          id: "RMA-118",
          title: "6 rejected cartons — Gupta Trading Co.",
          detail: "Damaged at delivery, Narela dock. Evidence: POD note, 4 photos, invoice Rs 18,400.",
          match: "Matched return leg: MH-12-XX-7788 heading Delhi → Mumbai.",
          tag: "ai",
        },
      ],
    },
    { name: "Claim filed", cards: [{ id: "CLM-092", title: "Rs 18,400 with carrier", detail: "Evidence bundle auto-assembled; filed Tuesday.", match: "Credit note pending.", tag: "approval" }] },
    { name: "Credited", cards: [{ id: "CN-051", title: "Rs 12,900 recovered", detail: "Shortage claim, Kedia Polymers.", match: "Closed in 11 days.", tag: "ai" }] },
  ],
};

const CALLS_SEED = [
  { id: "call-1", lang: "Gujarati", who: "Hasmukhbhai · truck owner, Ahmedabad", outcome: "Rate closed at Rs 74,500 (benchmark Rs 78,000)", duration: "06:12", time: "10:05", tag: "approval" },
  { id: "call-2", lang: "Hindi", who: "Ramesh · driver, LR-8839", outcome: "Check-in done; breakdown near Beawar reported", duration: "02:41", time: "09:38", tag: "human" },
  { id: "call-3", lang: "English", who: "Meera · Aarav Consumer Products", outcome: "Delivery slot status shared; WhatsApp link sent", duration: "01:58", time: "09:20", tag: "ai" },
  { id: "call-4", lang: "Hindi", who: "Suresh · carrier check-in, LR-8831", outcome: "On time, crossed Vapi", duration: "01:12", time: "08:47", tag: "ai" },
];

export const CALL_TRANSCRIPTS = {
  "call-1": {
    title: "Rate negotiation · Mumbai → Delhi · benchmark Rs 78,000",
    lines: [
      { who: "AI", native: "નમસ્તે હસમુખભાઈ, તમારી ગાડી અત્યારે ક્યાં છે?", en: "Hello Hasmukhbhai, where is your truck right now?" },
      { who: "Hasmukhbhai", native: "ગાડી અમદાવાદમાં ખાલી છે. કાલે લોડ થઈ શકે.", en: "The truck is empty in Ahmedabad. It can load tomorrow." },
      { who: "AI", native: "₹74,500 ભાડું ચાલશે?", en: "Will a rate of Rs 74,500 work?" },
      { who: "Hasmukhbhai", native: "ઠીક છે, કન્ફર્મ કરો.", en: "Fine, confirm it." },
    ],
    outcome: "Closed at Rs 74,500, under the Rs 78,000 benchmark. Booking awaits your approval.",
  },
  "call-2": {
    title: "Driver check-in · LR-8839 · Bhiwandi → Narela",
    lines: [
      { who: "AI", native: "नमस्ते रमेश जी, आपका ट्रक अभी कहाँ है?", en: "Hello Ramesh ji, where is your truck right now?" },
      { who: "Ramesh", native: "सर, ट्रक ब्यावर के पास ब्रेकडाउन हो गया है।", en: "Sir, the truck has broken down near Beawar." },
      { who: "AI", native: "ठीक है, मैंने कंट्रोल टावर को बता दिया है। सहायता भेजी जा रही है।", en: "Understood, I have informed the control tower. Help is on the way." },
    ],
    outcome: "Breakdown captured, control tower alerted, re-plan options generated.",
  },
};

const AGENTS_SEED = [
  { id: "backoffice", name: "Back-Office agent", autonomy: "Act within limits" },
  { id: "voice", name: "Voice agent", autonomy: "Act within limits" },
  { id: "matching", name: "Matching agent", autonomy: "Approve each action" },
  { id: "tower", name: "Control Tower agent", autonomy: "Act within limits" },
  { id: "finance", name: "Finance agent", autonomy: "Suggest only" },
  { id: "vision", name: "Warehouse Vision agent", autonomy: "Act within limits" },
];

const LANES_SEED = [
  { lane: "Mumbai → Delhi", benchmark: 78000, ceiling: 80000 },
  { lane: "Delhi → Mumbai", benchmark: 71000, ceiling: 74000 },
  { lane: "Mumbai → Jaipur", benchmark: 32000, ceiling: 34000 },
];

const AUDIT_SEED = [
  { id: "l1", time: "09:42", agent: "Control Tower", action: "Raised breakdown exception", inputs: "LR-8839, telematics alert", result: "Escalated to human", approver: "—" },
  { id: "l2", time: "09:38", agent: "Voice agent", action: "Driver check-in call", inputs: "Ramesh, Hindi", result: "Breakdown captured", approver: "Auto (within limits)" },
  { id: "l3", time: "10:05", agent: "Voice agent", action: "Rate negotiation", inputs: "Benchmark 78,000, ceiling 80,000", result: "Closed 74,500, pending approval", approver: "Awaiting Imran" },
  { id: "l4", time: "09:12", agent: "Back-Office agent", action: "Order auto-created", inputs: "ORD-1041, 97% confidence", result: "Written to TMS", approver: "Auto (within limits)" },
  { id: "l5", time: "08:55", agent: "Warehouse Vision", action: "Pallet height flag", inputs: "Pallet 7, 1.8 m vs 1.6 m rule", result: "Supervisor alerted", approver: "—" },
];

const MockContext = createContext(null);
let seq = 100;

export const MockProvider = ({ children }) => {
  const [activity, setActivity] = useState(ACTIVITY_SEED);
  const [exceptions, setExceptions] = useState(EXCEPTIONS_SEED);
  const [orders, setOrders] = useState(ORDERS_SEED);
  const [partLoadAdded, setPartLoadAdded] = useState(false);
  const [pallets, setPallets] = useState(PALLETS_SEED);
  const [invoices, setInvoices] = useState(INVOICES_SEED);
  const [agents, setAgents] = useState(AGENTS_SEED);
  const [lanes, setLanes] = useState(LANES_SEED);
  const [spendLimit, setSpendLimit] = useState(10000);
  const [autoApproveUnder, setAutoApproveUnder] = useState(2000);
  const [allowed, setAllowed] = useState({
    "Book trucks within ceiling": true,
    "Send customer updates": true,
    "File claims under Rs 5,000": true,
    "Rebook delivery slots": false,
  });
  const [auditLog, setAuditLog] = useState(AUDIT_SEED);

  const addActivity = (agent, action, tag) =>
    setActivity((a) => [{ id: `a${seq++}`, time: "now", agent, action, tag }, ...a]);

  const addAudit = (entry) =>
    setAuditLog((l) => [{ id: `l${seq++}`, time: "now", approver: "You (demo)", ...entry }, ...l]);

  const resolveException = (id, action, label) => {
    const tag = action === "approve" ? "ai" : action === "takeover" ? "human" : "approval";
    setExceptions((xs) => xs.map((x) => (x.id === id ? { ...x, tag, resolved: label } : x)));
    const ex = exceptions.find((x) => x.id === id);
    addActivity("Control Tower", `${label} — ${ex?.title || id}`, tag);
    toast.success(label);
  };

  const selectOption = (id, optionId) =>
    setExceptions((xs) => xs.map((x) => (x.id === id ? { ...x, selected: optionId } : x)));

  const resolveOrder = (id, action) => {
    const tag = action === "approve" ? "ai" : "human";
    setOrders((xs) => xs.map((x) => (x.id === id ? { ...x, tag } : x)));
    addActivity("Back-Office agent", `${id} ${action === "approve" ? "approved and created in TMS" : "escalated to a human"}`, tag);
    toast.success(action === "approve" ? `${id} created in TMS` : `${id} escalated`);
  };

  const addPartLoad = () => {
    if (partLoadAdded) return;
    setPartLoadAdded(true);
    addActivity("Matching agent", "Jaipur-bound part-load (4 pallets) added to MH-04-XX-4471 spare space", "ai");
    toast.success("Part-load added: 22/22 spaces filled");
  };

  const markPalletFixed = (id) => {
    setPallets((ps) => ps.map((p) => (p.id === id ? { ...p, status: "pass", tag: "ai", flag: null, checks: Object.fromEntries(Object.keys(p.checks).map((k) => [k, true])) } : p)));
    addActivity("Warehouse Vision", `Pallet ${id} marked fixed and re-scanned: pass`, "ai");
    toast.success(`Pallet ${id} marked fixed`);
  };

  const resolveInvoice = (id, action) => {
    const tag = action === "approve" ? "ai" : "approval";
    setInvoices((xs) => xs.map((x) => (x.id === id ? { ...x, tag, resolved: action === "approve" ? "Correction approved" : "Dispute sent to carrier" } : x)));
    addActivity("Finance agent", `${id}: ${action === "approve" ? "correction approved" : "dispute filed with evidence"}`, tag);
    toast.success(action === "approve" ? "Correction approved" : "Dispute filed");
  };

  const updateGuardrail = (kind, key, value, description) => {
    if (kind === "autonomy") setAgents((as) => as.map((a) => (a.id === key ? { ...a, autonomy: value } : a)));
    if (kind === "lane") setLanes((ls) => ls.map((l) => (l.lane === key.lane ? { ...l, [key.field]: value } : l)));
    if (kind === "spend") setSpendLimit(value);
    if (kind === "threshold") setAutoApproveUnder(value);
    if (kind === "allowed") setAllowed((a) => ({ ...a, [key]: value }));
    addAudit({ agent: "Guardrails", action: "Guardrail changed", inputs: description, result: "Applied (demo state)" });
    toast.success("Guardrail updated");
  };

  const value = {
    activity, exceptions, orders, pallets, invoices, agents, lanes, spendLimit, autoApproveUnder, allowed, auditLog,
    partLoadAdded, loads: LOADS_SEED, truckSuggestions: TRUCK_SUGGESTIONS, fleet: FLEET_SEED, returns: RETURNS_SEED,
    calls: CALLS_SEED, handled: HANDLED_SEED,
    resolveException, selectOption, resolveOrder, addPartLoad, markPalletFixed, resolveInvoice, updateGuardrail, addActivity,
  };
  return <MockContext.Provider value={value}>{children}</MockContext.Provider>;
};

export const useMock = () => useContext(MockContext);
