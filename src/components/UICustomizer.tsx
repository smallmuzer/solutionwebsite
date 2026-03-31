import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { X, Sun, Moon, Save, GripHorizontal, LayoutGrid, List, Image, Layers } from "lucide-react";
import { toast } from "sonner";
import { applySettings } from "@/hooks/useSiteSettings";

const LOCAL_STORAGE_KEY = "bss-user-settings";

export interface UIPrefs {
  font_size: string;
  font_style: string;
  theme: "light" | "dark" | "system";
  accent_color: string;
  global_view: "grid" | "list";
  card_style: "icon" | "image";
}

const defaultPrefs: UIPrefs = {
  font_size: "medium",
  font_style: "'Inter', sans-serif",
  theme: "light",
  accent_color: "#3b82f6",
  global_view: "grid",
  card_style: "icon",
};

const ViewCtx = createContext<"grid" | "list">("grid");
export const useGlobalView = () => useContext(ViewCtx);

const CardStyleCtx = createContext<"icon" | "image">("icon");
export const useCardStyle = () => useContext(CardStyleCtx);

export function GlobalViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<"grid" | "list">(() => {
    try { 
      const s = localStorage.getItem(LOCAL_STORAGE_KEY); 
      return s ? (JSON.parse(s) as UIPrefs).global_view ?? "grid" : "grid"; 
    } catch { return "grid"; }
  });
  const [cardStyle, setCardStyle] = useState<"icon" | "image">(() => {
    try { 
      const s = localStorage.getItem(LOCAL_STORAGE_KEY); 
      return s ? (JSON.parse(s) as UIPrefs).card_style ?? "icon" : "icon"; 
    } catch { return "icon"; }
  });

  useEffect(() => {
    const hv = (e: Event) => setView((e as CustomEvent<"grid" | "list">).detail);
    const hc = (e: Event) => setCardStyle((e as CustomEvent<"icon" | "image">).detail);
    window.addEventListener("ss:globalView", hv);
    window.addEventListener("ss:cardStyle", hc);
    return () => { window.removeEventListener("ss:globalView", hv); window.removeEventListener("ss:cardStyle", hc); };
  }, []);

  return (
    <ViewCtx.Provider value={view}>
      <CardStyleCtx.Provider value={cardStyle}>{children}</CardStyleCtx.Provider>
    </ViewCtx.Provider>
  );
}

const fonts = [
  { label: "Arial",            value: "Arial, Helvetica, sans-serif" },
  { label: "Courier New",      value: "'Courier New', Courier, monospace" },
  { label: "DM Sans",          value: "'DM Sans', sans-serif" },
  { label: "Georgia",          value: "Georgia, 'Times New Roman', serif" },
  { label: "Inter",            value: "'Inter', sans-serif" },
  { label: "Lato",             value: "'Lato', sans-serif" },
  { label: "Montserrat",       value: "'Montserrat', sans-serif" },
  { label: "Nunito",           value: "'Nunito', sans-serif" },
  { label: "Open Sans",        value: "'Open Sans', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Poppins",          value: "'Poppins', sans-serif" },
  { label: "Raleway",          value: "'Raleway', sans-serif" },
  { label: "Roboto",           value: "'Roboto', sans-serif" },
  { label: "Source Code Pro",  value: "'Source Code Pro', monospace" },
  { label: "Space Grotesk",    value: "'Space Grotesk', sans-serif" },
  { label: "Tahoma",           value: "Tahoma, Geneva, sans-serif" },
  { label: "Times New Roman",  value: "'Times New Roman', Times, serif" },
  { label: "Trebuchet MS",     value: "'Trebuchet MS', sans-serif" },
  { label: "Verdana",          value: "Verdana, Geneva, sans-serif" },
];

const accentColors = ["#3b82f6", "#2db8a0", "#8b5cf6", "#f43f5e", "#f59e0b", "#10b981"];

const UICustomizer = () => {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<UIPrefs>(() => {
    try {
      const s = localStorage.getItem(LOCAL_STORAGE_KEY);
      return s ? { ...defaultPrefs, ...JSON.parse(s) } : { ...defaultPrefs };
    } catch { return { ...defaultPrefs }; }
  });
  const [draft, setDraft] = useState<UIPrefs>({ ...prefs });

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setPos({ x: 0, y: 0 });
      setDraft({ ...prefs });
    };
    window.addEventListener("ss:openCustomizer", handleOpen);
    return () => window.removeEventListener("ss:openCustomizer", handleOpen);
  }, [prefs]);

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const origin = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const onPD = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    origin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [pos]);

  const onPM = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    setPos({ x: origin.current.px + e.clientX - origin.current.mx, y: origin.current.py + e.clientY - origin.current.my });
  }, []);

  const onPU = useCallback(() => { dragging.current = false; }, []);

  const update = (p: Partial<UIPrefs>) => {
    const next = { ...draft, ...p };
    setDraft(next);
    applySettings(next, true);
  };

  const save = () => {
    setPrefs(draft);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
    toast.success("Settings saved locally!");
    setOpen(false);
  };

  const reset = () => {
    const d = { ...defaultPrefs };
    setDraft(d); setPrefs(d);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(d));
    applySettings(d);
    toast.success("Reset to defaults!");
  };

  const cancel = () => {
    setDraft({ ...prefs });
    applySettings(prefs);
    setOpen(false);
  };

  const isDark = draft.theme === "dark";
  const bg      = isDark ? "#1a2236" : "#ffffff";
  const border  = isDark ? "#2d3a52" : "#e2e8f0";
  const text    = isDark ? "#e2e8f0" : "#1a202c";
  const muted   = isDark ? "#8896b0" : "#64748b";
  const mutedBg = isDark ? "#232d42" : "#f8fafc";
  const accent  = draft.accent_color;

  const S: Record<string, React.CSSProperties> = {
    panel: {
      position: "fixed",
      top: Math.max(10, 122 + pos.y),
      right: Math.max(8, 16 - pos.x),
      zIndex: 99999, width: 280,
      background: bg, border: `1.5px solid ${border}`,
      borderRadius: 14,
      boxShadow: "0 12px 48px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.12)",
      overflow: "hidden",
      fontFamily: "system-ui,-apple-system,sans-serif",
    },
    handle: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 12px", background: mutedBg,
      borderBottom: `1px solid ${border}`,
      cursor: "grab", userSelect: "none" as const,
    },
    body: {
      padding: 12, display: "flex", flexDirection: "column" as const,
      gap: 14, maxHeight: "68vh", overflowY: "auto" as const,
    },
    label: {
      fontSize: 10, fontWeight: 600, color: muted,
      textTransform: "uppercase" as const, letterSpacing: "0.07em",
      marginBottom: 6, display: "block",
    },
    row: { display: "flex", gap: 6 },
    footer: {
      display: "flex", gap: 6, padding: 12,
      borderTop: `1px solid ${border}`, background: mutedBg,
    },
  };

  const optBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    gap: 5, padding: "7px 8px", borderRadius: 8,
    fontSize: 11, fontWeight: 600,
    border: `1.5px solid ${active ? accent : border}`,
    background: active ? accent : bg,
    color: active ? "#fff" : muted, cursor: "pointer",
  });

  const fontBtn = (active: boolean): React.CSSProperties => ({
    padding: "6px 8px", borderRadius: 6, fontSize: 10,
    border: `1.5px solid ${active ? accent : border}`,
    background: active ? accent : bg,
    color: active ? "#fff" : muted,
    cursor: "pointer", textAlign: "center",
  });

  if (!open) return null;

  return (
    <div style={S.panel}>
      <div style={S.handle} onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <GripHorizontal size={13} color={muted} />
          <span style={{ fontSize: 12, fontWeight: 700, color: text }}>User Experience Settings</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); cancel(); }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 3, display: "flex", color: muted }}
        >
          <X size={14} color={muted} />
        </button>
      </div>

      <div style={S.body}>
        <div>
          <span style={S.label}>Theme</span>
          <div style={S.row}>
            <button onClick={() => update({ theme: "light" })} style={optBtn(draft.theme === "light")}>
              <Sun size={12} color={draft.theme === "light" ? "#fff" : muted} /> Light
            </button>
            <button onClick={() => update({ theme: "dark" })} style={optBtn(draft.theme === "dark")}>
              <Moon size={12} color={draft.theme === "dark" ? "#fff" : muted} /> Dark
            </button>
          </div>
        </div>

        <div>
          <span style={S.label}>Default View</span>
          <div style={S.row}>
            <button onClick={() => update({ global_view: "grid" })} style={optBtn(draft.global_view === "grid")}>
              <LayoutGrid size={12} color={draft.global_view === "grid" ? "#fff" : muted} /> Grid
            </button>
            <button onClick={() => update({ global_view: "list" })} style={optBtn(draft.global_view === "list")}>
              <List size={12} color={draft.global_view === "list" ? "#fff" : muted} /> List
            </button>
          </div>
        </div>

        <div>
          <span style={S.label}>Card Style</span>
          <div style={S.row}>
            <button onClick={() => update({ card_style: "icon" })} style={optBtn(draft.card_style === "icon")}>
              <Layers size={12} color={draft.card_style === "icon" ? "#fff" : muted} /> Icon
            </button>
            <button onClick={() => update({ card_style: "image" })} style={optBtn(draft.card_style === "image")}>
              <Image size={12} color={draft.card_style === "image" ? "#fff" : muted} /> Image
            </button>
          </div>
        </div>

        <div>
          <span style={S.label}>Font Size</span>
          <div style={S.row}>
            {["x-small", "small", "medium", "large", "x-large"].map(sz => (
              <button key={sz} onClick={() => update({ font_size: sz })} style={fontBtn(draft.font_size === sz)}>
                {sz.replace("-", "").substring(0, 2).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span style={S.label}>Font Family</span>
          <div style={{ position: "relative" }}>
            <select
              value={draft.font_style}
              onChange={e => update({ font_style: e.target.value })}
              style={{
                width: "100%", padding: "8px 32px 8px 10px", borderRadius: 8,
                border: `1.5px solid ${border}`, background: bg, color: text,
                fontSize: 12, outline: "none", cursor: "pointer", appearance: "none"
              }}
            >
              {fonts.map(f => (
                <option key={f.label} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span style={S.label}>Accent Color</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {accentColors.map(c => (
              <button key={c} onClick={() => update({ accent_color: c })}
                style={{
                  width: 26, height: 26, borderRadius: "50%", background: c,
                  border: `2.5px solid ${draft.accent_color === c ? text : "transparent"}`,
                  cursor: "pointer",
                  transform: draft.accent_color === c ? "scale(1.18)" : "scale(1)",
                  outline: "none",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="color" value={draft.accent_color}
              onChange={e => update({ accent_color: e.target.value })}
              style={{ width: 26, height: 26, borderRadius: 4, border: `1px solid ${border}`, cursor: "pointer", padding: 0 }}
            />
            <span style={{ fontSize: 10, color: muted, fontFamily: "monospace" }}>{draft.accent_color}</span>
          </div>
        </div>
      </div>

      <div style={S.footer}>
        <button onClick={() => {
          localStorage.removeItem("bss_tour_completed_v2");
          window.location.reload();
        }}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 7, fontSize: 11, fontWeight: 500,
            background: "transparent", border: `1.5px solid ${border}`, color: muted, cursor: "pointer",
          }}>
          Retake Tour
        </button>
        <button onClick={reset}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 7, fontSize: 11, fontWeight: 500,
            background: "transparent", border: `1.5px solid ${border}`, color: muted, cursor: "pointer",
          }}>
          Reset
        </button>
        <button onClick={save}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "8px 0", borderRadius: 7, fontSize: 11, fontWeight: 700,
            background: accent, border: "none", color: "#fff", cursor: "pointer",
          }}>
          <Save size={12} color="#fff" /> Save
        </button>
      </div>
    </div>
  );
};

export default UICustomizer;
