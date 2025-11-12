// api/chat.js — Vercel serverless function with health-only scope and hidden system prompt
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ---- scope rules ----
    const REFUSAL_TEXT =
      "I'm not designed to answer that. I only help with health, mental health, sleep, diet, and activity.";

    const ALLOWED_TOPICS = [
      "health","wellness","safety","temperature","fever","symptom","risk",
      "mental","anxiety","stress","depression","mood","therapy","counseling","mindfulness","meditation",
      "sleep","insomnia","rest","circadian","nap",
      "diet","food","meal","calorie","nutrition","hydrate","hydration","water","protein","carb","fat","vitamin",
      "exercise","workout","walk","steps","run","yoga","strength","cardio","fitness","activity",
      "bmi","weight","height","age","heart rate","pulse","bp","blood pressure"
    ];

    function lastUserText(messages) {
      if (!Array.isArray(messages)) return "";
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m?.role === "user" && typeof m.content === "string") return m.content;
      }
      return "";
    }

    function inScope(messages) {
      const q = lastUserText(messages).toLowerCase();
      return ALLOWED_TOPICS.some(k => q.includes(k));
    }

    // ---- hidden system prompt (policy + patient) ----
    const HEALTH_POLICY = `
You are a health-only assistant. Scope: personal health safety, mental health, sleep, diet/nutrition/hydration, physical activity/fitness, and interpreting simple temperature readings.
If the user asks for anything outside scope, reply exactly:
"I'm not designed to answer that. I only help with health, mental health, sleep, diet, and activity."
Style: brief, factual, non-judgmental. No diagnosis or treatment instructions. Encourage professional care for concerning symptoms.
If risk of self-harm or harm to others is expressed, say:
"If you're in danger or thinking about harming yourself, contact local emergency services or a suicide helpline now."
`.trim();

    const PATIENT = `Patient profile: name=Tufayl, age=63, height_cm=172. Use only for health-related answers.`;
    const SYSTEM_SEED = `${HEALTH_POLICY}\n\n${PATIENT}`;

    function ensureSystemSeed(messages) {
      if (!Array.isArray(messages) || !messages.length || messages[0]?.role !== "system") {
        return [{ role: "system", content: SYSTEM_SEED }, ...(messages || [])];
      }
      return messages;
    }

    function sanitizeHistory(messages) {
      const kept = (messages || []).filter(m =>
        m && (m.role === "system" || m.role === "user" || m.role === "assistant")
      );
      return kept.slice(-20);
    }

    // ---- Supabase (REST) helper to fetch latest temperatures ----
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://bbrleisgatjcrlnxatcc.supabase.co";
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicmxlaXNnYXRqY3JsbnhhdGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1OTE1NTYsImV4cCI6MjA3ODE2NzU1Nn0.r1YvySsMPFoMZMLhkTNQmDotbL6eIWUoaWN3xv91TuI";

    async function fetchLatestTemperatures(limit = 15) {
      try {
        const url = new URL(`${SUPABASE_URL}/rest/v1/temper`);
        // select columns, sort by time desc, limit
        url.searchParams.set("select", "degree,time");
        url.searchParams.set("order", "time.desc");
        url.searchParams.set("limit", String(limit));
        const r = await fetch(url.toString(), {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        });
        if (!r.ok) throw new Error(`Supabase ${r.status}`);
        const rows = await r.json();
        if (!Array.isArray(rows) || rows.length === 0) return null;
        // rows are newest-first; reverse for chronological readability
        const chron = rows.slice().reverse();
        const lines = chron.map(x => {
          const t = new Date(x.time);
          const ts = isNaN(t.getTime()) ? String(x.time) : t.toISOString();
          return `${ts} -> ${x.degree} °C`;
        });
        return {
          latestValue: chron[chron.length - 1]?.degree,
          formatted: lines.join("\n"),
        };
      } catch (e) {
        console.error("fetchLatestTemperatures error:", e?.message || e);
        return null;
      }
    }

    async function fetchLatestSpO2(limit = 15) {
      try {
        const url = new URL(`${SUPABASE_URL}/rest/v1/heartrate`);
        // select columns, sort by created_at desc, limit
        url.searchParams.set("select", "spo2,created_at");
        url.searchParams.set("order", "created_at.desc");
        url.searchParams.set("limit", String(limit));
        const r = await fetch(url.toString(), {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        });
        if (!r.ok) throw new Error(`Supabase ${r.status}`);
        const rows = await r.json();
        if (!Array.isArray(rows) || rows.length === 0) return null;
        // Filter out null values and reverse for chronological readability
        const validRows = rows.filter(x => x.spo2 != null);
        if (validRows.length === 0) return null;
        const chron = validRows.slice().reverse();
        const lines = chron.map(x => {
          const t = new Date(x.created_at);
          const ts = isNaN(t.getTime()) ? String(x.created_at) : t.toISOString();
          return `${ts} -> ${x.spo2}%`;
        });
        return {
          latestValue: chron[chron.length - 1]?.spo2,
          formatted: lines.join("\n"),
        };
      } catch (e) {
        console.error("fetchLatestSpO2 error:", e?.message || e);
        return null;
      }
    }

    async function fetchLatestBPM(limit = 10) {
      try {
        const url = new URL(`${SUPABASE_URL}/rest/v1/heartrate`);
        // select columns, sort by created_at desc, limit
        url.searchParams.set("select", "bpm,created_at");
        url.searchParams.set("order", "created_at.desc");
        url.searchParams.set("limit", String(limit));
        const r = await fetch(url.toString(), {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        });
        if (!r.ok) throw new Error(`Supabase ${r.status}`);
        const rows = await r.json();
        if (!Array.isArray(rows) || rows.length === 0) return null;
        // Filter out null values and reverse for chronological readability
        const validRows = rows.filter(x => x.bpm != null);
        if (validRows.length === 0) return null;
        const chron = validRows.slice().reverse();
        const lines = chron.map(x => {
          const t = new Date(x.created_at);
          const ts = isNaN(t.getTime()) ? String(x.created_at) : t.toISOString();
          return `${ts} -> ${x.bpm} bpm`;
        });
        return {
          latestValue: chron[chron.length - 1]?.bpm,
          formatted: lines.join("\n"),
        };
      } catch (e) {
        console.error("fetchLatestBPM error:", e?.message || e);
        return null;
      }
    }

    // ---- Process request ----
    const clientMsgs = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!inScope(clientMsgs)) {
      return res.json({ reply: REFUSAL_TEXT });
    }

    let messages = ensureSystemSeed(sanitizeHistory(clientMsgs));

    // Always fetch latest SpO2 and BPM readings and add to hidden system prompt
    const [spo2Data, bpmData] = await Promise.all([
      fetchLatestSpO2(15),
      fetchLatestBPM(10)
    ]);

    // Build hidden context with vital signs
    const vitalSignsContext = [];
    
    if (spo2Data?.formatted) {
      vitalSignsContext.push(`Last 15 SpO2 readings (newest last):\n${spo2Data.formatted}`);
    }
    
    if (bpmData?.formatted) {
      vitalSignsContext.push(`Last 10 BPM readings (newest last):\n${bpmData.formatted}`);
    }

    // If the user is asking about temperature, also include temperature readings
    const userText = lastUserText(messages).toLowerCase();
    if (["temp","temperature","fever","heat","body temp"].some(k => userText.includes(k))) {
      const temps = await fetchLatestTemperatures(15);
      if (temps?.formatted) {
        vitalSignsContext.push(`Recent temperature readings (newest last):\n${temps.formatted}`);
      }
    }

    // Add vital signs context to system prompt if available
    if (vitalSignsContext.length > 0) {
      const contextText = vitalSignsContext.join("\n\n") + 
        "\n\nGuidance: You have access to these recent vital sign readings. Refer to them when relevant to provide accurate health insights. Interpret trends briefly and encourage professional care for concerning values.";
      messages = [
        { role: "system", content: contextText },
        ...messages
      ];
    }

    const MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct";
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is missing from environment variables");
      return res.status(500).json({ error: "OPENROUTER_API_KEY not configured. Please set it in Vercel environment variables." });
    }

    // Validate API key format (OpenRouter keys start with sk-or-v1-)
    if (!OPENROUTER_API_KEY.startsWith('sk-or-v1-')) {
      console.error("OPENROUTER_API_KEY format appears invalid (should start with 'sk-or-v1-')");
      return res.status(500).json({ error: "Invalid API key format. OpenRouter keys should start with 'sk-or-v1-'. Please check your OPENROUTER_API_KEY in Vercel." });
    }

    // Log that we have the key (but not the actual key value for security)
    console.log("OpenRouter API key present, model:", MODEL, "Key prefix:", OPENROUTER_API_KEY.substring(0, 10) + "...");

    // Get the origin for HTTP-Referer header
    const origin = req.headers.origin || req.headers.referer || "https://lifesense.vercel.app";

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": origin,
        "X-Title": "LifeSense"
      },
      body: JSON.stringify({ model: MODEL, messages })
    });

    if (!r.ok) {
      const errorData = await r.json().catch(() => ({ error: `OpenRouter API error: ${r.status} ${r.statusText}` }));
      console.error("OpenRouter API error:", {
        status: r.status,
        statusText: r.statusText,
        error: errorData
      });
      
      // Provide helpful error messages based on status code
      let errorMessage = errorData.error?.message || errorData.error || `OpenRouter API error: ${r.status}`;
      if (r.status === 401) {
        errorMessage = "Invalid OpenRouter API key. Please check your OPENROUTER_API_KEY in Vercel environment variables.";
      } else if (r.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      }
      
      return res.status(200).json({ 
        error: errorMessage,
        details: errorData
      });
    }

    const j = await r.json();
    const reply =
      j?.choices?.[0]?.message?.content?.trim?.() ||
      j?.choices?.[0]?.text?.trim?.() ||
      (j?.error ? `Error: ${j.error.message || j.error}` : "No response.");

    return res.status(200).json({ reply });
  } catch (e) {
    console.error("Chat API error:", e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
