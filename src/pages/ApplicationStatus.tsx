import { useState } from "react";
import { RefreshCw } from "lucide-react";

const ApplicationStatus = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<any[]>([]);

  const fetchApps = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const resp = await fetch(`/api/applications?email=${encodeURIComponent(email)}`);
      const json = await resp.json();
      if (!json.error) setApps(json.data || []);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg glass-card p-6 space-y-4">
        <h1 className="font-heading font-bold text-2xl text-foreground text-center">Track Your Application</h1>
        <p className="text-muted-foreground text-sm text-center">Enter the email you used to apply.</p>
        <div className="flex gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm" />
          <button onClick={fetchApps} className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm flex items-center gap-2">
            <RefreshCw size={14}/> Check
          </button>
        </div>
        {loading && <div className="text-muted-foreground text-sm">Loading...</div>}
        {!loading && apps.map((a) => (
          <div key={a.id} className="border border-border rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-foreground">{a.job_id || "General Application"}</span>
              <span className="uppercase text-xs text-muted-foreground">{a.status}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</div>
            {a.cover_letter && <p className="text-sm text-foreground mt-1">{a.cover_letter}</p>}
          </div>
        ))}
        {!loading && apps.length === 0 && email && <div className="text-muted-foreground text-sm text-center">No applications found.</div>}
      </div>
    </div>
  );
};

export default ApplicationStatus;
