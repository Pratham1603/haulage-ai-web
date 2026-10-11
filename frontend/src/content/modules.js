import {
  Keyboard, FileWarning, PhoneCall, BellOff, PhoneMissed, Timer, BadgePercent, PhoneOff,
  RotateCcw, PackageOpen, EyeOff, ScanLine, Tag, BookOpen, TruckIcon, AlertTriangle,
  ReceiptText, HandCoins, FileSearch, Siren, MapPinned, Route, Shuffle, Undo2, FileClock,
  CircleDollarSign, Inbox, ListChecks, Gauge, ClipboardX,
} from "lucide-react";

export const MODULE_CONTENT = {
  "back-office-automation": {
    seo: {
      title: "Back-Office Automation - Email to booked order, no re-typing | Haulage AI",
      description: "Haulage AI reads emails, PDFs, Excel sheets and WhatsApp messages, fills your TMS, and updates customers automatically. Humans only see exceptions.",
    },
    hero: {
      headline: "Turn every customer email into a booked order, with no re-typing.",
      subheadline:
        "Haulage AI reads emails, PDFs, Excel sheets, and WhatsApp messages, fills your TMS, and updates customers automatically. Humans only see exceptions.",
      mockup: "boa-hero",
    },
    integrations: {
      logos: ["Gmail", "Outlook", "WhatsApp", "TMS", "Tally", "Excel"],
      caption: "Works with the channels you already use.",
    },
    problem: {
      heading: "Back-office work is slowing down your operations.",
      items: [
        { icon: Keyboard, title: "Manual data entry from emails and attachments", text: "Every order is typed by hand from an inbox into the TMS." },
        { icon: FileWarning, title: "Re-keying errors that become billing disputes", text: "A wrong pallet count today is a deduction next month." },
        { icon: PhoneCall, title: "Constant 'where is my truck?' follow-ups", text: "Customers call because nobody told them first." },
        { icon: BellOff, title: "Late or missing customer updates", text: "Updates depend on someone remembering to send them." },
      ],
    },
    steps: [
      { title: "Capture", line: "Email, WhatsApp, attachments." },
      { title: "Understand", line: "Extract fields, match customers and locations." },
      { title: "Validate", line: "Rules and confidence scores." },
      { title: "Book and confirm", line: "Write to the TMS, reply to the customer." },
    ],
    features: [
      {
        title: "Email-to-TMS data entry",
        mockup: "boa-extract",
        bullets: ["Reads PDFs, images, and Excel", "Matches customers and locations automatically", "Flags duplicates and mismatches"],
      },
      {
        title: "Confidence-based review",
        mockup: "boa-review",
        bullets: ["High-confidence orders are created with no human touch", "Reviewers fix one field and approve", "Every field links back to its source text"],
      },
      {
        title: "Auto-tracking and proactive updates",
        mockup: "boa-tracking",
        bullets: ["Tracking from GPS and driver check-ins", "Customers get updates before they ask", "Delay messages include a new ETA"],
      },
      {
        title: "Exception-only escalation",
        mockup: "boa-exceptions",
        bullets: ["Your team handles the 5 percent that needs judgment", "Each card arrives with full context", "Amendments and cancellations patch the existing order"],
      },
    ],
    beforeAfter: [
      { task: "Order entry time", before: "15 minutes per order, typed by hand", after: "Under a minute, no typing" },
      { task: "Error rate", before: "Re-keying errors found at billing", after: "Mismatches flagged before booking" },
      { task: "Customer update effort", before: "Manual calls and emails per shipment", after: "Automatic at every milestone" },
      { task: "Team focus", before: "Data entry", after: "Exceptions and customers" },
    ],
    metrics: [
      { value: "25+", label: "hours saved per week" },
      { value: "92%", label: "of orders auto-created" },
      { value: "70%", label: "reduction in status-query calls" },
      { value: "45 sec", label: "average order entry time" },
    ],
    caseTeaser: {
      copy: "Tuesday, 9:12 AM: an Excel sheet and a scanned invoice arrive. By 9:13 the order is in the TMS.",
      cta: "Read the full story",
    },
    trust: {
      heading: "Every field has a source.",
      points: [
        { title: "Source-linked fields", text: "Each extracted field links back to its place in the email or attachment." },
        { title: "Full audit trail", text: "Every action is logged, visible and reversible." },
        { title: "Human approval below threshold", text: "Anything under the confidence score goes to a person." },
      ],
    },
    testimonial: {
      quote: "Our email inbox used to be the bottleneck. Now orders appear in the TMS before my team finishes their chai.",
      name: "Placeholder Name",
      role: "Transport Owner, Vashi (Placeholder)",
    },
    faqs: [
      { q: "What file types can it read?", a: "PDFs, scanned images, Excel and CSV sheets, and WhatsApp text or photos of documents. If your team can read it at a desk, we can usually read it." },
      { q: "What if my TMS has no API?", a: "No problem to start. We can confirm orders by email templates, spreadsheets, or assisted entry into your TMS screen. An API makes it faster, not possible." },
      { q: "How accurate is extraction?", a: "High-confidence fields are booked automatically; anything below the threshold goes to a human. You see a confidence score per field, and accuracy improves as it learns your formats." },
      { q: "What happens with amendments and cancellations?", a: "They patch the existing order instead of creating a new one, keep the full history, and trigger an updated confirmation to the customer." },
      { q: "Can it handle Hindi or Gujarati messages?", a: "Yes. It reads the mixed Hindi-Gujarati-English messages that are normal on logistics WhatsApp groups." },
      { q: "Who sees the exceptions?", a: "Whoever you assign to each queue. Every exception card shows the problem, the source document, and what the AI already tried." },
    ],
    related: ["voice-ai", "freight-capacity-matching", "compliance-finance"],
    finalCta: "Get the back office off your team's plate.",
  },

  "voice-ai": {
    seo: {
      title: "Voice AI - Phone lines handled in Hindi and Gujarati | Haulage AI",
      description: "Haulage AI calls and answers carriers, drivers and customers in Hindi and Gujarati, negotiates rates within your limits, and escalates only real decisions.",
    },
    hero: {
      headline: "Your phone lines, handled in Hindi and Gujarati.",
      subheadline:
        "Haulage AI calls and answers carriers, drivers, and customers, negotiates rates within your limits, and hands you only the decisions that matter.",
      mockup: "voice-hero",
    },
    integrations: {
      logos: ["Phone and telephony", "WhatsApp", "TMS", "GPS", "Calendar"],
      caption: "Calls connect straight into your operations data.",
    },
    problem: {
      heading: "Half your day is spent on the phone.",
      items: [
        { icon: PhoneCall, title: "Repeated 'where is my truck?' calls", text: "The same question, from every customer, every day." },
        { icon: Timer, title: "Chasing drivers for check-ins", text: "Pickup confirmed? Crossed the toll? Someone has to ask." },
        { icon: BadgePercent, title: "Slow rate negotiation across many carriers", text: "Rates move while you are on the other line." },
        { icon: PhoneMissed, title: "Missed calls that lose loads", text: "After-hours calls go unanswered, and the load goes elsewhere." },
      ],
    },
    steps: [
      { title: "Listen or dial", line: "Inbound and outbound calls." },
      { title: "Understand", line: "Detect Hindi or Gujarati, transcribe, read intent." },
      { title: "Act within your rules", line: "Check rate limits and live shipment data." },
      { title: "Confirm and log", line: "Write to the TMS, WhatsApp confirmation, escalate if needed." },
    ],
    extra: "language-band",
    features: [
      {
        title: "Freight status calls",
        mockup: "voice-status",
        bullets: ["Answers 'where is my truck?' instantly, 24/7", "Reads live GPS and milestone data", "Sends a WhatsApp tracking link after the call"],
      },
      {
        title: "Driver and carrier check-ins",
        mockup: "voice-checkins",
        bullets: ["Proactive calls at key milestones", "Captures delay reasons and updates the ETA", "Escalates when a driver is unreachable"],
      },
      {
        title: "Rate negotiation within your guardrails",
        mockup: "voice-negotiation",
        bullets: ["You set benchmark and ceiling per lane", "The agent negotiates turn by turn", "Nothing above your threshold closes without approval"],
      },
      {
        title: "Automated booking and confirmation",
        mockup: "voice-booking",
        bullets: ["Books the load once a deal is approved", "Sends confirmation and document checklist", "Logs call, transcript, and recording to the order"],
      },
    ],
    beforeAfter: [
      { task: "Calls handled per day", before: "Limited by team size", after: "Every call answered, 24/7" },
      { task: "Time to close a load", before: "Hours of phone tag", after: "Minutes, within your limits" },
      { task: "Missed calls", before: "Loads lost after hours", after: "None missed" },
      { task: "Team focus", before: "Routine calls", after: "Negotiation exceptions" },
    ],
    metrics: [
      { value: "85%", label: "of calls handled without a human" },
      { value: "6 min", label: "average time to close a load" },
      { value: "90%", label: "missed-call reduction" },
      { value: "20+ hrs", label: "phone time saved per week" },
    ],
    caseTeaser: {
      copy: "Tuesday, 10:05 AM: a truck owner in Ahmedabad picks up. The agent negotiates in Gujarati and closes the load within your limit.",
      cta: "Read the full story",
    },
    trust: {
      heading: "Control stays with you.",
      points: [
        { title: "Rate ceilings and approval thresholds", text: "You set the numbers per lane; the agent cannot cross them." },
        { title: "Instant human handoff", text: "Confused caller or low speech confidence means a person takes over." },
        { title: "Recording with consent", text: "The agent identifies itself as an AI and announces recording." },
        { title: "Full transcript and audit trail", text: "Every call, logged against the order." },
      ],
    },
    testimonial: {
      quote: "Drivers negotiate with the AI in Gujarati at 11 PM and the load is booked before I wake up.",
      name: "Placeholder Name",
      role: "Fleet Owner, Ahmedabad (Placeholder)",
    },
    faqs: [
      { q: "Which languages and accents are supported?", a: "Hindi, Gujarati and English today, tuned for Indian accents and the mixed highway Hindi drivers actually speak. Sample lines on this page are pending native-speaker review." },
      { q: "What happens if the agent does not understand the caller?", a: "It says so honestly, asks once more in simpler words, and if confidence stays low it hands the call to a human with the transcript." },
      { q: "Can it negotiate rates without my approval?", a: "Only within the benchmark and ceiling you set per lane. Anything above your threshold pauses for a one-tap approval." },
      { q: "How are call recording and consent handled?", a: "The agent introduces itself as an AI, announces that the call is recorded, and stores the consent. Recording and transcript attach to the order." },
      { q: "Does it work on noisy calls from highways and truck stops?", a: "It is built for noisy lines. When confidence drops on key numbers, it repeats them back and confirms by WhatsApp message." },
      { q: "Can callers tell it is an AI?", a: "Yes. It introduces itself as Haulage AI's assistant on every call. That transparency is by design." },
    ],
    related: ["freight-capacity-matching", "back-office-automation", "control-tower"],
    finalCta: "Get your team off the phone.",
  },

  "freight-capacity-matching": {
    seo: {
      title: "Freight and Capacity Matching - Fewer empty kilometres | Haulage AI",
      description: "Haulage AI finds spot loads, matches them to the right trucks, and fills spare pallet space, so fewer trucks run empty or half full.",
    },
    hero: {
      headline: "The right load on the right truck, without the phone calls.",
      subheadline:
        "Haulage AI finds spot loads, matches them to available trucks, and fills unused space, so fewer trucks run empty or half full.",
      mockup: "match-hero",
    },
    integrations: {
      logos: ["TMS", "GPS & FASTag", "WhatsApp", "Phone and telephony", "Rate benchmarks"],
      caption: "Matching runs on your live fleet and order data.",
    },
    problem: {
      heading: "Empty kilometres are the most expensive kilometres.",
      items: [
        { icon: PhoneCall, title: "Dispatchers matching loads to trucks by phone", text: "Every match is a dozen calls and a guess." },
        { icon: RotateCcw, title: "Return trips running empty", text: "The truck is coming back anyway. The load is not found in time." },
        { icon: PackageOpen, title: "Trucks leaving with spare pallet space", text: "Four empty pallet spaces are margin left on the floor." },
        { icon: EyeOff, title: "Good spot loads missed", text: "Nobody saw the message before someone else booked it." },
      ],
    },
    steps: [
      { title: "Discover", line: "Spot loads and open orders." },
      { title: "Match", line: "Rank trucks by fit, location, timing, and cost." },
      { title: "Fill", line: "Add part-loads to spare space on the route." },
      { title: "Book and track", line: "Confirm by voice or WhatsApp and follow the trip." },
    ],
    features: [
      {
        title: "Spot load discovery and selection",
        mockup: "match-spot",
        bullets: ["Surfaces loads that fit your trucks and lanes", "Scores each by margin, timing, and return-trip value", "Ignores loads that break your rules"],
      },
      {
        title: "AI load-to-truck matching",
        mockup: "match-trucks",
        bullets: ["Replaces manual phone coordination", "Explains every match", "Learns from your accepts and rejects"],
      },
      {
        title: "Part-load fill for unused space",
        mockup: "match-fill",
        bullets: ["Finds compatible loads going the same way", "Checks weight, pallet type, and delivery timing before combining", "Cuts cost per pallet and empty miles"],
      },
      {
        title: "The full coordination loop",
        mockup: "match-loop",
        bullets: ["The agent contacts the carrier by voice or WhatsApp", "Closes within your rate limits", "Books and then tracks, so no handover is dropped"],
      },
    ],
    beforeAfter: [
      { task: "Time to match a load", before: "30-60 minutes of calls", after: "Minutes, ranked with reasons" },
      { task: "Empty-run share", before: "Return legs often empty", after: "Matched before dispatch" },
      { task: "Average truck fill", before: "Trucks leave part-full", after: "Spare space filled on the corridor" },
      { task: "Dispatcher focus", before: "Phone coordination", after: "Approvals only" },
    ],
    metrics: [
      { value: "22%", label: "reduction in empty runs" },
      { value: "+14 pts", label: "average truck fill improvement" },
      { value: "8 min", label: "time to match a load" },
      { value: "11%", label: "cost per pallet reduction" },
    ],
    caseTeaser: {
      copy: "Tuesday, 9:40 AM: a 32 ft truck with 22 pallet spaces is matched, and a Jaipur-bound part-load fills the 4 spare spaces.",
      cta: "Read the full story",
    },
    trust: {
      heading: "You set the rules.",
      points: [
        { title: "Rate and margin limits per lane", text: "The matcher never books below your floor." },
        { title: "Compatibility checks", text: "Weight, pallet type and timing verified before any load is combined." },
        { title: "Approval above thresholds", text: "Anything outside your limits waits for a human." },
        { title: "A reason and audit trail for every match", text: "Every suggestion explains itself." },
      ],
    },
    testimonial: {
      quote: "Our Delhi return legs used to run empty half the week. Now the matcher fills them before the truck is even unloaded.",
      name: "Placeholder Name",
      role: "Dispatcher, Transport Company, Bhiwandi (Placeholder)",
    },
    faqs: [
      { q: "Where do the spot loads come from?", a: "Your inbound emails and WhatsApp messages, connected load boards, and shippers already on the platform. Which sources are active depends on the integrations you enable." },
      { q: "How does the AI decide which truck is the best match?", a: "It scores location, capacity, available time, cost and return-trip value, then explains the top picks in one line each. It learns from what you accept and reject." },
      { q: "Can it mix loads from different customers on one truck?", a: "Yes, but only after weight, pallet type and delivery-timing checks pass, and only when both customers allow part-loading." },
      { q: "Does it work with my own fleet and with hired trucks?", a: "Both. Hired trucks get confirmed by voice or WhatsApp, and their trip is tracked the same way as your own." },
      { q: "How are rates benchmarked?", a: "From your historical lane rates plus market rate feeds. Benchmarks are indicative and you can override them per lane. (Placeholder data source.)" },
      { q: "How do you measure empty runs?", a: "Loaded kilometres versus total kilometres per truck per week, from GPS and FASTag data." },
    ],
    related: ["voice-ai", "control-tower", "back-office-automation"],
    finalCta: "Put your fleet to work on the right loads.",
  },

  "warehouse-vision": {
    seo: {
      title: "Warehouse Vision - Get it right before the truck leaves | Haulage AI",
      description: "A tablet and camera at the packing bench check labels, packing and pallet builds against each retailer's rules in real time.",
    },
    hero: {
      headline: "Get it right before the truck leaves.",
      subheadline:
        "A tablet and camera at the packing bench check labels, packing, and pallet builds against each retailer's rules in real time.",
      mockup: "wh-hero",
    },
    integrations: {
      logos: ["Tablet app", "WMS", "ERP", "Retailer routing guides", "Barcode & QR scanning"],
      caption: "Runs on a tablet at the packing bench.",
    },
    problem: {
      heading: "Warehouse errors turn into chargebacks.",
      items: [
        { icon: Tag, title: "Wrong or misplaced labels", text: "One label on the wrong face is a deduction at the retailer's dock." },
        { icon: PackageOpen, title: "Pallets built to the wrong height or mix rules", text: "Every retailer is different. Nobody memorises them all." },
        { icon: BookOpen, title: "Retailer manuals nobody has time to read", text: "Hundreds of pages, updated without warning." },
        { icon: TruckIcon, title: "Errors found after the truck has left", text: "The fix costs ten times more at destination." },
      ],
    },
    steps: [
      { title: "Load the rules", line: "Retailer manuals indexed once." },
      { title: "Scan", line: "Camera captures label, carton, and pallet." },
      { title: "Check", line: "Vision and language models compare against the rules." },
      { title: "Fix or release", line: "Pass, fix prompt, or supervisor alert." },
    ],
    features: [
      {
        title: "Label verification",
        mockup: "wh-label",
        bullets: ["Checks label placement and readability", "Verifies barcode and content against the order", "Shows a clear pass or fail with the reason"],
      },
      {
        title: "Packing and carton checks",
        mockup: "wh-packing",
        bullets: ["Counts cartons and catches damage", "Flags wrong orientation or missing seals", "Guides new packers step by step"],
      },
      {
        title: "Palletization guidance",
        mockup: "wh-pallet",
        bullets: ["Checks height, weight, stacking, and mixed-SKU rules", "Suggests how to rebuild a failed pallet", "Confirms wrap and pallet labels before loading"],
      },
      {
        title: "Retailer-rule intelligence",
        mockup: "wh-rules",
        bullets: ["Upload retailer manuals once", "Every flag cites the rule it comes from", "Rules update when the manual changes"],
      },
    ],
    beforeAfter: [
      { task: "Chargeback rate", before: "Found at the retailer's dock", after: "Caught at the packing bench" },
      { task: "Rework time", before: "Repack after dispatch", after: "Fix on the spot" },
      { task: "New-packer training time", before: "Weeks reading manuals", after: "Guided checks from day one" },
      { task: "Audit readiness", before: "Photo hunt during disputes", after: "Evidence stored per pallet" },
    ],
    metrics: [
      { value: "Rs 3.1L", label: "chargebacks prevented per year" },
      { value: "97%", label: "pallets passed first time" },
      { value: "60%", label: "rework time reduction" },
      { value: "5 days", label: "new-packer ramp-up time" },
    ],
    caseTeaser: {
      copy: "Wednesday: the tablet flags a pallet at 1.8 m and a label on one side only. Both are fixed before loading.",
      cta: "Read the full story",
    },
    trust: {
      heading: "Your floor, your rules.",
      points: [
        { title: "Every flag shows the rule behind it", text: "The exact manual excerpt and page, on screen." },
        { title: "Supervisor override, logged", text: "A person can always release a pallet; the decision is recorded." },
        { title: "Photo evidence per pallet", text: "Stored for disputes with retailers and carriers." },
        { title: "Simple pass or fail for staff", text: "No manual reading on the floor." },
      ],
    },
    testimonial: {
      quote: "Chargebacks from one big retailer dropped to almost zero in a month. The tablet catches what tired eyes miss.",
      name: "Placeholder Name",
      role: "Warehouse Lead, 3PL, Narela (Placeholder)",
    },
    faqs: [
      { q: "What hardware do we need?", a: "An Android tablet with a decent camera at each packing bench. No fixed cameras or servers needed to start." },
      { q: "Does it work in poor lighting?", a: "It works in normal warehouse lighting. When an image is too dark or blurry, it asks for a rescan instead of guessing." },
      { q: "How are retailer manuals loaded and kept current?", a: "Upload the PDF once and we index the rules per retailer. Upload a new version when it changes and we highlight what moved." },
      { q: "What if the AI is wrong?", a: "A supervisor overrides on the spot. The override is logged with the photo and used to improve the checks." },
      { q: "Does it work with our WMS?", a: "Yes. It reads orders and SKUs from your WMS or TMS through an API or simple file exports." },
      { q: "How long does setup take per retailer?", a: "Typically a few days per manual, including a test run on your floor. (Placeholder timeline.)" },
    ],
    related: ["compliance-finance", "reverse-logistics", "control-tower"],
    finalCta: "Stop paying for packing errors.",
  },

  "compliance-finance": {
    seo: {
      title: "Compliance and Finance - Catch the error before it becomes a loss | Haulage AI",
      description: "Haulage AI checks packing against retailer manuals, audits every freight invoice, flags billing errors, and follows up on payments.",
    },
    hero: {
      headline: "Catch the error before it becomes a loss.",
      subheadline:
        "Haulage AI checks packing against retailer manuals, audits every freight invoice, flags billing errors, and follows up on payments.",
      mockup: "fin-hero",
    },
    integrations: {
      logos: ["Tally", "ERP", "TMS", "GST & e-way bill data", "Bank & UPI", "Email"],
      caption: "Audits run on the documents and data you already have.",
    },
    problem: {
      heading: "Money leaks at every handover.",
      items: [
        { icon: ClipboardX, title: "Chargebacks from packing-rule violations", text: "Retailer deductions that nobody had time to prevent." },
        { icon: ReceiptText, title: "Carrier invoices with unverified extras", text: "Detention and loading charges paid without evidence." },
        { icon: AlertTriangle, title: "Billing errors found weeks late", text: "By the time the ledger is checked, the money is gone." },
        { icon: HandCoins, title: "Collections chased by hand", text: "Reminder calls and messages compete with everything else." },
      ],
    },
    steps: [
      { title: "Ingest", line: "Invoices, PODs, manuals, rate contracts." },
      { title: "Compare", line: "Against contracts, timestamps, and retailer rules." },
      { title: "Flag", line: "Variance with evidence." },
      { title: "Resolve", line: "Approve, dispute, or collect." },
    ],
    features: [
      {
        title: "Retailer-manual compliance checks",
        mockup: "fin-manual",
        bullets: ["Reads retailer manuals and turns them into checks", "Validates packing and documents before dispatch", "Cites the rule behind every result"],
      },
      {
        title: "Invoice audit",
        mockup: "fin-audit",
        bullets: ["Matches invoices to rate contracts, PODs, and gate timestamps", "Catches duplicate and excess charges", "Approve or dispute in one click"],
      },
      {
        title: "Billing error detection",
        mockup: "fin-anomaly",
        bullets: ["Flags errors before invoices go out", "Checks GST and document consistency", "Learns your customers' usual patterns"],
      },
      {
        title: "Automated collections",
        mockup: "fin-collections",
        bullets: ["Reminders follow your tone and schedule", "Customers can reply and pay from the message", "Escalates only when judgment is needed"],
      },
    ],
    beforeAfter: [
      { task: "Invoice audit time", before: "Days at month-end", after: "Continuous, same day" },
      { task: "Leakage caught", before: "Found weeks late, if at all", after: "Flagged before payment" },
      { task: "Days sales outstanding", before: "Chased by hand", after: "Reminders on schedule, paid from the message" },
      { task: "Finance team focus", before: "Reconciliation", after: "Disputes and decisions" },
    ],
    metrics: [
      { value: "Rs 2.8L", label: "variance caught per month" },
      { value: "Rs 4.2L", label: "chargebacks prevented per year" },
      { value: "9 days", label: "faster collection" },
      { value: "30 hrs", label: "saved in reconciliation per month" },
    ],
    caseTeaser: {
      copy: "Next week: a transporter invoice claims 5 hours of detention. The gate timestamps show 2.",
      cta: "Read the full story",
    },
    trust: {
      heading: "Every flag comes with evidence.",
      points: [
        { title: "Source-linked flags", text: "Each flag links to the exact invoice line and document." },
        { title: "Finance approves every dispute", text: "Nothing is disputed or written off without a person." },
        { title: "Your schedule, your tone", text: "Payment reminders go out the way you would send them." },
        { title: "Full audit trail", text: "Every check and decision is logged." },
      ],
    },
    testimonial: {
      quote: "The first audit run paid for the year. It caught duplicate detention charges we had been paying for months.",
      name: "Placeholder Name",
      role: "Finance Head, FMCG Shipper, Mumbai (Placeholder)",
    },
    faqs: [
      { q: "Which documents can it audit?", a: "Freight invoices, PODs, rate contracts, detention claims, and e-way bill and GST data. If finance checks it today, we can check it faster." },
      { q: "How does it know my contract rates?", a: "You upload rate contracts once. We extract lane rates and validity periods, and flag contracts that are about to expire." },
      { q: "Can it dispute charges with carriers automatically?", a: "It prepares the dispute with evidence and wording. A human approves before anything goes to the carrier." },
      { q: "How does it handle GST and TDS details?", a: "It checks GSTIN, tax rates and invoice consistency and flags mismatches. It is not a tax filing tool; your CA stays in charge." },
      { q: "Will collection messages go out without approval?", a: "Standard reminders follow your approved template and schedule. Anything off-script, like a discount or escalation, needs approval." },
      { q: "How accurate is variance detection?", a: "Rate, duplicate and timestamp checks are deterministic. Judgment calls are flagged with a confidence score and the evidence attached." },
    ],
    related: ["warehouse-vision", "back-office-automation", "reverse-logistics"],
    finalCta: "Stop paying for errors you cannot see.",
  },

  "control-tower": {
    seo: {
      title: "Control Tower - One screen, every shipment | Haulage AI",
      description: "Haulage AI plans, dispatches, tracks and adjusts continuously, and brings you ranked options when something breaks.",
    },
    hero: {
      headline: "One screen. Every shipment. Problems fixed before you ask.",
      subheadline:
        "Haulage AI plans, dispatches, tracks, and adjusts continuously, and brings you ranked options when something breaks.",
      mockup: "ct-hero",
    },
    integrations: {
      logos: ["GPS & FASTag", "Weather", "Traffic", "TMS", "WhatsApp", "Telephony"],
      caption: "The control tower runs on live data.",
    },
    problem: {
      heading: "Operations run on firefighting.",
      items: [
        { icon: Siren, title: "Problems discovered after the delay", text: "You hear about the breakdown when the customer calls." },
        { icon: PhoneOff, title: "Breakdowns that need a dozen phone calls", text: "Driver, workshop, replacement truck, customer, consignee." },
        { icon: Shuffle, title: "Re-planning done by hand under pressure", text: "Spreadsheets and guesswork at 2 AM." },
        { icon: EyeOff, title: "No single view of what needs attention", text: "Status lives in five apps and three people's heads." },
      ],
    },
    steps: [
      { title: "Plan", line: "Assign vehicles and routes." },
      { title: "Dispatch", line: "Confirm drivers, documents, and customers." },
      { title: "Track", line: "Live location and milestone monitoring." },
      { title: "Adjust", line: "Detect disruptions and re-plan." },
    ],
    features: [
      {
        title: "Live control tower",
        mockup: "ct-live",
        bullets: ["One screen for the whole operation", "Exceptions first, everything else collapsed", "Every AI action visible and reversible"],
      },
      {
        title: "Disruption monitoring",
        mockup: "ct-alerts",
        bullets: ["Watches traffic, weather, and vehicle signals", "Links each alert to shipments and delivery slots", "Warns customers before they ask"],
      },
      {
        title: "Solver-backed re-planning",
        mockup: "ct-solver",
        bullets: ["A constraint solver finds feasible plans", "The AI explains the tradeoffs in plain language", "One-tap approval"],
      },
      {
        title: "Automated procurement and notifications",
        mockup: "ct-procure",
        bullets: ["Finds and books replacement trucks", "Rebooks delivery slots with consignees", "Keeps every party informed automatically"],
      },
    ],
    beforeAfter: [
      { task: "Time to respond to a disruption", before: "Hours", after: "Minutes, with ranked options" },
      { task: "On-time delivery", before: "Firefighting after the slip", after: "Exceptions handled before they slip" },
      { task: "Calls per exception", before: "A dozen", after: "One approval" },
      { task: "Visibility", before: "Scattered across apps and people", after: "One screen" },
    ],
    metrics: [
      { value: "+6 pts", label: "on-time delivery improvement" },
      { value: "40 min", label: "average recovery from disruption" },
      { value: "120", label: "manual re-plans avoided per month" },
      { value: "78%", label: "exceptions resolved without escalation" },
    ],
    caseTeaser: {
      copy: "Friday, 2:10 AM: a breakdown near Beawar threatens the delivery slot. One approval later, it is handled.",
      cta: "Read the full story",
    },
    trust: {
      heading: "Autonomy within your limits.",
      points: [
        { title: "Spend limits on automatic actions", text: "The tower cannot spend above your ceiling without approval." },
        { title: "Options with cost and SLA impact", text: "Every recommendation shows the tradeoff." },
        { title: "Every action can be overridden", text: "Humans can reverse anything the AI did." },
        { title: "Complete decision log", text: "Who approved what, when, and why." },
      ],
    },
    testimonial: {
      quote: "The night shift used to mean phone calls at 3 AM. Now I approve one option in the morning and read what happened.",
      name: "Placeholder Name",
      role: "Ops Manager, 3PL, Bhiwandi (Placeholder)",
    },
    faqs: [
      { q: "What disruptions does it detect?", a: "Traffic and weather on the route, breakdowns from driver calls or telematics, gate delays, and missed milestones." },
      { q: "How does the solver choose options?", a: "A constraint solver generates feasible plans and ranks them by cost and SLA impact. The AI explains each option in plain language." },
      { q: "Can it act without approval?", a: "Only within the spend limits you set. Everything above that, and anything unusual, waits for a one-tap approval." },
      { q: "How is live location tracked?", a: "GPS devices, FASTag events, the driver app, or check-in calls, whichever your fleet has." },
      { q: "What if data sources conflict?", a: "It shows both sources with their freshness, picks the more recent, and flags the uncertainty instead of hiding it." },
      { q: "How does it handle multi-stop routes?", a: "It plans sequences with time windows per stop and re-sequences the remaining stops when one slips." },
    ],
    related: ["freight-capacity-matching", "voice-ai", "reverse-logistics"],
    finalCta: "Run operations without the firefighting.",
  },

  "reverse-logistics": {
    seo: {
      title: "Reverse Logistics - Returns that run themselves | Haulage AI",
      description: "Haulage AI opens return requests, files claims with evidence, and matches return legs, so rejected goods do not become lost money.",
    },
    hero: {
      headline: "Returns that run themselves.",
      subheadline:
        "Haulage AI opens return requests, files claims with evidence, and matches return legs, so rejected goods do not become lost money.",
      mockup: "rl-hero",
    },
    integrations: {
      logos: ["TMS", "WMS", "ERP", "WhatsApp", "Insurer & claims portals", "Tally"],
      caption: "Returns connect to the systems that already hold the orders.",
    },
    problem: {
      heading: "Returns are where margin disappears.",
      items: [
        { icon: Inbox, title: "Return requests tracked across email and calls", text: "Nobody owns the return, so everybody does." },
        { icon: FileClock, title: "Claims filed late or without evidence", text: "Miss the window and the claim is dead." },
        { icon: Undo2, title: "Empty return trucks while returns wait", text: "The truck goes back empty; the cartons wait for a full-fare trip." },
        { icon: CircleDollarSign, title: "No view of value recovered versus lost", text: "Write-offs blend into the month-end." },
      ],
    },
    steps: [
      { title: "Trigger", line: "Rejection, damage, or shortage found at delivery." },
      { title: "Document", line: "POD, photos, reasons." },
      { title: "Move", line: "Match a return leg and book it." },
      { title: "Recover", line: "File the claim and track the credit note." },
    ],
    features: [
      {
        title: "Automated return workflows",
        mockup: "rl-rma",
        bullets: ["Opens a return from a POD note or customer message", "Assigns pickup and tracks it", "Keeps customer and supplier informed"],
      },
      {
        title: "Claim and invoice recovery",
        mockup: "rl-claim",
        bullets: ["Builds the claim with evidence automatically", "Files with the carrier or insurer", "Tracks credit notes to closure"],
      },
      {
        title: "Return-leg matching",
        mockup: "rl-return",
        bullets: ["Matches returns to trucks already going that way", "Matches suppliers and carriers for reverse transit", "Cuts the cost of return freight"],
      },
      {
        title: "Loss management",
        mockup: "rl-loss",
        bullets: ["Shows where value is being lost", "Highlights repeat causes by customer, lane, or carrier", "Feeds fixes back to warehouse and dispatch"],
      },
    ],
    beforeAfter: [
      { task: "Time to open a claim", before: "Days, when someone remembers", after: "Same day, automatically" },
      { task: "Claim recovery rate", before: "Often written off", after: "Filed on time, with evidence" },
      { task: "Return transit cost", before: "Full-fare return trip", after: "Matched return leg" },
      { task: "Coordination effort", before: "Email chains across three parties", after: "One pipeline, visible to all" },
    ],
    metrics: [
      { value: "Rs 6.5L", label: "claim value recovered per year" },
      { value: "12 days", label: "to credit note" },
      { value: "30%", label: "return cost reduction" },
      { value: "200", label: "manual follow-ups avoided per month" },
    ],
    caseTeaser: {
      copy: "Following days: 6 rejected cartons become a return request, a claim with photos and POD, and a matched truck heading back to Mumbai.",
      cta: "Read the full story",
    },
    trust: {
      heading: "Evidence first.",
      points: [
        { title: "Claims packed with source evidence", text: "POD, photos and timestamps, assembled automatically." },
        { title: "Approvals on claim amounts", text: "Anything above your limit waits for a person." },
        { title: "Status visible to supplier and customer", text: "Everyone sees the same pipeline." },
        { title: "Full audit trail", text: "Every return, from rejection to credit note." },
      ],
    },
    testimonial: {
      quote: "Returns used to be a drawer full of pending claims. Now they are a board with a credit note at the end.",
      name: "Placeholder Name",
      role: "Logistics Head, D2C Brand, Delhi (Placeholder)",
    },
    faqs: [
      { q: "What triggers a return?", a: "A POD note marking rejection, damage or shortage, a customer message, or a scan at the receiving dock." },
      { q: "How are claims proven?", a: "The claim packet is assembled automatically: POD, photos, gate timestamps and the invoice." },
      { q: "Which insurers or carriers does it work with?", a: "It files in each carrier's or insurer's format by email or portal upload. Direct portal integrations are on the roadmap. (Placeholder.)" },
      { q: "Can suppliers see the status?", a: "Yes. Suppliers and customers get a shared status link and WhatsApp updates at each stage." },
      { q: "How is return freight priced?", a: "Returns are matched to trucks already returning on that corridor and priced against your lane benchmarks." },
      { q: "Can it handle partial returns?", a: "Yes. RMAs work at quantity level, with a reason per item or carton." },
    ],
    related: ["compliance-finance", "freight-capacity-matching", "warehouse-vision"],
    finalCta: "Recover more from every return.",
  },
};
