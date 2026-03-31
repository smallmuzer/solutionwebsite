import { useState, useEffect } from "react";
import { supabase } from "@/lib/localClient";
import { toast } from "sonner";
import { RefreshCw, Edit2, Check, X, Save } from "lucide-react";
import RichTextEditor from "./RichTextEditor";

const SECTION_KEYS = [
  {
    key: "hero", label: "Hero Section",
    fields: [
      { name: "title",    label: "Page Title",           rich: false },
      { name: "subtitle", label: "Subtitle / Description", rich: true  },
      { name: "cta_text", label: "Button Text",           rich: false },
    ],
  },
  {
    key: "about", label: "About Section",
    fields: [
      { name: "title",        label: "Section Title",          rich: false },
      { name: "description",  label: "Main Description",       rich: true  },
      { name: "vision",       label: "Vision / 2nd Paragraph", rich: true  },
      { name: "card_mission", label: "Card: Our Mission",      rich: true  },
      { name: "card_team",    label: "Card: Our Team",         rich: true  },
      { name: "card_quality", label: "Card: Quality First",    rich: true  },
      { name: "card_global",  label: "Card: Global Reach",     rich: true  },
    ],
  },
  {
    key: "services", label: "Services Section",
    fields: [
      { name: "title",    label: "Section Title",    rich: false },
      { name: "subtitle", label: "Section Subtitle", rich: true  },
    ],
  },
  {
    key: "contact", label: "Contact Section",
    fields: [
      { name: "title",    label: "Section Title",   rich: false },
      { name: "subtitle", label: "Section Subtitle", rich: true  },
      { name: "address",  label: "Office Address",  rich: true  },
      { name: "email",    label: "Email Address",   rich: false },
      { name: "phone",    label: "Phone Number",    rich: false },
      { name: "hours",    label: "Business Hours",  rich: true  },
      { name: "facebook",  label: "Facebook URL",  rich: false },
      { name: "twitter",   label: "Twitter URL",   rich: false },
      { name: "linkedin",  label: "LinkedIn URL",  rich: false },
      { name: "instagram", label: "Instagram URL", rich: false },
    ],
  },
  {
    key: "footer", label: "Footer",
    fields: [
      { name: "copyright", label: "Copyright Text",       rich: false },
      { name: "tagline",   label: "Tagline / Description", rich: true  },
    ],
  },
];

const DEFAULT_CONTENT: Record<string, Record<string, string>> = {
  hero: { title: "Leading IT Solutions Company in Maldives", subtitle: "Transform your business with cutting-edge technology solutions.", cta_text: "Get Started" },
  about: { title: "Driving Digital Transformation", description: "Systems Solutions Pvt Ltd is a tech-leading IT consulting and software development company.", vision: "Our journey began out of the passion for a unique position in the industry.", card_mission: "Deliver innovative technology solutions.", card_team: "Expert developers, designers, and consultants.", card_quality: "Every solution meets the highest standards.", card_global: "Serving clients across Maldives, Bhutan, and beyond." },
  services: { title: "Services & Solutions", subtitle: "Team up with the perfect digital partner for all your technical needs." },
  contact: { title: "Get In Touch", subtitle: "Ready to transform your business? Contact us today.", address: "Alia Building, 7th Floor\nGandhakoalhi Magu\nMalé, Maldives", email: "info@solutions.com.mv", phone: "+960 301-1355", hours: "Sun–Thu: 9AM–6PM\nSat: 9AM–1PM", facebook: "", twitter: "", linkedin: "", instagram: "" },
  footer: { copyright: `© ${new Date().getFullYear()} Systems Solutions Pvt Ltd. All rights reserved.`, tagline: "Leading IT consulting and software development company." },
};

const fieldCls = "w-full px-3 py-2 rounded-lg bg-transparent border border-border/60 text-foreground text-sm outline-none focus:border-secondary/70 focus:ring-1 focus:ring-secondary/30 transition-colors";

const ContentEditor = () => {
  const [contents, setContents]           = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  useEffect(() => { loadContent(); }, []);

  const loadContent = async () => {
    setLoading(true);
    const { data } = await supabase.from("site_content").select("*");
    const map: Record<string, Record<string, string>> = {};
    if (data) {
      data.forEach((row: any) => {
        if (row.section_key !== "settings") map[row.section_key] = row.content || {};
      });
    }
    SECTION_KEYS.forEach((s) => {
      const base = { ...(DEFAULT_CONTENT[s.key] || {}) };
      map[s.key] = map[s.key] ? { ...base, ...map[s.key] } : base;
    });
    setContents(map);
    setLoading(false);
  };

  const saveSection = async (key: string) => {
    setSaving(key);
    const existing = await supabase.from("site_content").select("id").eq("section_key", key).maybeSingle();
    if (existing.data) {
      await supabase.from("site_content").update({ content: contents[key] as any }).eq("section_key", key);
    } else {
      await supabase.from("site_content").insert({ section_key: key, content: contents[key] as any });
    }
    setSaving(null);
    setEditingSection(null);
    toast.success(`${key} content saved!`);
  };

  const update = (section: string, field: string, value: string) =>
    setContents(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));

  if (loading) return <div className="text-muted-foreground text-center py-12">Loading content...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Site Content</h1>
          <p className="text-muted-foreground text-sm mt-1">Edit website content — changes go live when saved</p>
        </div>
        <button onClick={loadContent} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="space-y-5">
        {SECTION_KEYS.map((section) => (
          <div key={section.key} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-foreground">{section.label}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">{section.key}</p>
              </div>
              {editingSection !== section.key && (
                <button onClick={() => setEditingSection(section.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm hover:opacity-90">
                  <Edit2 size={13} /> Edit
                </button>
              )}
            </div>

            <div className="grid gap-4">
              {section.fields.map((field) => (
                <div key={field.name}>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                    {field.label}
                  </label>
                  {editingSection === section.key ? (
                    field.rich ? (
                      <RichTextEditor
                        value={contents[section.key]?.[field.name] || ""}
                        onChange={(v) => update(section.key, field.name, v)}
                      />
                    ) : (
                      <input
                        value={contents[section.key]?.[field.name] || ""}
                        onChange={(e) => update(section.key, field.name, e.target.value)}
                        className={fieldCls}
                      />
                    )
                  ) : (
                    <div className="px-3 py-2 rounded-lg border border-border/30 text-foreground text-sm max-h-24 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: contents[section.key]?.[field.name] || "<span class='text-muted-foreground italic'>Not set</span>" }}
                    />
                  )}
                </div>
              ))}
            </div>

            {editingSection === section.key && (
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border/30">
                <button onClick={() => { setEditingSection(null); loadContent(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm">
                  <X size={13} /> Cancel
                </button>
                <button onClick={() => saveSection(section.key)} disabled={saving === section.key}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  <Save size={13} /> {saving === section.key ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentEditor;
