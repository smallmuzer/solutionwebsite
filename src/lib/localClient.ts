/**
 * Drop-in Supabase replacement.
 * All data operations go to the Express + SQLite backend at /api/db/:table
 * Auth session stored in sessionStorage (token only, no data).
 */

const API = "/api/db";

// --- Realtime SSE Bridge (Cross-tab sync) ---
type RealtimeCb = (payload: any) => void;
const _channels = new Map<string, RealtimeCb[]>();

// SSE is handled directly in AdminDashboard to avoid duplicate connections

function emit(table: string, event: string, row: any) {
  const payload = { eventType: event, new: row, old: {} };
  _channels.forEach((cbs) => cbs.forEach((cb) => cb(payload)));
}

class RealtimeChannel {
  private _key: string;
  constructor(key: string) { this._key = key; }
  on(_event: string, _filter: any, cb: RealtimeCb) {
    if (!_channels.has(this._key)) _channels.set(this._key, []);
    _channels.get(this._key)!.push(cb);
    return this;
  }
  subscribe() { return this; }
  unsubscribe() { 
    const cbs = _channels.get(this._key);
    if (cbs) _channels.set(this._key, []); // Clear local listeners
    return this; 
  }
}

// ─── Query Builder ────────────────────────────────────────────────────────────
type Op = "select" | "insert" | "update" | "delete";
interface Filter { col: string; val: any; }
interface QResult<T> { data: T | null; error: { message: string } | null; }

class QueryBuilder {
  private _table: string;
  private _op: Op = "select";
  private _filters: Filter[] = [];
  private _orderCol = "";
  private _orderAsc = true;
  private _writeData: any = null;
  private _wantSingle = false;
  private _wantMaybe  = false;
  private _returnRow  = false;

  constructor(table: string) { this._table = table; }

  select(_cols = "*") {
    if (this._op === "insert" || this._op === "update") this._returnRow = true;
    else this._op = "select";
    return this;
  }
  eq(col: string, val: any)                        { this._filters.push({ col, val }); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this._orderCol = col; this._orderAsc = opts?.ascending !== false; return this; }
  insert(data: any)  { this._op = "insert"; this._writeData = Array.isArray(data) ? data[0] : data; return this; }
  update(data: any)  { this._op = "update"; this._writeData = data; return this; }
  delete()           { this._op = "delete"; return this; }
  single()           { this._wantSingle = true; return this._exec(); }
  maybeSingle()      { this._wantMaybe  = true; return this._exec(); }
  then(resolve: (v: QResult<any>) => void, reject?: (e: any) => void) {
    this._exec().then(resolve, reject);
  }

  private _filterParams(): string {
    return this._filters.map(f => `${encodeURIComponent(f.col)}=${encodeURIComponent(f.val)}`).join("&");
  }

  private async _exec(): Promise<QResult<any>> {
    try {
      const table = this._table;

      // ── SELECT ──
      if (this._op === "select") {
        const params = new URLSearchParams();
        this._filters.forEach(f => params.set(f.col, String(f.val)));
        if (this._orderCol) { params.set("_order", this._orderCol); params.set("_asc", String(this._orderAsc)); }
        if (this._wantSingle || this._wantMaybe) params.set("_single", "1");
        const res = await fetch(`${API}/${table}?${params}`);
        const json = await res.json();
        return json;
      }

      // ── INSERT ──
      if (this._op === "insert") {
        const res = await fetch(`${API}/${table}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this._writeData),
        });
        const json = await res.json();
        if (!json.error) emit(table, "INSERT", json.data);
        if (this._wantSingle || this._wantMaybe || this._returnRow) return json;
        return { data: null, error: json.error };
      }

      // ── UPDATE ──
      if (this._op === "update") {
        const params = this._filterParams();
        const res = await fetch(`${API}/${table}?${params}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this._writeData),
        });
        const json = await res.json();
        if (!json.error) emit(table, "UPDATE", json.data);
        if (this._wantSingle || this._wantMaybe || this._returnRow) return json;
        return { data: null, error: json.error };
      }

      // ── DELETE ──
      if (this._op === "delete") {
        const params = this._filterParams();
        const res = await fetch(`${API}/${table}?${params}`, { method: "DELETE" });
        const json = await res.json();
        if (!json.error) emit(table, "DELETE", {});
        return json;
      }

      return { data: null, error: { message: "Unknown op" } };
    } catch (e: any) {
      console.error("[localClient] API error:", e);
      return { data: null, error: { message: e?.message ?? "Network error" } };
    }
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
const SESSION_KEY = "app_admin_session";

interface Session { user: { id: string; email: string }; access_token: string; }

function getSession(): Session | null {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
function setSession(s: Session | null) {
  if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else sessionStorage.removeItem(SESSION_KEY);
}

const auth = {
  async getSession() {
    const s = getSession();
    if (!s) return { data: { session: null }, error: null };
    try {
      const res = await fetch("/api/auth/session", { headers: { Authorization: `Bearer ${s.access_token}` } });
      const json = await res.json();
      if (json.data?.session) return { data: { session: s }, error: null };
    } catch {}
    setSession(null);
    return { data: { session: null }, error: null };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (json.data?.session) {
      setSession(json.data.session);
      return { data: { user: json.data.session.user, session: json.data.session }, error: null };
    }
    return { data: { user: null, session: null }, error: json.error };
  },

  async signOut() {
    const s = getSession();
    if (s) {
      await fetch("/api/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${s.access_token}` } });
    }
    setSession(null);
    return { error: null };
  },

  onAuthStateChange(_cb: any) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
};

// ─── Storage ──────────────────────────────────────────────────────────────────
const storage = {
  from(_bucket: string) {
    return {
      async upload(path: string, file: File, _opts?: any): Promise<{ error: any }> {
        const form = new FormData();
        form.append("file", file);
        form.append("path", path);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        return { error: null };
      },
      getPublicUrl(path: string) {
        // path is like "products/myfile.jpg" — map to /assets/products/myfile.jpg
        return { data: { publicUrl: `/assets/${path}` } };
      },
    };
  },
  async listBuckets() { return { data: [{ name: "uploads" }], error: null }; },
  async createBucket(_n: string, _o?: any) { return { data: null, error: null }; },
};

// ─── Main export ──────────────────────────────────────────────────────────────
export const supabase = {
  from(table: string) { return new QueryBuilder(table); },
  auth,
  storage,
  channel(key: string) { return new RealtimeChannel(key); },
  removeChannel(ch: RealtimeChannel) { ch.unsubscribe(); },
};
