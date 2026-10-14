import os
import json
import logging
from pathlib import Path
from dotenv import load_dotenv
import httpx
from typing import List, Dict, Any, Optional

logger = logging.getLogger("haulage_ai.llm")

DEFAULT_PRIMARY_MODEL = "openrouter/free"
DEFAULT_FALLBACK_MODELS = [
    "nvidia/nemotron-3.5-lightning:free",
    "liquid/lfm-2.5-2.6b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
]

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def get_api_key(override_key: Optional[str] = None) -> str:
    key = override_key or os.getenv("OPENROUTER_API_KEY", "")
    if not key:
        env_file = Path(__file__).parent / ".env"
        if env_file.exists():
            load_dotenv(env_file, override=True)
            key = os.getenv("OPENROUTER_API_KEY", "")
    return key.strip()


def get_model_cascade(override_model: Optional[str] = None) -> List[str]:
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        load_dotenv(env_file, override=True)
    primary = override_model or os.getenv("OPENROUTER_MODEL", DEFAULT_PRIMARY_MODEL)
    fallbacks_env = os.getenv("OPENROUTER_FALLBACK_MODELS", "")
    if fallbacks_env:
        fallbacks = [m.strip() for m in fallbacks_env.split(",") if m.strip()]
    else:
        fallbacks = DEFAULT_FALLBACK_MODELS

    cascade = [primary] + [m for m in fallbacks if m != primary]
    return cascade


async def call_openrouter_cascade(
    messages: List[Dict[str, str]],
    temperature: float = 0.3,
    max_tokens: int = 800,
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
    json_mode: bool = False,
) -> Dict[str, Any]:
    key = get_api_key(api_key)
    models = get_model_cascade(preferred_model)

    if not key:
        logger.info("No OpenRouter API key found; will use local fallback engine")
        return {"content": "", "model_used": "local-fallback", "success": False, "reason": "No API key configured"}

    headers = {
        "Authorization": f"Bearer {key}",
        "HTTP-Referer": "https://haulage-ai.local",
        "X-Title": "Haulage AI Logistics Suite",
        "Content-Type": "application/json",
    }

    last_error = ""
    for model in models:
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(OPENROUTER_URL, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        msg = choices[0]["message"]
                        content = msg.get("content") or msg.get("reasoning") or ""
                        if content:
                            return {
                                "content": content.strip(),
                                "model_used": model,
                                "success": True,
                                "fallback_triggered": model != models[0],
                            }
                else:
                    last_error = f"Model {model} returned HTTP {res.status_code}: {res.text[:120]}"
                    logger.warning(f"OpenRouter error: {last_error}. Cascading to next model...")
        except Exception as e:
            last_error = f"Model {model} exception: {str(e)}"
            logger.warning(f"OpenRouter exception on {model}: {e}. Cascading...")

    return {
        "content": "",
        "model_used": "local-fallback",
        "success": False,
        "reason": f"All cascade models failed. Last error: {last_error}",
    }


# =====================================================================
# FEATURE 1: Operations Copilot Query Engine (LLM + Local Fallback)
# =====================================================================
async def copilot_llm_query(
    question: str,
    live_context: Dict[str, Any],
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
) -> Dict[str, Any]:
    loads = live_context.get("loads", [])
    orders = live_context.get("orders", [])
    exceptions = live_context.get("exceptions", [])
    calls = live_context.get("calls", [])

    system_prompt = f"""You are the Haulage AI Operations Copilot, an elite logistics AI managing freight, loads, fleet, and exceptions on the Indian highway corridor (NH-48 Mumbai-Delhi).
Current Live Operations Data:
- Active Exceptions: {len(exceptions)} (e.g., LR-8839 breakdown near Beawar, carrying 18 pallets FMCG for Aarav Consumer Products).
- Active Open Loads: {len(loads)} (LD-201: Bhiwandi -> Narela; LD-202: Bhiwandi -> Jaipur; LD-203: Narela -> Pune).
- Active Ingested Orders: {len(orders)} (ORD-1042 flagged for 14.2 t vs 14.5 t weight discrepancy).
- Recent Voice AI Calls: {len(calls)} (Rate closed with Hasmukhbhai at Rs 74,500 vs Rs 78,000 ceiling in Gujarati).

Instructions:
1. Answer concisely, professionally, and authoritatively. Use markdown formatting and bold metrics.
2. If asked about rates, breakdowns, telematics, or orders, cite the exact numbers from live operations data.
3. If asked in Hindi, Hinglish, or Gujarati, respond in that language warmly.
4. Keep answers under 150 words."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question},
    ]

    llm_res = await call_openrouter_cascade(
        messages=messages,
        temperature=0.3,
        max_tokens=600,
        api_key=api_key,
        preferred_model=preferred_model,
    )

    if llm_res.get("success") and llm_res.get("content"):
        ans = llm_res["content"].strip()
        actions = []
        q = question.lower()
        if "exception" in q or "breakdown" in q or "truck" in q or "delhi" in q:
            actions = [
                {"label": "Review Exception in Control Tower", "path": "/app"},
                {"label": "Check Standby Fleet", "path": "/app/fleet"},
            ]
        elif "rate" in q or "call" in q or "hasmukh" in q or "quote" in q:
            actions = [
                {"label": "Listen to Voice AI Call", "path": "/app/calls"},
                {"label": "View Matched Load LD-201", "path": "/app/loads"},
            ]
        else:
            actions = [
                {"label": "Inspect Open Loads", "path": "/app/loads"},
                {"label": "Open Orders Ingestion", "path": "/app/orders"},
            ]

        return {
            "query": question,
            "answer": ans,
            "model_used": llm_res.get("model_used"),
            "fallback_triggered": llm_res.get("fallback_triggered", False),
            "is_live_llm": True,
            "actions": actions,
            "kpis": {
                "active_exceptions": str(len(exceptions)),
                "corridor": "NH-48 Mumbai-Delhi",
                "engine": llm_res.get("model_used", "OpenRouter"),
            },
        }

    # Intelligent Local Fallback Engine if OpenRouter is offline or unkeyed
    q = question.lower()
    if any(k in q for k in ["exception", "breakdown", "alert", "risk", "issue", "problem", "delhi"]):
        answer = (
            f"**Operational Alert (Local Engine):** Found **{len(exceptions)} active exception(s)**.\n\n"
            "- **LR-8839 Breakdown (Beawar, NH-48):** Carrying 18 pallets for Aarav Consumer Products. "
            "Partner vehicle *RJ-14-XX-3321* (45 km away) selected for transshipment to protect the 8–10 AM delivery window.\n"
            "- **Slot Congestion:** Narela DC proposed rebooking for tomorrow 14:00–16:00."
        )
        actions = [
            {"label": "Review Exception in Control Tower", "path": "/app"},
            {"label": "Check Standby Fleet", "path": "/app/fleet"},
        ]
        kpis = {"active_exceptions": str(len(exceptions)), "corridor": "NH-48 Mumbai-Delhi", "sla_status": "Protected"}
    elif any(k in q for k in ["voice", "quote", "rate", "carrier", "hasmukh", "call", "negotiate"]):
        answer = (
            "**Voice AI Agent Report (Local Engine):**\n\n"
            "- **Recent Carrier Negotiation:** Rate closed at **₹74,500** with *Hasmukhbhai* in **Gujarati**.\n"
            "- **Rate Arbitrage:** Closed under lane benchmark of **₹78,000** (saved ₹3,500 / 4.5% margin boost).\n"
            "- **Status:** Verified and awaiting final dispatch approval."
        )
        actions = [
            {"label": "Listen to Voice AI Call", "path": "/app/calls"},
            {"label": "View Matched Load LD-201", "path": "/app/loads"},
        ]
        kpis = {"agreed_rate": "₹74,500", "benchmark": "₹78,000", "language": "Gujarati"}
    else:
        answer = (
            f"**Freight Operations Status (Local Engine):**\n\n"
            f"- **Active Database Loads:** {len(loads)} loads in pipeline.\n"
            f"- **Intake Orders:** {len(orders)} documents processed with 96% average AI confidence.\n"
            f"- **Fleet Health:** 6 vehicles monitored on NH-48 corridor with real-time telematics."
        )
        actions = [
            {"label": "Open Orders Ingestion", "path": "/app/orders"},
            {"label": "Inspect Open Loads", "path": "/app/loads"},
        ]
        kpis = {"total_orders": str(len(orders)), "loads": str(len(loads)), "telematics": "Active"}

    return {
        "query": question,
        "answer": answer,
        "model_used": "local-heuristic-fallback",
        "fallback_triggered": True,
        "is_live_llm": False,
        "reason": llm_res.get("reason", ""),
        "actions": actions,
        "kpis": kpis,
    }


# =====================================================================
# FEATURE 2: Raw WhatsApp & Unstructured Text Freight Parser
# =====================================================================
async def parse_unstructured_indent(
    raw_text: str,
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
) -> Dict[str, Any]:
    system_prompt = """You are an expert Indian freight document & WhatsApp indent parser.
Convert the user's messy logistics WhatsApp/Email message into a strict JSON object with these keys:
{
  "customer": string (e.g. "Aarav Consumer Products" or "Kedia Polymers" or inferred),
  "origin": string (e.g. "Bhiwandi WH-3"),
  "destination": string (e.g. "Narela, Delhi" or "Pune"),
  "pallets": number (integer, default 18 if unspecified),
  "weight_t": number (tons as float, e.g. 14.2),
  "vehicle_type": string (e.g. "32 ft MXL", "24 ft", "Container"),
  "offered_rate": number (integer in INR),
  "po_ref": string (e.g. "PO-7712" or "WA-INDENT"),
  "pickup_window": string,
  "confidence": number (between 70 and 99),
  "notes": string (brief summary of any special terms)
}
Return ONLY valid JSON. No markdown ticks, no preamble."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": raw_text},
    ]

    llm_res = await call_openrouter_cascade(
        messages=messages,
        temperature=0.1,
        max_tokens=500,
        api_key=api_key,
        preferred_model=preferred_model,
        json_mode=True,
    )

    if llm_res.get("success") and llm_res.get("content"):
        content = llm_res["content"].strip()
        if content.startswith("```"):
            content = content.strip("`").replace("json\n", "", 1)
        try:
            parsed = json.loads(content)
            parsed["source"] = "WhatsApp / Natural Text"
            parsed["model_used"] = llm_res.get("model_used")
            parsed["is_live_llm"] = True
            return parsed
        except Exception:
            pass

    # Intelligent Fallback Parser for typical Indian freight formats
    text_lower = raw_text.lower()
    customer = "Aarav Consumer Products"
    if "kedia" in text_lower:
        customer = "Kedia Polymers"
    elif "gupta" in text_lower:
        customer = "Gupta Trading Co."
    elif "shree" in text_lower:
        customer = "Shree Packaging"

    origin = "Bhiwandi WH-3" if "bhiwandi" in text_lower else "Vashi, Navi Mumbai"
    dest = "Narela, Delhi" if "delhi" in text_lower or "narela" in text_lower else "Pune" if "pune" in text_lower else "Jaipur"

    pallets = 18
    if "4 pallet" in text_lower:
        pallets = 4
    elif "9 pallet" in text_lower:
        pallets = 9

    rate = 76000
    if "74" in text_lower or "74500" in text_lower:
        rate = 74500
    elif "42" in text_lower:
        rate = 42500
    elif "31" in text_lower:
        rate = 31000

    return {
        "customer": customer,
        "origin": origin,
        "destination": dest,
        "pallets": pallets,
        "weight_t": 14.2 if pallets == 18 else 3.8,
        "vehicle_type": "32 ft MXL" if pallets > 10 else "20 ft Container",
        "offered_rate": rate,
        "po_ref": "PO-WA-7712",
        "pickup_window": "Tomorrow 08:00 - 12:00",
        "confidence": 95,
        "notes": "Extracted via local pattern extractor (Fallback engine)",
        "source": "WhatsApp (Parsed)",
        "model_used": "local-fallback",
        "is_live_llm": False,
    }


# =====================================================================
# FEATURE 3: Live AI Carrier Negotiation Simulation
# =====================================================================
async def negotiate_carrier_turn(
    carrier_message: str,
    conversation_history: List[Dict[str, str]],
    benchmark_rate: int = 78000,
    ceiling_rate: int = 80000,
    target_rate: int = 74500,
    carrier_persona: str = "Hasmukhbhai (Gujarati/Hindi Transporter)",
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None,
) -> Dict[str, Any]:
    system_prompt = f"""You are negotiating freight on behalf of Haulage AI with {carrier_persona} for a 32 ft MXL truck on the Mumbai -> Delhi lane.
Policy limits:
- Target rate: Rs {target_rate:,}
- Benchmark rate: Rs {benchmark_rate:,}
- Hard ceiling: Rs {ceiling_rate:,} (NEVER agree above this number)

Persona rules:
1. Speak professionally with a warm, Indian transport trade tone (occasional Hindi/Gujarati polite greetings like "Namaste", "Bhai", "Ji").
2. Push for diesel advance via FASTag or quick 48-hour digital payment to sweeten a lower rate.
3. If carrier asks for more than Rs {ceiling_rate:,}, politely refuse and explain the client freight ceiling limit.
4. Keep turns short (under 40 words), like an authentic phone or WhatsApp dialogue."""

    messages = [{"role": "system", "content": system_prompt}] + conversation_history
    messages.append({"role": "user", "content": carrier_message})

    llm_res = await call_openrouter_cascade(
        messages=messages,
        temperature=0.4,
        max_tokens=250,
        api_key=api_key,
        preferred_model=preferred_model,
    )

    if llm_res.get("success") and llm_res.get("content"):
        return {
            "reply": llm_res["content"].strip(),
            "model_used": llm_res.get("model_used"),
            "success": True,
            "is_live_llm": True,
        }

    # Realistic Transporter Fallback Turn
    return {
        "reply": f"Namaste ji. ₹74,500 final karte hain. FASTag mein ₹15,000 diesel advance loading time pe release ho jayega. Gaadi kal subah ready rakhna.",
        "model_used": "local-fallback",
        "success": True,
        "is_live_llm": False,
    }
