// chatbot.js — modern glassy UI + auto greeting + health-only logic
document.addEventListener("DOMContentLoaded", () => {
  const HEALTH_POLICY = `
You are a health-only assistant. Scope: personal health safety, mental health, sleep, diet/nutrition/hydration, physical activity/fitness, and interpreting simple temperature readings.
If the user asks for anything outside scope, reply exactly:
"I’m not designed to answer that. I only help with health, mental health, sleep, diet, and activity."
Style: brief, factual, non-judgmental. No diagnosis or treatment instructions. Encourage professional care for concerning symptoms.
If risk of self-harm or harm to others is expressed, say:
"If you’re in danger or thinking about harming yourself, contact local emergency services or a suicide helpline now."
`.trim();

  const PATIENT = `Patient profile: name=Tufayl, age=63, height_cm=172, weight_kg=72. Use only for health-related answers.`;
  const SYSTEM_SEED = `${HEALTH_POLICY}\n\n${PATIENT}`;

  const REFUSAL_TEXT = "I’m not designed to answer that. I only help with health, mental health, sleep, diet, and activity.";

  const ALLOWED_TOPICS = [
    "health","wellness","safety","temperature","fever","symptom","risk",
    "mental","anxiety","stress","depression","mood","therapy","counseling","mindfulness","meditation",
    "sleep","insomnia","rest","circadian","nap",
    "diet","food","meal","calorie","nutrition","hydrate","hydration","water","protein","carb","fat","vitamin",
    "exercise","workout","walk","steps","run","yoga","strength","cardio","fitness","activity",
    "bmi","weight","height","age","heart rate","pulse","bp","blood pressure"
  ];
  const inScope = (t) => ALLOWED_TOPICS.some(k => String(t||"").toLowerCase().includes(k));

  const KEY = "lifesense.chat.history";
  let convo;
  try { convo = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { convo = null; }
  if (!Array.isArray(convo) || convo.length === 0 || convo[0]?.role !== "system") {
    convo = [{ role: "system", content: SYSTEM_SEED }];
    localStorage.setItem(KEY, JSON.stringify(convo));
  }
  function saveConvo() { localStorage.setItem(KEY, JSON.stringify(convo.slice(-20))); }

  // --- launcher button ---
  const chatButton = document.createElement("div");
  chatButton.id = "chat-button";
  chatButton.innerHTML = "🤖";
  Object.assign(chatButton.style, {
    position: "fixed",
    bottom: "25px",
    right: "25px",
    width: "70px",
    height: "70px",
    background: "linear-gradient(135deg, #0072ff, #00c6ff)",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "34px",
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 0 25px rgba(0, 198, 255, 0.8)",
    animation: "pulse 2s infinite",
    zIndex: "9999",
    transition: "transform 0.3s ease"
  });
  chatButton.addEventListener("mouseenter", () => (chatButton.style.transform = "scale(1.1)"));
  chatButton.addEventListener("mouseleave", () => (chatButton.style.transform = "scale(1)"));
  document.body.appendChild(chatButton);

  // --- global styles ---
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap');
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(0,198,255,0.6); }
      70% { box-shadow: 0 0 0 15px rgba(0,198,255,0); }
      100% { box-shadow: 0 0 0 0 rgba(0,198,255,0); }
    }
    .chat-container {
      position:fixed; bottom:110px; right:30px; width:360px; height:520px;
      display:none; flex-direction:column; border-radius:20px;
      backdrop-filter:blur(12px); background:rgba(255,255,255,0.15);
      box-shadow:0 8px 30px rgba(0,0,0,0.3); overflow:hidden;
      border:1px solid rgba(255,255,255,0.2); z-index:9998;
      transition:all 0.3s ease;
    }
    .chat-header {
      background:linear-gradient(135deg,#0072ff,#00c6ff);
      color:#fff; padding:12px 15px; font-weight:bold; font-size:16px;
      display:flex; justify-content:space-between; align-items:center;
      font-family:'Poppins',sans-serif;
    }
    .chat-body {
      flex:1; overflow-y:auto; padding:12px; display:flex;
      flex-direction:column; scroll-behavior:smooth;
    }
    .chat-msg {
      max-width:80%; padding:10px 14px; border-radius:16px;
      margin:6px 0; font-family:'Poppins',sans-serif; font-size:14px;
      display:inline-flex; align-items:flex-start; gap:8px;
    }
    .msg-user { background:linear-gradient(135deg,#0072ff,#00c6ff); color:#fff; align-self:flex-end; border-bottom-right-radius:4px; }
    .msg-bot  { background:linear-gradient(135deg,#232526,#414345); color:#f5f5f5; align-self:flex-start; border-bottom-left-radius:4px; }
    .msg-bot .icon { font-size:18px; }
    .chat-input-area {
      display:flex; padding:10px; border-top:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.1);
    }
    .chat-input-area input {
      flex:1; padding:10px; border:none; border-radius:10px;
      outline:none; font-family:'Poppins',sans-serif; background:rgba(255,255,255,0.85);
    }
    .chat-input-area button {
      margin-left:10px; border:none; border-radius:50%; width:40px; height:40px;
      background:linear-gradient(135deg,#00c6ff,#0072ff); color:white;
      font-size:18px; cursor:pointer; transition:transform 0.2s ease;
    }
    .chat-input-area button:hover { transform:scale(1.1); }
  `;
  document.head.appendChild(style);

  // --- chat box ---
  const chatBox = document.createElement("div");
  chatBox.className = "chat-container";
  chatBox.innerHTML = `
    <div class="chat-header">
      <span>LifeSense Assistant</span>
      <button id="resetChat" style="background:none;border:none;color:white;font-size:14px;cursor:pointer;">Reset</button>
    </div>
    <div class="chat-body" id="chatLog"></div>
    <div class="chat-input-area">
      <input id="chatInput" type="text" placeholder="Type a message..." />
      <button id="sendBtn">➤</button>
    </div>
  `;
  document.body.appendChild(chatBox);

  const chatLog = chatBox.querySelector("#chatLog");
  const chatInput = chatBox.querySelector("#chatInput");
  const sendBtn = chatBox.querySelector("#sendBtn");
  const resetBtn = chatBox.querySelector("#resetChat");

  chatButton.addEventListener("click", () => {
    chatBox.style.display = chatBox.style.display === "none" ? "flex" : "none";
  });

  resetBtn.addEventListener("click", () => {
    convo = [{ role: "system", content: SYSTEM_SEED }];
    saveConvo();
    chatLog.innerHTML = "";
    appendMessage("Hi! I’m LifeSense, your health assistant. I’m here to help you with your health-related queries.", true);
  });

  function appendMessage(text, isBot = false) {
    const msg = document.createElement("div");
    msg.classList.add("chat-msg", isBot ? "msg-bot" : "msg-user");
    if (isBot) {
      const icon = document.createElement("span");
      icon.className = "icon";
      icon.textContent = "🤖";
      const t = document.createElement("span");
      t.className = "text";
      t.textContent = text;
      msg.appendChild(icon);
      msg.appendChild(t);
    } else {
      msg.textContent = text;
    }
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function updateLastBotMessage(text) {
    const nodes = chatLog.querySelectorAll(".msg-bot .text");
    if (!nodes.length) return;
    nodes[nodes.length - 1].textContent = text;
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  async function sendChat() {
    const userText = chatInput.value.trim();
    if (!userText) return;
    appendMessage(userText, false);
    chatInput.value = "";
    appendMessage("Typing...", true);

    if (!inScope(userText)) {
      convo.push({ role: "user", content: userText });
      convo.push({ role: "assistant", content: REFUSAL_TEXT });
      saveConvo();
      updateLastBotMessage(REFUSAL_TEXT);
      return;
    }

    convo.push({ role: "user", content: userText });
    saveConvo();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: convo }),
      });
      const data = await res.json();
      const reply = data?.reply?.trim?.() || "No response.";
      convo.push({ role: "assistant", content: reply });
      saveConvo();
      updateLastBotMessage(reply);
    } catch {
      const errText = "Backend missing. Set up /api/chat.";
      convo.push({ role: "assistant", content: errText });
      saveConvo();
      updateLastBotMessage(errText);
    }
  }

  sendBtn.addEventListener("click", sendChat);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChat();
  });

  // greet user initially
  if (chatLog.children.length === 0) {
    appendMessage("Hi! I’m LifeSense, your health assistant. I’m here to help you with your health-related queries.", true);
  }
});
