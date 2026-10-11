import { useEffect, useState } from "react";
import { Phone, Play, Volume2, Square } from "lucide-react";
import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel } from "../../components/app/bits";
import { useMock, CALL_TRANSCRIPTS } from "../../mock/store";
import { apiRequest, LIVE_API_ENABLED } from "../../lib/api";

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
    };
  }, []);

  const currentCall = calls.find((item) => item.id === open) || calls[0];
  const transcript =
    currentCall?.transcript ||
    CALL_TRANSCRIPTS[open] ||
    (currentCall?.lang?.toLowerCase().includes("gujarati") ? CALL_TRANSCRIPTS["call-1"] : CALL_TRANSCRIPTS["call-2"]);

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

  const playAudio = () => {
    if (!("speechSynthesis" in window) || !transcript?.lines?.length) return;
    window.speechSynthesis.cancel();
    setIsPlaying(true);

    transcript.lines.forEach((line, index) => {
      const text = line.native || line.en;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = line.who === "AI" ? 1.05 : 0.9;
      if (index === transcript.lines.length - 1) {
        utterance.onend = () => setIsPlaying(false);
      }
      window.speechSynthesis.speak(utterance);
    });
  };

  const stopAudio = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  return (
    <div data-testid="calls-page">
      <Seo title="Calls - Haulage AI" description="Voice AI call log demo with Hindi and Gujarati transcripts and English translations." />
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Calls · Voice AI log</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every call recorded with consent, transcribed and logged against the order. {LIVE_API_ENABLED ? "Live API mode." : "Demo data."}
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
                stopAudio();
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
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {LIVE_API_ENABLED && currentCall?.live && (
              <button
                type="button"
                onClick={startTask}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold text-heading hover:bg-accent"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" /> Run Voice Task
              </button>
            )}
            {transcript?.lines?.length > 0 && (
              isPlaying ? (
                <button
                  type="button"
                  onClick={stopAudio}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/20"
                >
                  <Square className="h-3.5 w-3.5" aria-hidden="true" /> Stop Audio
                </button>
              ) : (
                <button
                  type="button"
                  onClick={playAudio}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> 🔊 Listen (TTS Speech)
                </button>
              )
            )}
          </div>

          {transcript ? (
            <>
              <div className="flex items-center gap-3 rounded-lg border bg-surface p-3">
                <Waveform active={isPlaying} />
                <span className="text-[10px] text-muted-foreground">
                  {isPlaying ? "Playing voice agent audio via browser speech engine..." : "Audio waveform · click 'Listen' to hear synthetic speech"}
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {transcript.lines.map((l, i) => (
                  <li key={i} className={`max-w-[90%] rounded-xl border p-3 ${l.who === "AI" ? "ml-auto border-status-ai/30 bg-status-ai/10" : "bg-surface"}`}>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{l.who}</p>
                    <p className="mt-1 text-sm font-medium text-heading">{l.native}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{l.en}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] text-muted-foreground">Multilingual Indian logistics dialogue with verified English translation.</p>
              <div className="mt-3 rounded-xl border bg-surface p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Extracted outcome</p>
                <p className="mt-1 text-xs font-medium text-heading">{transcript.outcome}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Transcript available for calls with open outcomes.</p>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default Calls;
