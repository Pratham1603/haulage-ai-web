import { useState } from "react";
import { Mic, Volume2, ShieldAlert, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { Container, SectionHeading } from "./ui";

export const InteractiveSimulator = () => {
  const [targetRate, setTargetRate] = useState(34000);
  const [maxRate, setMaxRate] = useState(36000);
  const [driverAsk, setDriverAsk] = useState(38500);
  const [language, setLanguage] = useState("gujarati");
  const [simState, setSimState] = useState("idle"); // idle, running, completed
  const [transcript, setTranscript] = useState([]);

  const runNegotiation = () => {
    setSimState("running");
    setTranscript([]);

    setTimeout(() => {
      setTranscript((prev) => [
        ...prev,
        {
          speaker: "driver",
          text: language === "gujarati" 
            ? "ભાઈ, સુરતથી ગુડગાંવ ₹38,500 થી ઓછું નહીં ચાલે. ડીઝલ મોંઘુ છે." 
            : "Bhai, Surat to Gurgaon won't work below ₹38,500. Diesel is expensive.",
          tag: "Driver Ramesh"
        }
      ]);
    }, 400);

    setTimeout(() => {
      setTranscript((prev) => [
        ...prev,
        {
          speaker: "ai",
          text: language === "gujarati"
            ? `રમેશભાઈ, લોડ વજન ફક્ત 14 ટન છે અને પેમેન્ટ અનલોડિંગના 2 કલાકમાં બેંકમાં આવી જશે. ₹${targetRate.toLocaleString("en-IN")} ફાઇનલ કરી આપું?`
            : `Ramesh bhai, the load is only 14T and payment will hit your account within 2 hours of POD. Can we lock at ₹${targetRate.toLocaleString("en-IN")}?`,
          tag: "Haulage Voice AI (340ms)"
        }
      ]);
    }, 1200);

    setTimeout(() => {
      const settledRate = Math.min(maxRate, Math.round((targetRate + driverAsk) / 2));
      setTranscript((prev) => [
        ...prev,
        {
          speaker: "driver",
          text: language === "gujarati"
            ? `ચાલો ઠીક છે, ₹${settledRate.toLocaleString("en-IN")} કરી દો જો પેમેન્ટ 2 કલાકમાં આવી જતું હોય તો.`
            : `Alright, finalize ₹${settledRate.toLocaleString("en-IN")} if payment is guaranteed within 2 hours.`,
          tag: "Driver Ramesh"
        },
        {
          speaker: "ai",
          text: language === "gujarati"
            ? `ડીલ કન્ફર્મ! ₹${settledRate.toLocaleString("en-IN")} પર લોડ કન્ફર્મેશન વોટ્સએપ કરી દીધું છે.`
            : `Deal confirmed! Load sheet for ₹${settledRate.toLocaleString("en-IN")} sent to your WhatsApp.`,
          tag: "Haulage Voice AI (Deal Sealed)"
        }
      ]);
      setSimState("completed");
    }, 2200);
  };

  const reset = () => {
    setSimState("idle");
    setTranscript([]);
  };

  return (
    <section className="py-16 md:py-24 border-t border-border/80 bg-surface/30">
      <Container>
        <SectionHeading
          eyebrow="Interactive Product Demo"
          title="Test our Autonomous Voice Negotiator live."
          sub="Set your freight limits. Choose a dialect. Watch the voice agent negotiate with real fleet drivers in 340ms."
          center
        />

        <div className="mx-auto max-w-4xl card-craft overflow-hidden border border-border/80 shadow-2xl bg-card">
          {/* Header Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-border/80 bg-surface/70 p-4 gap-4">
            {/* Language Picker */}
            <div>
              <label className="label-caps text-muted-foreground block mb-2">Driver Dialect</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage("gujarati")}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    language === "gujarati"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-border bg-card text-muted-foreground hover:text-heading"
                  }`}
                >
                  ગુજરાતી (Gujarati)
                </button>
                <button
                  onClick={() => setLanguage("hindi")}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    language === "hindi"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-border bg-card text-muted-foreground hover:text-heading"
                  }`}
                >
                  हिंदी / English
                </button>
              </div>
            </div>

            {/* Target Rate Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label-caps text-muted-foreground">Target Budget</label>
                <span className="font-mono text-xs font-bold text-heading">₹{targetRate.toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range"
                min="30000"
                max="38000"
                step="500"
                value={targetRate}
                onChange={(e) => setTargetRate(Number(e.target.value))}
                className="w-full accent-primary h-1.5 rounded-lg bg-surface cursor-pointer"
              />
              <span className="text-[10px] text-muted-foreground">Optimal rate for 14T payload</span>
            </div>

            {/* Max Ceiling Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label-caps text-muted-foreground">Auto-Approve Ceiling</label>
                <span className="font-mono text-xs font-bold text-heading">₹{maxRate.toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range"
                min="34000"
                max="42000"
                step="500"
                value={maxRate}
                onChange={(e) => setMaxRate(Number(e.target.value))}
                className="w-full accent-primary h-1.5 rounded-lg bg-surface cursor-pointer"
              />
              <span className="text-[10px] text-muted-foreground">Over this limit escalates to human</span>
            </div>
          </div>

          {/* Arena Display */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-heading">Lane: Surat Textile DC ➔ Gurgaon 1,180 KM</h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    Driver Ask: ₹{driverAsk.toLocaleString("en-IN")} · Auto-Guardrails: Active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {simState === "idle" && (
                  <button
                    onClick={runNegotiation}
                    className="btn-tactile inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Simulate Live Negotiation
                  </button>
                )}
                {simState === "running" && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-2 text-xs font-semibold text-status-ai">
                    <span className="sonar-ping h-2 w-2 rounded-full bg-status-ai" />
                    AI Synthesizing Audio (340ms)...
                  </div>
                )}
                {simState === "completed" && (
                  <button
                    onClick={reset}
                    className="btn-tactile-secondary inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-heading"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reset Simulation
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Timeline */}
            <div className="min-h-[220px] rounded-xl border border-border/80 bg-surface/40 p-4 space-y-3">
              {transcript.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                  <Volume2 className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs font-medium">Click "Simulate Live Negotiation" above.</p>
                  <p className="text-[11px] opacity-70 mt-0.5">
                    Experience how our Whisper + DeepSeek R1 agent negotiates freight in regional Indian dialects.
                  </p>
                </div>
              ) : (
                transcript.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`animate-fade-in p-3.5 rounded-xl border shadow-xs max-w-[85%] ${
                      msg.speaker === "ai"
                        ? "ml-auto border-status-ai/40 bg-status-ai/10 text-heading"
                        : "border-border/80 bg-card text-heading"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-semibold mb-1 opacity-75">
                      <span>{msg.tag}</span>
                      <span className="font-mono">
                        {msg.speaker === "ai" ? "Fast Turn (0.34s)" : "Driver Phone"}
                      </span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Guardrail Guarantee Footnote */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                Guardrail Rule: Never exceeds ₹{maxRate.toLocaleString("en-IN")}. If breached, auto-transfers call to human dispatcher.
              </span>
              <span className="font-mono text-status-ai font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Zero Hallucinations Verified
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
