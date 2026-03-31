import { useState, useEffect } from "react";
import { supabase } from "@/lib/localClient";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Eye, EyeOff, Check, X, RefreshCw } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CareerJob = Tables<"career_jobs">;

const inputCls = "w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:ring-2 focus:ring-ring outline-none";
const textareaCls = `${inputCls} resize-y min-h-[80px] max-h-52 overflow-y-auto`;

const emptyForm = { title: "", description: "", location: "Malé, Maldives", job_type: "Full-time" };

const CareersManager = () => {
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ ...emptyForm });
  const [newForm, setNewForm] = useState({ ...emptyForm });
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("career_jobs").select("*").order("sort_order");
    if (data) setJobs(data);
    setLoading(false);
  };

  const startEdit = (j: CareerJob) => {
    setEditingId(j.id);
    setEditData({ title: j.title, description: j.description, location: j.location, job_type: j.job_type });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const { error } = await supabase.from("career_jobs").update({
      title: editData.title,
      description: editData.description,
      location: editData.location,
      job_type: editData.job_type,
    }).eq("id", editingId);
    if (error) { toast.error("Failed to save."); } else {
      setJobs(prev => prev.map(j => j.id === editingId ? { ...j, ...editData } : j));
      toast.success("Job updated!");
      setEditingId(null);
    }
    setSaving(false);
  };

  const toggleVisible = async (id: string, current: boolean) => {
    await supabase.from("career_jobs").update({ is_visible: !current }).eq("id", id);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, is_visible: !current } : j));
    toast.success(current ? "Job hidden." : "Job visible.");
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Delete this job listing?")) return;
    const { error } = await supabase.from("career_jobs").delete().eq("id", id);
    if (error) { toast.error("Failed to delete."); return; }
    setJobs(prev => prev.filter(j => j.id !== id));
    toast.success("Job deleted.");
  };

  const addJob = async () => {
    if (!newForm.title || !newForm.description) { toast.error("Title and description required."); return; }
    setSaving(true);
    const maxOrder = jobs.length > 0 ? Math.max(...jobs.map(j => j.sort_order)) + 1 : 0;
    const { data, error } = await supabase.from("career_jobs").insert({
      title: newForm.title,
      description: newForm.description,
      location: newForm.location,
      job_type: newForm.job_type,
      sort_order: maxOrder,
    }).select().single();
    if (error) { toast.error("Failed to add."); } else if (data) {
      setJobs(prev => [...prev, data]);
      setNewForm({ ...emptyForm });
      setAdding(false);
      toast.success("Job added!");
    }
    setSaving(false);
  };

  if (loading) return <div className="text-muted-foreground text-center py-12">Loading jobs...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Career Listings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage "Join Our Team" job postings</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            <Plus size={16} /> Add Job
          </button>
        </div>
      </div>

      {adding && (
        <div className="glass-card p-5 mb-4 border-2 border-secondary/30">
          <h3 className="font-heading font-semibold text-foreground mb-4">New Job Listing</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Job Title</label>
              <input value={newForm.title} onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior Developer" className={inputCls} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Location</label>
                <input value={newForm.location} onChange={e => setNewForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Malé, Maldives" className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Job Type</label>
                <select value={newForm.job_type} onChange={e => setNewForm(p => ({ ...p, job_type: e.target.value }))} className={inputCls}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Remote</option>
                  <option>Internship</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
              <textarea value={newForm.description} onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))} placeholder="Job description..." className={textareaCls} />
            </div>
            <div className="flex gap-2">
              <button onClick={addJob} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
                <Check size={14} /> {saving ? "Saving..." : "Add Job"}
              </button>
              <button onClick={() => { setAdding(false); setNewForm({ ...emptyForm }); }} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map(job => (
          <div key={job.id} className={`glass-card p-5 ${!job.is_visible ? "opacity-60" : ""}`}>
            {editingId === job.id ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Job Title</label>
                  <input value={editData.title} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))} className={inputCls} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Location</label>
                    <input value={editData.location} onChange={e => setEditData(p => ({ ...p, location: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Job Type</label>
                    <select value={editData.job_type} onChange={e => setEditData(p => ({ ...p, job_type: e.target.value }))} className={inputCls}>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Remote</option>
                      <option>Internship</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                  <textarea value={editData.description} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} className={textareaCls} />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
                    <Check size={14} /> {saving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} className="flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-lg text-sm font-medium">
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-semibold text-foreground">{job.title}</h3>
                    <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">{job.job_type}</span>
                    <span className="text-xs text-muted-foreground">{job.location}</span>
                    {!job.is_visible && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Hidden</span>}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{job.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(job)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => toggleVisible(job.id, job.is_visible)}
                    className={`p-1.5 rounded-lg hover:bg-muted ${job.is_visible ? "text-secondary" : "text-muted-foreground"}`}
                    title={job.is_visible ? "Hide" : "Show"}>
                    {job.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => deleteJob(job.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {jobs.length === 0 && <p className="text-muted-foreground text-center py-12">No job listings yet. Add one above.</p>}
      </div>
    </div>
  );
};

export default CareersManager;
