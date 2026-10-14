import { useState, useEffect } from "react";
import {
  Key, Sparkles, X, CheckCircle2, AlertCircle, RefreshCw, Layers, ShieldCheck, Cpu
} from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "../../lib/api";
import { ActionBtn } from "./bits";

const FREE_MODELS = [
  { id: "nvidia/llama-3.1-nemotron-70b-instruct:free", name: "NVIDIA Llama 3.1 Nemotron 70B (Free)", desc: "Flagship NVIDIA logistics reasoning & instruction following" },
  { id: "google/gemini-2.0-flash-exp:free", name: "Google Gemini 2.0 Flash (Free)", desc: "Ultra-fast multimodal & bilingual (Hindi/Gujarati/English)" },
  { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Meta Llama 3.2 3B Instruct (Free)", desc: "Lowest latency edge reasoning" },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B Instruct (Free)", desc: "High-precision structured JSON document extraction" },
  { id: "qwen/qwen-2.5-72b-instruct:free", name: "Qwen 2.5 72B Instruct (Free)", desc: "Deep multi-step logistics reasoning" },
];

export const LLMSettingsModal = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [primaryModel, setPrimaryModel] = useState("nvidia/llama-3.1-nemotron-70b-instruct:free");
  const [hasServerKey, setHasServerKey] = useState(false);
  const [keyPreview, setKeyPreview] = useState("");
  const [fallbacks, setFallbacks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await apiRequest("/operations/llm/config");
      setHasServerKey(res.has_api_key);
      setKeyPreview(res.key_preview || "");
      if (res.primary_model) setPrimaryModel(res.primary_model);
      if (res.fallback_models) setFallbacks(res.fallback_models);
    } catch (e) {
      // Local fallback
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      // Also check local storage for custom browser key
      const storedKey = localStorage.getItem("openrouter_custom_key");
      if (storedKey) setApiKey(storedKey);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (apiKey.trim()) {
        localStorage.setItem("openrouter_custom_key", apiKey.trim());
      }
      await apiRequest("/operations/llm/config", {
        method: "POST",
        body: JSON.stringify({
          api_key: apiKey.trim() || undefined,
          primary_model: primaryModel,
        }),
      });
      toast.success("OpenRouter LLM & cascade configuration saved!");
      fetchConfig();
      onClose();
    } catch (e) {
      toast.error("Failed to save LLM settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await apiRequest("/copilot/query", {
        method: "POST",
        body: JSON.stringify({
          query: "Ping test: are you online?",
          api_key: apiKey.trim() || undefined,
          model: primaryModel,
        }),
      });
      if (res.is_live_llm) {
        toast.success(`Connected to OpenRouter! Model: ${res.model_used}`);
      } else {
        toast.info(`Local fallback engine active (${res.model_used}). Add a key to enable live OpenRouter.`);
      }
    } catch (e) {
      toast.error("Test failed: check API key or network connection.");
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="llm-settings-title"
        className="relative w-full max-w-xl rounded-2xl border bg-card p-6 shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 id="llm-settings-title" className="font-heading text-lg font-bold text-heading">
                OpenRouter LLM & Model Cascade
              </h2>
              <p className="text-xs text-muted-foreground">
                NVIDIA Nemotron & multi-model fallback configuration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-heading transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {/* API Key Input */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-semibold text-heading">
              <span className="flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-primary" /> OpenRouter API Key
              </span>
              {hasServerKey && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                  Active in .env ({keyPreview})
                </span>
              )}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxx"
              className="h-10 w-full rounded-xl border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Supports free OpenRouter accounts. If left blank, Haulage AI automatically uses the intelligent built-in logistics fallback engine.
            </p>
          </div>

          {/* Primary Model Selector */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-heading">
              <Sparkles className="h-3.5 w-3.5 text-status-ai" /> Primary Generative Model
            </label>
            <select
              value={primaryModel}
              onChange={(e) => setPrimaryModel(e.target.value)}
              className="h-10 w-full rounded-xl border bg-surface px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {FREE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Multi-Model Automatic Cascade Diagram */}
          <div className="rounded-xl border border-border/80 bg-surface/80 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-heading">
              <Layers className="h-4 w-4 text-primary" />
              <span>Automatic Multi-Model Fallback Cascade</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              If the primary model is busy or rate-limited on OpenRouter, the backend automatically cascades through the backup free models before switching to the local engine:
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
              <span className="rounded bg-primary/20 px-2 py-0.5 font-bold text-primary">
                1. {primaryModel.split("/")[1] || primaryModel}
              </span>
              <span className="text-muted-foreground">➔</span>
              <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">
                2. gemini-2.0-flash-exp:free
              </span>
              <span className="text-muted-foreground">➔</span>
              <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">
                3. llama-3.2-3b:free
              </span>
              <span className="text-muted-foreground">➔</span>
              <span className="rounded bg-status-ai/20 px-2 py-0.5 text-status-ai font-semibold">
                4. Local Heuristic Engine
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Testing..." : "Test Connection"}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-heading"
            >
              Cancel
            </button>
            <ActionBtn primary onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save & Apply"}
            </ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
};
