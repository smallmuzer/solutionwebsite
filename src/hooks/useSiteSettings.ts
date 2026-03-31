import { useEffect } from "react";
import { supabase } from "@/lib/localClient";

const FONT_MAP: Record<string, string> = {
  "Arial": "Arial, Helvetica, sans-serif",
  "Courier New": "'Courier New', Courier, monospace",
  "DM Sans": "'DM Sans', sans-serif",
  "Georgia": "Georgia, 'Times New Roman', serif",
  "Inter": "'Inter', sans-serif",
  "Lato": "'Lato', sans-serif",
  "Montserrat": "'Montserrat', sans-serif",
  "Nunito": "'Nunito', sans-serif",
  "Open Sans": "'Open Sans', sans-serif",
  "Playfair Display": "'Playfair Display', serif",
  "Poppins": "'Poppins', sans-serif",
  "Raleway": "'Raleway', sans-serif",
  "Roboto": "'Roboto', sans-serif",
  "Source Code Pro": "'Source Code Pro', monospace",
  "Space Grotesk": "'Space Grotesk', sans-serif",
  "Tahoma": "Tahoma, Geneva, sans-serif",
  "Times New Roman": "'Times New Roman', Times, serif",
  "Trebuchet MS": "'Trebuchet MS', sans-serif",
  "Verdana": "Verdana, Geneva, sans-serif",
};

const FONT_SIZE_MAP: Record<string, string> = {
  "x-small": "13px",
  "small": "14.5px",
  "medium": "16px",
  "large": "18px",
  "x-large": "20px",
};

export function applySettings(dbSettings: Record<string, any>, live = false) {
  // 1. Get User Overrides from LocalStorage (unless in live preview mode)
  let userPrefs: any = {};
  if (!live) {
    try {
      const stored = localStorage.getItem("bss-user-settings");
      if (stored) userPrefs = JSON.parse(stored);
    } catch (e) {
      console.error("Local settings error:", e);
    }
  }

  // 2. Merge Hierarchy: Live Draft/Local Overrides > DB Settings
  const s = { ...dbSettings, ...userPrefs };

  // Theme
  const theme = s.theme || "light";
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (theme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }
  localStorage.setItem("bss-theme", theme);

  // Font Size
  let fs = s.font_size || "medium";
  const sizeVal = FONT_SIZE_MAP[fs] || (typeof fs === "number" ? `${16 + fs * 1.5}px` : "16px");
  document.documentElement.style.setProperty("font-size", sizeVal, "important");
  document.documentElement.style.fontSize = sizeVal;

  // Font Style
  const fontFamily = FONT_MAP[s.font_style] || FONT_MAP[s.default_font] || s.font_style || "";
  if (fontFamily) {
    document.documentElement.style.setProperty("--font-body", fontFamily);
    document.body.style.fontFamily = fontFamily;
    // Apply to headings too
    document.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach(h => (h as HTMLElement).style.fontFamily = fontFamily);
  }

  // Accent Color
  if (s.accent_color) {
    // Helper to convert hex to hsl for CSS variables if needed
    const hexToHSL = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };
    const hsl = hexToHSL(s.accent_color);
    document.documentElement.style.setProperty("--secondary", hsl);
    document.documentElement.style.setProperty("--accent", hsl);
    document.documentElement.style.setProperty("--ring", hsl);
  }

  if (s.enable_cinematic) document.body.classList.add("cinematic-mode");
  else document.body.classList.remove("cinematic-mode");
  if (s.cinematic_asset) {
    document.documentElement.style.setProperty("--cinematic-asset", `url('${s.cinematic_asset}')`);
  }

  window.dispatchEvent(new CustomEvent("ss:globalView", { detail: s.global_view || "grid" }));
  window.dispatchEvent(new CustomEvent("ss:cardStyle", { detail: s.card_style || "icon" }));

  // Ensure the body font-family is forced
  if (fontFamily) {
    document.body.style.setProperty("font-family", fontFamily, "important");
  }
}

function applySecurity(sec: Record<string, any>) {
  // Anti Scraping
  if (sec.anti_scraping) {
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  } else {
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
  }

  // Right Click Disable
  // Note: Only disable right-click if explicitly turned on (true)
  if (sec.right_click) {
    document.oncontextmenu = (e) => e.preventDefault();
  } else {
    document.oncontextmenu = null;
  }
}

export function useSiteSettings() {
  useEffect(() => {
    // Apply cached theme immediately to prevent flash
    const cached = localStorage.getItem("bss-theme");
    if (cached === "dark") document.documentElement.classList.add("dark");
    else if (cached === "light") document.documentElement.classList.remove("dark");

    // NEW: Apply local overrides immediately (Sync) to prevent flicker of default blue/font
    try {
      const stored = localStorage.getItem("bss-user-settings");
      if (stored) {
        applySettings({}); // Passing empty object because applySettings handles merging localStorage internally
      }
    } catch (e) {}

    const load = async () => {
      const qSettings = supabase.from("site_content").select("content").eq("section_key", "settings").maybeSingle();
      const qSecurity = supabase.from("site_content").select("content").eq("section_key", "security").maybeSingle();
      
      const [resSet, resSec] = await Promise.all([qSettings, qSecurity]);
      
      if (resSet.data?.content) {
        applySettings(resSet.data.content as Record<string, any>);
      }
      if (resSec.data?.content) {
        applySecurity(resSec.data.content as Record<string, any>);
      }
    };
    load();

    const channel = supabase
      .channel("site_settings_global")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_content" }, (payload: any) => {
        if (payload.new?.section_key === "settings") {
          applySettings((payload.new.content || {}) as Record<string, any>);
        } else if (payload.new?.section_key === "security") {
          applySecurity((payload.new.content || {}) as Record<string, any>);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);
}
