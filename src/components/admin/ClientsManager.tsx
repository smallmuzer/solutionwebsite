import { useState, useEffect } from "react";
import { supabase } from "@/lib/localClient";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Eye, EyeOff, Check, X, RefreshCw } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ClientLogo = Tables<"client_logos">;

const inputCls = "w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:ring-2 focus:ring-ring outline-none";

const emptyForm = { name: "", logo_url: "" };

const ClientsManager = () => {
  const [clients, setClients] = useState<ClientLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ ...emptyForm });
  const [newForm, setNewForm] = useState({ ...emptyForm });
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("client_logos").select("*").order("sort_order");
    if (data) setClients(data);
    setLoading(false);
  };

  const startEdit = (c: ClientLogo) => {
    setEditingId(c.id);
    setEditData({ name: c.name, logo_url: c.logo_url });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const { error } = await supabase.from("client_logos").update({
      name: editData.name,
      logo_url: editData.logo_url,
    }).eq("id", editingId);
    if (error) { toast.error("Failed to save."); } else {
      setClients(prev => prev.map(c => c.id === editingId ? { ...c, ...editData } : c));
      toast.success("Client updated!");
      setEditingId(null);
    }
    setSaving(false);
  };

  const toggleVisible = async (id: string, current: boolean) => {
    await supabase.from("client_logos").update({ is_visible: !current }).eq("id", id);
    setClients(prev => prev.map(c => c.id === id ? { ...c, is_visible: !current } : c));
    toast.success(current ? "Client logo hidden." : "Client logo visible.");
  };

  const deleteClient = async (id: string) => {
    if (!confirm("Delete this client logo?")) return;
    const { error } = await supabase.from("client_logos").delete().eq("id", id);
    if (error) { toast.error("Failed to delete."); return; }
    setClients(prev => prev.filter(c => c.id !== id));
    toast.success("Client deleted.");
  };

  const addClient = async () => {
    if (!newForm.name || !newForm.logo_url) { toast.error("Name and logo URL required."); return; }
    setSaving(true);
    const maxOrder = clients.length > 0 ? Math.max(...clients.map(c => c.sort_order)) + 1 : 0;
    const { data, error } = await supabase.from("client_logos").insert({
      name: newForm.name,
      logo_url: newForm.logo_url,
      sort_order: maxOrder,
    }).select().single();
    if (error) { toast.error("Failed to add."); } else if (data) {
      setClients(prev => [...prev, data]);
      setNewForm({ ...emptyForm });
      setAdding(false);
      toast.success("Client added!");
    }
    setSaving(false);
  };

  if (loading) return <div className="text-muted-foreground text-center py-12">Loading clients...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Client Logos</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage client logos shown in the marquee slider</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      {adding && (
        <div className="glass-card p-5 mb-4 border-2 border-secondary/30">
          <h3 className="font-heading font-semibold text-foreground mb-4">New Client</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Company Name</label>
              <input value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. OBLU Resorts" className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Logo Image URL</label>
              <input value={newForm.logo_url} onChange={e => setNewForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="https://... or /assets/clients/..." className={inputCls} />
              <p className="text-[0.625rem] text-muted-foreground mt-1">Tip: Use local paths like <code>/assets/clients/filename.png</code> for better performance.</p>
              {newForm.logo_url && (
                <img src={newForm.logo_url} alt="preview" className="mt-2 h-12 object-contain rounded-lg border border-border p-1" />
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={addClient} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
                <Check size={14} /> {saving ? "Saving..." : "Add Client"}
              </button>
              <button onClick={() => { setAdding(false); setNewForm({ ...emptyForm }); }} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {clients.map(client => (
          <div key={client.id} className={`glass-card p-4 ${!client.is_visible ? "opacity-60" : ""}`}>
            {editingId === client.id ? (
              <div className="space-y-2">
                <input value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} placeholder="Company Name" className={inputCls} />
                <input value={editData.logo_url} onChange={e => setEditData(p => ({ ...p, logo_url: e.target.value }))} placeholder="Logo URL" className={inputCls} />
                <p className="text-[0.625rem] text-muted-foreground">Use <code>/assets/clients/name.png</code> for local assets.</p>
                {editData.logo_url && <img src={editData.logo_url} alt="preview" className="h-10 object-contain rounded border border-border p-1" />}
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium disabled:opacity-50">
                    <Check size={12} /> {saving ? "..." : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium">
                    <X size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-foreground text-sm">{client.name}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => startEdit(client)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Edit2 size={14} /></button>
                    <button onClick={() => toggleVisible(client.id, client.is_visible)}
                      className={`p-1 rounded hover:bg-muted ${client.is_visible ? "text-secondary" : "text-muted-foreground"}`}>
                      {client.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => deleteClient(client.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="h-14 flex items-center justify-center bg-muted/30 rounded-lg p-2">
                  <img src={client.logo_url} alt={client.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                </div>
                {!client.is_visible && <span className="text-xs text-muted-foreground mt-1 block">Hidden from site</span>}
              </div>
            )}
          </div>
        ))}
        {clients.length === 0 && <div className="col-span-3 text-muted-foreground text-center py-12">No clients yet.</div>}
      </div>
    </div>
  );
};

export default ClientsManager;
