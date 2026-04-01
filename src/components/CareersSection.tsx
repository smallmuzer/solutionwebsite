import { useEffect, useState } from "react";
import AnimatedSection from "./AnimatedSection";
import {
  Briefcase, MapPin, Clock,
  Code2, Smartphone, Palette, BarChart2, Database,
  Users, Globe, Shield, Headphones, PenTool, TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/localClient";
import type { Tables } from "@/integrations/supabase/types";
import { useGlobalView } from "./UICustomizer";
import { toast } from "sonner";

const FALLBACK_JOBS = [
  { id: "1", title: "Senior Full Stack Developer", location: "Malé, Maldives", job_type: "Full-time", description: "Build enterprise-grade web applications using modern technologies.", is_visible: true, sort_order: 0, created_at: "", updated_at: "" },
  { id: "2", title: "Mobile App Developer",        location: "Remote",          job_type: "Full-time", description: "Create cross-platform mobile solutions for our global clients.",  is_visible: true, sort_order: 1, created_at: "", updated_at: "" },
  { id: "3", title: "UI/UX Designer",              location: "Malé, Maldives", job_type: "Full-time", description: "Design intuitive and beautiful user experiences for enterprise products.", is_visible: true, sort_order: 2, created_at: "", updated_at: "" },
];

type CareerJob = Tables<"career_jobs">;

// Map job title keywords → icon + solid background color
const JOB_ICONS: Array<{ keys: string[]; Icon: React.ElementType; bg: string; fg: string }> = [
  { keys: ["full stack", "backend", "frontend", "developer", "engineer", "software"],  Icon: Code2,        bg: "#1e40af", fg: "#93c5fd" },
  { keys: ["mobile", "android", "ios", "flutter", "react native"],                     Icon: Smartphone,   bg: "#065f46", fg: "#6ee7b7" },
  { keys: ["ui", "ux", "design", "designer", "figma"],                                 Icon: Palette,      bg: "#831843", fg: "#f9a8d4" },
  { keys: ["seo", "marketing", "digital", "content", "social"],                        Icon: TrendingUp,   bg: "#365314", fg: "#bef264" },
  { keys: ["data", "analyst", "analytics", "bi", "report"],                            Icon: BarChart2,    bg: "#78350f", fg: "#fcd34d" },
  { keys: ["erp", "database", "sql", "dba"],                                           Icon: Database,     bg: "#7c2d12", fg: "#fdba74" },
  { keys: ["hr", "human resource", "payroll", "recruit"],                              Icon: Users,        bg: "#4c1d95", fg: "#c4b5fd" },
  { keys: ["network", "infrastructure", "cloud", "devops", "system"],                  Icon: Globe,        bg: "#164e63", fg: "#67e8f9" },
  { keys: ["security", "cyber", "pen test"],                                           Icon: Shield,       bg: "#7f1d1d", fg: "#fca5a5" },
  { keys: ["support", "helpdesk", "customer"],                                         Icon: Headphones,   bg: "#134e4a", fg: "#5eead4" },
  { keys: ["business", "sales", "executive", "manager", "account"],                   Icon: Briefcase,    bg: "#713f12", fg: "#fde68a" },
  { keys: ["writer", "copywriter", "editor", "documentation"],                        Icon: PenTool,      bg: "#581c87", fg: "#e9d5ff" },
];

function getJobIcon(title: string): { Icon: React.ElementType; bg: string; fg: string } {
  const t = title.toLowerCase();
  for (const entry of JOB_ICONS) {
    if (entry.keys.some((k) => t.includes(k))) return entry;
  }
  return { Icon: Briefcase, bg: "#1e3a5f", fg: "#93c5fd" };
}

const JobCard = ({ job, onApply }: { job: CareerJob; onApply: () => void }) => {
  const { Icon, bg, fg } = getJobIcon(job.title);
  return (
    <div className="glass-card p-5 flex flex-col h-full group hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
            <Icon size={20} style={{ color: fg }} />
          </div>
          <h3 className="font-heading font-semibold text-foreground text-[0.9375rem] leading-snug">{job.title}</h3>
        </div>
        <p className="text-muted-foreground text-[0.8125rem] leading-relaxed flex-1">{job.description}</p>
        <div className="flex flex-wrap gap-3 mt-4 mb-4">
          <span className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground"><MapPin size={13} /> {job.location}</span>
          <span className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground"><Clock size={13} /> {job.job_type}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onApply(); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-semibold text-[0.8125rem] hover:opacity-90 transition-opacity w-full mt-auto"
        >
          <Briefcase size={14} /> Apply Now
        </button>
      </div>
    </div>
  );
};

const CareersSection = () => {
  const view = useGlobalView();
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [header, setHeader] = useState({ badge: "Careers", title: "Join Our", highlight: "Team", description: "Be part of a dynamic team building cutting-edge technology solutions for clients worldwide." });
  const scrollTo = () => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CareerJob | null>(null);
  const [applyForm, setApplyForm] = useState({ name: "", email: "", phone: "", cover: "", website: "" });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [jobsRes, contentRes] = await Promise.all([
        fetch("/api/db/career_jobs?is_visible=1&_order=sort_order&_asc=true").then(r => r.json()),
        fetch("/api/db/site_content?section_key=careers&_single=1").then(r => r.json()),
      ]);
      if (jobsRes.data && jobsRes.data.length > 0) setJobs(jobsRes.data);
      else setJobs(FALLBACK_JOBS as CareerJob[]);
      
      if (contentRes.data?.content) {
        setHeader(h => ({ ...h, ...contentRes.data.content }));
      }
    };
    load();
    const interval = setInterval(load, 10000); // Poll every 10s as a lightweight alternative to SSE
    return () => clearInterval(interval);
  }, []);

  if (jobs.length === 0) return null;

  const openApply = (job: CareerJob) => {
    setSelectedJob(job);
    setShowModal(true);
  };
  const submitApplication = async () => {
    if (!applyForm.name.trim()) {
      toast.error("Full Name is required.");
      return;
    }
    if (!applyForm.email.trim()) {
      toast.error("Email Address is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applyForm.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const resp = await fetch("/api/db/job_applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_name: applyForm.name.trim(),
          email: applyForm.email.trim(),
          phone: applyForm.phone.trim() || null,
          cover_letter: applyForm.cover.trim() || null,
          job_id: selectedJob?.title || selectedJob?.id || "General",
          status: "new",
          website: applyForm.website || null,
        })
      });
      const json = await resp.json();
      const appData = json.data;
      if (json.error) throw new Error(json.error.message);

      // Automatically create an appointment for today so it shows up on the admin calendar
      if (appData) {
        await fetch("/api/db/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            reference_type: "application",
            reference_id: appData.id,
            name: applyForm.name.trim(),
            email: applyForm.email.trim(),
            title: `Job App: ${selectedJob?.title || "General"}`,
            description: applyForm.cover?.slice(0, 100) || "Candidate applied for this position.",
            appointment_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          })
        });
      }

      toast.success("Application submitted successfully!");
      setShowModal(false);
      setApplyForm({ name: "", email: "", phone: "", cover: "", website: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="careers" className="section-padding relative overflow-hidden">
      <div className="container-wide relative z-10">
        <AnimatedSection className="text-center mb-14">
          <span className="text-secondary font-semibold text-sm uppercase tracking-widest">{header.badge}</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mt-3 mb-4">
            {header.title} <span className="gradient-text">{header.highlight}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-4 text-[0.9375rem]">
            {header.description}
          </p>
        </AnimatedSection>

        {view === "grid" ? (
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onApply={() => openApply(job)} />
            ))}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {jobs.map((job) => {
              const { Icon, bg, fg } = getJobIcon(job.title);
              return (
                <div
                  key={job.id}
                  className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                    <Icon size={20} style={{ color: fg }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-foreground text-[0.9375rem]">{job.title}</h3>
                    <p className="text-muted-foreground text-[0.8125rem] mt-1">{job.description}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground"><MapPin size={13} /> {job.location}</span>
                      <span className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground"><Clock size={13} /> {job.job_type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openApply(job)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-semibold text-[0.8125rem] hover:opacity-90 transition-opacity shrink-0"
                  >
                    <Briefcase size={14} /> Apply Now
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-3">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-heading font-semibold text-lg text-foreground">Apply for {selectedJob?.title}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
                <input className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm" value={applyForm.name} onChange={(e) => setApplyForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email *</label>
                <input className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm" value={applyForm.email} onChange={(e) => setApplyForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <input className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm" value={applyForm.phone} onChange={(e) => setApplyForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Job ID / Title</label>
                <input className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm" value={selectedJob?.title || ""} readOnly />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cover Letter / Notes</label>
              <textarea className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none" rows={3}
                value={applyForm.cover} onChange={(e) => setApplyForm(f => ({ ...f, cover: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>
              <button onClick={submitApplication} disabled={submitting || !applyForm.name || !applyForm.email}
                className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
            {/* Honeypot — hidden from real users */}
            <input
              type="text"
              name="website"
              value={applyForm.website}
              onChange={(e) => setApplyForm(f => ({ ...f, website: e.target.value }))}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default CareersSection;
