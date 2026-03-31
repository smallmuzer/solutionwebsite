import { useState, useEffect } from "react";
import { Cookie, X, Settings2 } from "lucide-react";

const COOKIE_KEY = "ss_cookie_consent";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState({ necessary: true, analytics: false, marketing: false });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) {
      const t = setTimeout(() => { setMounted(true); setTimeout(() => setVisible(true), 30); }, 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const save = (all?: boolean) => {
    const toSave = all ? { necessary: true, analytics: true, marketing: true } : prefs;
    localStorage.setItem(COOKIE_KEY, JSON.stringify(toSave));
    setVisible(false);
    setTimeout(() => setMounted(false), 400);
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        zIndex: 70,
        padding: "1rem",
        transform: visible ? "translateY(0)" : "translateY(110%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s ease, opacity 0.35s ease",
      }}
    >
      <div className="flex justify-center">
        <div className="glass-card p-5 shadow-2xl" style={{ width: "100%", maxWidth: 560 }}>
          {!showSettings ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Cookie size={24} className="text-secondary shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-heading font-semibold text-foreground text-sm mb-1">We use cookies</h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  We use cookies to enhance your experience. By continuing, you agree to our use of cookies.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Settings2 size={14} className="inline mr-1.5" />
                  Customize
                </button>
                <button
                  onClick={() => save(true)}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Accept All
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-heading font-semibold text-foreground">Cookie Settings</h4>
                <button onClick={() => setShowSettings(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3 mb-5">
                {[
                  { key: "necessary" as const, label: "Necessary", desc: "Required for the website to function. Cannot be disabled.", locked: true },
                  { key: "analytics" as const, label: "Analytics", desc: "Help us understand how visitors interact with our website.", locked: false },
                  { key: "marketing" as const, label: "Marketing", desc: "Used to deliver personalized advertisements.", locked: false },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <div className="font-medium text-foreground text-sm">{item.label}</div>
                      <div className="text-muted-foreground text-xs">{item.desc}</div>
                    </div>
                    <button
                      disabled={item.locked}
                      onClick={() => setPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))}
                      className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                        prefs[item.key] ? "bg-secondary" : "bg-border"
                      } ${item.locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-card shadow transition-transform ${prefs[item.key] ? "translate-x-4" : ""}`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => save()} className="px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted">
                  Save Preferences
                </button>
                <button onClick={() => save(true)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold hover:opacity-90">
                  Accept All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
