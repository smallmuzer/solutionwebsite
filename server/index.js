import express from "express";
import cors from "cors";
import multer from "multer";
import { join, dirname, basename, extname, resolve } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, existsSync, appendFileSync } from "fs";
import { db, uuid } from "./db.js";
import { DB_PATH } from "./db.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { EventEmitter } from "events";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

const TRUSTED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
  "http://localhost:8081"
]);
const SAFE_TABLES = new Set([
  "contact_submissions", "job_applications", "services", "testimonials", "career_jobs",
  "products", "client_logos", "site_content", "seo_settings", "users", "chat_threads",
  "chat_messages", "submission_replies", "application_replies", "appointments"
]);

app.use(cors({ origin: Array.from(TRUSTED_ORIGINS), credentials: true }));
app.use(express.json({ limit: "20mb" }));

let secCache = { data: {}, lastFetch: 0 };
function getSecuritySettings() {
  const now = Date.now();
  if (now - secCache.lastFetch < 10000) return secCache.data;
  try {
    const row = db.prepare("SELECT content FROM site_content WHERE section_key = 'security'").get();
    secCache = { data: row && row.content ? JSON.parse(row.content) : {}, lastFetch: now };
    return secCache.data;
  } catch (e) {
    return secCache.data;
  }
}

const requestCounts = new Map();
setInterval(() => requestCounts.clear(), 30000);

app.use((req, res, next) => {
  const sec = getSecuritySettings();
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";

  if (sec.ip_logging && req.url.startsWith("/api")) {
    try {
      appendFileSync(join(__dirname, "server.log"), `${new Date().toISOString()} [security.ip_activity] ${JSON.stringify({ ip, method: req.method, url: req.url })}\n`);
    } catch {}
  }

  if (sec.content_security) {
     res.setHeader("X-Frame-Options", "DENY");
     res.setHeader("X-Content-Type-Options", "nosniff");
     res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  if (sec.rate_limiting && req.url.startsWith("/api")) {
     const count = (requestCounts.get(ip) || 0) + 1;
     requestCounts.set(ip, count);
     if (count > 200) {
       return res.status(429).json({ error: { message: "Rate limit exceeded" }, data: null });
     }
  }

  if (sec.cors_protection && req.headers.origin) {
    if (TRUSTED_ORIGINS.has(req.headers.origin)) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
      res.setHeader("Vary", "Origin");
    }
  }

  next();
});

function isTrustedOrigin(origin) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return TRUSTED_ORIGINS.has(url.origin);
  } catch {
    return false;
  }
}

app.use((req, res, next) => {
  const mutatingMethods = ["POST", "PATCH", "PUT", "DELETE"];
  if (!mutatingMethods.includes(req.method) || req.path.startsWith("/api/webhook") || req.path.startsWith("/api/health")) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  if (isTrustedOrigin(origin)) return next();
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (isTrustedOrigin(refererOrigin)) return next();
    } catch {}
  }

  res.status(403).json({ data: null, error: { message: "CSRF protection: untrusted origin" } });
});

// ── File uploads ──────────────────────────────────────────────────────────────
const PUBLIC_ASSETS = join(__dirname, "../public/assets");
const UPLOADS_DIR   = join(PUBLIC_ASSETS, "uploads");
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_FOLDERS = ["products", "services", "testimonials", "about", "careers", "hero", "uploads", "clients"];

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const requestedPath = String(req.body?.path || "");
    const folder = requestedPath.split("/")[0].replace(/[^a-zA-Z0-9_-]/g, "");
    const dir = ALLOWED_FOLDERS.includes(folder) ? join(PUBLIC_ASSETS, folder) : UPLOADS_DIR;
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const original = String(file.originalname || "upload.jpg");
    const extension = extname(original).replace(/^\./, "").toLowerCase() || "jpg";
    const safeBase = basename(original, extname(original)).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "file";
    cb(null, `${safeBase}_${Date.now()}.${extension}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Auth ──────────────────────────────────────────────────────────────────────
// token → { id, email, userrole }
const SESSIONS = new Map();

const DEFAULT_SETTINGS = {
  site_name: "Brilliant System Solutions",
  whatsapp_number: "9489477144",
  viber_number: "9489477144",
  contact_email: "info@solutions.com.mv",
  contact_from_email: "devteam.bss@gmail.com",
  hr_email: "hr.brillientsystem@zoho.com",
  demo_url: "https://demo.hrmetrics.mv/",
  bot_api_url: "",
  bot_api_token: "",
  ai_model: "gpt-4o-mini",
  site_logo: "/logo.png",
};

// Bot/Human mode toggle (in-memory, resets on restart)
let botMode = "bot"; // "bot" | "human"

function getSettings() {
  try {
    const row = db.prepare("SELECT content FROM site_content WHERE section_key = 'settings'").get();
    return { ...DEFAULT_SETTINGS, ...(row ? JSON.parse(row.content) : {}) };
  } catch (e) {
    console.error("[settings] failed to load settings", e);
    return { ...DEFAULT_SETTINGS };
  }
}

function appendLog(kind, payload) {
  try {
    appendFileSync(join(__dirname, "server.log"), `${new Date().toISOString()} [${kind}] ${JSON.stringify(payload)}\n`);
  } catch {}
}

const bus = new EventEmitter();
function emitEvent(event, data) {
  bus.emit(event, data);
}

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = db.prepare("SELECT id, email, password, userrole FROM users WHERE email = ?").get(email);
    const passwordValid = user && typeof user.password === "string" && typeof password === "string" &&
      user.password.length === password.length &&
      crypto.timingSafeEqual(Buffer.from(user.password), Buffer.from(password));
    if (passwordValid) {
      const token = uuid();
      SESSIONS.set(token, { id: user.id, email: user.email, userrole: user.userrole });
      return res.json({ data: { session: { access_token: token, user: { id: user.id, email: user.email, userrole: user.userrole } } }, error: null });
    }
  } catch (e) {
    console.error("[auth] Login error:", e);
  }
  
  res.status(401).json({ data: { session: null }, error: { message: "Invalid credentials" } });
});

app.post("/api/auth/logout", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) SESSIONS.delete(token);
  res.json({ error: null });
});

app.get("/api/auth/session", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token && SESSIONS.get(token);
  if (user) {
    // Re-verify user still exists and is still admin in DB
    try {
      const dbUser = db.prepare("SELECT id, email, userrole FROM users WHERE id = ? AND userrole = 'admin'").get(user.id);
      if (dbUser) {
        return res.json({ data: { session: { access_token: token, user: { id: dbUser.id, email: dbUser.email, userrole: dbUser.userrole } } }, error: null });
      }
    } catch {}
    SESSIONS.delete(token);
  }
  res.json({ data: { session: null }, error: null });
});

// ── Generic table helpers ─────────────────────────────────────────────────────

const UNIQUE_COLS = { site_content: "section_key", seo_settings: "page_key" };

function now() { return new Date().toISOString(); }

function buildSelect(table, filters, orderCol, orderAsc) {
  if (!SAFE_TABLES.has(table)) throw new Error("Invalid table");
  const allowedCols = TABLE_COLS[table] || [];
  const safeFilters = filters.filter(f => allowedCols.includes(f.col));

  let sql = `SELECT * FROM ${table}`;
  const vals = [];

  if (safeFilters.length) {
    sql += " WHERE " + safeFilters.map(f => `${f.col} = ?`).join(" AND ");
    vals.push(...safeFilters.map(f => f.val));
  }
  if (orderCol) sql += ` ORDER BY ${orderCol} ${orderAsc ? "ASC" : "DESC"}`;
  return { sql, vals };
}

function isAllowedExternalUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname)) return false;
    if (hostname.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

async function sendWhatsAppMessage({ to, text, settings }) {
  if (!settings.bot_api_url || !isAllowedExternalUrl(settings.bot_api_url)) {
    return { status: "skipped", detail: "Invalid or unset bot_api_url" };
  }
  try {
    const res = await fetch(settings.bot_api_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(settings.bot_api_token ? { Authorization: `Bearer ${settings.bot_api_token}` } : {}),
      },
      body: JSON.stringify({ to, message: text }),
    });
    if (!res.ok) throw new Error(`Remote responded ${res.status}`);
    const json = await res.json().catch(() => ({}));
    return { status: "sent", detail: json };
  } catch (e) {
    appendLog("wa.error", { to, message: text, error: e?.message });
    return { status: "failed", detail: e?.message || "Unknown error" };
  }
}

async function generateBotReply(messages, settings) {
  const s = settings || getSettings();
  const lastUser = messages.filter(m => m.role === "user").pop();
  const userText = (lastUser?.content || "").trim();
  const lower = userText.toLowerCase();
  const systemPrompt = s.system_prompt || "You are a friendly, conversational, and human-like AI assistant for Brilliant Systems Solutions (BSS). You must answer normal human questions naturally. For any inquiries regarding our IT products (especially HR Metrics 'MOST POPULAR', BSOL ERP, GoBoat, PromisePro) or services, provide highly relevant, applicable, and detailed answers showcasing features like 15 Days Free Trial, Cloud-based SaaS, and 24/7 Support. Be engaging and avoid repeating the exact same responses.";

  console.log(`[bot] Generating reply for: "${userText.substring(0, 50)}..."`);
  appendLog("bot.request", { text: userText, model: s.ai_model || "default" });

  // 1. External bot API (Legacy)
  if (s.bot_api_url && isAllowedExternalUrl(s.bot_api_url)) {
    try {
      const res = await fetch(s.bot_api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(s.bot_api_token ? { Authorization: `Bearer ${s.bot_api_token}` } : {}) },
        body: JSON.stringify({ messages, model: s.ai_model }),
      });
      const json = await res.json().catch(() => ({}));
      const reply = json?.choices?.[0]?.message?.content || json?.reply;
      if (reply) return { reply: reply.trim(), source: "external" };
    } catch (e) { appendLog("bot.legacy_error", { error: e?.message }); }
  }

  // 2. Google Gemini (Modern)
  if (s.gemini_api_key) {
    try {
      const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${s.ai_model || "gemini-1.5-flash"}:generateContent?key=${s.gemini_api_key}`;
      const payload = { contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nUser Message: ${userText}` }] }] };
      const res = await fetch(gUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return { reply: reply.trim(), source: "gemini" };
    } catch (e) { appendLog("bot.gemini_error", { error: e?.message }); }
  }

  // 3. OpenAI direct
  if (process.env.OPENAI_API_KEY || s.openai_api_key) {
    try {
      const apiKey = s.openai_api_key || process.env.OPENAI_API_KEY;
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: s.ai_model || "gpt-4o-mini", messages: [{ role: "system", content: systemPrompt }, ...messages], max_tokens: 500, temperature: 0.75 }),
      });
      const json = await res.json().catch(() => ({}));
      const reply = json?.choices?.[0]?.message?.content;
      if (reply) return { reply: reply.trim(), source: "openai" };
    } catch (e) { appendLog("bot.openai_error", { error: e?.message }); }
  }

  // 3. Smart local FAQ — keyword matching with rich answers
  const contact_info = `\n📧 ${s.contact_email || "info@solutions.com.mv"}\n📱 WhatsApp: ${s.whatsapp_number || "9603011355"}\n📞 ${s.landline || "+91-452 238 7388"}`;

  const rules = [
    // Greetings
    { match: () => /^(hi+|hello|hey|good\s*(morning|afternoon|evening)|howdy|greetings|sup|what'?s up)/i.test(lower),
      reply: `Hello! 👋 Welcome to Brilliant System Solutions!\n\nI can help you with:\n• HR & Payroll software (HR-Metrics)\n• ERP & CRM systems (BSOL)\n• Web & Mobile development\n• IT Consulting & Cloud\n• Pricing, demos & trials\n\nWhat can I help you with today?` },

    // HR-Metrics
    { match: () => /(hr.metric|hrmetric|hr software|payroll|attendance|leave management|employee management|performance review|okr|task management|workforce)/i.test(lower),
      reply: `**HR-Metrics** is our complete HR & Payroll platform:\n\n✅ Employee Onboarding & Management\n✅ Payroll Processing (auto tax, deductions)\n✅ Attendance & Leave Tracking\n✅ Performance Reviews & KPIs\n✅ Task Management & OKRs\n✅ Cloud-based SaaS — access anywhere\n✅ 24/7 Support\n\n🎯 **15 Days Free Trial** — no credit card needed!\n🔗 Demo: ${s.demo_url || "https://demo.hrmetrics.mv/"}\n${contact_info}` },

    // BSOL ERP
    { match: () => /(bsol|\berp\b|enterprise resource|inventory|procurement|supply chain|accounting|finance module|crm|sales pipeline|multi.branch)/i.test(lower),
      reply: `**BSOL** is our flagship ERP + CRM platform:\n\n✅ Finance & Accounting\n✅ Inventory & Warehouse Management\n✅ Procurement & Purchase Orders\n✅ Sales Pipeline & CRM\n✅ Multi-branch & Multi-currency\n✅ Real-time Dashboards & Reports\n\n🎯 **15 Days Free Trial** available!\n${contact_info}` },

    // GoBoat
    { match: () => /(goboat|boat|marine|vessel|charter|crew management|maritime)/i.test(lower),
      reply: `**GoBoat** — Complete Marine Management Software:\n\n✅ Vessel Scheduling & Booking\n✅ Crew Management\n✅ Maintenance Logs & Alerts\n✅ Charter Bookings\n✅ Compliance Tracking\n\nPerfect for boat operators in Maldives & beyond.\n${contact_info}` },

    // PromisePro
    { match: () => /(promisepro|resort|hotel|housekeeping|room management|guest|reservation|spa|f&b|food.*beverage)/i.test(lower),
      reply: `**PromisePro** — Resort & Hotel Management:\n\n✅ Online Reservations & Booking Engine\n✅ Room & Property Management\n✅ Housekeeping Management\n✅ F&B & Spa Scheduling\n✅ Guest Communications\n✅ Revenue Management\n\nUsed by leading resorts in Maldives.\n${contact_info}` },

    // Travel
    { match: () => /(travel platform|travel booking|flight booking|visa processing|tour package|travel agency|itinerary)/i.test(lower),
      reply: `**Travel Platform** — End-to-End Booking Engine:\n\n✅ Flight & Hotel Booking\n✅ Tour Package Management\n✅ Visa Processing\n✅ Customer Itineraries\n✅ Agency Dashboard & Reports\n\n${contact_info}` },

    // Pricing
    { match: () => /(price|cost|how much|pricing|quote|budget|affordable|cheap|expensive|subscription|plan)/i.test(lower),
      reply: `Our pricing is flexible and competitive:\n\n💡 **All products** — 15 Days Free Trial\n☁️ Cloud SaaS subscription plans\n🏢 Custom enterprise pricing\n📦 One-time license options available\n\nShare your requirements for a detailed quote:\n${contact_info}` },

    // Demo / Trial
    { match: () => /(demo|free trial|try|test drive|sandbox|evaluation)/i.test(lower),
      reply: `🎯 **Try FREE for 15 Days!**\n\n🔗 HR-Metrics Demo: ${s.demo_url || "https://demo.hrmetrics.mv/"}\n\nFor BSOL, GoBoat, PromisePro & Travel demos:\n${contact_info}` },

    // Services
    { match: () => /(service|what do you (do|offer|provide)|solution|capability|expertise)/i.test(lower),
      reply: `Brilliant System Solutions offers:\n\n💻 Custom Software Development\n🌐 Web Development (React, Node.js)\n📱 Mobile Apps (iOS & Android)\n🏭 ERP Solutions (BSOL)\n👥 HR & Payroll (HR-Metrics)\n☁️ Cloud & IT Consulting\n🔍 SEO & Digital Marketing\n🎨 UI/UX Design\n🛡️ Cybersecurity Consulting\n\nWhich service interests you?` },

    // Contact
    { match: () => /(contact|reach|phone|email|whatsapp|call|address|office|location|where are you)/i.test(lower),
      reply: `📞 **Contact Brilliant System Solutions:**\n\n📧 Email: ${s.contact_email || "info@solutions.com.mv"}\n📱 WhatsApp: ${s.whatsapp_number || "9603011355"}\n📱 Viber: ${s.viber_number || "9489477144"}\n📞 Landline: ${s.landline || "+91-452 238 7388"}\n\n🏢 Malé, Maldives: Alia Building, 7th Floor\n🇮🇳 Tamilnadu, India: Regional Office\n\n⏰ Sun–Thu: 9AM–6PM | Sat: 9AM–1PM` },

    // Careers
    { match: () => /(career|job|hiring|vacancy|apply|join us|work with|internship|opening)/i.test(lower),
      reply: `🚀 **Join Brilliant System Solutions!**\n\nCurrent openings:\n• Full Stack Developers (React, Node.js)\n• UI/UX Designers\n• Business Development Executives\n• Mobile App Developers\n\nApply via our website Careers section or:\n📧 ${s.hr_email || "hr.brillientsystem@zoho.com"}` },

    // About company
    { match: () => /(about (you|company|bss|brilliant)|who are you|what is bss|tell me about)/i.test(lower),
      reply: `**Brilliant System Solutions (BSS)** is a leading IT company serving Maldives, India & Bhutan.\n\n🏆 300+ projects delivered\n👥 50+ happy clients\n⭐ 100% client satisfaction\n\nWe build enterprise software, ERP, HR systems, web & mobile apps for hospitality, finance, government & more.\n\n${contact_info}` },

    // Thanks
    { match: () => /^(thank|thanks|thank you|thx|ty|great|awesome|perfect|excellent|good job|well done)/i.test(lower),
      reply: "You're welcome! 😊 Is there anything else I can help you with?" },

    // Bye
    { match: () => /^(bye|goodbye|see you|later|take care|ciao|good night)/i.test(lower),
      reply: "Goodbye! 👋 Feel free to reach out anytime. Have a great day!" },

    // General knowledge / how-to questions — give a helpful answer
    { match: () => /(what is|what are|how (do|does|to|can)|why (is|does|do)|explain|define|difference between|compare|vs\b)/i.test(lower),
      reply: (() => {
        // Try to answer common tech/business questions
        if (/(what is erp|erp system|enterprise resource)/i.test(lower))
          return `**ERP (Enterprise Resource Planning)** is software that integrates all business processes — finance, inventory, HR, procurement, sales — into one unified system.\n\nOur **BSOL ERP** does exactly this for businesses in Maldives & beyond.\n${contact_info}`;
        if (/(what is hr software|hrms|hris)/i.test(lower))
          return `**HR Software (HRMS)** manages all human resource functions: employee records, payroll, attendance, leave, performance reviews.\n\nOur **HR-Metrics** is a complete cloud-based HRMS with 15 Days Free Trial.\n🔗 ${s.demo_url}`;
        if (/(what is saas|software as a service)/i.test(lower))
          return `**SaaS (Software as a Service)** means software hosted in the cloud — you access it via browser, no installation needed. You pay a subscription fee.\n\nAll our products (HR-Metrics, BSOL) are available as SaaS.`;
        if (/(what is cloud|cloud computing)/i.test(lower))
          return `**Cloud Computing** means storing and accessing data/software over the internet instead of local servers.\n\nBenefits: access anywhere, automatic updates, lower IT costs, scalable.\n\nWe offer cloud-based solutions for all our products.`;
        if (/(what is crm|customer relationship)/i.test(lower))
          return `**CRM (Customer Relationship Management)** software helps manage customer interactions, sales pipeline, and relationships.\n\nOur **BSOL** includes a built-in CRM module alongside ERP.\n${contact_info}`;
        // Generic how-to
        return `Great question! For detailed technical guidance, I recommend checking official documentation or a search engine.\n\nFor anything related to our products or services, I'm here to help:\n${contact_info}`;
      })() },
  ];

  for (const rule of rules) {
    if (rule.match()) return { reply: rule.reply, source: "faq" };
  }

  // 4. Smart contextual fallback — never give the same generic answer
  const words = userText.split(/\s+/).length;
  let fallback;
  if (words <= 2) {
    // Very short input — ask for clarification
    fallback = `I'd love to help! Could you tell me more about what you're looking for?\n\nFor example:\n• "Tell me about HR software"\n• "What is the price of BSOL?"\n• "I need a demo"\n• "Contact information"\n\nOr reach us directly:\n${contact_info}`;
  } else {
    // Longer input — acknowledge and route
    fallback = `Thanks for your message! 🙏\n\nI understand you're asking about: "${userText.slice(0, 80)}${userText.length > 80 ? "..." : ""}"\n\nLet me connect you with our team for the best answer:\n${contact_info}\n\n⏰ We respond within 24 hours on business days.`;
  }
  return { reply: fallback, source: "fallback" };
}

// ── Email helpers ────────────────────────────────────────────────────────────

function createTransport(settings) {
  // Priority: DB settings smtp_* fields > env vars > defaults
  const host   = settings.smtp_host   || process.env.SMTP_HOST   || "smtp.gmail.com";
  const port   = Number(settings.smtp_port   || process.env.SMTP_PORT   || 465);
  const user   = settings.smtp_user   || process.env.SMTP_USER   || "devteam.bss@gmail.com";
  const pass   = settings.smtp_pass   || process.env.SMTP_PASS   || "prwxaevpwsuengmt";
  const secure = port === 465;

  console.log(`[email] Creating transport: ${host}:${port} (SSL: ${secure}) as ${user}`);
  appendLog("email.transport", { host, port, secure, user });

  return nodemailer.createTransport({
    host, port, secure,
    auth: user ? { user, pass } : undefined,
    tls: { rejectUnauthorized: false },
  });
}

function sendFallbackEmail({ subject, body, settings }) {
  appendLog("email.queue", { subject, to: settings.hr_email });
  try {
    const transport = createTransport(settings);
    transport.sendMail({
      from: settings.smtp_user || settings.contact_from_email || "devteam.bss@gmail.com",
      to: settings.hr_email || settings.contact_email,
      subject,
      text: body,
    }).catch(err => appendLog("email.error", err?.message || err));
  } catch (e) {
    appendLog("email.error", e?.message || e);
  }
  return { queued: true };
}

async function sendEmailNow({ to, subject, text, html, settings }) {
  try {
    const transport = createTransport(settings);
    const from = settings.smtp_user || settings.contact_from_email || "devteam.bss@gmail.com";
    console.log(`[email] Sending to ${to} from ${from} (Subject: ${subject})`);
    await transport.sendMail({ from, to, subject, text, ...(html ? { html } : {}) });
    appendLog("email.sent", { to, from, subject });
    return { ok: true };
  } catch (e) {
    console.error("[email] Failed to send email", e);
    appendLog("email.error", { error: e?.message || e, to, subject });
    return { ok: false, error: e?.message };
  }
}

// ── REST API: /api/db/:table ──────────────────────────────────────────────────

// SELECT
app.get("/api/db/:table", (req, res) => {
  try {
    const { table } = req.params;
    if (!SAFE_TABLES.has(table)) return res.status(400).json({ data: null, error: { message: "Invalid table" } });
    const filters = [];
    const allowedCols = TABLE_COLS[table] || [];
    
    let orderCol  = String(req.query._order  || "");
    let orderAsc  = String(req.query._asc || "true") !== "false";
    
    // Support Supabase-style sorting: ?_order=created_at.desc
    if (orderCol.endsWith(".desc")) {
      orderCol = orderCol.slice(0, -5);
      orderAsc = false;
    } else if (orderCol.endsWith(".asc")) {
      orderCol = orderCol.slice(0, -4);
      orderAsc = true;
    }
    // Whitelist orderCol to only known safe column names (prevent SQL injection)
    const safeColPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (orderCol && (!safeColPattern.test(orderCol) || !allowedCols.includes(orderCol))) orderCol = "";

    const wantSingle = req.query._single === "1";

    for (const [k, v] of Object.entries(req.query)) {
      if (!k.startsWith("_")) {
        // coerce boolean strings to SQLite integers
        const val = v === "true" ? 1 : v === "false" ? 0 : v;
        filters.push({ col: k, val });
      }
    }

    const { sql, vals } = buildSelect(table, filters, orderCol, orderAsc);
    let rows = db.prepare(sql).all(...vals);
    rows = rows.map(r => normaliseRow(table, r));

    if (wantSingle) return res.json({ data: rows[0] ?? null, error: null });
    res.json({ data: rows, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: { message: e.message } });
  }
});

// ── Known columns per table (prevents unknown-column errors) ─────────────────
const TABLE_COLS = {
  contact_submissions: ["id","name","full_name","company_name","email","phone","message","status","is_read","website","created_at"],
  job_applications:    ["id","applicant_name","email","phone","job_id","resume_url","cover_letter","status","website","created_at","updated_at"],
  services:            ["id","title","description","image_url","icon","accent_color","is_visible","sort_order","created_at","updated_at"],
  testimonials:        ["id","name","company","message","avatar_url","rating","is_visible","created_at","updated_at"],
  career_jobs:         ["id","title","description","location","job_type","is_visible","sort_order","created_at","updated_at"],
  products:            ["id","name","tagline","description","image_url","extra_text","extra_color","contact_url","is_popular","is_visible","sort_order","created_at","updated_at"],
  client_logos:        ["id","name","logo_url","is_visible","sort_order","created_at","updated_at"],
  site_content:        ["id","section_key","content","created_at","updated_at"],
  seo_settings:        ["id","page_key","title","description","keywords","og_image","updated_at","updated_by"],
  users:               ["id","email","password","userrole","created_at","updated_at"],
  chat_threads:        ["id","title","contact","channel","last_message","created_at","updated_at"],
  chat_messages:       ["id","thread_id","direction","channel","message","to_number","from_number","status","model","error","meta","created_at"],
  submission_replies:  ["id","submission_id","sender","message","created_at"],
  application_replies: ["id","application_id","sender","message","created_at"],
  appointments:        ["id","reference_type","reference_id","name","email","title","description","appointment_date","created_at"],
};

function filterCols(table, row) {
  const allowed = TABLE_COLS[table];
  if (!allowed) return row;
  return Object.fromEntries(Object.entries(row).filter(([k]) => allowed.includes(k)));
}

// INSERT
app.post("/api/db/:table", (req, res) => {
  try {
    const { table } = req.params;
    const input = req.body;
    const uCol  = UNIQUE_COLS[table];
    const row   = {
      id: input.id || uuid(),
      created_at: input.created_at || now(),
      updated_at: now(),
      ...input,
    };

    if (table === "contact_submissions") {
      const email = String(row.email || "").trim();
      const message = String(row.message || "").trim();
      const fullName = String(row.full_name || row.name || "").trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ data: null, error: { message: "A valid email address is required." } });
      }
      if (!fullName) {
        return res.status(400).json({ data: null, error: { message: "Full name is required." } });
      }
      if (!message) {
        return res.status(400).json({ data: null, error: { message: "Message content is required." } });
      }
      row.email = email;
      row.message = message;
      row.full_name = fullName;
      row.status = row.status || "new";
    }

    if (table === "job_applications") {
      const email = String(row.email || "").trim();
      const applicantName = String(row.applicant_name || "").trim();
      const emailRegex = /^[^\s@]+@[^^\s@]+\.[^\s@]+$/;
      if (!applicantName) {
        return res.status(400).json({ data: null, error: { message: "Applicant name is required." } });
      }
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ data: null, error: { message: "A valid applicant email address is required." } });
      }
      row.email = email;
      row.applicant_name = applicantName;
      row.job_id = row.job_id || "General";
      row.status = row.status || "new";
    }

    const dbRow = filterCols(table, serialiseRow(table, row));

    if (uCol && dbRow[uCol] != null) {
      const existing = db.prepare(`SELECT id FROM ${table} WHERE ${uCol} = ?`).get(dbRow[uCol]);
      if (existing) {
        const sets = Object.keys(dbRow).filter(k => k !== "id").map(k => `${k} = ?`).join(", ");
        db.prepare(`UPDATE ${table} SET ${sets} WHERE id = ?`).run(...Object.keys(dbRow).filter(k => k !== "id").map(k => dbRow[k]), existing.id);
        const updated = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(existing.id);
        return res.json({ data: normaliseRow(table, updated), error: null });
      }
    }

    const keys = Object.keys(dbRow);
    db.prepare(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`).run(...keys.map(k => dbRow[k]));
    const inserted = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(dbRow.id);
    const normalised = normaliseRow(table, inserted);

    // Hooks for specific tables
    if (table === "contact_submissions") {
      // Honeypot spam check — if 'website' field is filled, it's a bot
      if (normalised.website) {
        appendLog("spam.blocked", { email: normalised.email });
        return res.json({ data: normalised, error: null });
      }
      emitEvent("submission", normalised);
      const settings = getSettings();
      const siteName = settings.site_name || "Brilliant System Solutions";
      // 1. Auto-reply to submitter
      sendEmailNow({
        to: normalised.email,
        subject: `Thank you for contacting ${siteName}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
          <h2 style="color:#3b82f6;margin-bottom:8px">Thank you, ${normalised.full_name || normalised.name || "there"}!</h2>
          <p style="color:#374151">We've received your message and our team will get back to you within <strong>24 hours</strong>.</p>
          <div style="background:#f9fafb;border-left:4px solid #3b82f6;padding:12px 16px;margin:16px 0;border-radius:4px">
            <p style="margin:0;color:#6b7280;font-size:14px"><strong>Your message:</strong><br>${(normalised.message || "").replace(/\n/g, "<br>")}</p>
          </div>
          <p style="color:#374151">Best regards,<br><strong>${siteName} Team</strong></p>
          <p style="color:#9ca3af;font-size:12px;margin-top:16px">${settings.contact_email || ""}</p>
        </div>`,
        text: `Thank you ${normalised.full_name || normalised.name || "there"}!\n\nWe've received your message and will get back to you within 24 hours.\n\nYour message: ${normalised.message}\n\nBest regards,\n${siteName} Team`,
        settings,
      });
      // 2. HR / admin notification
      const hrTo = settings.hr_email || settings.contact_email;
      if (hrTo) {
        sendEmailNow({
          to: hrTo,
          subject: `📩 New Contact: ${normalised.full_name || normalised.name || normalised.email}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
            <h2 style="color:#3b82f6">New Contact Form Submission</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:6px 0;color:#6b7280;width:120px">Name</td><td style="padding:6px 0;color:#111827;font-weight:600">${normalised.full_name || normalised.name || "N/A"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="padding:6px 0"><a href="mailto:${normalised.email}" style="color:#3b82f6">${normalised.email}</a></td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Phone</td><td style="padding:6px 0;color:#111827">${normalised.phone || "N/A"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Company</td><td style="padding:6px 0;color:#111827">${normalised.company_name || "N/A"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Submitted</td><td style="padding:6px 0;color:#111827">${new Date(normalised.created_at).toLocaleString()}</td></tr>
            </table>
            <div style="background:#f9fafb;border-left:4px solid #3b82f6;padding:12px 16px;margin:16px 0;border-radius:4px">
              <p style="margin:0;color:#374151;font-size:14px"><strong>Message:</strong><br>${(normalised.message || "").replace(/\n/g, "<br>")}</p>
            </div>
          </div>`,
          text: `New Contact Submission\n\nName: ${normalised.full_name || normalised.name || "N/A"}\nEmail: ${normalised.email}\nPhone: ${normalised.phone || "N/A"}\nCompany: ${normalised.company_name || "N/A"}\n\nMessage:\n${normalised.message}\n\nSubmitted: ${normalised.created_at}`,
          settings,
        });
      }
    }
    if (table === "job_applications") {
      // Honeypot spam check
      if (normalised.website) {
        appendLog("spam.blocked", { email: normalised.email });
        return res.json({ data: normalised, error: null });
      }
      emitEvent("application", normalised);
      const settings = getSettings();
      const siteName = settings.site_name || "Brilliant System Solutions";
      // 1. Auto-reply to applicant
      sendEmailNow({
        to: normalised.email,
        subject: `Application Received – ${normalised.job_id || "Position"} | ${siteName}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
          <h2 style="color:#3b82f6">Application Received!</h2>
          <p style="color:#374151">Dear <strong>${normalised.applicant_name}</strong>,</p>
          <p style="color:#374151">Thank you for applying for <strong>${normalised.job_id || "the position"}</strong> at ${siteName}. Our HR team will review your application and contact you shortly.</p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:12px 16px;margin:16px 0;border-radius:4px;font-size:14px">
            <p style="margin:0 0 4px;color:#6b7280">Position: <strong style="color:#111827">${normalised.job_id || "N/A"}</strong></p>
            <p style="margin:0;color:#6b7280">Status: <strong style="color:#3b82f6">${normalised.status}</strong></p>
          </div>
          <p style="color:#374151">Best regards,<br><strong>HR Team – ${siteName}</strong></p>
          <p style="color:#9ca3af;font-size:12px">${settings.hr_email || settings.contact_email || ""}</p>
        </div>`,
        text: `Dear ${normalised.applicant_name},\n\nThank you for applying for "${normalised.job_id || "the position"}" at ${siteName}.\n\nOur HR team will review your application and contact you shortly.\n\nStatus: ${normalised.status}\n\nBest regards,\nHR Team – ${siteName}`,
        settings,
      });
      // 2. HR notification
      const hrTo = settings.hr_email || settings.contact_email;
      if (hrTo) {
        sendEmailNow({
          to: hrTo,
          subject: `💼 New Application: ${normalised.applicant_name} → ${normalised.job_id || "General"}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
            <h2 style="color:#3b82f6">New Job Application</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:6px 0;color:#6b7280;width:120px">Applicant</td><td style="padding:6px 0;color:#111827;font-weight:600">${normalised.applicant_name}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="padding:6px 0"><a href="mailto:${normalised.email}" style="color:#3b82f6">${normalised.email}</a></td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Phone</td><td style="padding:6px 0;color:#111827">${normalised.phone || "N/A"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Position</td><td style="padding:6px 0;color:#111827;font-weight:600">${normalised.job_id || "N/A"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Submitted</td><td style="padding:6px 0;color:#111827">${new Date(normalised.created_at).toLocaleString()}</td></tr>
            </table>
            ${normalised.cover_letter ? `<div style="background:#f9fafb;border-left:4px solid #3b82f6;padding:12px 16px;margin:16px 0;border-radius:4px"><p style="margin:0;color:#374151;font-size:14px"><strong>Cover Letter:</strong><br>${normalised.cover_letter.replace(/\n/g, "<br>")}</p></div>` : ""}
          </div>`,
          text: `New Job Application\n\nApplicant: ${normalised.applicant_name}\nEmail: ${normalised.email}\nPhone: ${normalised.phone || "N/A"}\nPosition: ${normalised.job_id || "N/A"}\n\nCover Letter:\n${normalised.cover_letter || "N/A"}\n\nSubmitted: ${normalised.created_at}`,
          settings,
        });
      }
    }
    if (table === "appointments") {
      emitEvent("appointment", normalised);
    }

    res.json({ data: normalised, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: { message: e.message } });
  }
});

// UPDATE
app.patch("/api/db/:table", (req, res) => {
  try {
    const { table } = req.params;
    if (!SAFE_TABLES.has(table)) return res.status(400).json({ data: null, error: { message: "Invalid table" } });
    const allowedCols = TABLE_COLS[table] || [];
    const filters = [];
    for (const [k, v] of Object.entries(req.query)) {
      if (!k.startsWith("_") && allowedCols.includes(k)) {
        const val = v === "true" ? 1 : v === "false" ? 0 : v;
        filters.push({ col: k, val });
      }
    }
    if (!filters.length) return res.status(400).json({ data: null, error: { message: "No filters for update" } });

    const patch = { ...req.body, updated_at: now() };
    const dbPatch = Object.fromEntries(Object.entries(serialiseRow(table, patch)).filter(([k]) => allowedCols.includes(k)));

    const sets  = Object.keys(dbPatch).map(k => `${k} = ?`).join(", ");
    const where = filters.map(f => `${f.col} = ?`).join(" AND ");
    db.prepare(`UPDATE ${table} SET ${sets} WHERE ${where}`).run(...Object.values(dbPatch), ...filters.map(f => f.val));

    const { sql, vals } = buildSelect(table, filters, "", true);
    const rows = db.prepare(sql).all(...vals).map(r => normaliseRow(table, r));
    res.json({ data: rows[0] ?? null, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: { message: e.message } });
  }
});

// DELETE
app.delete("/api/db/:table", (req, res) => {
  try {
    const { table } = req.params;
    if (!SAFE_TABLES.has(table)) return res.status(400).json({ data: null, error: { message: "Invalid table" } });
    const allowedCols = TABLE_COLS[table] || [];
    const filters = [];
    for (const [k, v] of Object.entries(req.query)) {
      if (!k.startsWith("_") && allowedCols.includes(k)) {
        const val = v === "true" ? 1 : v === "false" ? 0 : v;
        filters.push({ col: k, val });
      }
    }
    if (!filters.length) return res.status(400).json({ data: null, error: { message: "No filters for delete" } });
    const where = filters.map(f => `${f.col} = ?`).join(" AND ");
    db.prepare(`DELETE FROM ${table} WHERE ${where}`).run(...filters.map(f => f.val));
    res.json({ data: null, error: null });
  } catch (e) {
    res.status(500).json({ data: null, error: { message: e.message } });
  }
});

// ── File upload ───────────────────────────────────────────────────────────────
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  // Build public URL from actual saved path relative to public/
  const relPath = req.file.path
    .replace(join(__dirname, "../public"), "")
    .replace(/\\/g, "/");
  const publicUrl = relPath.startsWith("/") ? relPath : `/${relPath}`;
  res.json({ data: { publicUrl }, error: null });
});

// ── Bot mode toggle ───────────────────────────────────────────────────────────
app.post("/api/bot/mode", (req, res) => {
  const { mode } = req.body || {};
  if (mode === "bot" || mode === "human") {
    botMode = mode;
    console.log(`[bot] Mode switched to: ${mode}`);
    res.json({ data: { mode: botMode }, error: null });
  } else {
    res.status(400).json({ error: { message: "mode must be 'bot' or 'human'" }, data: null });
  }
});

app.get("/api/bot/mode", (req, res) => {
  res.json({ data: { mode: botMode }, error: null });
});

app.post("/api/chat/send", async (req, res) => {
  const { message, session_id, from, history } = req.body || {};
  if (!message || typeof message !== "string") return res.status(400).json({ error: { message: "message is required" }, data: null });

  const settings = getSettings();
  const nowIso   = new Date().toISOString();
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown IP";
  const userChannel = req.body.channel || "website";
  
  // session_id is our Master ID (chat_messages.id)
  let masterId = session_id;

  // Ensure Master entry exists
  if (masterId) {
    const existing = db.prepare("SELECT id FROM chat_messages WHERE id = ?").get(masterId);
    if (!existing) masterId = null; // Reset if invalid
  }

  if (!masterId) {
    masterId = uuid();
    db.prepare(`INSERT INTO chat_messages (id, session_id, ip_address, channel, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)`)
      .run(masterId, masterId, ip, userChannel, nowIso, nowIso);
  } else {
    db.prepare("UPDATE chat_messages SET updated_at = ? WHERE id = ?").run(nowIso, masterId);
  }

  const direction = from === "admin-panel" || from === "admin" ? "outbound" : "inbound";
  const detailId = uuid();
  const userMeta = JSON.stringify({ ip, source: "website" });

  // Save to Detail table (chat_threads)
  db.prepare(`INSERT INTO chat_threads (id, message_id, direction, content, sender, timestamp, meta)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(detailId, masterId, direction, message, from || "website", nowIso, userMeta);

  emitEvent("chat", { id: detailId, message_id: masterId, direction, content: message, timestamp: nowIso });

  // Send via WA if configured
  const waResult = await sendWhatsAppMessage({ to: settings.whatsapp_number, text: message, settings });

  // Bot Reply Logic
  const isAdminReply = from === "admin";
  if (!isAdminReply && botMode === "bot") {
    // Load context for bot
    const dbHistory = db.prepare("SELECT direction, content FROM chat_threads WHERE message_id = ? ORDER BY timestamp ASC LIMIT 20").all(masterId);
    const contextMsgs = dbHistory
      .filter(m => m.direction !== "outbound")
      .map(m => ({ role: m.direction === "bot" ? "assistant" : "user", content: m.content }));
    if (!contextMsgs.length) contextMsgs.push({ role: "user", content: message });

    const botReply = await generateBotReply(contextMsgs, settings);
    const botDetailId = uuid();
    db.prepare(`INSERT INTO chat_threads (id, message_id, direction, content, sender, timestamp, meta)
                VALUES (?, ?, 'bot', ?, 'AI Assistant', ?, ?)`)
      .run(botDetailId, masterId, botReply.reply, new Date().toISOString(), JSON.stringify({ source: botReply.source }));
    
    emitEvent("chat", { id: botDetailId, message_id: masterId, direction: "bot", content: botReply.reply, timestamp: new Date().toISOString() });
    
    res.json({
      data: {
        session_id: masterId,
        user_message: { id: detailId, status: waResult.status },
        bot_message: { id: botDetailId, reply: botReply.reply, source: botReply.source },
      },
      error: null,
    });
  } else {
    res.json({ data: { session_id: masterId, user_message: { id: detailId, status: waResult.status }, bot_message: null }, error: null });
  }
});

app.get("/api/chat/history", (req, res) => {
  const limit = Math.max(1, Math.min(parseInt(req.query.limit || "50", 10), 200));
  // Return Joined Master-Detail for recent messages
  const rows = db.prepare(`
    SELECT m.id as session_id, m.ip_address, t.id, t.direction, t.content, t.timestamp, t.sender
    FROM chat_threads t
    JOIN chat_messages m ON t.message_id = m.id
    ORDER BY t.timestamp DESC 
    LIMIT ?
  `).all(limit);
  res.json({ data: rows.reverse(), error: null });
});

// Get replies for a submission
app.get("/api/submissions/:id/replies", (req, res) => {
  const { id } = req.params;
  const replies = db.prepare("SELECT * FROM submission_replies WHERE submission_id = ? ORDER BY datetime(created_at) ASC").all(id);
  res.json({ data: replies, error: null });
});

// Contact submission replies
app.post("/api/submissions/:id/reply", async (req, res) => {
  const { id } = req.params;
  const { message, sender = "admin" } = req.body || {};
  if (!message) return res.status(400).json({ error: "message required" });
  const submission = db.prepare("SELECT * FROM contact_submissions WHERE id = ?").get(id);
  if (!submission) return res.status(404).json({ error: "not found" });
  const replyId = uuid();
  const nowIso = new Date().toISOString();
  db.prepare("INSERT INTO submission_replies (id, submission_id, sender, message, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(replyId, id, sender, message, nowIso);
  // Mark as read + responded
  db.prepare("UPDATE contact_submissions SET is_read = 1, status = 'responded' WHERE id = ?").run(id);
  emitEvent("submission", { replyId, submission_id: id, message, sender, created_at: nowIso });
  const settings = getSettings();
  await sendEmailNow({
    to: submission.email,
    subject: "Reply to your enquiry",
    text: message,
    settings,
  });
  res.json({ ok: true });
});

// Get replies for an application
app.get("/api/applications/:id/replies", (req, res) => {
  const { id } = req.params;
  const replies = db.prepare("SELECT * FROM application_replies WHERE application_id = ? ORDER BY datetime(created_at) ASC").all(id);
  res.json({ data: replies, error: null });
});

// Job application status & replies
app.get("/api/applications", (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email required" });
  const apps = db.prepare("SELECT * FROM job_applications WHERE email = ? ORDER BY datetime(created_at) DESC").all(email);
  res.json({ data: apps, error: null });
});

app.post("/api/applications/:id/reply", (req, res) => {
  const { id } = req.params;
  const { message, sender = "admin", status } = req.body || {};
  if (!message && !status) return res.status(400).json({ error: "message or status required" });
  const appRow = db.prepare("SELECT * FROM job_applications WHERE id = ?").get(id);
  if (!appRow) return res.status(404).json({ error: "not found" });
  const nowIso = new Date().toISOString();
  if (status) {
    db.prepare("UPDATE job_applications SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso, id);
  }
  if (message) {
    const replyId = uuid();
    db.prepare("INSERT INTO application_replies (id, application_id, sender, message, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(replyId, id, sender, message, nowIso);
  }
  emitEvent("application", { id, status: status || appRow.status, message, created_at: nowIso });
  const settings = getSettings();
  if (message) {
    sendEmailNow({
      to: appRow.email,
      subject: `Update on your application (${status || appRow.status})`,
      text: message,
      settings,
    });
  }
  res.json({ ok: true });
});

app.post("/api/webhook/whatsapp", async (req, res) => {
  const { from, message } = req.body || {};
  if (!from || !message) return res.status(400).json({ error: "missing from/message" });
  const settings = getSettings();
  const threadId = uuid();
  const nowIso = new Date().toISOString();
  db.prepare(`INSERT INTO chat_threads (id, title, contact, channel, last_message, created_at, updated_at)
              VALUES (?, ?, ?, 'whatsapp', ?, ?, ?)`)
    .run(threadId, `WA ${from}`, from, message, nowIso, nowIso);
  const inboundId = uuid();
  db.prepare(`INSERT INTO chat_messages (id, thread_id, direction, channel, message, to_number, from_number, status, created_at)
              VALUES (?, ?, 'inbound', 'whatsapp', ?, ?, ?, 'delivered', ?)`)
    .run(inboundId, threadId, message, settings.whatsapp_number, from, nowIso);
  emitEvent("chat", { id: inboundId, thread_id: threadId, direction: "inbound", channel: "whatsapp", message, created_at: nowIso });

  const botReply = await generateBotReply([{ role: "user", content: message }], settings);
  const botMsgId = uuid();
  db.prepare(`INSERT INTO chat_messages (id, thread_id, direction, channel, message, to_number, from_number, status, model, meta, created_at)
              VALUES (?, ?, 'bot', 'whatsapp', ?, ?, ?, 'sent', ?, ?, ?)`)
    .run(botMsgId, threadId, botReply.reply, from, settings.whatsapp_number, settings.ai_model, JSON.stringify({ source: botReply.source }), new Date().toISOString());
  emitEvent("chat", { id: botMsgId, thread_id: threadId, direction: "bot", channel: "whatsapp", message: botReply.reply, created_at: new Date().toISOString() });
  // Try sending reply back out
  await sendWhatsAppMessage({ to: from, text: botReply.reply, settings });
  res.json({ ok: true });
});

app.post("/api/webhook/viber", async (req, res) => {
  const { from, message } = req.body || {};
  if (!from || !message) return res.status(400).json({ error: "missing from/message" });
  const settings = getSettings();
  const threadId = uuid();
  const nowIso = new Date().toISOString();
  db.prepare(`INSERT INTO chat_threads (id, title, contact, channel, last_message, created_at, updated_at)
              VALUES (?, ?, ?, 'viber', ?, ?, ?)`)
    .run(threadId, `Viber ${from}`, from, message, nowIso, nowIso);
  const inboundId = uuid();
  db.prepare(`INSERT INTO chat_messages (id, thread_id, direction, channel, message, to_number, from_number, status, created_at)
              VALUES (?, ?, 'inbound', 'viber', ?, ?, ?, 'delivered', ?)`)
    .run(inboundId, threadId, message, settings.viber_number, from, nowIso);
  emitEvent("chat", { id: inboundId, thread_id: threadId, direction: "inbound", channel: "viber", message, created_at: nowIso });
  const botReply = await generateBotReply([{ role: "user", content: message }], settings);
  const botMsgId = uuid();
  db.prepare(`INSERT INTO chat_messages (id, thread_id, direction, channel, message, to_number, from_number, status, model, meta, created_at)
              VALUES (?, ?, 'bot', 'viber', ?, ?, ?, 'sent', ?, ?, ?)`)
    .run(botMsgId, threadId, botReply.reply, from, settings.viber_number, settings.ai_model, JSON.stringify({ source: botReply.source }), new Date().toISOString());
  emitEvent("chat", { id: botMsgId, thread_id: threadId, direction: "bot", channel: "viber", message: botReply.reply, created_at: new Date().toISOString() });
  res.json({ ok: true });
});

app.get("/api/health/integrations", async (_req, res) => {
  const settings = getSettings();
  const results = { whatsapp: "not_configured", bot: "not_configured", email: "not_configured" };
  // WhatsApp health: check if API URL is set
  results.whatsapp = settings.bot_api_url ? "configured" : "not_configured";
  // Bot health: quick ping
  if (settings.bot_api_url && isAllowedExternalUrl(settings.bot_api_url)) {
    try {
      const ping = await fetch(settings.bot_api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(settings.bot_api_token ? { Authorization: `Bearer ${settings.bot_api_token}` } : {}) },
        body: JSON.stringify({ messages: [{ role: "user", content: "ping" }], model: settings.ai_model }),
      });
      results.bot = ping.ok ? "ok" : "error";
    } catch { results.bot = "error"; }
  } else if (settings.bot_api_url) {
    results.bot = "invalid_url";
  }
  // Email health
  try {
    const transport = createTransport(settings);
    await transport.verify();
    results.email = "ok";
  } catch (e) { results.email = "error"; }
  res.json({ data: results, error: null });
});

// Simple SSE bus for lightweight realtime updates
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  // Send initial ping to confirm connection
  res.write(": ok\n\n");

  const send = (event, data) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const chatHandler = (data) => send("chat", data);
  const submissionHandler = (data) => send("submission", data);
  const applicationHandler = (data) => send("application", data);

  bus.on("chat", chatHandler);
  bus.on("submission", submissionHandler);
  bus.on("application", applicationHandler);

  // Heartbeat to keep connection alive (especially for Firefox)
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) res.write(": heartbeat\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    bus.off("chat", chatHandler);
    bus.off("submission", submissionHandler);
    bus.off("application", applicationHandler);
  });
});

// ── Row normalisation helpers ─────────────────────────────────────────────────

const BOOL_COLS = ["is_visible", "is_popular", "is_read"];

function normaliseRow(table, row) {
  const out = { ...row };
  for (const col of BOOL_COLS) {
    if (col in out) out[col] = out[col] === 1 || out[col] === true;
  }
  if (table === "chat_messages" && typeof out.meta === "string") {
    try { out.meta = JSON.parse(out.meta); } catch {}
  }
  if (table === "site_content" && typeof out.content === "string") {
    try { out.content = JSON.parse(out.content); } catch {}
  }
  return out;
}

function serialiseRow(table, row) {
  const out = { ...row };
  for (const col of BOOL_COLS) {
    if (col in out) out[col] = out[col] ? 1 : 0;
  }
  if (table === "site_content" && out.content && typeof out.content === "object") {
    out.content = JSON.stringify(out.content);
  }
  return out;
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] SQLite API running on http://localhost:${PORT}`);
  console.log(`[server] DB file: ${DB_PATH}`);
});
