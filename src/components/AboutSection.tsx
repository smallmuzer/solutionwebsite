import AnimatedSection from "./AnimatedSection";
import { useSiteContent } from "@/hooks/useSiteContent";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { useCardStyle, useGlobalView } from "./UICustomizer";
import { Target, Users, Award, Globe } from "lucide-react";

const cardData = [
  { title: "Our Mission",   key: "card_mission", imgKey: "card_mission_image", fallback: "/assets/about/mission.png",  accent: "from-blue-600/65 to-indigo-900/80",   Icon: Target },
  { title: "Our Team",      key: "card_team",    imgKey: "card_team_image",    fallback: "/assets/about/team.png",     accent: "from-violet-600/65 to-purple-900/80", Icon: Users  },
  { title: "Quality First", key: "card_quality", imgKey: "card_quality_image", fallback: "/assets/about/quality.png", accent: "from-cyan-600/65 to-blue-900/80",    Icon: Award  },
  { title: "Global Reach",  key: "card_global",  imgKey: "card_global_image",  fallback: "/assets/about/global.png",  accent: "from-emerald-600/65 to-teal-900/80", Icon: Globe  },
];

const AboutSection = () => {
  const content   = useSiteContent("about");
  const cardStyle = useCardStyle();
  const view      = useGlobalView();
  const useImg    = cardStyle === "image";

  // Resolve image: prefer DB value, then fallback asset
  const resolveImg = (imgKey: string, fallback: string) => {
    const v = content[imgKey];
    return v && v.trim() ? v.trim() : fallback;
  };

  return (
    <section id="about" className="section-padding relative overflow-hidden">
      <div className="container-wide relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Left: text — live from DB */}
          <div>
            <AnimatedSection>
              <span className="text-secondary font-semibold text-sm uppercase tracking-widest">
                About Us
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mt-3 mb-6">
                {content.title?.includes("Digital") ? (
                  <>
                    {content.title.split("Digital")[0]}
                    <span className="gradient-text">Digital</span>
                    {content.title.split("Digital")[1]}
                  </>
                ) : (
                  content.title || "Driving Digital Transformation"
                )}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4 text-[0.9375rem]">
                {content.description || "Systems Solutions Pvt Ltd is a tech-leading IT consulting and software development company in the Digital Era!"}
              </p>
              <p className="text-muted-foreground leading-relaxed text-[0.9375rem]">
                {content.vision || "Our journey began out of the passion for a unique position in the industry."}
              </p>
            </AnimatedSection>
          </div>

          {/* Right: cards — images fully live from DB */}
          <AnimatedSection delay={0.2}>
            {view === "grid" ? (
              <div className="grid grid-cols-2 gap-3">
                {cardData.map((card) => {
                  const { Icon } = card;
                  const imgSrc = resolveImg(card.imgKey, card.fallback);
                  return (
                    <div
                      key={card.title}
                      className="glass-card relative rounded-xl overflow-hidden group cursor-default"
                      style={{ height: "clamp(120px, 18vw, 155px)" }}
                    >
                      {useImg && (
                        <img
                          src={imgSrc}
                          alt={card.title}
                          key={imgSrc}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = card.fallback; }}
                        />
                      )}
                      {useImg && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} transition-opacity duration-300 opacity-70 group-hover:opacity-95`} />
                      )}
                      <div className="relative z-10 p-4 h-full flex flex-col justify-end">
                        {!useImg && <Icon size={24} className="text-secondary mb-2" />}
                        <h3 className={`font-heading font-bold text-[0.9375rem] mb-1 drop-shadow leading-snug ${useImg ? "text-white" : "text-foreground"}`}>
                          {card.title}
                        </h3>
                        <p className={`text-[0.8125rem] leading-relaxed line-clamp-2 drop-shadow ${useImg ? "text-white/80" : "text-muted-foreground"}`}>
                          {content[card.key] || ""}
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
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cardData.map((card) => {
                  const { Icon } = card;
                  const imgSrc = resolveImg(card.imgKey, card.fallback);
                  return (
                    <div key={card.title}
                      className="glass-card flex items-center gap-4 p-4 group hover:glow-effect transition-all duration-300 cursor-default relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-secondary/[0.03] to-transparent group-hover:from-secondary/[0.07] transition-all pointer-events-none rounded-xl" />
                      <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-border/40 flex items-center justify-center">
                        {useImg ? (
                          <>
                            <img
                              src={imgSrc}
                              alt={card.title}
                              key={imgSrc}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = card.fallback; }}
                            />
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-70`} />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: "hsl(var(--card))" }}>
                            <Icon size={22} className="text-secondary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 relative z-10">
                        <h3 className="font-heading font-bold text-foreground text-[0.9375rem] leading-snug">{card.title}</h3>
                        <p className="text-muted-foreground text-[0.8125rem] mt-0.5 line-clamp-1">{content[card.key] || ""}</p>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all shrink-0 relative z-10" />
                    </div>
                  );
                })}
              </div>
            )}
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
