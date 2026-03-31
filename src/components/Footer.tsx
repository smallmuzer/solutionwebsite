import React from "react";
import { Facebook, Twitter, Linkedin, Instagram, ExternalLink, Globe, PhoneCall } from "lucide-react";
import { openViber, ViberIcon, VIBER_COLOR } from "@/lib/viber";
import { useSiteContent, useNetworkCompanies } from "@/hooks/useSiteContent";
import { supabase } from "@/lib/localClient";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

const Footer = () => {
  const content = useSiteContent("footer");
  const contact = useSiteContent("contact");
  const associated = useNetworkCompanies();
  const [logoPath, setLogoPath] = useState<string>("");
  const [siteName, setSiteName] = useState("Systems Solutions");

  useEffect(() => {
    supabase.from("site_content").select("content").eq("section_key", "settings").maybeSingle()
      .then(({ data }) => {
        if (data?.content) {
          const c = data.content as any;
          if (c.site_logo) setLogoPath(c.site_logo);
          if (c.site_name) setSiteName(c.site_name);
        }
      });
  }, []);

  const socials = [
    { Icon: Facebook,   href: content.facebook  || "https://www.facebook.com/brilliantsystemssolutions/" },
    { Icon: Twitter,    href: content.twitter   || "https://x.com/bsspl_india" },
    { Icon: Linkedin,   href: content.linkedin  || "https://in.linkedin.com/company/brilliantsystemssolutions" },
    { Icon: Instagram,  href: content.instagram || "https://www.instagram.com/brilliantsystemssolutions" },
    { Icon: ViberIcon,  onClick: () => openViber(), color: VIBER_COLOR },
  ];

  return (
    <footer>
      {/* Associated Companies */}
      <div className="border-b border-border/50">
        <div className="container-wide px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center mb-10">
            <span className="text-secondary font-semibold text-sm uppercase tracking-widest">Our Network</span>
            <h3 className="font-heading font-bold text-2xl mt-2 text-foreground">Associated Companies</h3>
            <p className="text-sm mt-2 max-w-md mx-auto text-muted-foreground">
              Part of a growing family of technology companies across South Asia.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-0 w-full max-w-4xl mx-auto">
            {associated.map((co, idx) => (
              <React.Fragment key={co.id || co.name}>
                <a
                  href={co.href}
                  target={co.href !== "#" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="group relative rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 flex-1 border border-border/40"
                  style={{ background: "hsl(var(--card)/0.85)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = co.accent + "66")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "")}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
                    style={{ background: `radial-gradient(ellipse at top left, ${co.accent}18 0%, transparent 65%)` }} />
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-muted overflow-hidden">
                      {(co as any).logo_url ? (
                        <img
                          src={(co as any).logo_url}
                          alt={co.name}
                          className="w-full h-full object-contain"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <span className="text-2xl">{co.flag || "🏢"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-heading font-bold text-base leading-snug text-foreground">{co.name}</h4>
                        {co.href !== "#" && <ExternalLink size={13} className="text-muted-foreground" />}
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: co.accent }}>
                        {co.subtitle}
                      </span>
                      <p className="text-sm mt-2 leading-relaxed text-muted-foreground">{co.desc}</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl"
                    style={{ background: `linear-gradient(90deg, transparent, ${co.accent}80, transparent)` }} />
                </a>

                {/* Handshake connector — use Unicode directly, not encoded */}
                {idx === 0 && associated.length > 1 && (
                  <div className="flex items-center justify-center shrink-0 z-10" style={{ width: 72, margin: "0 -1px" }}>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-px h-8 bg-border/50 sm:hidden" />
                      <div className="hidden sm:flex items-center gap-0">
                        <div className="w-5 h-px bg-border/60" />
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted border border-border/50" title="Partnership">
                          {/* Handshake emoji — direct Unicode */}
                          <span style={{ fontSize: 20 }}>🤝</span>
                        </div>
                        <div className="w-5 h-px bg-border/60" />
                      </div>
                      <span className="hidden sm:block text-[0.5625rem] font-semibold uppercase tracking-widest text-muted-foreground">Partners</span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer with AI 3D light-traveling background & reduced weight */}
      <div className="relative overflow-hidden" style={{ color: "#e2e8f0", backgroundColor: "#02040a" }}>
        
        {/* Background Base - Light traveling 3d effect */}
        <div className="absolute inset-0 z-0 mix-blend-screen opacity-[0.08] pointer-events-none overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2000&auto=format&fit=crop"
            alt=""
            crossOrigin="anonymous"
            className="w-full h-full object-cover transition-transform ease-linear hover:scale-125"
            style={{ transitionDuration: "20000ms" }}
          />
        </div>
        
        {/* Animated 3D Light Effect Overlays */}
        <div className="absolute inset-0 z-0 pointer-events-none"
             style={{
               background: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.15) 0%, transparent 70%), radial-gradient(ellipse at 100% 100%, rgba(99,102,241,0.1) 0%, transparent 60%)",
             }}
        />
        {/* Glow pulsing effect */}
        <div className="absolute inset-0 z-0 pointer-events-none animate-pulse opacity-20"
             style={{
               background: "radial-gradient(circle at 10% 40%, rgba(139,92,246,0.1) 0%, transparent 40%)",
               animationDuration: "6s"
             }}
        />
        {/* Scanline mesh to simulate 3d data structure - ultra subtle */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.015]"
             style={{
               backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
               backgroundSize: "60px 60px",
               transform: "perspective(800px) rotateX(70deg) scale(2)",
               transformOrigin: "bottom center"
             }}
        />

        <div className="relative z-10 container-wide px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

            {/* Brand */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                {(logoPath || logo) ? (
                  <img src={logoPath || logo} alt={siteName}
                    style={{ width: 38, height: 38, borderRadius: 10, objectFit: "contain", flexShrink: 0 }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#6366f1)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>S</span>
                  </div>
                )}
                <div className="flex flex-col leading-none">
                  <span className="font-heading font-bold text-[0.9375rem] leading-tight" style={{ color: "#f1f5f9" }}>
                    {siteName.split(" ")[0] || "Systems"}
                  </span>
                  <span className="font-heading font-bold text-[0.9375rem] leading-tight"
                    style={{ background: "linear-gradient(90deg,#60a5fa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {siteName.split(" ").slice(1).join(" ") || "Solutions"}
                  </span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "#64748b" }}>
                {content.tagline || "Leading IT consulting and software development company delivering cutting-edge technology solutions."}
              </p>
              <div className="flex gap-2.5">
                {socials.map((s, i) => {
                  const Icon = s.Icon as any;
                  return (
                    <a key={i} href={s.href || "#"} target={s.href ? "_blank" : undefined} rel="noopener noreferrer"
                      onClick={(e) => { if (s.onClick) { e.preventDefault(); s.onClick(); } }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.07)", color: "#94a3b8" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = s.color || "#3b82f6"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
                    >
                      <Icon size={15} />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-heading font-semibold text-sm mb-4" style={{ color: "#f1f5f9" }}>Services</h4>
              <ul className="space-y-2.5">
                {["Software Development", "Web Development", "Mobile Apps", "ERP Systems", "IT Consulting"].map(s => (
                  <li key={s}>
                    <a href="#services" className="text-sm transition-colors duration-150" style={{ color: "#64748b" }}
                      onMouseEnter={e => ((e.target as HTMLElement).style.color = "#60a5fa")}
                      onMouseLeave={e => ((e.target as HTMLElement).style.color = "#64748b")}
                    >{s}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-heading font-semibold text-sm mb-4" style={{ color: "#f1f5f9" }}>Company</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "About Us",  href: "#about"     },
                  { label: "Careers",   href: "#careers"   },
                  { label: "Portfolio", href: "#portfolio" },
                  { label: "Contact",   href: "#contact"   },
                ].map(s => (
                  <li key={s.label}>
                    <a href={s.href} className="text-sm transition-colors duration-150" style={{ color: "#64748b" }}
                      onMouseEnter={e => ((e.target as HTMLElement).style.color = "#60a5fa")}
                      onMouseLeave={e => ((e.target as HTMLElement).style.color = "#64748b")}
                    >{s.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-heading font-semibold text-sm mb-4" style={{ color: "#f1f5f9" }}>Contact</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "#64748b" }}>
                <li>{(contact.address as string)?.split("\n")[0] || "Alia Building, 7th Floor"}</li>
                <li>{(contact.address as string)?.split("\n")[1] || "Gandhakoalhi Magu, Malé"}</li>
                <li>
                  <a href={`mailto:${contact.email || "info@solutions.com.mv"}`} style={{ color: "#60a5fa" }}
                    onMouseEnter={e => ((e.target as HTMLElement).style.textDecoration = "underline")}
                    onMouseLeave={e => ((e.target as HTMLElement).style.textDecoration = "none")}
                  >{contact.email || "info@solutions.com.mv"}</a>
                </li>
                <li>{contact.phone || "+960 301-1355"}</li>
                <li>{contact.landline || "+91-452 238 7388"}</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)", color: "#475569" }}>
            <span>
              {content.copyright || `© ${new Date().getFullYear()} Systems Solutions Pvt Ltd. All rights reserved.`}
            </span>
            <span style={{ color: "rgba(255,255,255,0.15)" }} className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Globe size={12} />
              <span>Malé, Maldives</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
