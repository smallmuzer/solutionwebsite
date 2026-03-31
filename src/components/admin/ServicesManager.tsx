import { useState, useEffect } from "react";
import { supabase } from "@/lib/localClient";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Eye, EyeOff, Check, X, RefreshCw, GripVertical } from "lucide-react";
import {
  Monitor, Globe, Smartphone, Database, Users, Briefcase,
  Search, Megaphone, Palette, Cloud, Code2, BarChart2,
  Shield, Headphones, PenTool, TrendingUp, Cpu, Layers,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import RichTextEditor from "./RichTextEditor";

type Service = Tables<"services">;

const ICON_OPTIONS = [
  { name: "Monitor",    Icon: Monitor },    { name: "Globe",      Icon: Globe },
  { name: "Smartphone", Icon: Smartphone }, { name: "Database",   Icon: Database },
  { name: "Users",      Icon: Users },      { name: "Briefcase",  Icon: Briefcase },
  { name: "Search",     Icon: Search },     { name: "Megaphone",  Icon: Megaphone },
  { name: "Palette",    Icon: Palette },    { name: "Cloud",      Icon: Cloud },
  { name: "Code2",      Icon: Code2 },      { name: "BarChart2",  Icon: BarChart2 },
  { name: "Shield",     Icon: Shield },     { name: "Headphones", Icon: Headphones },
  { name: "PenTool",    Icon: PenTool },    { name: "TrendingUp", Icon: TrendingUp },
  { name: "Cpu",        Icon: Cpu },        { name: "Layers",     Icon: Layers },
];

const fieldCls = "w-full px-3 py-2 rounded-lg bg-transparent border border-border/60 text-foreground text-sm outline-none focus:border-secondary/70 focus:ring-1 focus:ring-secondary/30 transition-colors";

const IconPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Icon</label>
    <div className="flex flex-wrap gap-1.5 p-2 border border-border/60 rounded-lg bg-transparent">
      {ICON_OPTIONS.map(({ name, Icon }) => (
        <button key={name} type="button" title={name}
          onClick={() => onChange(name)}
          className={`p-2 rounded-lg transition-colors ${value === name ? "bg-secondary text-secondary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
          <Icon size={16} />
        </button>
      ))}
    </div>
  </div>
);

const ServicesManager = () => {
  const [services, setServices]   = useState<Service[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData]   = useState({ title: "", description: "", image_url: "", icon: "" });
  const [newForm, setNewForm]     = useState({ title: "", description: "", image_url: "", icon: "" });
  const [adding, setAdding]       = useState(false);
  const [saving, setSaving]       = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("services").select("*").order("sort_order");
    if (data) setServices(data);
    setLoading(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const { error } = await supabase.from("services").update({
      title: editData.title, description: editData.description,
      image_url: editData.image_url || null, icon: editData.icon || null,
    } as any).eq("id", editingId);
    if (error) { toast.error("Failed to save."); }
    else {
      setServices(prev => prev.map(s => s.id === editingId ? { ...s, ...editData } : s));
      toast.success("Service updated!"); setEditingId(null);
    }
    setSaving(false);
  };

  const toggleVisible = async (id: string, current: boolean) => {
    await supabase.from("services").update({ is_visible: !current } as any).eq("id", id);
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_visible: !current } : s));
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    await supabase.from("services").delete().eq("id", id);
    setServices(prev => prev.filter(s => s.id !== id));
    toast.success("Deleted.");
  };

  const addService = async () => {
    if (!newForm.title || !newForm.description) { toast.error("Title and description required."); return; }
    setSaving(true);
    const maxOrder = services.length > 0 ? Math.max(...services.map(s => s.sort_order)) + 1 : 0;
    const { data, error } = await supabase.from("services").insert({
      title: newForm.title, description: newForm.description,
      image_url: newForm.image_url || null, icon: newForm.icon || null, sort_order: maxOrder,
    } as any).select().single();
    if (error) { toast.error("Failed to add."); }
    else if (data) { setServices(prev => [...prev, data]); setNewForm({ title: "", description: "", image_url: "", icon: "" }); setAdding(false); toast.success("Service added!"); }
    setSaving(false);
  };

  if (loading) return <div className="text-muted-foreground text-center py-12">Loading services...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Services</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage service cards shown on your website</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><RefreshCw size={14} /></button>
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            <Plus size={16} /> Add Service
          </button>
        </div>
      </div>

      {adding && (
        <div className="glass-card p-5 mb-4 border-2 border-secondary/30 space-y-3">
          <h3 className="font-heading font-semibold text-foreground">New Service</h3>
          <input value={newForm.title} onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Service title" className={fieldCls} />
          <RichTextEditor value={newForm.description} onChange={v => setNewForm(p => ({ ...p, description: v }))} placeholder="Service description..." />
          <input value={newForm.image_url} onChange={e => setNewForm(p => ({ ...p, image_url: e.target.value }))}
            placeholder="Image URL (optional)" className={fieldCls} />
          <IconPicker value={newForm.icon} onChange={v => setNewForm(p => ({ ...p, icon: v }))} />
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => { setAdding(false); setNewForm({ title: "", description: "", image_url: "", icon: "" }); }}
              className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm"><X size={14} /></button>
            <button onClick={addService} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
              <Check size={14} /> {saving ? "Saving..." : "Add Service"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {services.map(service => (
          <div key={service.id} className={`glass-card p-4 ${!service.is_visible ? "opacity-60" : ""}`}>
            {editingId === service.id ? (
              <div className="space-y-3">
                <input value={editData.title} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
                  placeholder="Title" className={fieldCls} />
                <RichTextEditor value={editData.description} onChange={v => setEditData(p => ({ ...p, description: v }))} />
                <input value={editData.image_url} onChange={e => setEditData(p => ({ ...p, image_url: e.target.value }))}
                  placeholder="Image URL (optional)" className={fieldCls} />
                <IconPicker value={editData.icon} onChange={v => setEditData(p => ({ ...p, icon: v }))} />
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs">Cancel</button>
                  <button onClick={saveEdit} disabled={saving}
                    className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs disabled:opacity-50">
                    <Check size={12} /> {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <GripVertical size={16} className="text-muted-foreground/40 shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{service.title}</span>
                    {!service.is_visible && <span className="text-[0.625rem] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Hidden</span>}
                  </div>
                  <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2" dangerouslySetInnerHTML={{ __html: service.description }} />
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditingId(service.id); setEditData({ title: service.title, description: service.description, image_url: service.image_url || "", icon: (service as any).icon || "" }); }}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Edit2 size={14} /></button>
                  <button onClick={() => toggleVisible(service.id, service.is_visible)}
                    className={`p-1.5 rounded hover:bg-muted ${service.is_visible ? "text-secondary" : "text-muted-foreground"}`}>
                    {service.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => deleteService(service.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {services.length === 0 && <p className="text-muted-foreground text-center py-12">No services yet.</p>}
      </div>
    </div>
  );
};

export default ServicesManager;
