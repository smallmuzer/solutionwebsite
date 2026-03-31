import { useEffect, useState, useRef, useCallback } from "react";
import AnimatedSection from "./AnimatedSection";
import { supabase } from "@/lib/localClient";
import type { Tables } from "@/integrations/supabase/types";

// ── Real client logos ─────────────────────────────────────────────────────────
const SEED_CLIENTS = [
  { id: "cl-oblu",  name: "OBLU Resorts",              logo_url: "/assets/clients/OBLU-1-1-300x142.jpeg",          is_visible: true, sort_order: 1 },
  { id: "cl-ozen",  name: "OZEN Life",                 logo_url: "/assets/clients/Ozen-1-300x156.png",             is_visible: true, sort_order: 2 },
  { id: "cl-youme", name: "You & Me Maldives",         logo_url: "/assets/clients/You-Me-Maldives-300x258.png",    is_visible: true, sort_order: 3 },
  { id: "cl-cocoon",name: "Cocoon Maldives",           logo_url: "/assets/clients/Cocoon-300x140.jpg",             is_visible: true, sort_order: 4 },
  { id: "cl-fushi", name: "Fushifaru",                 logo_url: "/assets/clients/Fushifaru.png",                  is_visible: true, sort_order: 5 },
  { id: "cl-fun",   name: "Fun Island",                logo_url: "/assets/clients/Fun-Island.png",                 is_visible: true, sort_order: 6 },
  { id: "cl-hdfc",  name: "HDFC Bank",                 logo_url: "/assets/clients/HDFC.png",                       is_visible: true, sort_order: 7 },
  { id: "cl-mse",   name: "Maldives Stock Exchange",   logo_url: "/assets/clients/Maldives-Stock-Exchange-300x67.jpg", is_visible: true, sort_order: 8 },
  { id: "cl-villa", name: "Villa Group",               logo_url: "/assets/clients/Villagrouplogo-1-300x290.png",   is_visible: true, sort_order: 9 },
  { id: "cl-alia",  name: "Alia",                      logo_url: "/assets/clients/Alia.png",                       is_visible: true, sort_order: 10 },
  { id: "cl-mifco", name: "Mifco",                     logo_url: "/assets/clients/Mifco.png",                      is_visible: true, sort_order: 11 },
  { id: "cl-media", name: "Medianet",                  logo_url: "/assets/clients/Medianet.png",                   is_visible: true, sort_order: 12 },
  { id: "cl-ecm",   name: "ECM",                       logo_url: "/assets/clients/ECM.png",                        is_visible: true, sort_order: 13 },
  { id: "cl-rcsc",  name: "RCSC Bhutan",               logo_url: "/assets/clients/RCSC-Bhutan.png",                is_visible: true, sort_order: 14 },
  { id: "cl-fsm",   name: "FSM",                       logo_url: "/assets/clients/FSM-1-300x181.png",              is_visible: true, sort_order: 15 },
  { id: "cl-flyme", name: "Flyme",                     logo_url: "/assets/clients/Flyme-1-300x104.png",            is_visible: true, sort_order: 16 },
  { id: "cl-ibev",  name: "Island Beverages",          logo_url: "/assets/clients/Island-Beverages.png",           is_visible: true, sort_order: 17 },
  { id: "cl-hm",    name: "Happy Market",              logo_url: "/assets/clients/Happy-Market.png",               is_visible: true, sort_order: 18 },
];

type ClientLogo = Tables<"client_logos">;

// ── Globe: auto-compute slots for any number of clients ──────────────────────
function buildGlobeSlots(count: number) {
  const slots: { cx: number; cy: number }[] = [];
  if (count === 0) return slots;
  // Distribute evenly across 2 rings
  const ring1 = Math.ceil(count / 2);
  const ring2 = count - ring1;
  const r1 = 34, r2 = 20;
  for (let i = 0; i < ring1; i++) {
    const a = ((i * 360) / ring1 - 90) * (Math.PI / 180);
    slots.push({ cx: 50 + r1 * Math.cos(a), cy: 50 + r1 * Math.sin(a) });
  }
  for (let i = 0; i < ring2; i++) {
    const a = ((i * 360) / ring2 - 67.5) * (Math.PI / 180);
    slots.push({ cx: 50 + r2 * Math.cos(a), cy: 50 + r2 * Math.sin(a) });
  }
  return slots;
}

// ── Animated Globe ────────────────────────────────────────────────────────────
const StaticGlobe = ({ clients }: { clients: ClientLogo[] }) => {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const fgRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const zoomRef = useRef(1);
  const targetZoomRef = useRef(1);
  const zoomRafRef = useRef<number>(0);
  const [zoom, setZoom] = useState(1);
  const SIZE = 500;
  const MAX_GLOBE_CLIENTS = 20;
  const globeClients = clients.slice(0, MAX_GLOBE_CLIENTS);
  const slots = buildGlobeSlots(globeClients.length);

  // ── Scroll-based zoom: scroll up = zoom in, scroll down = zoom out ──
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault(); // prevent page scroll while over globe
    const delta = e.deltaY > 0 ? -0.12 : 0.12; // snappier scroll
    targetZoomRef.current = Math.max(0.5, Math.min(2.5, targetZoomRef.current + delta));
  }, []);

  const handleMouseLeave = useCallback(() => {
    targetZoomRef.current = 1; // reset to normal on leave
  }, []);

  // Smooth zoom lerp loop
  useEffect(() => {
    let running = true;
    const animateZoom = () => {
      if (!running) return;
      const diff = targetZoomRef.current - zoomRef.current;
      zoomRef.current += diff * 0.20; // more responsive (0.12 -> 0.20)
      if (Math.abs(diff) > 0.001) setZoom(zoomRef.current);
      zoomRafRef.current = requestAnimationFrame(animateZoom);
    };
    animateZoom();
    return () => { running = false; cancelAnimationFrame(zoomRafRef.current); };
  }, []);

  // Attach wheel listener (passive: false to allow preventDefault)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleWheel, handleMouseLeave]);

  useEffect(() => {
    const bg = bgRef.current, fg = fgRef.current;
    if (!bg || !fg) return;
    const bgCtx = bg.getContext("2d"), fgCtx = fg.getContext("2d");
    if (!bgCtx || !fgCtx) return;
    const cx = SIZE / 2, cy = SIZE / 2, R = SIZE * 0.43;
    let offset = 0;

    const runDraw = () => {
      cancelAnimationFrame(rafRef.current);
      const dark = document.documentElement.classList.contains("dark");
      const lineC = dark ? "rgba(96,165,250,0.65)" : "rgba(59,130,246,0.22)";
      const longC = dark ? "rgba(96,165,250,0.60)" : "rgba(59,130,246,0.18)";
      const borderC = dark ? "rgba(96,165,250,0.85)" : "rgba(59,130,246,0.28)";
      const ringC = dark ? "rgba(147,197,253,0.65)" : "rgba(59,130,246,0.20)";

      bgCtx.clearRect(0, 0, SIZE, SIZE);
      bgCtx.lineWidth = 0.6; bgCtx.strokeStyle = lineC;
      for (let lat = -75; lat <= 75; lat += 25) {
        const y = cy + R * Math.sin((lat * Math.PI) / 180);
        const r = R * Math.cos((lat * Math.PI) / 180);
        bgCtx.beginPath(); bgCtx.ellipse(cx, y, r, r * 0.16, 0, 0, Math.PI * 2); bgCtx.stroke();
      }
      bgCtx.beginPath(); bgCtx.arc(cx, cy, R, 0, Math.PI * 2);
      bgCtx.strokeStyle = borderC; bgCtx.lineWidth = 1.5; bgCtx.stroke();
      bgCtx.beginPath(); bgCtx.arc(cx, cy, R * 0.30, 0, Math.PI * 2);
      bgCtx.strokeStyle = ringC; bgCtx.lineWidth = 1; bgCtx.stroke();

      const draw = () => {
        fgCtx.clearRect(0, 0, SIZE, SIZE);
        fgCtx.lineWidth = 0.8; fgCtx.strokeStyle = longC;
        fgCtx.save();
        fgCtx.beginPath(); fgCtx.arc(cx, cy, R - 0.5, 0, Math.PI * 2); fgCtx.clip();
        for (let i = 0; i < 6; i++) {
          const a = offset + (i * Math.PI) / 6;
          const rx = R * Math.abs(Math.cos(a));
          fgCtx.beginPath(); fgCtx.ellipse(cx, cy, rx, R, 0, 0, Math.PI * 2); fgCtx.stroke();
        }
        fgCtx.restore();
        offset += 0.003;
        rafRef.current = requestAnimationFrame(draw);
      };
      rafRef.current = requestAnimationFrame(draw);
    };

    runDraw();
    const obs = new MutationObserver(runDraw);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => { cancelAnimationFrame(rafRef.current); obs.disconnect(); };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative select-none group"
      style={{
        width: SIZE, height: SIZE, maxWidth: "min(500px, 90vw)",
        position: "relative", zIndex: 1,
        transform: `scale(${zoom})`,
      }}
    >
      {/* World map inside globe — continuously scrolling, fully filled */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden pointer-events-none opacity-20 dark:opacity-40"
        style={{ width: SIZE * 0.86, height: SIZE * 0.86 }}>
        <div className="globe-map-scroll" style={{
          display: "flex", width: "300%", height: "100%",
          animation: "globeMapScroll 60s linear infinite",
        }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg" alt="" style={{ width: "33.333%", height: "100%", objectFit: "cover", flexShrink: 0, filter: "invert(0.5) sepia(1) hue-rotate(180deg) saturate(3)" }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg" alt="" style={{ width: "33.333%", height: "100%", objectFit: "cover", flexShrink: 0, filter: "invert(0.5) sepia(1) hue-rotate(180deg) saturate(3)" }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg" alt="" style={{ width: "33.333%", height: "100%", objectFit: "cover", flexShrink: 0, filter: "invert(0.5) sepia(1) hue-rotate(180deg) saturate(3)" }} />
        </div>
      </div>

      <canvas ref={bgRef} width={SIZE} height={SIZE} className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105" />
      <canvas ref={fgRef} width={SIZE} height={SIZE} className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105" />

      {/* Center CTA */}
      <button
        onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute z-20 flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-110"
        style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: SIZE * 0.30 * 2, height: SIZE * 0.30 * 2, borderRadius: "50%", background: "transparent", cursor: "pointer", border: "none", gap: 2 }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", color: "hsl(var(--secondary))", lineHeight: 1, opacity: 0.85 }}>JOIN</span>
        <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.06em", color: "hsl(var(--secondary))", textShadow: "0 0 12px hsl(var(--secondary)/0.6)", lineHeight: 1.1 }}>Here</span>
        <span className="blink-hint" style={{ fontSize: 9, fontWeight: 700, color: "hsl(var(--secondary))", marginTop: 4, letterSpacing: "0.1em", opacity: 0.9 }}>↓ Get in touch</span>
      </button>

      {/* Client cards — auto-positioned by computed slots */}
      {globeClients.map((client, i) => {
        const slot = slots[i];
        if (!slot) return null;
        return (
          <div key={client.id} className="absolute z-10 transition-transform duration-300 pointer-events-auto hover:z-30 hover:scale-[1.2] cursor-default"
            style={{ left: `${slot.cx}%`, top: `${slot.cy}%`, transform: "translate(-50%,-50%)" }}>
            <div className="flex flex-col items-center justify-center gap-0.5 rounded-lg border border-white/20 dark:border-white/10 backdrop-blur-sm transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_rgba(59,130,246,0.3)] bg-white/80 dark:bg-card/85"
              style={{ width: 56, height: 46, padding: "4px 3px" }}>
              <div className="w-8 h-5 flex items-center justify-center">
                <img src={client.logo_url} alt={client.name}
                  className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal" loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              </div>
              <span className="text-[0.375rem] text-foreground text-center font-bold leading-tight line-clamp-1 w-full px-0.5">{client.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Side scrolling grid ───────────────────────────────────────────────────────
const COLS = 2, GAP = 20, CARD_W = 82, CARD_H = 68;
const GRID_W = COLS * CARD_W + (COLS - 1) * GAP;
const VISIBLE_H = 500, SPEED_PX = 0.8;

const ClientCard = ({ client }: { client: ClientLogo }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-white/40 dark:border-white/10 backdrop-blur-sm bg-white/70 dark:bg-card/85 shadow-md transition-all duration-300 hover:scale-110 hover:shadow-xl hover:z-10 group"
    style={{ width: CARD_W, height: CARD_H, padding: "6px 5px", gap: 4 }}>
    <div style={{ width: CARD_W - 14, height: 36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <img src={client.logo_url} alt={client.name}
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
        className="mix-blend-multiply dark:mix-blend-normal transition-transform duration-300 group-hover:scale-110"
        loading="lazy"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
    </div>
    <span style={{ fontSize: 9, lineHeight: 1.3, textAlign: "center", fontWeight: 700, color: "hsl(var(--foreground))", width: "100%", padding: "0 3px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
      {client.name}
    </span>
  </div>
);

const GridSlideshow = ({ clients, startOffset = 0, reverse = false }: { clients: ClientLogo[]; startOffset?: number; reverse?: boolean }) => {
  const total = clients.length;
  const stripRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef<number>(0);
  const ordered = total === 0 ? [] : Array.from({ length: total }, (_, k) => clients[(startOffset + k) % total]);
  const doubled = [...ordered, ...ordered, ...ordered];
  const colCards = Math.ceil(total / COLS);
  const stripH = colCards * (CARD_H + GAP);

  useEffect(() => {
    if (total === 0) return;
    const el = stripRef.current;
    if (!el) return;
    if (reverse) posRef.current = stripH;
    const animate = () => {
      if (reverse) {
        posRef.current -= SPEED_PX;
        if (posRef.current <= 0) posRef.current += stripH;
      } else {
        posRef.current += SPEED_PX;
        if (posRef.current >= stripH) posRef.current -= stripH;
      }
      el.style.transform = `translateY(-${posRef.current}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [total, stripH, reverse]);

  if (total === 0) return null;
  return (
    <div style={{ width: GRID_W, height: VISIBLE_H, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 48, zIndex: 2, pointerEvents: "none", background: "linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, zIndex: 2, pointerEvents: "none", background: "linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)" }} />
      <div ref={stripRef} style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, ${CARD_W}px)`, gap: GAP, width: GRID_W }}>
        {doubled.map((client, k) => <ClientCard key={`${client.id}-${k}`} client={client} />)}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const ClientsSection = () => {
  const [clients, setClients] = useState<ClientLogo[]>([]);
  const [header, setHeader] = useState({
    badge: "Our Clients", title: "Trusted by", highlight: "Industry Leaders",
    description: "We're proud to have served over 300+ successful projects for leading companies across the Maldives and beyond.",
  });

  useEffect(() => {
    const load = async () => {
      const [clientsRes, contentRes] = await Promise.all([
        supabase.from("client_logos").select("*").eq("is_visible", true).order("sort_order"),
        supabase.from("site_content").select("content").eq("section_key", "clients").maybeSingle(),
      ]);
      // Use DB clients if any exist, otherwise use seed data
      const dbClients = clientsRes.data || [];
      setClients(dbClients.length > 0 ? dbClients : (SEED_CLIENTS as ClientLogo[]));
      if (contentRes.data?.content) {
        const c = contentRes.data.content as any;
        setHeader(h => ({ ...h, ...c }));
      }
    };
    load();
    const ch = supabase.channel("clients_section_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_logos" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "site_content" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <section id="portfolio" className="section-padding overflow-hidden">
      <div className="container-wide">
        <AnimatedSection className="text-center mb-14">
          <span className="text-secondary font-semibold text-sm uppercase tracking-widest">{header.badge}</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mt-3 mb-4">
            {header.title} <span className="gradient-text">{header.highlight}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-[0.9375rem]">{header.description}</p>
        </AnimatedSection>

        <AnimatedSection>
          {/* Desktop: side grids + globe */}
          <div className="hidden sm:flex items-center justify-center" style={{ gap: 12, overflow: "hidden" }}>
            <div style={{ position: "relative", zIndex: 0, flexShrink: 0 }}>
              <GridSlideshow clients={clients} startOffset={0} reverse={false} />
            </div>
            <div style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
              <StaticGlobe clients={clients} />
            </div>
            <div style={{ position: "relative", zIndex: 0, flexShrink: 0 }}>
              <GridSlideshow clients={clients} startOffset={Math.floor(clients.length / 2)} reverse={true} />
            </div>
          </div>


          {/* Mobile: globe + grid */}
          <div className="flex sm:hidden flex-col items-center gap-6">
            <StaticGlobe clients={clients} />
            <GridSlideshow clients={clients} startOffset={0} />
          </div>

          <p className="text-xs text-muted-foreground mt-5 text-center">
            {clients.length} clients across Maldives, Bhutan &amp; beyond
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ClientsSection;
