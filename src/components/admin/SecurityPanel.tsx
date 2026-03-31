import { useState, useEffect } from "react";
import { Shield, ShieldCheck, ShieldAlert, Lock, Eye, Globe, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface SecuritySetting {
  key: string;
  label: string;
  description: string;
  icon: any;
  enabled: boolean;
  group: string;
}

const DEFAULT_SETTINGS: SecuritySetting[] = [
  { key: "anti_scraping",    label: "Anti-Scraping Protection",   description: "Block automated bots and web scrapers from copying your content.", icon: ShieldAlert, enabled: true,  group: "Access Control" },
  { key: "right_click",      label: "Disable Right-Click",         description: "Prevent users from right-clicking to copy images and text.",         icon: Lock,        enabled: false, group: "Access Control" },
  { key: "rate_limiting",    label: "Rate Limiting",               description: "Limit API requests to prevent abuse (already enabled for contact form).", icon: Shield,   enabled: true,  group: "API Security" },
  { key: "content_security", label: "Content Security Headers",    description: "Add security headers to prevent XSS and clickjacking attacks.",       icon: ShieldCheck, enabled: true,  group: "API Security" },
  { key: "ip_logging",       label: "IP Activity Logging",         description: "Log IP addresses for suspicious activity monitoring.",                 icon: Eye,         enabled: false, group: "Monitoring" },
  { key: "cors_protection",  label: "CORS Protection",             description: "Restrict which domains can access your API endpoints.",                icon: Globe,       enabled: true,  group: "Monitoring" },
];

const preventContext = (e: MouseEvent) => e.preventDefault();

const SecurityPanel = () => {
  const [settings, setSettings] = useState<SecuritySetting[]>(DEFAULT_SETTINGS);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Access Control": true,
    "API Security": true,
    "Monitoring": true,
  });

  useEffect(() => {
    const load = async () => {
      const resp = await fetch("/api/db/site_content?section_key=security&_single=1");
      const { data } = await resp.json();
      if (data?.content) {
        const saved = data.content as Record<string, boolean>;
        setSettings((prev) =>
          prev.map((s) => ({ ...s, enabled: saved[s.key] !== undefined ? saved[s.key] : s.enabled }))
        );
      }
    };
    load();
  }, []);

  const toggle = async (key: string) => {
    const updated = settings.map((s) => {
      if (s.key === key) {
        const newVal = !s.enabled;
        if (key === "right_click") {
          if (newVal) document.addEventListener("contextmenu", preventContext);
          else document.removeEventListener("contextmenu", preventContext);
        }
        return { ...s, enabled: newVal };
      }
      return s;
    });
    setSettings(updated);

    const secObj: Record<string, boolean> = {};
    updated.forEach((s) => { secObj[s.key] = s.enabled; });
    await fetch("/api/db/site_content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_key: "security", content: secObj })
    });
    toast.success("Security setting updated.");
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const groups = Array.from(new Set(settings.map((s) => s.group)));
  const enabledCount = settings.filter((s) => s.enabled).length;
  const score = Math.round((enabledCount / settings.length) * 100);

  return (
    <div>
      <h2 className="font-heading font-bold text-xl text-foreground mb-2">Security Settings</h2>
      <p className="text-muted-foreground text-sm mb-4">Manage security features to protect your website and data.</p>

      {/* Score bar */}
      <div className="glass-card p-4 mb-6 flex items-center gap-4">
        <div className={`text-3xl font-heading font-bold ${score >= 70 ? "text-secondary" : score >= 40 ? "text-yellow-500" : "text-destructive"}`}>
          {score}%
        </div>
        <div className="flex-1">
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${score >= 70 ? "bg-secondary" : score >= 40 ? "bg-yellow-500" : "bg-destructive"}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs mt-1">{enabledCount} of {settings.length} security features enabled</p>
        </div>
      </div>

      {/* Grouped sections with toggle headings */}
      <div className="space-y-3">
        {groups.map((group) => {
          const groupSettings = settings.filter((s) => s.group === group);
          const isOpen = !!expandedGroups[group];
          const groupEnabled = groupSettings.filter((s) => s.enabled).length;

          return (
            <div key={group} className="glass-card overflow-hidden">
              {/* Toggle heading */}
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-secondary shrink-0" />
                  <div>
                    <span className="font-heading font-semibold text-foreground text-sm">{group}</span>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {groupEnabled}/{groupSettings.length} enabled
                    </div>
                  </div>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Settings list */}
              {isOpen && (
                <div className="border-t border-border/50 divide-y divide-border/30">
                  {groupSettings.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${setting.enabled ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"}`}>
                          <setting.icon size={18} />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold text-foreground text-sm">{setting.label}</h3>
                          <p className="text-muted-foreground text-xs mt-0.5">{setting.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggle(setting.key)}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${setting.enabled ? "bg-secondary" : "bg-muted"}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-all ${setting.enabled ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SecurityPanel;
