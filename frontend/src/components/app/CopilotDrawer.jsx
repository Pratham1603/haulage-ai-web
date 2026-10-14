import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Sparkles, Send, X, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import { apiRequest, LIVE_API_ENABLED } from "../../lib/api";

const QUICK_PROMPTS = [
  "🚨 What exceptions need immediate approval?",
  "📞 Review latest Voice AI carrier quote",
  "📦 Check part-load spare capacity on NH-48",
  "📋 Summarize pending orders and intake confidence",
];

export const CopilotDrawer = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello! I am **Haulage AI Copilot**, your real-time operations assistant. I monitor western freight corridors, live vehicle matching, voice rate negotiations, and back-office order validation. How can I assist your operations today?",
      kpis: { "Live Status": "Active", "Connected DB": "MongoDB Atlas" },
      actions: [
        { label: "View Control Tower", path: "/app" },
        { label: "Check Voice AI Logs", path: "/app/calls" },
      ],
    },
  ]);

  if (!open) return null;

  const handleSend = async (textToSend) => {
    const q = textToSend || query;
    if (!q.trim() || loading) return;

    const userMsg = { role: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const storedKey = localStorage.getItem("openrouter_custom_key") || undefined;
      if (LIVE_API_ENABLED) {
        const res = await apiRequest("/copilot/query", {
          method: "POST",
          body: JSON.stringify({ query: q, api_key: storedKey }),
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: res.answer,
            kpis: res.kpis,
            actions: res.actions,
            modelUsed: res.model_used,
            isLiveLlm: res.is_live_llm,
          },
        ]);
      } else {
        // Fallback for non-live mode
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: `**Operations Assessment for:** "${q}"\n\nAll automated agents are operating within policy guardrails. In demo mode, live telemetry and rate negotiations are simulated.`,
            actions: [{ label: "Open Control Tower", path: "/app" }],
            modelUsed: "local-demo-engine",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `⚠️ Unable to complete copilot query: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (path) => {
    if (path) {
      navigate(path);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="relative flex h-full w-full max-w-lg flex-col border-l bg-card shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-heading text-sm font-bold text-heading flex items-center gap-2">
                Operations Copilot
                <span className="rounded-full border border-status-ai/40 bg-status-ai/10 px-2 py-0.5 text-[10px] font-semibold text-status-ai flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Live
                </span>
              </h2>
              <p className="text-[11px] text-muted-foreground">Contextual intelligence across Modules 1, 2, & 3</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Copilot"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="border-b bg-surface px-4 py-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick queries:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p)}
                className="rounded-lg border bg-card px-2.5 py-1 text-left text-[11px] text-muted-foreground transition-all hover:border-primary/40 hover:bg-accent hover:text-heading"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Chat Area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "border bg-surface text-foreground shadow-sm"
                }`}
              >
                <div className="space-y-2 whitespace-pre-line">{m.text}</div>

                {m.modelUsed && (
                  <div className="mt-2 flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono">
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-primary font-semibold">
                      {m.isLiveLLM ? "⚡ LLM" : "🛡️ Local Fallback"}
                    </span>
                    <span>{m.modelUsed}</span>
                  </div>
                )}

                {m.kpis && (
                  <div className="mt-2.5 flex flex-wrap gap-2 border-t pt-2">
                    {Object.entries(m.kpis).map(([k, v]) => (
                      <span key={k} className="rounded-md border bg-card px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                        <strong className="text-heading capitalize">{k.replace(/_/g, " ")}:</strong> {v}
                      </span>
                    ))}
                  </div>
                )}

                {m.actions && m.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t pt-2.5">
                    {m.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => handleActionClick(act.path)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-all hover:bg-primary/20"
                      >
                        {act.label} <ArrowRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-status-ai" />
              <span>Analyzing live freight database and telemetry...</span>
            </div>
          )}
        </div>

        {/* Footer Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="border-t bg-surface p-3.5"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Copilot (e.g., 'Check unassigned loads' or 'Exception breakdown status')..."
              className="h-10 w-full rounded-xl border bg-background pl-3.5 pr-12 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-status-ai" /> Enterprise Guardrails Active
            </span>
            <span>Real-time Operations Engine</span>
          </div>
        </form>
      </div>
    </div>
  );
};
