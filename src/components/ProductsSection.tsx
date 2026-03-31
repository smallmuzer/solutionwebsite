import { useEffect, useRef, useState } from "react";
import AnimatedSection from "./AnimatedSection";
import { supabase } from "@/lib/localClient";
import { ShoppingCart, PlayCircle, Tag, CheckCircle2, XCircle, List, LayoutGrid,
  Database, Users, Anchor, Building2, Plane, Star } from "lucide-react";
import { useGlobalView, useCardStyle } from "./UICustomizer";

const PRODUCT_ICON_CONFIG: Record<string, { Icon: React.ElementType; bg: string }> = {
  BSOL:        { Icon: Database,  bg: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)" },
  "HR-Metrics":{ Icon: Users,     bg: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)" },
  GoBoat:      { Icon: Anchor,    bg: "linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)" },
  PromisePro:  { Icon: Building2, bg: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)" },
  Travel:      { Icon: Plane,     bg: "linear-gradient(135deg, #10b981 0%, #065f46 100%)" },
};

function getProductIcon(name: string) {
  return PRODUCT_ICON_CONFIG[name] ?? { Icon: ShoppingCart, bg: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)" };
}

interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  extra_text?: string;
  extra_color?: string;
  image_url: string;
  contact_url: string;
  is_popular: boolean;
  is_visible: boolean;
  sort_order: number;
}

interface SectionHeader {
  badge?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
}

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "1", name: "BSOL", tagline: "Integrated ERP & CRM Ecosystem",
    description: "BSOL seamlessly unifies your financial operations, inventory control, and customer relationships into a single dynamic platform. Empower your leadership with real-time, cross-departmental analytics and automated workflows for smarter, data-driven business maneuvers.",
    image_url: "/assets/products/bsol.jpg", contact_url: "#contact", is_popular: false, is_visible: true, sort_order: 0,
  },
  {
    id: "2", name: "HR-Metrics", tagline: "Modern Human Capital Hub",
    description: "Revolutionize your workforce management. HR-Metrics blends traditional HR processes—from payroll to performance reviews—with agile task boards, OKR tracking, and smart notifications. Drive team alignment and cultivate a culture of high performance.",
    image_url: "/assets/products/hr-metrics.jpg", contact_url: "#contact", is_popular: true, is_visible: true, sort_order: 1,
  },
  {
    id: "3", name: "GoBoat", tagline: "Connected Marine Operations",
    description: "The ultimate command center for the marine industry. GoBoat synchronizes your entire fleet, proactively linking vessel scheduling, maintenance logs, crew deployment, and charter bookings to ensure absolute compliance and seamless on-water experiences.",
    image_url: "/assets/products/goboat.jpg", contact_url: "#contact", is_popular: false, is_visible: true, sort_order: 2,
  },
  {
    id: "4", name: "PromisePro", tagline: "Unified Hospitality Management",
    description: "Transform your guest experience with an integrated property management core. PromisePro acts as the central nervous system for your resort, seamlessly connecting online reservations, housekeeping, and F&B into one frictionless, delightful guest journey.",
    image_url: "/assets/products/promisepro.jpg", contact_url: "#contact", is_popular: false, is_visible: true, sort_order: 3,
  },
  {
    id: "5", name: "Travel", tagline: "End-to-End Travel Ecosystem",
    description: "A comprehensive digital infrastructure for modern travel operators. Effortlessly orchestrate global flights, premium accommodations, visa processing, and multifaceted customer itineraries, delivering world-class travel experiences from a single, intuitive hub.",
    image_url: "/assets/products/travel.jpg", contact_url: "#contact", is_popular: false, is_visible: true, sort_order: 4,
  },
];

const DEFAULT_HEADER: SectionHeader = {
  badge: "Our Products", title: "Powerful Software", highlight: "Solutions",
  subtitle: "Purpose-built products that solve real business challenges — from ERP to resort management, each crafted for the industries we know best.",
};

const ProductCard = ({ product, onDemo, cardStyle }: { product: Product; onDemo: () => void; cardStyle: "icon" | "image" }) => {
  const [imgError, setImgError] = useState(false);
  const { Icon, bg } = getProductIcon(product.name);
  const badgeColor = product.extra_color || "#007600";

  return (
    <div
      className="relative flex-shrink-0 bg-white dark:bg-[#11111f] rounded-2xl overflow-hidden group cursor-pointer border border-border/50 hover:border-blue-500/30 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] transition-all duration-300 hover:-translate-y-2"
      style={{ width: 280 }}
    >
      {product.is_popular && (
        <div className={`absolute top-2 left-2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[0.6875rem] font-black text-white shadow-lg ${
          product.name === "HR-Metrics" 
            ? "bg-gradient-to-r from-pink-600 to-rose-700 ring-2 ring-white/30 animate-pulse scale-105" 
            : "bg-[#CC0C39]"
        }`}>
          {product.name === "HR-Metrics" && <Star size={10} fill="currentColor" className="animate-spin-slow" />}
          {product.name === "HR-Metrics" ? "MOST POPULAR HR" : "Best Seller"}
        </div>
      )}

      {cardStyle === "image" ? (
        <div className="relative bg-[#f7f8f8] dark:bg-[#0f0f1a] overflow-hidden" style={{ height: 200 }}>
          <img
            src={imgError ? "/assets/products/bsol.jpg" : product.image_url}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
        </div>
      ) : (
        <div className="relative overflow-hidden flex items-center justify-center" style={{ height: 90, background: bg }}>
          <Icon size={36} className="text-white/90" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
        </div>
      )}

      <div className="p-3.5 flex flex-col gap-2">
        <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-[#007185] dark:text-[#4db8c8]">
          {product.tagline}
        </span>
        <h3 className="font-bold text-[0.9375rem] leading-snug text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#C7511F] dark:group-hover:text-[#4db8c8] transition-colors">
          {product.name}
        </h3>
        <p className="text-[0.75rem] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
          {product.description}
        </p>
        {/* Feature Tags List - Vertical Layout */}
        <div className="flex flex-col gap-2 mt-1 border-t border-gray-100 dark:border-white/5 pt-3">
          {(product.extra_text ? product.extra_text.split(",") : ["15 Days Free Trial", "Cloud-based SaaS", "24/7 Support", "Custom Onboarding"]).map((feature, idx) => {
            const rawText = feature.trim();
            if (!rawText) return null;
            const isNegative = rawText.startsWith("!");
            const cleanText = isNegative ? rawText.substring(1).trim() : rawText;
            const fColors = product.extra_color ? product.extra_color.split(",").map(c => c.trim()) : ["#16a34a"];
            const fColor = isNegative ? "#ef4444" : (fColors[idx % fColors.length] || "#16a34a");
            
            return (
              <div key={idx} className="flex items-center gap-1.5 py-0.5 group/badge hover:scale-[1.02] transition-transform">
                {isNegative ? (
                  <XCircle size={13} style={{ color: fColor }} className="shrink-0" />
                ) : (
                  <CheckCircle2 size={13} style={{ color: fColor }} className="shrink-0" />
                )}
                <span style={{ color: fColor }} className="text-[0.6875rem] font-bold tracking-tight brightness-90 dark:brightness-125 uppercase">{cleanText}</span>
              </div>
            );
          })}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDemo(); }}
          className="mt-3 w-full py-2.5 rounded-xl text-[0.8125rem] font-bold text-white transition-all duration-300 hover:opacity-90 active:scale-95 shadow-md flex justify-center group-hover:bg-blue-600"
          style={{ background: bg }}
        >
          <span className="flex items-center justify-center gap-2">
            <PlayCircle size={15} /> Request Demo
          </span>
        </button>
      </div>
    </div>
  );
};

const ProductListRow = ({ product, onDemo, cardStyle }: { product: Product; onDemo: () => void; cardStyle: "icon" | "image" }) => {
  const [imgError, setImgError] = useState(false);
  const { Icon, bg } = getProductIcon(product.name);

  return (
    <div className="flex flex-col sm:flex-row gap-5 bg-white dark:bg-[#11111f] rounded-2xl border border-border/50 overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.25)] hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 group">
      {cardStyle === "image" ? (
        <div className="relative sm:w-48 shrink-0 bg-[#f7f8f8] dark:bg-[#0f0f1a] overflow-hidden" style={{ minHeight: 140 }}>
          <img
            src={imgError ? "/assets/products/bsol.jpg" : product.image_url}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="sm:w-24 shrink-0 flex items-center justify-center" style={{ background: bg, minHeight: 100 }}>
          <Icon size={32} className="text-white/90" />
        </div>
      )}

      <div className="flex-1 p-4 flex flex-col gap-2">
        {product.is_popular && (
          <span className={`self-start text-[0.625rem] font-bold text-white px-2 py-0.5 rounded-sm ${
            product.name === "HR-Metrics" 
              ? "bg-gradient-to-r from-pink-600 to-rose-700 ring-2 ring-white/30 animate-pulse" 
              : "bg-[#CC0C39]"
          }`}>
            {product.name === "HR-Metrics" ? "MOST POPULAR HR" : "Best Seller"}
          </span>
        )}
        <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-[#007185] dark:text-[#4db8c8]">
          {product.tagline}
        </span>
        <h3 className="font-bold text-[1.0625rem] text-gray-900 dark:text-white group-hover:text-[#C7511F] dark:group-hover:text-[#4db8c8] transition-colors">
          {product.name}
        </h3>
        <p className="text-[0.8125rem] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
          {product.description}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-auto pt-2">
          {/* Feature Tags List - Vertical Layout */}
          <div className="flex flex-col gap-2 mb-4 w-full">
            {(product.extra_text ? product.extra_text.split(",") : ["15 Days Free Trial", "Cloud-based SaaS", "24/7 Support", "Custom Onboarding"]).map((feature, idx) => {
              const rawText = feature.trim();
              if (!rawText) return null;
              const isNegative = rawText.startsWith("!");
              const cleanText = isNegative ? rawText.substring(1).trim() : rawText;
              const fColors = product.extra_color ? product.extra_color.split(",").map(c => c.trim()) : ["#16a34a"];
              const fColor = isNegative ? "#ef4444" : (fColors[idx % fColors.length] || "#16a34a");
              
              return (
                <div key={idx} className="flex items-center gap-2 py-0.5 w-full max-w-sm">
                  {isNegative ? (
                    <XCircle size={14} style={{ color: fColor }} className="shrink-0" />
                  ) : (
                    <CheckCircle2 size={14} style={{ color: fColor }} className="shrink-0" />
                  )}
                  <span style={{ color: fColor }} className="text-[0.75rem] font-black tracking-widest uppercase brightness-90 dark:brightness-125">{cleanText}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDemo(); }}
            className="py-2.5 px-5 rounded-xl text-[0.8125rem] font-bold text-white transition-all duration-300 hover:opacity-90 active:scale-95 shadow-md flex items-center group-hover:bg-blue-600"
            style={{ background: bg }}
          >
            <span className="flex items-center gap-2">
              <PlayCircle size={15} /> Request Demo
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductsSection = () => {
  const globalView = useGlobalView();
  const cardStyle = useCardStyle();
  const [products, setProducts] = useState<Product[]>([]);
  const [header, setHeader] = useState<SectionHeader>(DEFAULT_HEADER);
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);
  const SPEED = 0.45;
  const GAP = 24;
  const CARD_W = 280;

  useEffect(() => {
    const load = async () => {
      const [contentRes, prodRes] = await Promise.all([
        supabase.from("site_content").select("content").eq("section_key", "our_products").maybeSingle(),
        supabase.from("products").select("*").eq("is_visible", true).order("sort_order"),
      ]);
      // Load section header from site_content
      if (contentRes.data?.content) {
        const c = contentRes.data.content as any;
        if (c.header) setHeader({ ...DEFAULT_HEADER, ...c.header });
      }
      // Always use products table as source of truth
      if (prodRes.data && prodRes.data.length > 0) {
        setProducts(prodRes.data);
      } else {
        setProducts(FALLBACK_PRODUCTS.filter((p) => p.is_visible));
      }
    };
    load();
    const ch = supabase.channel("products_section")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_content" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (globalView !== "grid" || products.length === 0) return;
    const el = trackRef.current;
    if (!el) return;
    const itemW = CARD_W + GAP;
    const totalW = products.length * itemW;
    const animate = () => {
      if (!pausedRef.current) {
        posRef.current += SPEED;
        if (posRef.current >= totalW) posRef.current -= totalW;
        if (el) el.style.transform = `translateX(-${posRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [products, globalView]);

  const scrollToContact = () => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });

  if (products.length === 0) return null;

  const tripled = [...products, ...products, ...products];

  return (
    <section id="products" className="section-padding relative overflow-hidden bg-[#EAEDED] dark:bg-[#0d0d1a]">
      <div className="container-wide relative z-10">
        <AnimatedSection className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-3">
            <ShoppingCart size={18} className="text-secondary" />
            <span className="text-secondary font-bold text-sm uppercase tracking-widest">
              {header.badge || DEFAULT_HEADER.badge}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mt-1 mb-4">
            {header.title || DEFAULT_HEADER.title}{" "}
            <span className="gradient-text">{header.highlight || DEFAULT_HEADER.highlight}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-[0.9375rem]">
            {header.subtitle || DEFAULT_HEADER.subtitle}
          </p>
        </AnimatedSection>

        <div className="flex items-center justify-end gap-2 mb-4">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {globalView === "grid" ? <><LayoutGrid size={13} /> Carousel View</> : <><List size={13} /> List View</>}
          </span>
        </div>

        {globalView === "grid" ? (
          <div
            className="relative overflow-hidden"
            style={{ maskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)" }}
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
          >
            <div ref={trackRef} className="flex" style={{ gap: GAP, willChange: "transform", paddingBottom: 12, paddingTop: 4 }}>
              {tripled.map((product, i) => (
                <ProductCard key={`${product.id}-${i}`} product={product} onDemo={scrollToContact} cardStyle={cardStyle} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {products.map((product) => (
              <AnimatedSection key={product.id}>
                <ProductListRow product={product} onDemo={scrollToContact} cardStyle={cardStyle} />
              </AnimatedSection>
            ))}
          </div>
        )}

        <AnimatedSection className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            {globalView === "grid" && "Hover over any product to pause · "}
            <button onClick={scrollToContact} className="text-secondary underline underline-offset-2 hover:opacity-80">
              Contact us
            </button>{" "}
            for a personalised demo
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ProductsSection;
