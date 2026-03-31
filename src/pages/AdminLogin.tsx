import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/localClient";
import { toast } from "sonner";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import LoadingSpinner from "@/components/LoadingSpinner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: roles } = await supabase
          .from("users")
          .select("userrole")
          .eq("id", session.user.id)
          .eq("userrole", "admin");
        if (roles && roles.length > 0) {
          navigate("/admin", { replace: true });
          return;
        }
      }
      setChecking(false);
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error("Invalid credentials.");
      return;
    }
    const { data: roles } = await supabase
      .from("users")
      .select("userrole")
      .eq("id", data.user.id)
      .eq("userrole", "admin");

    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error("You do not have admin access.");
      return;
    }
    toast.success("Welcome back, admin!");
    navigate("/admin", { replace: true });
  };

  if (checking) return <LoadingSpinner message="Checking session..." />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="glass-card p-8 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="Systems Solutions" className="h-12 w-12 mx-auto mb-4" />
          <h1 className="font-heading font-bold text-2xl text-foreground">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to manage your website</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
                placeholder="admin@solutions.com.mv" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="text-center mt-6">
          <a href="/" className="text-sm text-muted-foreground hover:text-secondary transition-colors">
            ← Back to website
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
