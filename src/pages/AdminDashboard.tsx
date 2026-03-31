import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/localClient";
import { toast } from "sonner";
import {
  LayoutDashboard, MessageSquare, FileText, Shield, Globe, LogOut, Eye, EyeOff, Trash2, ChevronLeft, Menu, X, PanelLeftClose, PanelLeft, Settings, RefreshCw, Mail, Activity, Send, PhoneCall, Save, Bot, Sun, Moon, Star,
  ChevronRight, Calendar as CalendarIcon, Clock, User, Briefcase, LayoutGrid, List, Search, ChevronDown, Image, Type, BotMessageSquare
} from "lucide-react";
import { openViber, ViberIcon } from "@/lib/viber";
import type { Tables } from "@/integrations/supabase/types";
import SEOManager from "@/components/admin/SEOManager";
import SecurityPanel from "@/components/admin/SecurityPanel";
import PageEditor from "@/components/admin/PageEditor";
import { useUndoAction } from "@/hooks/useUndoAction";
import LoadingSpinner from "@/components/LoadingSpinner";
import { applySettings } from "@/hooks/useSiteSettings";

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("bss-theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return document.documentElement.classList.contains("dark");
  });
  useEffect(() => {
    const stored = localStorage.getItem("bss-theme");
    if (stored === "dark") document.documentElement.classList.add("dark");
    else if (stored === "light") document.documentElement.classList.remove("dark");
  }, []);
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  const toggle = () => {
    const next = !isDark;
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("bss-theme", next ? "dark" : "light");
    setIsDark(next);
  };
  return { isDark, toggle };
}

type Tab = "dashboard" | "inbox" | "website" | "sitehealth" | "settings" | "chat" | "appointments";

const AVAILABLE_FONTS: { label: string; value: string }[] = [
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "DM Sans", value: "'DM Sans', sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Lato", value: "'Lato', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Nunito", value: "'Nunito', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Raleway", value: "'Raleway', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Source Code Pro", value: "'Source Code Pro', monospace" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
];

interface SiteSettings {
  site_name: string; site_logo: string; whatsapp_number: string; viber_number: string;
  contact_email: string; contact_from_email: string; hr_email: string;
  smtp_host: string; smtp_port: string; smtp_user: string; smtp_pass: string;
  ai_model: string; demo_url: string; db_connection: string;
  social_linkedin: string; social_twitter: string; social_facebook: string; social_instagram: string;
  landline: string; enable_cinematic: boolean; cinematic_asset: string;
  font_size: string; theme: string; font_style: string; enable_animations: boolean;
  gemini_api_key: string; openai_api_key: string; system_prompt: string;
  accent_color: string; global_view: string; card_style: string;
  bot_api_url: string; bot_api_token: string;
  hr_email: string;
}

const AppointmentsCalendar = ({ appointments }: { appointments: any[] }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const handlePrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNext = () => setCurrentDate(new Date(year, month + 1, 1));
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const getDayAppts = (day: number) => {
    return appointments.filter(a => {
      const d = new Date(a.appointment_date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="glass-card flex flex-col items-center overflow-hidden">
      <div className="flex justify-between w-full items-center px-6 py-4 border-b border-border/50 bg-muted/20">
        <button onClick={handlePrev} className="p-2 bg-background border border-border shadow-sm hover:bg-muted text-foreground rounded-lg transition-colors flex items-center justify-center">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-xl font-heading font-black text-foreground flex items-center gap-2">
          <CalendarIcon size={20} className="text-secondary" /> {monthName}
        </h2>
        <button onClick={handleNext} className="p-2 bg-background border border-border shadow-sm hover:bg-muted text-foreground rounded-lg transition-colors flex items-center justify-center">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="w-full p-6 bg-background">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-3 rounded-xl">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="bg-muted p-2 rounded-lg text-center text-[0.625rem] sm:text-[0.6875rem] font-black uppercase text-muted-foreground tracking-widest border border-border/30 shadow-sm">
              {d}
            </div>
          ))}
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="bg-transparent min-h-[80px] sm:min-h-[100px]" />;
            const dayAppts = getDayAppts(day);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            return (
              <div key={`day-${day}`} className={`bg-muted/10 border ${isToday ? 'border-secondary/50 ring-1 ring-inset ring-secondary/20 bg-secondary/5' : 'border-border/50'} min-h-[80px] sm:min-h-[110px] rounded-xl p-1.5 sm:p-2 transition-colors hover:bg-muted/30 relative shadow-sm`}>
                <div className="flex justify-start">
                  <span className={`text-xs font-bold leading-none ${isToday ? 'text-secondary bg-secondary/20 px-1.5 py-1 rounded-md' : 'text-muted-foreground'}`}>{day}</span>
                </div>
                <div className="mt-1.5 flex flex-col gap-1 w-full max-h-[70px] sm:max-h-[90px] overflow-y-auto custom-scrollbar">
                  {dayAppts.map((a, i) => (
                    <button key={i} onClick={() => setSelectedAppt(a)}
                      className={`text-left text-[0.5625rem] sm:text-[0.625rem] leading-tight px-1.5 py-1.5 ${a.reference_type === 'contact' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-sm' : 'bg-green-500/10 text-green-600 border border-green-500/20 shadow-sm'} rounded-md hover:scale-[1.02] active:scale-95 transition-all truncate font-medium`}>
                      {new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <div className="font-bold opacity-80 mt-0.5 truncate">{a.name.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedAppt && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedAppt(null)}>
          <div className="bg-background border border-border rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full space-y-5 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className={`text-[0.625rem] uppercase font-black tracking-widest px-2 py-1 flex items-center gap-1.5 rounded-full inline-flex ${selectedAppt.reference_type === 'contact' ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'}`}>
                  {selectedAppt.reference_type === 'application' ? <Briefcase size={12} /> : <User size={12} />}
                  {selectedAppt.reference_type} Interaction
                </div>
              </div>
              <button onClick={() => setSelectedAppt(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X size={18} /></button>
            </div>
            <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
              <div className="flex items-start gap-3">
                <CalendarIcon size={16} className="text-secondary shrink-0 mt-0.5" />
                <div>
                  <div className="text-[0.625rem] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Scheduled Date</div>
                  <div className="text-sm font-semibold text-foreground">{new Date(selectedAppt.appointment_date).toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-secondary shrink-0 mt-0.5" />
                <div>
                  <div className="text-[0.625rem] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Time</div>
                  <div className="text-sm font-semibold text-foreground">{new Date(selectedAppt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-secondary shrink-0 mt-0.5" />
                <div>
                  <div className="text-[0.625rem] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Contact Email</div>
                  <a href={`mailto:${selectedAppt.email}`} className="text-sm font-semibold text-secondary hover:underline break-all">{selectedAppt.email}</a>
                </div>
              </div>
              {selectedAppt.description && (
                <div className="p-3 bg-card border border-border rounded-lg text-xs text-muted-foreground italic leading-relaxed">
                  "{selectedAppt.description}"
                </div>
              )}
            </div>
            <button onClick={() => setSelectedAppt(null)} className="w-full py-2.5 bg-secondary text-secondary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity">Close Overview</button>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState({ contacts: 0, appointments: 0, jobs: 0, visitors: 0 });
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptsLoading, setApptsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox");
  const [inboxSubTab, setInboxSubTab] = useState("contacts");
  const [siteHealthSubTab, setSiteHealthSubTab] = useState("seo");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [replyingSub, setReplyingSub] = useState<string | null>(null);
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
  const [subReplies, setSubReplies] = useState<Record<string, any[]>>({});
  const [appReplies, setAppReplies] = useState<Record<string, any[]>>();
  // Inbox filters & pagination
  const [subSearch, setSubSearch] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState("all");
  const [subDateFilter, setSubDateFilter] = useState("");
  const [subPage, setSubPage] = useState(1);
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  const [appDateFilter, setAppDateFilter] = useState("");
  const [appPage, setAppPage] = useState(1);
  const PAGE_SIZE = 10;
  const [savingSettings, setSavingSettings] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeChannel, setActiveChannel] = useState<"website" | "whatsapp" | "viber">("website");
  const [integrationStatus, setIntegrationStatus] = useState<any>({ whatsapp: "loading", bot: "loading", email: "loading" });
  const { executeWithUndo } = useUndoAction();

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_name: "Systems Solutions",
    site_logo: "/assets/logo.png",
    whatsapp_number: "9603011355",
    viber_number: "9489477144",
    contact_email: "info@solutions.com.mv",
    contact_from_email: "devteam.bss@gmail.com",
    hr_email: "", smtp_host: "", smtp_port: "", smtp_user: "", smtp_pass: "",
    bot_api_url: "", bot_api_token: "", ai_model: "gemini-1.5-flash",
    demo_url: "https://demo.hrmetrics.mv/", db_connection: "sqlite://server/app.db",
    social_linkedin: "https://in.linkedin.com/company/brilliantsystemssolutions",
    social_twitter: "https://x.com/bsspl_india",
    social_facebook: "https://www.facebook.com/brilliantsystemssolutions/",
    social_instagram: "https://www.instagram.com/brilliantsystemssolutions",
    landline: "+91-452 238 7388", enable_cinematic: false,
    cinematic_asset: "/assets/hero/cinematic.png",
    font_size: "medium", theme: "light", font_style: "'Inter', sans-serif",
    enable_animations: true, gemini_api_key: "", openai_api_key: "",
    system_prompt: "", accent_color: "#3b82f6", global_view: "grid", card_style: "glass"
  });

  const [uxDraft, setUxDraft] = useState<any>({
    font_style: "'Inter', sans-serif", font_size: "medium", accent_color: "#3b82f6",
    global_view: "grid", card_style: "icon", theme: "light"
  });



  const dbFetch = async (table: string, options: { method?: string; body?: any; query?: Record<string, string> } = {}) => {
    try {
      const url = new URL(`/api/db/${table}`, window.location.origin);
      if (options.query) {
        Object.entries(options.query).forEach(([key, value]) => {
          if (typeof value === "string") url.searchParams.set(key, value);
        });
      }
      const resp = await fetch(url.toString(), {
        method: options.method || "GET",
        headers: { "Content-Type": "application/json" },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      const json = await resp.json();
      return { data: json.data, error: json.error };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  };

  const applyUX = (prefs: any) => {
    applySettings(prefs);
  };
  const esRef = useRef<EventSource | null>(null);

  const startSSE = () => {
    if (esRef.current) return; // already connected
    const es = new EventSource("/api/events");
    esRef.current = es;
    es.addEventListener("submission", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data);
      setSubmissions((prev) => {
        if (prev.some(s => s.id === data.id)) return prev;
        return [data, ...prev];
      });
    });
    es.addEventListener("chat", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data);
      setChatHistory((prev) => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [data, ...prev].slice(0, 200);
      });
    });
    es.addEventListener("application", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data);
      setApplications((prev) => {
        if (prev.some(a => a.id === data.id)) return prev;
        return [data, ...prev];
      });
    });
  };

  useEffect(() => {
    const cleanup = () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
    window.addEventListener("beforeunload", cleanup);
    return () => {
      cleanup();
      window.removeEventListener("beforeunload", cleanup);
    };
  }, []);

  const switchTab = (t: Tab) => {
    setTab(t);
    setSidebarOpen(false);
    if (t === "website") setCollapsed(true);
    else setCollapsed(false);
  };

  // Auto-collapse sidebar on Edit Website
  useEffect(() => {
    if (tab === "website") setCollapsed(true);
    else setCollapsed(false);
  }, [tab]);

  useEffect(() => {
    if (activeTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, activeTab]);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/admin/login", { replace: true }); return; }
    const { data: roles } = await supabase.from("users").select("userrole").eq("id", session.user.id).eq("userrole", "admin");
    if (!roles || roles.length === 0) { navigate("/admin/login", { replace: true }); return; }
    setAuthChecking(false);
    startSSE();
    loadData();
    loadSettings();
    loadChatHistory();
    loadApplications();
    loadAppointments();
    loadIntegrationStatus();
  };

  const loadData = async () => {
    setLoading(true);
    const { data: subData } = await dbFetch("contact_submissions", { query: { _order: "created_at", _asc: "false" } });
    if (subData) setSubmissions(subData);
    setLoading(false);
  };

  const loadSettings = async () => {
    const { data } = await dbFetch("site_content", { query: { section_key: "settings", _single: "1" } });
    if (data?.content) {
      const c = data.content as any;
      setSiteSettings((prev) => ({ ...prev, ...c }));
      
      // 1. Get User Overrides from LocalStorage first
      let localPrefs: any = {};
      try {
        const stored = localStorage.getItem("bss-user-settings");
        if (stored) localPrefs = JSON.parse(stored);
      } catch {}

      // 2. Sync UX draft prioritizing Local Overrides > DB Settings
      setUxDraft({
        font_style: localPrefs.font_style || c.font_style || "'Inter', sans-serif",
        font_size: localPrefs.font_size || c.font_size || "medium",
        accent_color: localPrefs.accent_color || c.accent_color || "#3b82f6",
        global_view: localPrefs.global_view || c.global_view || "grid",
        card_style: localPrefs.card_style || c.card_style || "icon"
      });
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);

    // 1. ALWAYS save UX to DB so it acts as Global Default
    const finalSettings = { ...siteSettings, ...uxDraft };
    setSiteSettings(finalSettings);

    // 2. Always save Personal UX to LocalStorage (cookie-equivalent) for persistence
    localStorage.setItem("bss-user-settings", JSON.stringify(uxDraft));

    await dbFetch("site_content", {
      method: "POST",
      body: { section_key: "settings", content: finalSettings }
    });

    setSavingSettings(false);
    toast.success("Settings saved globally & preferences updated for your session!");
  };

  // Real-time Preview: Apply UX changes immediately to the Admin Panel as they are drafted
  useEffect(() => {
    if (tab === "settings") {
      applySettings(uxDraft, true);
    }
  }, [uxDraft, tab]);

  const loadChatHistory = async () => {
    setChatLoading(true);
    try {
      const resp = await fetch("/api/chat/history?limit=80");
      const json = await resp.json();
      if (!json.error && json.data) setChatHistory(json.data);
    } catch { }
    setChatLoading(false);
  };

  const loadApplications = async () => {
    setAppsLoading(true);
    const { data } = await dbFetch("job_applications", { query: { _order: "created_at", _asc: "false" } });
    if (data) setApplications(data);
    setAppsLoading(false);
  };

  const loadAppointments = async () => {
    setApptsLoading(true);
    try {
      const { data } = await dbFetch("appointments", { query: { _order: "appointment_date", _asc: "true" } });
      if (data) setAppointments(data);
    } catch { }
    setApptsLoading(false);
  };

  const loadIntegrationStatus = async () => {
    try {
      const resp = await fetch("/api/health/integrations");
      const json = await resp.json();
      if (json?.data) setIntegrationStatus(json.data);
    } catch { }
  };



  const updateApplicationStatus = async (id: string, status: string, message?: string) => {
    await fetch(`/api/applications/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, message }),
    });
    await loadApplications();
    await loadAppointments();
  };

  const loadSubmissionReplies = async (id: string) => {
    try {
      const resp = await fetch(`/api/submissions/${id}/replies`);
      const json = await resp.json();
      if (json.data) setSubReplies(p => ({ ...p, [id]: json.data }));
    } catch { }
  };

  const loadAppReplies = async (id: string) => {
    try {
      const resp = await fetch(`/api/applications/${id}/replies`);
      const json = await resp.json();
      if (json.data) setAppReplies((p: any) => ({ ...(p || {}), [id]: json.data }));
    } catch { }
  };

  const toggleCardCollapse = (id: string, type: "sub" | "app") => {
    const isNowOpen = collapsedCards[id];
    setCollapsedCards(p => ({ ...p, [id]: !p[id] }));
    if (isNowOpen === undefined) {
      // First expand — load replies
      if (type === "sub") loadSubmissionReplies(id);
      else loadAppReplies(id);
    }
  };

  const sendSubmissionReply = async (id: string) => {
    const message = replyTexts[id]?.trim();
    if (!message) return;
    setReplyingSub(id);
    try {
      const resp = await fetch(`/api/submissions/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sender: "admin" }),
      });
      if (resp.ok) {
        toast.success("Reply sent!");
        setReplyTexts(p => ({ ...p, [id]: "" }));
        await loadSubmissionReplies(id);
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, is_read: true, status: "responded" } : s));
      } else {
        toast.error("Failed to send reply.");
      }
    } catch {
      toast.error("Network error.");
    }
    setReplyingSub(null);
  };

  // SSE moved to useEffect above

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  const toggleRead = async (id: string, current: boolean) => {
    await dbFetch("contact_submissions", {
      method: "PATCH",
      query: { id },
      body: { is_read: !current }
    });
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, is_read: !current } : s));
  };

  const deleteSubmission = async (id: string) => {
    const item = submissions.find((s) => s.id === id);
    if (!item) return;
    const safeUndoId = `del-sub-${String(id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
    executeWithUndo({
      id: safeUndoId,
      label: "Submission deleted",
      action: async () => {
        await dbFetch("contact_submissions", { method: "DELETE", query: { id } });
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
      },
      undoFn: async () => {
        const { data } = await dbFetch("contact_submissions", {
          method: "POST",
          body: {
            id: String(item.id),
            full_name: String(item.full_name || ""),
            email: String(item.email || ""),
            message: String(item.message || ""),
            company_name: String(item.company_name || ""),
            phone: String(item.phone || ""),
            is_read: item.is_read,
          }
        });
        if (data) setSubmissions((prev) => [data, ...prev]);
      },
    });
  };



  const filteredSubmissions = submissions.filter((s) => {
    const term = subSearch.trim().toLowerCase();
    const haystack = `${s.full_name || s.name || ""} ${s.email || ""} ${s.company_name || ""} ${s.phone || ""} ${s.message || ""}`.toLowerCase();
    if (term && !haystack.includes(term)) return false;
    if (subStatusFilter !== "all") {
      if (subStatusFilter === "read" && !s.is_read) return false;
      if (subStatusFilter === "unread" && s.is_read) return false;
      if (subStatusFilter !== "read" && subStatusFilter !== "unread" && s.status !== subStatusFilter) return false;
    }
    if (subDateFilter) {
      const filterDate = new Date(subDateFilter);
      const createdDate = new Date(s.created_at);
      if (createdDate.toDateString() !== filterDate.toDateString()) return false;
    }
    return true;
  });
  const totalSubPages = Math.max(1, Math.ceil(filteredSubmissions.length / PAGE_SIZE));
  const displayedSubmissions = filteredSubmissions.slice((subPage - 1) * PAGE_SIZE, subPage * PAGE_SIZE);

  const filteredApplications = applications.filter((app) => {
    const term = appSearch.trim().toLowerCase();
    const haystack = `${app.applicant_name || ""} ${app.email || ""} ${app.phone || ""} ${app.job_id || ""} ${app.cover_letter || ""}`.toLowerCase();
    if (term && !haystack.includes(term)) return false;
    if (appStatusFilter !== "all" && app.status !== appStatusFilter) return false;
    if (appDateFilter) {
      const filterDate = new Date(appDateFilter);
      const createdDate = new Date(app.created_at);
      if (createdDate.toDateString() !== filterDate.toDateString()) return false;
    }
    return true;
  });
  const totalAppPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const displayedApplications = filteredApplications.slice((appPage - 1) * PAGE_SIZE, appPage * PAGE_SIZE);

  useEffect(() => {
    if (subPage > totalSubPages) setSubPage(totalSubPages);
  }, [subPage, totalSubPages]);

  useEffect(() => {
    if (appPage > totalAppPages) setAppPage(totalAppPages);
  }, [appPage, totalAppPages]);

  useEffect(() => {
    setSubPage(1);
  }, [subSearch, subStatusFilter, subDateFilter]);

  useEffect(() => {
    setAppPage(1);
  }, [appSearch, appStatusFilter, appDateFilter]);

  const sideItems: { key: Tab; icon: any; label: string }[] = [
    { key: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { key: "inbox", icon: MessageSquare, label: "Inbox" },
    { key: "chat", icon: BotMessageSquare, label: "Live Chat" },
    { key: "appointments", icon: CalendarIcon, label: "Appointments" },
    { key: "website", icon: FileText, label: "Edit Website" },
    { key: "sitehealth", icon: Shield, label: "Site Health" },
    { key: "settings", icon: Settings, label: "Settings" },
  ];

  const unreadCount = submissions.filter((s) => !s.is_read).length;
  const inboxBadge = unreadCount + applications.filter((a: any) => a.status === "applied").length;

  if (authChecking || loggingOut) return <LoadingSpinner message={loggingOut ? "Signing out..." : "Verifying access..."} />;

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 bg-card border-r border-border flex flex-col shrink-0 transition-all duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-16" : "lg:w-64"} w-64`}>
        <div className={`border-b border-border flex items-center ${collapsed ? "lg:justify-center lg:p-3 p-5" : "justify-between p-5"}`}>
          {!collapsed && <h2 className="font-heading font-bold text-foreground text-lg">Admin Panel</h2>}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg text-muted-foreground hover:bg-muted"><X size={20} /></button>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:bg-muted">
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <nav className={`flex-1 space-y-1 overflow-y-auto ${collapsed ? "lg:p-1.5 p-3" : "p-3"}`}>
          {sideItems.map((item) => (
            <button key={item.key} onClick={() => switchTab(item.key)} title={collapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-colors ${collapsed ? "lg:justify-center lg:px-0 lg:py-3 gap-3 px-4 py-3" : "gap-3 px-4 py-3"
                } ${tab === item.key ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <item.icon size={18} className="shrink-0" />
              <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
              {item.key === "inbox" && inboxBadge > 0 && !collapsed && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">{inboxBadge}</span>
              )}
            </button>
          ))}
          <button onClick={toggleDark} title={isDark ? "Light Mode" : "Dark Mode"} className={`w-full flex items-center rounded-xl text-sm transition-colors ${collapsed ? "lg:justify-center lg:px-0 lg:py-3 gap-3 px-4 py-3" : "gap-3 px-4 py-3"
            } ${isDark ? "text-yellow-400 hover:bg-yellow-400/10" : "text-slate-600 hover:bg-slate-100"}`}>
            {isDark ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
            {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
          </button>
        </nav>
        <div className={`border-t border-border space-y-1 ${collapsed ? "lg:p-1.5 p-3" : "p-3"}`}>
          <a href="/" title={collapsed ? "Back to site" : undefined} className={`flex items-center rounded-xl text-sm text-muted-foreground hover:bg-muted ${collapsed ? "lg:justify-center lg:px-0 lg:py-3 gap-3 px-4 py-3" : "gap-3 px-4 py-3"
            }`}>
            <ChevronLeft size={18} className="shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Back to site</span>
          </a>
          <button onClick={handleLogout} title={collapsed ? "Logout" : undefined} className={`w-full flex items-center rounded-xl text-sm text-destructive hover:bg-destructive/10 ${collapsed ? "lg:justify-center lg:px-0 lg:py-3 gap-3 px-4 py-3" : "gap-3 px-4 py-3"
            }`}>
            <LogOut size={18} className="shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-foreground hover:bg-muted"><Menu size={20} /></button>
          <h2 className="font-heading font-semibold text-foreground text-sm capitalize">{tab === "sitehealth" ? "Site Health" : tab.replace("_", " ")}</h2>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {loading && tab !== "website" && tab !== "sitehealth" && tab !== "settings" ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
          ) : (
            <>
              {tab === "dashboard" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="font-heading font-bold text-2xl text-foreground">Dashboard</h1>
                    <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {[
                      { label: "Total Submissions", value: submissions.length, color: "text-secondary" },
                      { label: "Unread", value: unreadCount, color: "text-destructive" },
                    ].map((s) => (
                      <div key={s.label} className="glass-card p-6">
                        <div className={`text-3xl font-heading font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-muted-foreground text-sm mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="glass-card p-5 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-heading font-semibold text-foreground">Live Website Preview</h3>
                        <p className="text-muted-foreground text-sm mt-1">View your website as visitors see it</p>
                      </div>
                      <a href="/" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                        <Eye size={14} /> View Live Site
                      </a>
                    </div>
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-3">Recent Submissions</h3>
                  {submissions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12">No submissions yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {submissions.slice(0, 5).map((s) => (
                        <div key={s.id} className={`glass-card p-4 ${!s.is_read ? "border-l-4 border-l-secondary" : ""}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-semibold text-foreground text-sm">{s.full_name}</span>
                              <span className="text-muted-foreground text-xs ml-2">{s.email}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{s.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "inbox" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="font-heading font-bold text-2xl text-foreground">Inbox</h1>
                    <button onClick={() => { loadData(); loadApplications(); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted">
                      <RefreshCw size={13} /> Refresh
                    </button>
                  </div>
                  {/* Sub-tabs */}
                  <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                    <div className="flex gap-1 bg-muted/40 rounded-xl p-1 shrink-0">
                      <button onClick={() => setInboxSubTab("contacts")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${inboxSubTab === "contacts" ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}>
                        📩 Contact Submissions {unreadCount > 0 && <span className="ml-1 bg-destructive text-destructive-foreground text-[0.625rem] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                      </button>
                      <button onClick={() => setInboxSubTab("applications")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${inboxSubTab === "applications" ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}>
                        💼 Job Applications {applications.filter((a: any) => a.status === "applied").length > 0 && <span className="ml-1 bg-blue-500 text-white text-[0.625rem] px-1.5 py-0.5 rounded-full">{applications.filter((a: any) => a.status === "applied").length}</span>}
                      </button>
                    </div>
                  </div>

                  {/* CONTACTS */}
                  {inboxSubTab === "contacts" && (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-3 items-end mb-4">
                        <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3">
                          <input value={subSearch}
                            onChange={(e) => setSubSearch(e.target.value)}
                            placeholder="Search submissions..."
                            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                          <select value={subStatusFilter} onChange={(e) => setSubStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-ring">
                            <option value="all">All statuses</option>
                            <option value="read">Read</option>
                            <option value="unread">Unread</option>
                            <option value="new">New</option>
                            <option value="responded">Responded</option>
                          </select>
                          <input type="date" value={subDateFilter}
                            onChange={(e) => setSubDateFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Showing {displayedSubmissions.length} of {filteredSubmissions.length} submissions
                        </div>
                      </div>
                      {displayedSubmissions.map((s) => {
                        const isExpanded = collapsedCards[s.id] === true;
                        const replies = subReplies[s.id] || [];
                        return (
                          <div key={s.id} className={`glass-card overflow-hidden transition-all ${!s.is_read ? "border-l-4 border-l-secondary" : ""}`}>
                            {/* Card Header — always visible */}
                            <div className="flex justify-between items-center px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
                              onClick={() => toggleCardCollapse(s.id, "sub")}>
                              <div className="flex items-center gap-3 min-w-0">
                                <ChevronDown size={16} className={`text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                <div className="min-w-0">
                                  <span className="font-semibold text-foreground text-sm">{s.full_name || s.name || s.email}</span>
                                  {s.company_name && <span className="text-muted-foreground text-xs ml-2">({s.company_name})</span>}
                                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{s.email}{s.phone ? ` · ${s.phone}` : ""}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                                <span className="text-xs text-muted-foreground hidden sm:block">{new Date(s.created_at).toLocaleDateString()}</span>
                                <button onClick={() => toggleRead(s.id, s.is_read)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title={s.is_read ? "Mark unread" : "Mark read"}>
                                  {s.is_read ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button onClick={() => deleteSubmission(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Expanded body */}
                            {isExpanded && (
                              <div className="border-t border-border/50 px-5 pb-5">
                                {/* Original message */}
                                <div className="pt-4 flex justify-start">
                                  <div className="max-w-[85%] bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-foreground border border-border/40">
                                    <div className="text-[0.625rem] text-muted-foreground font-bold uppercase mb-1">{s.full_name || s.email}</div>
                                    {s.message}
                                    <div className="text-[0.625rem] text-muted-foreground mt-1.5 opacity-60">{new Date(s.created_at).toLocaleString()}</div>
                                  </div>
                                </div>

                                {/* Admin replies in chat style */}
                                {replies.map((r: any) => (
                                  <div key={r.id} className={`flex mt-3 ${r.sender === "admin" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm border ${r.sender === "admin"
                                      ? "bg-secondary text-secondary-foreground border-secondary/20 rounded-tr-sm"
                                      : "bg-muted/50 text-foreground border-border/40 rounded-tl-sm"
                                      }`}>
                                      <div className="text-[0.625rem] font-bold uppercase opacity-70 mb-1">{r.sender === "admin" ? "You (Admin)" : r.sender}</div>
                                      {r.message}
                                      <div className="text-[0.625rem] opacity-50 mt-1.5">{new Date(r.created_at).toLocaleString()}</div>
                                    </div>
                                  </div>
                                ))}

                                {/* Reply input */}
                                <div className="mt-4 space-y-2">
                                  <div className="flex gap-2">
                                    <input
                                      value={replyTexts[s.id] || ""}
                                      onChange={(e) => setReplyTexts(p => ({ ...p, [s.id]: e.target.value }))}
                                      onKeyDown={(e) => { if (e.key === "Enter") sendSubmissionReply(s.id); }}
                                      placeholder="Type a reply (sends email)..."
                                      className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
                                    />
                                    <button onClick={() => sendSubmissionReply(s.id)}
                                      disabled={replyingSub === s.id || !replyTexts[s.id]?.trim()}
                                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shrink-0">
                                      <Send size={14} /> {replyingSub === s.id ? "Sending..." : "Reply"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {displayedSubmissions.length === 0 && <p className="text-muted-foreground text-center py-12">No submissions match the selected filters.</p>}
                      {filteredSubmissions.length > PAGE_SIZE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-sm text-muted-foreground">
                          <button onClick={() => setSubPage((prev) => Math.max(1, prev - 1))}
                            disabled={subPage === 1}
                            className="px-3 py-2 rounded-lg bg-background border border-border text-sm disabled:opacity-50">
                            Previous
                          </button>
                          <span>Page {subPage} of {totalSubPages}</span>
                          <button onClick={() => setSubPage((prev) => Math.min(totalSubPages, prev + 1))}
                            disabled={subPage === totalSubPages}
                            className="px-3 py-2 rounded-lg bg-background border border-border text-sm disabled:opacity-50">
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* APPLICATIONS */}
                  {inboxSubTab === "applications" && (
                    <div className="space-y-3">
                      {appsLoading ? <div className="text-muted-foreground">Loading...</div> : (
                        filteredApplications.length === 0
                          ? <p className="text-muted-foreground text-center py-12">No applications match the selected filters.</p>
                          : <div className="space-y-3">
                            <div className="grid gap-3 sm:grid-cols-3 items-end mb-4">
                              <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3">
                                <input value={appSearch}
                                  onChange={(e) => setAppSearch(e.target.value)}
                                  placeholder="Search applications..."
                                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-ring"
                                />
                                <select value={appStatusFilter} onChange={(e) => setAppStatusFilter(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-ring">
                                  <option value="all">All statuses</option>
                                  <option value="applied">Applied</option>
                                  <option value="in_review">In Review</option>
                                  <option value="selected">Selected</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                                <input type="date" value={appDateFilter}
                                  onChange={(e) => setAppDateFilter(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-ring"
                                />
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Showing {displayedApplications.length} of {filteredApplications.length} applications
                              </div>
                            </div>
                            {displayedApplications.map((app) => {
                              const isExpanded = collapsedCards[`app-${app.id}`] === true;
                              const replies = (appReplies as any)?.[app.id] || [];
                              return (
                                <div key={app.id} className="glass-card overflow-hidden">
                                  {/* Header */}
                                  <div className="flex justify-between items-center px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
                                    onClick={() => toggleCardCollapse(`app-${app.id}`, "app")}>
                                    <div className="flex items-center gap-3 min-w-0">
                                      <ChevronDown size={16} className={`text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                      <div className="min-w-0">
                                        <div className="font-semibold text-foreground text-sm">{app.applicant_name}</div>
                                        <div className="text-xs text-muted-foreground">{app.email}{app.phone ? ` · ${app.phone}` : ""}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">Applied for: <span className="text-foreground font-medium">{app.job_id || "General"}</span></div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${app.status === "selected" ? "bg-green-100 text-green-700" :
                                        app.status === "rejected" ? "bg-red-100 text-red-700" :
                                          app.status === "in_review" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                                        }`}>{app.status}</span>
                                      <select value={app.status} onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                                        className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground">
                                        {["applied", "in_review", "selected", "rejected"].map(s => (
                                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {/* Expanded body */}
                                  {isExpanded && (
                                    <div className="border-t border-border/50 px-5 pb-5">
                                      {app.cover_letter && (
                                        <div className="pt-4 flex justify-start">
                                          <div className="max-w-[85%] bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-foreground border border-border/40">
                                            <div className="text-[0.625rem] text-muted-foreground font-bold uppercase mb-1">{app.applicant_name}</div>
                                            {app.cover_letter}
                                            <div className="text-[0.625rem] text-muted-foreground mt-1.5 opacity-60">{new Date(app.created_at).toLocaleString()}</div>
                                          </div>
                                        </div>
                                      )}
                                      {replies.map((r: any) => (
                                        <div key={r.id} className={`flex mt-3 ${r.sender === "admin" ? "justify-end" : "justify-start"}`}>
                                          <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm border ${r.sender === "admin"
                                            ? "bg-secondary text-secondary-foreground border-secondary/20 rounded-tr-sm"
                                            : "bg-muted/50 text-foreground border-border/40 rounded-tl-sm"
                                            }`}>
                                            <div className="text-[0.625rem] font-bold uppercase opacity-70 mb-1">{r.sender === "admin" ? "You (Admin)" : r.sender}</div>
                                            {r.message}
                                            <div className="text-[0.625rem] opacity-50 mt-1.5">{new Date(r.created_at).toLocaleString()}</div>
                                          </div>
                                        </div>
                                      ))}
                                      <div className="mt-4 space-y-2">
                                        <div className="flex gap-2">
                                          <input placeholder="Reply to applicant (sends email)..."
                                            className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-ring outline-none"
                                            value={replyTexts[app.id] || ""}
                                            onChange={(e) => setReplyTexts(p => ({ ...p, [app.id]: e.target.value }))}
                                            onKeyDown={(e) => { if (e.key === "Enter" && replyTexts[app.id]?.trim()) { e.preventDefault(); updateApplicationStatus(app.id, app.status, replyTexts[app.id]); setReplyTexts(p => ({ ...p, [app.id]: "" })); } }}
                                          />
                                          <button
                                            onClick={() => { updateApplicationStatus(app.id, app.status, replyTexts[app.id]); setReplyTexts(p => ({ ...p, [app.id]: "" })); }}
                                            disabled={!replyTexts[app.id]?.trim()}
                                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shrink-0">
                                            <Send size={14} /> Send
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {filteredApplications.length > PAGE_SIZE && (
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-sm text-muted-foreground">
                                <button onClick={() => setAppPage((prev) => Math.max(1, prev - 1))}
                                  disabled={appPage === 1}
                                  className="px-3 py-2 rounded-lg bg-background border border-border text-sm disabled:opacity-50">
                                  Previous
                                </button>
                                <span>Page {appPage} of {totalAppPages}</span>
                                <button onClick={() => setAppPage((prev) => Math.min(totalAppPages, prev + 1))}
                                  disabled={appPage === totalAppPages}
                                  className="px-3 py-2 rounded-lg bg-background border border-border text-sm disabled:opacity-50">
                                  Next
                                </button>
                              </div>
                            )}
                          </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === "website" && <PageEditor key="page-editor" />}
              {tab === "sitehealth" && (
                <div>
                  <h1 className="font-heading font-bold text-2xl text-foreground mb-4">Site Health</h1>
                  <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                    <div className="flex gap-1 bg-muted/40 rounded-xl p-1 shrink-0">
                      <button onClick={() => setSiteHealthSubTab("seo")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${siteHealthSubTab === "seo" ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}>
                        🔍 SEO Meta Manager
                      </button>
                      <button onClick={() => setSiteHealthSubTab("security")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${siteHealthSubTab === "security" ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}>
                        🛡️ Security Headers
                      </button>
                    </div>
                  </div>
                  {siteHealthSubTab === "seo" && <SEOManager key="seo-manager" />}
                  {siteHealthSubTab === "security" && <SecurityPanel key="security-panel" />}
                </div>
              )}

              {tab === "settings" && (
                <div className="w-full">
                  <div className="w-full space-y-6">
                    <div className="space-y-2">
                      <h1 className="font-heading font-bold text-2xl text-foreground mb-1">Site Settings</h1>
                      <p className="text-muted-foreground text-sm">These settings affect the live website for all visitors in real-time.</p>
                    </div>
                    <div className="glass-card w-full p-6 lg:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                        {/* --- BASIC INFO --- */}
                        <div className="space-y-4">
                          <h3 className="text-[0.6875rem] font-bold text-secondary uppercase tracking-widest border-b border-border/50 pb-1">Basic Site Info</h3>
                          <div>
                            <label className="text-[0.6875rem] font-medium text-muted-foreground mb-1 block">Site Name</label>
                            <input value={siteSettings.site_name}
                              onChange={(e) => setSiteSettings(p => ({ ...p, site_name: e.target.value }))}
                              placeholder="e.g. Systems Solutions"
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:ring-2 focus:ring-ring outline-none" />
                          </div>
                          <div>
                            <label className="text-[0.6875rem] font-medium text-muted-foreground mb-1 block">Site Logo Path</label>
                            <input value={siteSettings.site_logo || ""}
                              onChange={(e) => setSiteSettings(p => ({ ...p, site_logo: e.target.value }))}
                              placeholder="/assets/logo.png"
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-sm focus:ring-2 focus:ring-ring outline-none" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[0.6875rem] font-medium text-muted-foreground mb-1 block">WhatsApp</label>
                              <input value={siteSettings.whatsapp_number}
                                onChange={(e) => setSiteSettings(p => ({ ...p, whatsapp_number: e.target.value }))}
                                placeholder="e.g. 9603011355"
                                className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm outline-none" />
                            </div>
                            <div>
                              <label className="text-[0.6875rem] font-medium text-muted-foreground mb-1 block">Viber</label>
                              <input value={siteSettings.viber_number || ""}
                                onChange={(e) => setSiteSettings(p => ({ ...p, viber_number: e.target.value }))}
                                placeholder="e.g. 9489477144"
                                className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm outline-none" />
                            </div>
                          </div>
                          <div>
                            <input type="email" value={siteSettings.contact_email}
                              onChange={(e) => setSiteSettings(p => ({ ...p, contact_email: e.target.value }))}
                              placeholder="info@solutions.com.mv"
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm outline-none" />
                          </div>
                        </div>

                        {/* --- EMAIL / SMTP --- */}
                        <div className="space-y-4">
                          <h3 className="text-[0.6875rem] font-bold text-secondary uppercase tracking-widest border-b border-border/50 pb-1">SMTP & Notifications</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[0.6875rem] font-medium text-muted-foreground mb-1 block">From Email</label>
                              <input type="email" value={siteSettings.contact_from_email}
                                onChange={(e) => setSiteSettings(p => ({ ...p, contact_from_email: e.target.value }))}
                                placeholder="e.g. noreply@bss.com"
                                className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm outline-none" />
                            </div>
                            <div>
                              <label className="text-[0.6875rem] font-medium text-muted-foreground mb-1 block">HR Email</label>
                              <input type="email" value={siteSettings.hr_email}
                                onChange={(e) => setSiteSettings(p => ({ ...p, hr_email: e.target.value }))}
                                placeholder="e.g. careers@bss.com"
                                className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm outline-none" />
                            </div>
                          </div>
                          <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/10 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[0.625rem] text-muted-foreground mb-0.5 block">Host</label>
                                <input value={siteSettings.smtp_host} onChange={(e) => setSiteSettings(p => ({ ...p, smtp_host: e.target.value }))} placeholder="smtp.gmail.com" className="w-full px-2 py-1 rounded-md bg-background border border-border text-xs" />
                              </div>
                              <div>
                                <label className="text-[0.625rem] text-muted-foreground mb-0.5 block">Port</label>
                                <input value={siteSettings.smtp_port} onChange={(e) => setSiteSettings(p => ({ ...p, smtp_port: e.target.value }))} placeholder="587" className="w-full px-2 py-1 rounded-md bg-background border border-border text-xs" />
                              </div>
                            </div>
                            <div>
                              <label className="text-[0.625rem] text-muted-foreground mb-0.5 block">SMTP User</label>
                              <input value={siteSettings.smtp_user} onChange={(e) => setSiteSettings(p => ({ ...p, smtp_user: e.target.value }))} className="w-full px-2 py-1 rounded-md bg-background border border-border text-xs" />
                            </div>
                            <div>
                              <label className="text-[0.625rem] text-muted-foreground mb-0.5 block">SMTP Password</label>
                              <input type="password" value={siteSettings.smtp_pass} onChange={(e) => setSiteSettings(p => ({ ...p, smtp_pass: e.target.value }))} className="w-full px-2 py-1 rounded-md bg-background border border-border text-xs" />
                            </div>
                          </div>
                        </div>

                        {/* --- AI & BOT --- */}
                        <div className="space-y-4">
                          <h3 className="text-[0.6875rem] font-bold text-secondary uppercase tracking-widest border-b border-border/50 pb-1">AI & Chat Bot</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[0.6875rem] font-medium text-muted-foreground mb-1 block">AI Model</label>
                              <input value={siteSettings.ai_model}
                                onChange={(e) => setSiteSettings(p => ({ ...p, ai_model: e.target.value }))}
                                placeholder="gemini-1.5-flash"
                                className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm outline-none" />
                            </div>
                            <div>
                              <label className="text-[0.6875rem] font-medium text-muted-foreground mb-1 block">API Choice</label>
                              <select
                                value={siteSettings.gemini_api_key ? "gemini" : "openai"}
                                onChange={(e) => {
                                  // Simple visual toggle for now, doesn't force a switch if keys are missing
                                  const val = e.target.value;
                                  if (val === "openai" && !siteSettings.openai_api_key) {
                                    toast.error("Please provide OpenAI API key first.");
                                  } else if (val === "gemini" && !siteSettings.gemini_api_key) {
                                    toast.error("Please provide Google Gemini API key first.");
                                  }
                                }}
                                className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm outline-none">
                                <option value="gemini">Google Gemini</option>
                                <option value="openai">OpenAI</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-[0.6875rem] font-medium text-muted-foreground mb-1 block">Google Gemini API Key</label>
                            <input type="password" value={siteSettings.gemini_api_key || ""}
                              onChange={(e) => setSiteSettings(p => ({ ...p, gemini_api_key: e.target.value }))}
                              placeholder="AIzaSy..."
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm outline-none" />
                          </div>
                          <div>
                            <label className="text-[0.6875rem] font-medium text-muted-foreground mb-1 block">OpenAI API Key (Alternative)</label>
                            <input type="password" value={siteSettings.openai_api_key || ""}
                              onChange={(e) => setSiteSettings(p => ({ ...p, openai_api_key: e.target.value }))}
                              placeholder="sk-..."
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm outline-none" />
                          </div>
                          <div>
                            <label className="text-[0.6875rem] font-medium text-muted-foreground mb-1 block">AI System Persona / Prompt</label>
                            <textarea value={siteSettings.system_prompt || ""}
                              onChange={(e) => setSiteSettings(p => ({ ...p, system_prompt: e.target.value }))}
                              placeholder="You are a helpful assistant for BSS..."
                              rows={3}
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm outline-none resize-none" />
                          </div>
                        </div>

                        {/* --- RESOURCES & LINKS --- */}
                        <div className="col-span-full mt-4 pt-8 border-t border-border/50">
                          <h3 className="text-[0.6875rem] font-bold text-secondary uppercase tracking-widest border-b border-border/50 pb-1 mb-6">Resources & Social Links</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Branding */}
                            <div className="space-y-4">
                              <div>
                                <label className="text-[0.625rem] font-medium text-muted-foreground mb-1 block uppercase tracking-wider">Site Logo Path</label>
                                <div className="flex gap-2">
                                  <input value={siteSettings.site_logo || ""} onChange={(e) => setSiteSettings(p => ({ ...p, site_logo: e.target.value }))} className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-xs outline-none focus:ring-1 focus:ring-secondary/30" placeholder="/assets/logo.png" />
                                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center p-1 border border-border shrink-0">
                                    <img src={siteSettings.site_logo || "/logo.png"} alt="Logo" className="max-w-full max-h-full object-contain" />
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="text-[0.625rem] font-medium text-muted-foreground mb-1 block uppercase tracking-wider">Demo / Portal URL</label>
                                <input value={(siteSettings as any).demo_url || ""} onChange={(e) => setSiteSettings(p => ({ ...p, demo_url: e.target.value }))} className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs outline-none focus:ring-1 focus:ring-secondary/30" placeholder="https://demo.bss.com" />
                              </div>
                              <div>
                                <label className="text-[0.625rem] font-medium text-muted-foreground mb-1 block uppercase tracking-wider">Landline / Office Phone</label>
                                <input value={(siteSettings as any).landline || ""} onChange={(e) => setSiteSettings(p => ({ ...p, landline: e.target.value }))} className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs outline-none" placeholder="+960 xxx xxxx" />
                              </div>
                            </div>

                            {/* Social Links */}
                            <div className="space-y-4">
                              <div>
                                <label className="text-[0.625rem] font-medium text-muted-foreground mb-1 block uppercase tracking-wider">LinkedIn</label>
                                <input value={(siteSettings as any).social_linkedin || ""} onChange={(e) => setSiteSettings(p => ({ ...p, social_linkedin: e.target.value }))} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs" placeholder="https://linkedin.com/company/bss" />
                              </div>
                              <div>
                                <label className="text-[0.625rem] font-medium text-muted-foreground mb-1 block uppercase tracking-wider">Twitter / X</label>
                                <input value={(siteSettings as any).social_twitter || ""} onChange={(e) => setSiteSettings(p => ({ ...p, social_twitter: e.target.value }))} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs" placeholder="https://x.com/bsspl" />
                              </div>
                              <div>
                                <label className="text-[0.625rem] font-medium text-muted-foreground mb-1 block uppercase tracking-wider">Facebook</label>
                                <input value={(siteSettings as any).social_facebook || ""} onChange={(e) => setSiteSettings(p => ({ ...p, social_facebook: e.target.value }))} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs" placeholder="https://facebook.com/bss" />
                              </div>
                              <div>
                                <label className="text-[0.625rem] font-medium text-muted-foreground mb-1 block uppercase tracking-wider">Instagram</label>
                                <input value={(siteSettings as any).social_instagram || ""} onChange={(e) => setSiteSettings(p => ({ ...p, social_instagram: e.target.value }))} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs" placeholder="https://instagram.com/bss" />
                              </div>
                            </div>

                            {/* Accent Color only */}
                          </div>
                        </div>
                      </div> {/* End Grid */}

                      {/* --- USER EXPERIENCE (Hierarchical) --- */}
                      <div className="mt-8 pt-8 border-t border-border/50 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20 shadow-inner">
                              <Settings size={20} />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Admin & Portal Preference</h3>
                              <p className="text-[0.625rem] text-muted-foreground font-medium uppercase tracking-widest opacity-60 mt-0.5">Control your workspace and site-wide defaults</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 bg-muted/20 p-5 rounded-3xl border border-border/40">
                          {/* Theme */}
                          <div>
                            <label className="text-[0.625rem] font-black text-muted-foreground uppercase tracking-widest mb-2 block px-1">Visual Theme</label>
                            <div className="flex gap-1 p-1 bg-background border border-border rounded-xl">
                              {["light", "dark"].map(t => (
                                <button key={t} onClick={() => {
                                  setUxDraft(p => ({ ...p, theme: t }));
                                  setSiteSettings(p => ({ ...p, theme: t }));
                                }}
                                  className={`flex-1 py-1.5 rounded-lg text-[0.625rem] font-bold uppercase transition-all ${uxDraft.theme === t ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}>
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Font Family */}
                          <div className="xl:col-span-1">
                            <label className="text-[0.625rem] font-black text-muted-foreground uppercase tracking-widest mb-2 block px-1">Typography</label>
                            <select value={uxDraft.font_style} onChange={(e) => setUxDraft(p => ({ ...p, font_style: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs outline-none focus:ring-2 focus:ring-secondary/20">
                              {AVAILABLE_FONTS.map(f => (
                                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Text Size */}
                          <div>
                            <label className="text-[0.625rem] font-black text-muted-foreground uppercase tracking-widest mb-2 block px-1">Text Size</label>
                            <div className="flex gap-1 p-1 bg-background border border-border rounded-xl">
                              {["xs", "sm", "md", "lg", "xl"].map((size, i) => {
                                const vals = ["x-small", "small", "medium", "large", "x-large"];
                                return (
                                  <button key={size} onClick={() => setUxDraft(p => ({ ...p, font_size: vals[i] }))}
                                    className={`flex-1 py-1.5 rounded-lg text-[0.625rem] font-bold uppercase tracking-tighter transition-all ${uxDraft.font_size === vals[i] ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}>
                                    {size}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Image/Icon Mode */}
                          <div>
                            <label className="text-[0.625rem] font-black text-muted-foreground uppercase tracking-widest mb-2 block px-1">Display Mode</label>
                            <div className="flex gap-1 p-1 bg-background border border-border rounded-xl">
                              <button onClick={() => setUxDraft(p => ({ ...p, card_style: "icon" }))}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[0.625rem] font-bold border-0 transition-all ${uxDraft.card_style === "icon" ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                                  }`}>
                                <Type size={10} /> Icon
                              </button>
                              <button onClick={() => setUxDraft(p => ({ ...p, card_style: "image" }))}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[0.625rem] font-bold border-0 transition-all ${uxDraft.card_style === "image" ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                                  }`}>
                                <Image size={10} /> Image
                              </button>
                            </div>
                          </div>

                          {/* Brand Accent */}
                          <div>
                            <label className="text-[0.625rem] font-black text-muted-foreground uppercase tracking-widest mb-2 block px-1">Brand Accent</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={uxDraft.accent_color} onChange={(e) => setUxDraft(p => ({ ...p, accent_color: e.target.value }))}
                                className="w-8 h-8 rounded-lg bg-background border border-border cursor-pointer p-0.5" />
                              <div className="flex gap-1 flex-wrap">
                                {["#3b82f6", "#2db8a0", "#8b5cf6", "#f43f5e", "#f59e0b", "#10b981"].map(c => (
                                  <button key={c} onClick={() => setUxDraft(p => ({ ...p, accent_color: c }))}
                                    className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${uxDraft.accent_color === c ? 'border-foreground shadow-md' : 'border-transparent'}`}
                                    style={{ background: c }} />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* View Strategy */}
                          <div>
                            <label className="text-[0.625rem] font-black text-muted-foreground uppercase tracking-widest mb-2 block px-1">View Layout</label>
                            <div className="flex gap-1">
                              <button onClick={() => setUxDraft(p => ({ ...p, global_view: "grid" }))}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[0.625rem] font-bold border transition-all ${uxDraft.global_view === "grid" ? "border-secondary bg-secondary/5 text-secondary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                                <LayoutGrid size={11} /> Grid
                              </button>
                              <button onClick={() => setUxDraft(p => ({ ...p, global_view: "list" }))}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[0.625rem] font-bold border transition-all ${uxDraft.global_view === "list" ? "border-secondary bg-secondary/5 text-secondary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                                <List size={11} /> List
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center gap-4 mt-10">
                        <button onClick={() => {
                          const defaults = {
                            font_style: "'Inter', sans-serif", font_size: "medium", accent_color: "#3b82f6",
                            global_view: "grid", card_style: "icon", theme: "light"
                          };
                          setUxDraft(defaults);
                          setSiteSettings(p => ({ ...p, ...defaults }));
                          localStorage.removeItem("bss-user-settings");
                          toast.success("Preferences reset to default. Click Save to apply globally.");
                        }}
                          className="flex items-center gap-3 px-6 py-4 bg-muted/50 text-foreground hover:bg-muted border border-border rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95">
                          <RefreshCw size={18} /> Reset
                        </button>
                        <button onClick={saveSettings} disabled={savingSettings}
                          className="flex items-center gap-3 px-10 py-4 bg-secondary text-secondary-foreground rounded-2xl text-base font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 shadow-2xl shadow-secondary/20 transition-all active:scale-95 group">
                          <Save size={18} className="group-hover:rotate-12 transition-transform" /> {savingSettings ? "Propagating..." : "Save All Changes"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "chat" && (
                <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
                  <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                    <div>
                      <h1 className="font-heading font-bold text-2xl text-foreground">Live Chat Sessions</h1>
                      <p className="text-xs text-muted-foreground mt-0.5">Real-time status of all digital conversations</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search conversations..."
                          value={chatSearchQuery}
                          onChange={(e) => setChatSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/40 border-none text-xs focus:ring-2 focus:ring-secondary/30 outline-none"
                        />
                      </div>
                      <button onClick={loadChatHistory} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all font-bold">
                        <RefreshCw size={12} className={chatLoading ? "animate-spin" : ""} /> Sync
                      </button>
                    </div>
                  </div>

                  {/* Chat Content */}
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-20">
                    {(() => {
                      // Group by session_id
                      const sessions: Record<string, any[]> = {};
                      for (const m of chatHistory) {
                        const sid = m.session_id || "unknown";
                        if (!sessions[sid]) sessions[sid] = [];
                        sessions[sid].push(m);
                      }

                      const sessionEntries = Object.entries(sessions)
                        .map(([sid, msgs]) => ({
                          sid,
                          msgs: msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
                          lastTime: Math.max(...msgs.map(m => new Date(m.timestamp).getTime())),
                          ip: msgs[0]?.ip_address || "Unknown IP"
                        }))
                        .sort((a, b) => b.lastTime - a.lastTime)
                        .filter(s => !chatSearchQuery || s.msgs.some(m => m.content.toLowerCase().includes(chatSearchQuery.toLowerCase()) || m.sid.toLowerCase().includes(chatSearchQuery.toLowerCase())));

                      if (sessionEntries.length === 0) {
                        return (
                          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-40 py-20">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                              <BotMessageSquare size={32} />
                            </div>
                            <p className="text-sm font-medium">No activity matching your search.</p>
                          </div>
                        );
                      }

                      return sessionEntries.map((session) => {
                        const msgs = session.msgs;
                        const isExpanded = collapsedCards[`chat-${session.sid}`];
                        const lastDate = msgs.length ? new Date(msgs[msgs.length - 1].timestamp) : new Date();

                        return (
                          <div key={session.sid} className="glass-card overflow-hidden transition-all duration-300 transform bg-card shadow-sm border border-border/50">
                            {/* Session Header */}
                            <div className="flex justify-between items-center px-4 py-3 sm:px-5 sm:py-4 cursor-pointer hover:bg-muted/10 transition-colors"
                              onClick={() => {
                                setCollapsedCards(p => ({ ...p, [`chat-${session.sid}`]: !p[`chat-${session.sid}`] }));
                              }}>
                              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20 shadow-inner">
                                  <BotMessageSquare size={20} className="text-secondary" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-heading font-semibold text-foreground text-sm flex items-center gap-2">
                                    Chat Session
                                    <span className="text-[0.5625rem] px-1.5 py-0.5 rounded-sm bg-secondary/10 text-secondary uppercase font-black tracking-widest">{msgs.length} msgs</span>
                                  </div>
                                  <div className="text-[0.6875rem] sm:text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1.5 font-mono">
                                    <span>{lastDate.toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                                    <span className="text-border/50">-</span>
                                    <span className="text-foreground/80 font-semibold">{session.ip}</span>
                                    <span className="text-border/50">-</span>
                                    <span className="opacity-60">{session.sid.slice(0, 12)}...</span>
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 shadow-sm ml-2">
                                <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                              </div>
                            </div>

                            {/* Expanded Session Chat History */}
                            {isExpanded && (
                              <div className="border-t border-border/50 bg-muted/10 px-0 pb-0">
                                <div className="p-4 sm:p-6 space-y-5 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                  {msgs.map((m, idx, arr) => {
                                    const isOut = m.direction === "outbound" || m.direction === "bot";
                                    const prevMsg = idx > 0 ? arr[idx - 1] : null;
                                    const showAvatar = !prevMsg || (prevMsg.direction !== m.direction);

                                    return (
                                      <div key={m.id || idx} className={`flex ${isOut ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isOut ? "items-end" : "items-start"}`}>
                                          {showAvatar && (
                                            <div className="flex items-center gap-2 mb-1.5 px-1">
                                              {!isOut && <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[0.625rem] font-bold shadow-sm">U</div>}
                                              <span className="text-[0.625rem] sm:text-xs font-black text-muted-foreground uppercase tracking-widest">
                                                {isOut ? (m.direction === "bot" ? "AI System" : "Admin (You)") : "Visitor"}
                                              </span>
                                              {isOut && <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center shadow-sm"><Bot size={10} className="text-secondary" /></div>}
                                            </div>
                                          )}

                                          <div className={`group relative px-4 py-3 sm:px-5 sm:py-4 rounded-3xl text-sm shadow-md transition-all ${isOut
                                            ? "bg-secondary text-secondary-foreground border border-secondary/20 rounded-tr-sm"
                                            : "bg-card text-foreground border border-border/60 rounded-tl-sm"
                                            }`}>
                                            <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                                            <div className={`text-[0.5625rem] mt-2 font-mono flex items-center justify-between ${isOut ? "text-secondary-foreground/60" : "text-muted-foreground"}`}>
                                              <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {/* Admin Reply Input */}
                                <div className="p-4 border-t border-border/50 bg-background/50">
                                   <div className="flex gap-2">
                                      <input 
                                        placeholder="Type an admin reply..."
                                        value={replyTexts[session.sid] || ""}
                                        onChange={(e) => setReplyTexts(p => ({ ...p, [session.sid]: e.target.value }))}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && replyTexts[session.sid]?.trim()) {
                                            const msg = replyTexts[session.sid];
                                            setReplyTexts(p => ({ ...p, [session.sid]: "" }));
                                            fetch("/api/chat/send", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ message: msg, session_id: session.sid, from: "admin" })
                                            }).then(() => loadChatHistory());
                                          }
                                        }}
                                        className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-xs outline-none"
                                      />
                                      <button 
                                        onClick={() => {
                                          const msg = replyTexts[session.sid];
                                          setReplyTexts(p => ({ ...p, [session.sid]: "" }));
                                          fetch("/api/chat/send", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ message: msg, session_id: session.sid, from: "admin" })
                                          }).then(() => loadChatHistory());
                                        }}
                                        disabled={!replyTexts[session.sid]?.trim()}
                                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-bold disabled:opacity-50"
                                      >
                                        Send
                                      </button>
                                   </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}





              {tab === "appointments" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="font-heading font-bold text-2xl text-foreground">Appointments Calendar</h1>
                    <button onClick={loadAppointments} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                  {apptsLoading ? <div className="text-muted-foreground">Loading...</div> : (
                    <div className="animate-in fade-in duration-500">
                      <AppointmentsCalendar appointments={appointments} />
                    </div>
                  )}
                </div>
              )}

            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

