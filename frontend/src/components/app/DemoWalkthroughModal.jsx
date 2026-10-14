import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, X, ChevronRight, ChevronLeft, ArrowRight, CheckCircle2,
  FileText, Truck, Phone, Radar, Warehouse, Bot, Play, Compass
} from "lucide-react";
import { ActionBtn } from "./bits";

const STEPS = [
  {
    step: 1,
    title: "1. Visual Document OCR & Back-Office Ingestion",
    tag: "Module 1 Intake",
    path: "/app/orders",
    icon: FileText,
    headline: "Zero-touch document processing from Email, WhatsApp & PDF",
    summary:
      "Haulage AI automatically ingests PDFs, Excel indents, and scanned LR Challans. Watch the animated laser scan extract all 8 freight fields with 96% AI confidence, flagging a 14.2 t vs 14.5 t weight mismatch for human sign-off before writing directly to the TMS.",
    actionLabel: "Open Orders & OCR Scanner",
    tip: "Tip: Switch to the 'Visual Document OCR Scanner' tab on Orders to see presets and animated bounding boxes.",
  },
  {
    step: 2,
    title: "2. Carrier Matchmaking & 3D Truck Cargo Deck",
    tag: "Module 3 Matching",
    path: "/app/loads",
    icon: Truck,
    headline: "Axle-balanced load optimization & 100% volumetric fill",
    summary:
      "Open loads are automatically matched against available fleet trucks based on corridor history, capacity, and cost arbitrage. The interactive 3D Cargo Deck visualizer displays 22 pallet slots on a 32 ft MXL container with MoRTH axle balance gauges and 1-click consolidation of 4 spare pallets (+₹9,200 margin).",
    actionLabel: "View Loads & 3D Cargo Bed",
    tip: "Tip: Click 'Consolidate 4 Spare Pallets' in the capacity visualizer to watch the pallets snap into the truck bed.",
  },
  {
    step: 3,
    title: "3. Multilingual Voice AI Agent (Gujarati & Hindi)",
    tag: "Module 2 Voice",
    path: "/app/calls",
    icon: Phone,
    headline: "Autonomous carrier rate negotiation & driver check-ins",
    summary:
      "Hear human-like voice agents negotiating freight rates in Gujarati with truck owner Hasmukhbhai, closing at ₹74,500 (saving ₹3,500 vs the ₹78,000 ceiling). Features live dialing states, call timers, and line-by-line synchronized speech synthesis with native audio playback.",
    actionLabel: "Listen to Voice AI Negotiation",
    tip: "Tip: Click 'Start Simulated Audio Playback' or 'Call Driver' to test live bilingual speech synthesis.",
  },
  {
    step: 4,
    title: "4. Live Control Tower & Corridor Telematics",
    tag: "Operations Control",
    path: "/app",
    icon: Radar,
    headline: "Exceptions-first operational triage & NH-48 telemetry",
    summary:
      "Prioritizes anomalies requiring human approval. The interactive NH-48 corridor station lets you inspect live telematics for trucks between Mumbai and Delhi, including OBD-II engine fault codes, pharma cold-chain reefer temps (+3.8°C), and automated FASTag electronic toll audits.",
    actionLabel: "Go to Control Tower",
    tip: "Tip: Click pins on the NH-48 corridor map or try 'Simulate Detour' to trigger geofence alerts.",
  },
  {
    step: 5,
    title: "5. Warehouse Vision & 3-Way Invoice Audit",
    tag: "Vision & Finance",
    path: "/app/warehouse",
    icon: Warehouse,
    headline: "Computer Vision packing checks & evidence-linked billing",
    summary:
      "Packing bench cameras automatically inspect pallets against retailer routing guides (enforcing 1.6 m height limits and dual SSCC labels). In Finance, every detention discrepancy links to automated warehouse gate timestamps, preventing duplicate billings.",
    actionLabel: "Inspect Warehouse Vision",
    tip: "Tip: Click 'Mark fixed & re-scan' on Pallet 7 or 12 to test live MongoDB state updates.",
  },
  {
    step: 6,
    title: "6. AI Operations Copilot Assistant",
    tag: "AI Copilot",
    path: "/app",
    icon: Bot,
    headline: "Conversational intelligence across live freight data",
    summary:
      "Ask natural-language questions about corridor disruptions, agreed carrier quotes, or warehouse packing status. The Copilot queries live MongoDB collections and provides 1-click operational action buttons and live KPI metrics.",
    actionLabel: "Open Operations Copilot",
    tip: "Tip: Use the top search bar or floating 'Ask Copilot' button to ask questions anytime.",
  },
];

export const DemoWalkthroughModal = ({ isOpen, onClose, onOpenCopilot }) => {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!isOpen) return null;

  const current = STEPS[currentIdx];
  const Icon = current.icon;

  const handleNavigate = () => {
    if (current.step === 6 && onOpenCopilot) {
      onOpenCopilot();
      onClose();
    } else {
      navigate(current.path);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-modal-title"
        className="relative w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-2xl transition-all"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 id="tour-modal-title" className="font-heading text-lg font-bold text-heading">
                Haulage AI · Product Walkthrough Tour
              </h2>
              <p className="text-xs text-muted-foreground">
                Step-by-step showcase of the 6 core AI capabilities
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tour modal"
            className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-heading transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="mt-4 flex items-center justify-between gap-1.5">
          {STEPS.map((s, idx) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={`h-2 flex-1 rounded-full transition-all ${
                idx === currentIdx
                  ? "bg-primary"
                  : idx < currentIdx
                  ? "bg-primary/50"
                  : "bg-border"
              }`}
              title={s.title}
            />
          ))}
        </div>

        {/* Card Content Body */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Icon className="h-3.5 w-3.5" /> {current.tag}
            </span>
            <span className="text-xs font-mono font-medium text-muted-foreground">
              Step {currentIdx + 1} of {STEPS.length}
            </span>
          </div>

          <div>
            <h3 className="font-heading text-base font-bold text-heading sm:text-lg">
              {current.title}
            </h3>
            <p className="mt-0.5 text-sm font-semibold text-primary">
              {current.headline}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {current.summary}
          </p>

          <div className="rounded-xl border border-border/80 bg-surface/80 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-heading">{current.tip}</p>
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentIdx((i) => Math.min(STEPS.length - 1, i + 1))}
              disabled={currentIdx === STEPS.length - 1}
              className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-heading"
            >
              Close
            </button>
            <ActionBtn primary onClick={handleNavigate}>
              {current.actionLabel} <ArrowRight className="h-3.5 w-3.5 ml-1 inline" />
            </ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
};
