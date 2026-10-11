import { useState } from "react";
import { Phone } from "lucide-react";
import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel } from "../../components/app/bits";
import { useMock, CALL_TRANSCRIPTS } from "../../mock/store";

const Waveform = () => (
  <span className="flex items-end gap-0.5" aria-hidden="true">
    {[6, 12, 8, 16, 10, 14, 7, 13, 9, 15, 6, 11, 8, 14, 10, 5, 12, 9].map((h, i) => (
      <span key={i} className="w-1 rounded-full bg-status-ai/70" style={{ height: `${h}px` }} />
    ))}
  </span>
);

const Calls = () => {
  const { calls } = useMock();
  const [open, setOpen] = useState("call-1");
  const transcript = CALL_TRANSCRIPTS[open];

  return (
    <div data-testid="calls-page">
      <Seo title="Calls - Haulage AI" description="Voice AI call log demo with Hindi and Gujarati transcripts and English translations." />
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Calls · Voice AI log</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every call recorded with consent, transcribed and logged against the order. Demo data.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-2.5" data-testid="calls-list">
          {calls.map((c) => (
            <button
              key={c.id}
              type="button"
              data-testid={c.id}
              onClick={() => setOpen(c.id)}
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
              <p className="mt-1 text-[10px] text-muted-foreground">{c.lang} · {c.duration} · today {c.time}</p>
            </button>
          ))}
        </div>

        <Panel title={transcript ? transcript.title : "Transcript"} testId="call-detail">
          {transcript ? (
            <>
              <div className="flex items-center gap-3 rounded-lg border bg-surface p-3">
                <Waveform />
                <span className="text-[10px] text-muted-foreground">Audio waveform placeholder · recording with consent</span>
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
              <p className="mt-3 text-[10px] text-muted-foreground">Sample lines, pending native-speaker review.</p>
              <div className="mt-3 rounded-xl border bg-surface p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Extracted outcome</p>
                <p className="mt-1 text-xs font-medium text-heading">{transcript.outcome}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Transcript available for calls with open outcomes. Demo data.</p>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default Calls;
