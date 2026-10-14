import { useEffect, useState, useRef } from "react";
import { Phone, Play, Volume2, Square, PhoneCall, PhoneOff, Radio, CheckCircle2 } from "lucide-react";
import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel } from "../../components/app/bits";
import { useMock, CALL_TRANSCRIPTS } from "../../mock/store";
import { apiRequest, LIVE_API_ENABLED } from "../../lib/api";
import { LiveNegotiationArena } from "../../components/app/LiveNegotiationArena";

const Waveform = ({ active }) => (
  <span className="flex items-end gap-0.5" aria-hidden="true">
    {[6, 12, 8, 16, 10, 14, 7, 13, 9, 15, 6, 11, 8, 14, 10, 5, 12, 9].map((h, i) => (
      <span
        key={i}
        className={`w-1 rounded-full transition-all ${active ? "animate-pulse bg-status-ai" : "bg-status-ai/70"}`}
        style={{ height: `${active ? (h * 1.3) % 18 + 4 : h}px` }}
      />
    ))}
  </span>
);

const Calls = () => {
  const { calls: demoCalls } = useMock();
  const [calls, setCalls] = useState(demoCalls);
  const [liveError, setLiveError] = useState("");
  const [open, setOpen] = useState("call-1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLine, setActiveLine] = useState(null);
  const [callState, setCallState] = useState("idle"); // idle, dialing, connected, ended
  const [speechLang, setSpeechLang] = useState("native"); // native or en
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!LIVE_API_ENABLED) return undefined;
    let active = true;
    apiRequest("/operations/calls")
      .then((records) => {
        if (!active || !records.length) return;
        const liveList = records.map((record) => ({
          id: record.task_id || record.id,
          live: true,
          entityId: record.entity_id,
          lang: record.result?.language || "Gujarati",
          who: record.result?.contact || record.entity_id || "Voice task",
          outcome: record.result?.summary || record.state,
          duration: record.result?.duration || "02:45",
          time: record.updated_at ? new Date(record.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "now",
          tag: record.state === "completed" ? "ai" : "human",
          transcript: record.result?.transcript,
        }));
        // Merge live MongoDB voice calls with demo calls so all scenarios are accessible
        setCalls([...liveList, ...demoCalls]);
        if (liveList.length > 0) {
          setOpen(liveList[0].id);
        }
      })
      .catch((error) => {
        if (active) setLiveError(error.message);
      });
    return () => {
      active = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCall = calls.find((item) => item.id === open) || calls[0];
  const transcript =
    currentCall?.transcript ||
    CALL_TRANSCRIPTS[open] ||
    (currentCall?.lang?.toLowerCase().includes("gujarati") ? CALL_TRANSCRIPTS["call-1"] : CALL_TRANSCRIPTS["call-2"]);

  const stopCall = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
    setActiveLine(null);
    setCallState("ended");
  };

  const startTask = async () => {
    const call = calls.find((item) => item.id === open);
    if (!call?.id) return;
    try {
      const task = await apiRequest(`/voice/tasks/${call.id}/start`, { method: "POST" });
      setCalls((current) => current.map((item) => (item.id === call.id ? { ...item, outcome: task.state, providerCallId: task.provider_call_id } : item)));
    } catch (error) {
      setLiveError(error.message);
    }
  };

  const speakTurn = (lines, index) => {
    if (index >= lines.length) {
      stopCall();
      return;
    }

    setActiveLine(index);
    const line = lines[index];
    const textToSpeak = speechLang === "en" ? line.en : (line.native || line.en);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = line.who === "AI" ? 1.05 : 0.9;

    utterance.onend = () => {
      setTimeout(() => {
        speakTurn(lines, index + 1);
      }, 500);
    };

    utterance.onerror = () => {
      setTimeout(() => {
        speakTurn(lines, index + 1);
      }, 500);
    };

    window.speechSynthesis.speak(utterance);
  };

  const startCallSimulation = () => {
    if (!("speechSynthesis" in window) || !transcript?.lines?.length) return;
    window.speechSynthesis.cancel();
    if (timerRef.current) clearInterval(timerRef.current);

    setCallState("dialing");
    setIsPlaying(true);
    setCallDuration(0);

    setTimeout(() => {
      setCallState("connected");
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      speakTurn(transcript.lines, 0);
    }, 1200);
  };

  const formatSecs = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div data-testid="calls-page">
      <Seo title="Calls - Haulage AI" description="Voice AI call log demo with Hindi and Gujarati transcripts and English translations." />
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Calls · Voice AI Operations Hub</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Recorded carrier quotations, rate negotiations, and driver check-ins with consent. {LIVE_API_ENABLED ? "Live MongoDB Connected." : "Demo data."}
      </p>
      {liveError && <p className="mt-2 text-xs text-status-human" role="alert">Live calls unavailable: {liveError}</p>}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-2.5" data-testid="calls-list">
          {calls.map((c) => (
            <button
              key={c.id}
              type="button"
              data-testid={c.id}
              onClick={() => {
                setOpen(c.id);
                stopCall();
              }}
              aria-pressed={open === c.id}
              className={`block w-full rounded-xl border p-4 text-left transition-colors ${
                open === c.id ? "border-status-ai/50 bg-status-ai/10" : "bg-card shadow-sm hover:bg-accent"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-heading">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {c.who}
                </span>
                <StatusTag variant={c.tag} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{c.outcome}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{c.lang} · {c.duration} · {c.time}</p>
            </button>
          ))}
        </div>

        <Panel title={transcript ? transcript.title : "Transcript"} testId="call-detail">
          {/* Active Call Controls */}
          <div className="mb-4 rounded-xl border bg-surface p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
              <div className="flex items-center gap-2">
                {callState === "connected" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE CALL {formatSecs(callDuration)}
                  </span>
                )}
                {callState === "dialing" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 animate-pulse">
                    <Radio className="h-3 w-3" /> Dialing Carrier...
                  </span>
                )}
                {callState === "ended" && (
                  <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-status-ai" /> Completed
                  </span>
                )}
                {callState === "idle" && (
                  <span className="text-[11px] font-medium text-muted-foreground">Telephony Simulator Ready</span>
                )}
              </div>

              {/* Language toggle */}
              <div className="flex rounded-lg border bg-card p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSpeechLang("native")}
                  className={`rounded-md px-2 py-0.5 font-medium transition-all ${speechLang === "native" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}
                >
                  Native ({currentCall?.lang || "Indian"})
                </button>
                <button
                  type="button"
                  onClick={() => setSpeechLang("en")}
                  className={`rounded-md px-2 py-0.5 font-medium transition-all ${speechLang === "en" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}
                >
                  English Audio
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Waveform active={isPlaying} />
                <span className="text-[11px] text-muted-foreground font-mono">
                  {isPlaying ? (activeLine !== null ? `Speaking turn ${activeLine + 1}/${transcript?.lines?.length}` : "Connecting audio...") : "Press 'Simulate Call' to hear live turn-by-turn dialogue"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isPlaying ? (
                  <button
                    type="button"
                    onClick={stopCall}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/20"
                  >
                    <PhoneOff className="h-3.5 w-3.5" /> End Call
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startCallSimulation}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-status-ai px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:opacity-90"
                  >
                    <PhoneCall className="h-3.5 w-3.5" /> 🔊 Simulate Live Call (TTS)
                  </button>
                )}
                {LIVE_API_ENABLED && currentCall?.live && (
                  <button
                    type="button"
                    onClick={startTask}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Play className="h-3 w-3" /> Backend Task
                  </button>
                )}
              </div>
            </div>
          </div>

          {transcript ? (
            <>
              {/* Turn-by-turn transcript lines with active highlighting */}
              <ul className="space-y-3">
                {transcript.lines.map((l, i) => {
                  const isCurrent = activeLine === i;
                  return (
                    <li
                      key={i}
                      className={`max-w-[92%] rounded-xl border p-3.5 transition-all ${
                        isCurrent
                          ? "ring-2 ring-status-ai border-status-ai shadow-md bg-status-ai/15 scale-[1.01]"
                          : l.who === "AI"
                          ? "ml-auto border-status-ai/30 bg-status-ai/10"
                          : "bg-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {l.who === "AI" ? "🤖 Haulage Voice AI" : `👤 ${currentCall?.who?.split("·")[0] || l.who}`}
                        </span>
                        {isCurrent && (
                          <span className="flex items-center gap-1 rounded-full bg-status-ai px-2 py-0.5 text-[9px] font-bold text-white animate-pulse">
                            <Radio className="h-2.5 w-2.5" /> Speaking
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-heading">{l.native}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground italic">"{l.en}"</p>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 rounded-xl border bg-surface p-3.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Auto-Extracted Outcome & Structured Quote</p>
                <p className="mt-1 text-xs font-semibold text-heading flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-status-ai shrink-0" /> {transcript.outcome}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a call from the log on the left to review transcript.</p>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <LiveNegotiationArena />
      </div>
    </div>
  );
};

export default Calls;
