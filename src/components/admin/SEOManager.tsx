import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Globe, Search, Plus, ChevronDown } from "lucide-react";

interface SEOEntry {
  id: string;
  page_key: string;
  title: string;
  description: string;
  keywords: string;
  og_image: string;
}

const DEFAULT_SEO: Omit<SEOEntry, "id">[] = [
  { page_key: "home", title: "Systems Solutions - Leading IT Company in Maldives", description: "Transform your business with cutting-edge technology solutions. Software development, ERP, mobile apps, and IT consulting.", keywords: "IT solutions, Maldives, software development, ERP, web development", og_image: "" },
];

const SEOManager = () => {
  const [entries, setEntries] = useState<SEOEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => { loadSEO(); }, []);

  const loadSEO = async () => {
    setLoading(true);
    const resp = await fetch("/api/db/seo_settings");
    const { data } = await resp.json();
    if (data && data.length > 0) {
      setEntries(data.map((d: any) => ({ ...d, og_image: d.og_image || "" })));
      // Auto-expand first entry
      if (data[0]?.id) setExpanded({ [data[0].id]: true });
    } else {
      for (const def of DEFAULT_SEO) {
        const insResp = await fetch("/api/db/seo_settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(def)
        });
        const { data: inserted } = await insResp.json();
        if (inserted) {
          setEntries((prev) => [...prev, { ...inserted, og_image: inserted.og_image || "" }]);
          setExpanded((prev) => ({ ...prev, [inserted.id]: true }));
        }
      }
    }
    setLoading(false);
  };

  const addPage = async () => {
    const pageKey = prompt("Enter page key (e.g. 'about', 'services'):");
    if (!pageKey) return;
    const resp = await fetch("/api/db/seo_settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_key: pageKey,
        title: `${pageKey.charAt(0).toUpperCase() + pageKey.slice(1)} - Systems Solutions`,
        description: "",
        keywords: "",
        og_image: "",
      })
    });
    const { data } = await resp.json();
    if (data) {
      setEntries((prev) => [...prev, { ...data, og_image: data.og_image || "" }]);
      setExpanded((prev) => ({ ...prev, [data.id]: true }));
      toast.success("Page added!");
    }
  };

  const saveSEO = async (entry: SEOEntry) => {
    setSaving(entry.id);
    const resp = await fetch(`/api/db/seo_settings?id=${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: entry.title,
        description: entry.description,
        keywords: entry.keywords,
        og_image: entry.og_image,
      })
    });
    const { error } = await resp.json();
    setSaving(null);
    if (error) { toast.error("Failed to save."); return; }
    toast.success("SEO settings saved!");
    if (entry.page_key === "home") {
      document.title = entry.title;
      document.querySelector('meta[name="description"]')?.setAttribute("content", entry.description);
      document.querySelector('meta[name="keywords"]')?.setAttribute("content", entry.keywords);
    }
  };

  const updateEntry = (id: string, field: string, value: string) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div className="text-muted-foreground text-center py-12">Loading SEO settings...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-xl text-foreground mb-1">SEO Management</h2>
          <p className="text-muted-foreground text-sm">Manage meta tags, titles, and descriptions for each page.</p>
        </div>
        <button onClick={addPage}
          className="flex items-center gap-1.5 px-4 py-2 bg-secondary/10 text-secondary rounded-lg text-sm font-medium hover:bg-secondary/20">
          <Plus size={14} /> Add Page
        </button>
      </div>

      <div className="space-y-3">
        {entries.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Globe size={48} className="text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No SEO entries found. Click "Add Page" to create one.</p>
          </div>
        )}
        {entries.map((entry) => {
          const isOpen = !!expanded[entry.id];
          return (
            <div key={entry.id} className="glass-card overflow-hidden">
              {/* Toggle heading */}
              <div
                onClick={() => toggleExpand(entry.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-secondary shrink-0" />
                  <div>
                    <span className="font-heading font-semibold text-foreground capitalize text-sm">
                      {entry.page_key} Page
                    </span>
                    {!isOpen && entry.title && (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{entry.title}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isOpen && (
                    <button
                      onClick={(e) => { e.stopPropagation(); saveSEO(entry); }}
                      disabled={saving === entry.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      <Save size={12} /> {saving === entry.id ? "Saving..." : "Save"}
                    </button>
                  )}
                  <ChevronDown
                    size={16}
                    className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </div>

              {/* Collapsible body */}
              {isOpen && (
                <div className="border-t border-border/50 px-5 pb-5">
                  {/* Search preview */}
                  <div className="mt-4 mb-5 p-4 rounded-lg bg-background border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Search size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Search Preview</span>
                    </div>
                    <div className="text-secondary text-base font-medium truncate">{entry.title || "Page Title"}</div>
                    <div className="text-xs text-secondary mt-0.5">solutions.com.mv/{entry.page_key === "home" ? "" : entry.page_key}</div>
                    <div className="text-muted-foreground text-sm mt-1 line-clamp-2">{entry.description || "Page description..."}</div>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Title <span className="text-muted-foreground font-normal">({entry.title.length}/60)</span>
                      </label>
                      <input value={entry.title} onChange={(e) => updateEntry(entry.id, "title", e.target.value)}
                        maxLength={60} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:ring-2 focus:ring-ring outline-none" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Meta Description <span className="text-muted-foreground font-normal">({entry.description.length}/160)</span>
                      </label>
                      <textarea value={entry.description} onChange={(e) => updateEntry(entry.id, "description", e.target.value)}
                        maxLength={160} rows={2} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm resize-none focus:ring-2 focus:ring-ring outline-none" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Keywords (comma-separated)</label>
                      <input value={entry.keywords} onChange={(e) => updateEntry(entry.id, "keywords", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
                        placeholder="keyword1, keyword2, keyword3" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">OG Image URL</label>
                      <input value={entry.og_image} onChange={(e) => updateEntry(entry.id, "og_image", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
                        placeholder="https://..." />
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => saveSEO(entry)}
                      disabled={saving === entry.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                      <Save size={14} /> {saving === entry.id ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SEOManager;
