import { ArrowRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";

function useCountUp(end: number, duration: number, start: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, end, duration]);
  return count;
}

const HeroSection = () => {
  const content = useSiteContent("hero");
  const settings = useSiteContent("settings");
  const rawImages = (content as any)?.images || (content as any)?.hero_images || (settings as any)?.hero_images || [];
  const backgrounds = Array.isArray(rawImages)
    ? rawImages
    : typeof rawImages === "string" ? rawImages.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
  // hero_image from DB takes priority as first slide
  const heroImg = (content as any)?.hero_image || (settings as any)?.hero_image;
  const MALDIVES_IMAGES = (() => {
    const imgs = backgrounds.length ? backgrounds : [
      "/assets/hero_3d_glassy.png",
      "/assets/hero/bg.jpg"

    ];
    // Prepend hero_image if set and not already first
    if (heroImg && heroImg.trim() && imgs[0] !== heroImg.trim()) {
      return [heroImg.trim(), ...imgs];
    }
    return imgs.slice(0, 3);
  })();
  const [isDark, setIsDark] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const scrollTo = (id: string) => document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBgIndex(i => (i + 1) % MALDIVES_IMAGES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const statsRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const projects = useCountUp(300, 2000, inView);
  const clients = useCountUp(50, 1800, inView);
  const satisfaction = useCountUp(100, 1600, inView);

  return (
    <section id="home" className="relative flex items-center overflow-hidden" style={{ minHeight: "100vh" }}>
      {/* Background images — CSS-only parallax, no JS animation loop */}
      <div className="absolute inset-0">
        {MALDIVES_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover hero-parallax"
            style={{
              opacity: i === bgIndex ? 1 : 0,
              transition: "opacity 0.8s ease-in-out",
            }}
          />
        ))}
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? "linear-gradient(135deg, hsl(220 40% 6% / 0.88) 0%, hsl(220 35% 12% / 0.78) 50%, hsl(217 40% 18% / 0.65) 100%)"
              : "linear-gradient(135deg, hsl(220 60% 12% / 0.72) 0%, hsl(220 50% 22% / 0.60) 50%, hsl(217 60% 30% / 0.45) 100%)",
          }}
        />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)" }} />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(217 91% 60% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(217 91% 60% / 0.4) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container-wide relative z-10 px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm mb-6 hero-fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-white/90 text-sm font-medium">Maldives' Leading IT Solutions Partner</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold text-white leading-tight mb-6 drop-shadow-lg hero-fade-in" style={{ animationDelay: "0.2s" }}>
            {content.title?.includes("Maldives") ? (
              <>
                {content.title.split("Maldives")[0]}
                <span className="gradient-text">Maldives</span>
              </>
            ) : (
              <span>{content.title || "Transforming Business Across Maldives"}</span>
            )}
          </h1>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mb-10 leading-relaxed drop-shadow hero-fade-in" style={{ animationDelay: "0.35s" }}>
            {content.subtitle || "Enterprise software, ERP, and digital transformation solutions for the hospitality, finance, and government sectors."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 hero-fade-in" style={{ animationDelay: "0.5s" }}>
            <button
              onClick={() => scrollTo("#contact")}
              className="group inline-flex items-center justify-center gap-2 px-7 py-3 bg-secondary text-secondary-foreground font-semibold text-sm rounded-xl hover:opacity-90 transition-opacity glow-effect shadow-lg"
            >
              {content.cta_text || "Get Started"}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => scrollTo("#services")}
              className="inline-flex items-center justify-center px-7 py-3 border border-white/30 text-white font-semibold text-sm rounded-xl hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              Our Services
            </button>
          </div>
        </div>

        {/* Stats */}
        <div ref={statsRef} className="mt-20 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl hero-fade-in" style={{ animationDelay: "0.7s" }}>
          {[
            { value: projects, suffix: "+", label: "Projects Completed" },
            { value: clients, suffix: "+", label: "Happy Clients" },
            { value: satisfaction, suffix: "%", label: "Client Satisfaction" },
          ].map(stat => (
            <div key={stat.label} className="backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/15 bg-white/5">
              <div className="text-3xl sm:text-4xl font-heading font-bold gradient-text">{stat.value}{stat.suffix}</div>
              <div className="text-white/60 text-xs sm:text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator — CSS animation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
          <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
        </div>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-8 right-8 flex gap-1.5">
        {MALDIVES_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setBgIndex(i)}
            className={`rounded-full transition-all duration-300 ${i === bgIndex ? "w-5 h-1.5 bg-secondary" : "w-1.5 h-1.5 bg-white/30"}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
