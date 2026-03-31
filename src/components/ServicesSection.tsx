import { useEffect, useState } from "react";
import AnimatedSection from "./AnimatedSection";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/lib/localClient";
import { ArrowUpRight, ArrowRight, Monitor, Globe, Smartphone, Database, Users, BarChart2, Search, Megaphone, Palette as PaletteIcon, Briefcase, Cloud, Shield, Code } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useGlobalView, useCardStyle } from "./UICustomizer";

type Service = Tables<"services">;

// Keyword → fallback image + gradient
const SERVICE_THEMES: Record<string, { img: string; accent: string }> = {
  default:    { img: "/assets/services/software.png", accent: "from-blue-700/70 to-indigo-900/85" },
  software:   { img: "/assets/services/software.png", accent: "from-violet-700/70 to-purple-900/85" },
  web:        { img: "/assets/services/web.png",      accent: "from-cyan-700/70 to-blue-900/85" },
  mobile:     { img: "/assets/services/mobile.png",   accent: "from-emerald-700/70 to-teal-900/85" },
  erp:        { img: "/assets/services/erp.png",      accent: "from-orange-700/70 to-red-900/85" },
  hr:         { img: "/assets/services/hr.png",       accent: "from-pink-700/70 to-rose-900/85" },
  consulting: { img: "/assets/services/consulting.png", accent: "from-amber-700/70 to-yellow-900/85" },
  seo:        { img: "/assets/services/seo.png",      accent: "from-lime-700/70 to-green-900/85" },
  marketing:  { img: "/assets/services/seo.png",      accent: "from-fuchsia-700/70 to-purple-900/85" },
  design:     { img: "/assets/services/design.png",   accent: "from-sky-700/70 to-blue-900/85" },
  cloud:      { img: "/assets/services/software.png", accent: "from-indigo-700/70 to-blue-900/85" },
};

// Icon name → component map (used when admin sets icon field)
const ICON_MAP: Record<string, React.ElementType> = {
  Monitor, Globe, Smartphone, Database, Users, BarChart2, Search,
  Megaphone, PaletteIcon, Briefcase, Cloud, Shield, Code,
};

function getTheme(service: Service) {
  const t = service.title.toLowerCase();
  let theme = SERVICE_THEMES.default;
  for (const key of Object.keys(SERVICE_THEMES)) {
    if (key !== "default" && t.includes(key)) { theme = SERVICE_THEMES[key]; break; }
  }
  // DB image_url takes priority over keyword-matched fallback
  return {
    img: (service.image_url && service.image_url.trim()) ? service.image_url.trim() : theme.img,
    accent: (service.accent_color && service.accent_color.trim()) ? service.accent_color.trim() : theme.accent,
  };
}

function getIcon(service: Service): React.ElementType {
  // Admin can set icon field to a Lucide icon name
  if (service.icon && ICON_MAP[service.icon]) return ICON_MAP[service.icon];
  const t = service.title.toLowerCase();
  if (t.includes("web"))        return Globe;
  if (t.includes("mobile"))     return Smartphone;
  if (t.includes("erp"))        return Database;
  if (t.includes("hr"))         return Users;
  if (t.includes("consulting")) return Briefcase;
  if (t.includes("seo") || t.includes("marketing")) return Search;
  if (t.includes("design"))     return PaletteIcon;
  if (t.includes("cloud"))      return Cloud;
  if (t.includes("security"))   return Shield;
  return Monitor;
}

const ServicesSection = () => {
  const cardStyle = useCardStyle();
  const view      = useGlobalView();
  const [services, setServices] = useState<Service[]>([]);
  const content   = useSiteContent("services");
  const scrollTo  = () => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("services").select("*").eq("is_visible", true).order("sort_order");
      if (data && data.length > 0) setServices(data);
    };
    load();
    const ch = supabase.channel("services_section_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "site_content" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (services.length === 0) return null;

  return (
    <section id="services" className="section-padding section-alt relative overflow-hidden">
      <div className="container-wide relative z-10">
        <AnimatedSection className="text-center mb-8">
          <span className="text-secondary font-semibold text-sm uppercase tracking-widest">Our Services</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mt-3 mb-4">
            {content.title?.includes("&") ? (
              <>{content.title.split("&")[0]}&{" "}<span className="gradient-text">{content.title.split("& ")[1]}</span></>
            ) : (
              content.title || <><span className="gradient-text">Solutions</span> We Deliver</>
            )}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-[0.9375rem]">{content.subtitle}</p>
        </AnimatedSection>

        {view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map((service, i) => {
              const theme = getTheme(service);
              const Icon  = getIcon(service);
              const useImg = cardStyle === "image";
              return (
                <AnimatedSection key={service.id} delay={i * 0.05}>
                  <div
                    className="glass-card relative rounded-xl overflow-hidden group cursor-pointer"
                    style={{ height: "clamp(130px, 18vw, 160px)" }}
                    onClick={scrollTo}
                  >
                    {useImg && (
                      <img
                        src={theme.img}
                        alt={service.title}
                        key={theme.img}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/services/software.png"; }}
                      />
                    )}
                    {useImg && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} transition-opacity duration-300 opacity-70 group-hover:opacity-95`} />
                    )}
                    <div className="relative z-10 p-4 h-full flex flex-col justify-end">
                      {!useImg && <Icon size={24} className="text-secondary mb-2" />}
                      <h3 className={`font-heading font-bold text-[0.9375rem] mb-1 leading-snug drop-shadow ${useImg ? "text-white" : "text-foreground"}`}>
                        {service.title}
                      </h3>
                      <p className={`text-[0.8125rem] leading-relaxed line-clamp-2 drop-shadow ${useImg ? "text-white/80" : "text-muted-foreground"}`}>
                        {service.description}
                      </p>
                    </div>
                    <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                      <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <ArrowUpRight size={14} className="text-white" />
                      </div>
                    </div>
                    {useImg && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 55%)" }} />
                    )}
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-3xl mx-auto w-full">
            {services.map((service, i) => {
              const theme = getTheme(service);
              const Icon  = getIcon(service);
              const useImg = cardStyle === "image";
              return (
                <AnimatedSection key={service.id} delay={i * 0.03}>
                  <div
                    className="glass-card flex items-center gap-4 p-4 group hover:glow-effect transition-all duration-300 cursor-pointer relative overflow-hidden"
                    onClick={scrollTo}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary/[0.03] to-transparent group-hover:from-secondary/[0.07] transition-all pointer-events-none rounded-xl" />
                    <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-border/40 flex items-center justify-center">
                      {useImg ? (
                        <>
                          <img
                            src={theme.img}
                            alt={service.title}
                            key={theme.img}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/services/software.png"; }}
                          />
                          <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} opacity-70`} />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "hsl(var(--card))" }}>
                          <Icon size={22} className="text-secondary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <h3 className="font-heading font-bold text-foreground text-[0.9375rem] leading-snug">{service.title}</h3>
                      <p className="text-muted-foreground text-[0.8125rem] mt-0.5 line-clamp-1">{service.description}</p>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all shrink-0 relative z-10" />
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;
