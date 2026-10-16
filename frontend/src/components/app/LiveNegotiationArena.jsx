import { useState } from "react";
import {
  Send, Sparkles, Bot, User, Volume2, ShieldAlert, CheckCircle2, RotateCcw, Cpu
} from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "../../lib/api";

const PRESET_COUNTERS = [
  "Namaste Hasmukhbhai, ₹73,500 chalega? Diesel advance ₹15,000 FASTag mein turant credit hoga.",
  "Bhai Delhi lane pe market down hai. ₹74,500 final booking confirm kar lijiye.",
  "Kal subah 8 AM Bhiwandi loading dock pe gaadi lagao toh ₹75,000 denge.",
  "₹82,000 bahut jyada hai bhai, ceiling limit ₹80,000 hai. Max ₹76,000 kar sakte hain.",
];

const INDIAN_LANGS = [
  { code: "gu-IN", label: "Gujarati (ગુજરાતી)" },
  { code: "hi-IN", label: "Hindi (हिन्दी)" },
  { code: "mr-IN", label: "Marathi (मराठी)" },
  { code: "ta-IN", label: "Tamil (தமிழ்)" },
  { code: "te-IN", label: "Telugu (తెలుగు)" },
  { code: "kn-IN", label: "Kannada (ಕನ್ನಡ)" },
  { code: "bn-IN", label: "Bengali (বাংলা)" },
  { code: "pa-IN", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "ml-IN", label: "Malayalam (മലയാളം)" },
  { code: "od-IN", label: "Odia (ଓଡ଼ିଆ)" },
  { code: "en-IN", label: "English (India)" },
];

export const LiveNegotiationArena = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      speaker: "Hasmukhbhai (Transporter)",
      text: "નમસ્તે ભાઈ! ગાડી અમદાવાદમાં તૈયાર છે. મુંબઈથી દિલ્હી માટે ₹81,000 ભાડું થશે.",
      translation: "Namaste brother! Truck is ready in Ahmedabad. Freight from Mumbai to Delhi will be ₹81,000.",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsLang, setTtsLang] = useState("gu-IN");
  const [activeModel, setActiveModel] = useState("nvidia/llama-3.1-nemotron-70b-instruct:free");
  const [isLiveLLM, setIsLiveLLM] = useState(true);

  const speakText = async (text, langCodeOverride) => {
    const lang = langCodeOverride || ttsLang;
    setTtsLoading(true);
    try {
      const res = await apiRequest("/voice/sarvam/tts", {
        method: "POST",
        body: JSON.stringify({
          text,
          language_code: lang,
        }),
      });

      if (res.success && res.audio_base64) {
        const audio = new Audio(`data:audio/wav;base64,${res.audio_base64}`);
        await audio.play();
        toast.success(`Playing Sarvam AI Bulbul voice (${lang})`);
        return;
      }
    } catch (e) {
      // Fallback seamlessly to Web Speech API
    } finally {
      setTtsLoading(false);
    }

    // Web Speech API fallback
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();

      const voices = window.speechSynthesis.getVoices();
      const prefix = (lang || "").split("-")[0];
      const matchedVoice = voices.find((v) => v.lang === lang || v.lang.startsWith(prefix));
      const indianVoice = voices.find((v) => v.lang.includes("en-IN") || v.name.toLowerCase().includes("india"));

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = lang;
      } else if (indianVoice) {
        utterance.voice = indianVoice;
        utterance.lang = "en-IN";
      } else {
        utterance.lang = "en-US";
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (userTextToSend) => {
    const text = (userTextToSend || inputMessage).trim();
    if (!text || loading) return;

    const newHistory = [...messages, { role: "user", speaker: "You (Haulage AI Dispatcher)", text }];
    setMessages(newHistory);
    setInputMessage("");
    setLoading(true);

    try {
      const storedKey = localStorage.getItem("openrouter_custom_key") || undefined;
      const historyForApi = messages.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await apiRequest("/operations/llm/negotiate-turn", {
        method: "POST",
        body: JSON.stringify({
          carrier_message: text,
          history: historyForApi,
          target_rate: 74500,
          ceiling_rate: 80000,
          benchmark_rate: 78000,
          api_key: storedKey,
          model: activeModel,
        }),
      });

      if (res.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            speaker: "Hasmukhbhai (Transporter)",
            text: res.reply,
            modelUsed: res.model_used,
          },
        ]);
        setActiveModel(res.model_used || activeModel);
        setIsLiveLLM(res.is_live_llm ?? true);
        speakText(res.reply);
      }
    } catch (e) {
      toast.error("Negotiation turn failed: " + (e.message || "Network error"));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        speaker: "Hasmukhbhai (Transporter)",
        text: "નમસ્તે ભાઈ! ગાડી અમદાવાદમાં તૈયાર છે. મુંબઈથી દિલ્હી માટે ₹81,000 ભાડું થશે.",
        translation: "Namaste brother! Truck is ready in Ahmedabad. Freight from Mumbai to Delhi will be ₹81,000.",
      },
    ]);
  };

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm space-y-4" data-testid="live-negotiation-arena">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-bold text-heading">
              Live AI Carrier Negotiation Arena
            </h3>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary flex items-center gap-1">
              <Cpu className="h-3 w-3" /> {isLiveLLM ? "OpenRouter Nemotron" : "Local Cascade"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Bilingual rate bargaining agent · Enforces ₹78,000 benchmark & ₹80,000 ceiling guardrail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase hidden sm:inline">Sarvam Voice:</span>
            <select
              value={ttsLang}
              onChange={(e) => setTtsLang(e.target.value)}
              className="rounded-lg border bg-surface px-2 py-1 text-xs text-heading font-medium focus:outline-none"
              title="Select Indian language voice for Sarvam AI Bulbul TTS"
            >
              {INDIAN_LANGS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-lg border bg-surface px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
            title="Reset conversation"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      </div>

      {/* Policy Guardrails Bar */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl border bg-surface p-2.5 text-center">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground">Target Rate</p>
          <p className="font-bold text-heading text-sm text-status-ai">₹74,500</p>
        </div>
        <div className="rounded-xl border bg-surface p-2.5 text-center">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground">Lane Benchmark</p>
          <p className="font-bold text-heading text-sm">₹78,000</p>
        </div>
        <div className="rounded-xl border border-status-human/30 bg-status-human/5 p-2.5 text-center">
          <p className="text-[10px] uppercase font-semibold text-status-human">Ceiling Limit</p>
          <p className="font-bold text-status-human text-sm">₹80,000</p>
        </div>
      </div>

      {/* Dialogue Thread */}
      <div className="h-64 overflow-y-auto rounded-xl border bg-surface/50 p-3 space-y-3">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                {isUser ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3 text-status-ai" />}
                <span>{m.speaker}</span>
                {m.modelUsed && (
                  <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] font-mono">
                    {m.modelUsed.split("/")[1] || m.modelUsed}
                  </span>
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  isUser
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-card border text-card-foreground shadow-sm rounded-tl-none"
                }`}
              >
                <p>{m.text}</p>
                {m.translation && (
                  <p className="mt-1 border-t border-border/40 pt-1 text-[11px] text-muted-foreground italic">
                    EN: {m.translation}
                  </p>
                )}
                {!isUser && (
                  <button
                    type="button"
                    onClick={() => speakText(m.text)}
                    className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                  >
                    <Volume2 className="h-3 w-3" /> Speak
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse p-2">
            <Bot className="h-3.5 w-3.5 text-status-ai animate-spin" />
            <span>Hasmukhbhai is evaluating counter-offer with OpenRouter Nemotron...</span>
          </div>
        )}
      </div>

      {/* Preset Fast Counter Prompts */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Counter-Offer Templates:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COUNTERS.map((preset, i) => (
            <button
              key={i}
              type="button"
              disabled={loading}
              onClick={() => handleSend(preset)}
              className="rounded-lg border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-heading transition-colors text-left"
            >
              "{preset.slice(0, 48)}..."
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your counter-offer (e.g. '₹74,000 with immediate diesel advance')..."
          className="h-10 flex-1 rounded-xl border bg-surface px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Send className="h-3.5 w-3.5" /> Send Counter
        </button>
      </form>
    </div>
  );
};
