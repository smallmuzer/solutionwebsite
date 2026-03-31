import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X, ArrowRight, ArrowLeft, Navigation, Settings, Mail,
  ExternalLink, MessageCircle, ChevronRight, ChevronLeft
} from "lucide-react";

/**
 * Modern Redesigned Guided Tour
 * Features: 
 * - Glassmorphism UI
 * - Pulsing Spotlight
 * - Intersection / Measurement retries
 * - Smooth step transitions
 */

const TOUR_KEY = "bss_tour_completed_v2";

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  targetSelector: string;
  anchor: string;
  cardSide: "bottom" | "top" | "left" | "right";
  featureLabel: string;
  centerCard?: boolean;
}

const steps: Step[] = [
  {
    icon: Navigation,
    title: "Seamless Navigation",
    description: "Navigate through our core sectors including Services, Portfolio, and Contact. Everything is optimized for speed.",
    featureLabel: "UX/UI",
    targetSelector: "header nav",
    anchor: "body",
    cardSide: "bottom",
  },
  {
    icon: ExternalLink,
    title: "HR-Metrics Demo",
    description: "Experience our most popular HR & Payroll platform instantly. Click 'Get Access' to explore the live demo environment.",
    featureLabel: "HOT FEATURE",
    targetSelector: "a[href*='hrmetrics']",
    anchor: "body",
    cardSide: "bottom",
  },
  {
    icon: Settings,
    title: "Live Customizer",
    description: "Take control of your experience. Click the Gear icon to change themes, fonts, and layouts in real-time.",
    featureLabel: "PERSONALIZATION",
    targetSelector: "button[title='User Experience Settings']",
    anchor: "body",
    cardSide: "bottom",
  },


  {
    icon: MessageCircle,
    title: "AI & WhatsApp Support",
    description: "Need help? Our AI Assistant and WhatsApp support are always one click away at the bottom right.",
    featureLabel: "SUPPORT",
    targetSelector: "#tour-float-btns",
    anchor: "body",
    cardSide: "left",
  },
  {
    icon: Mail,
    title: "Contact Us",
    description: "Ready to transform your business? Fill out our contact form to get started with our expert team.",
    featureLabel: "CONTACT",
    targetSelector: "#contact-header",
    anchor: "#contact",
    cardSide: "top",
    centerCard: true,
  },
];

const PAD = 12;
const CARD_W = 260;

const GuidedTour = () => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [sr, setSr] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [pulsing, setPulsing] = useState(true);

  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const retryRef = useRef(0);

  // Initial check: if completed, don't mount
  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      const t = setTimeout(() => setMounted(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const measureElement = useCallback(() => {
    const cur = steps[step];
    const el = document.querySelector(cur.targetSelector) as HTMLElement | null;

    if (el) {
      const r = el.getBoundingClientRect();
      // Only show if element has dimensions and is somewhat visible
      if (r.width > 0 && r.height > 0) {
        setSr({
          x: r.left - PAD,
          y: r.top - PAD,
          w: r.width + PAD * 2,
          h: r.height + PAD * 2
        });
        setVisible(true);
        retryRef.current = 0;
        return true;
      }
    }
    return false;
  }, [step]);

  const runMeasurement = useCallback(() => {
    const found = measureElement();
    if (!found && retryRef.current < 10) {
      retryRef.current++;
      timerRef.current = setTimeout(runMeasurement, 200 * retryRef.current);
    } else if (!found) {
      // If still not found, skip or default to center
      setVisible(false);
      setSr(null);
    }
  }, [measureElement]);

  useEffect(() => {
    if (!mounted) return;

    setVisible(false);
    setSr(null);
    clearTimeout(timerRef.current);
    retryRef.current = 0;

    const cur = steps[step];

    // Scroll logic
    if (cur.anchor === "body") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      timerRef.current = setTimeout(runMeasurement, 500);
    } else {
      const target = document.querySelector(cur.anchor);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        timerRef.current = setTimeout(runMeasurement, 800);
      } else {
        runMeasurement();
      }
    }

    return () => clearTimeout(timerRef.current);
  }, [step, mounted, runMeasurement]);

  const close = (completed = false) => {
    if (completed) {
      localStorage.setItem(TOUR_KEY, "true");
      window.dispatchEvent(new CustomEvent("bss:tourCompleted"));
      // Auto-scroll back to home after tour finishes
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 300);
    }
    setVisible(false);
    setMounted(false);
  };

  const next = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else close(true);
  };

  const prev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  if (!mounted || !visible || !sr) return null;

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  // Position card intelligently
  const isCentered = !!current.centerCard;
  let cardTop: number | undefined;
  let cardBottom: number | undefined;
  let cardLeft = Math.min(Math.max(sr.x + sr.w / 2 - CARD_W / 2, 20), window.innerWidth - CARD_W - 20);

  if (isCentered) {
    // Center the card on screen
    cardTop = Math.max((window.innerHeight - 260) / 2, 40);
    cardLeft = Math.max((window.innerWidth - CARD_W) / 2, 20);
  } else if (current.cardSide === "bottom") {
    cardTop = sr.y + sr.h + 20;
    if (cardTop + 250 > window.innerHeight) {
      cardTop = undefined;
      cardBottom = window.innerHeight - sr.y + 20;
    }
  } else {
    cardBottom = window.innerHeight - sr.y + 20;
    if (cardBottom + 250 > window.innerHeight) {
      cardBottom = undefined;
      cardTop = sr.y + sr.h + 20;
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none font-sans">
      {/* Background Mask */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tour-mask-v2">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={sr.x} y={sr.y} width={sr.w} height={sr.h}
              rx={16} ry={16} fill="black"
              style={{ transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#tour-mask-v2)"
          className="pointer-events-auto"
          onClick={() => close()}
        />

        {/* Animated Highlight Ring */}
        <rect
          x={sr.x} y={sr.y} width={sr.w} height={sr.h}
          rx={16} ry={16} fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="3"
          strokeDasharray="8 4"
          style={{
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            animation: pulsing ? "tour-pulse 2s infinite" : "none"
          }}
        />
      </svg>

      {/* Tour Card */}
      <div
        className="absolute transition-all duration-500 pointer-events-auto"
        style={{
          width: CARD_W,
          left: cardLeft,
          top: cardTop,
          bottom: cardBottom,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)"
        }}
      >
        <div className="relative group overflow-hidden rounded-3xl border border-white/20 bg-card/95 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] p-5">
          {/* Animated Gradientbg */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-secondary/20 blur-[60px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-secondary/15 border border-secondary/20 flex items-center justify-center text-secondary">
                  <Icon size={20} />
                </div>
                <div>
                  <span className="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-secondary/80 block mb-0.5">
                    {current.featureLabel}
                  </span>
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {current.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => close()}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm text-foreground leading-relaxed mb-4">
              {current.description}
            </p>

            {/* Footer / Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-secondary" : "w-2 bg-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                <span className="text-[0.625rem] font-medium text-muted-foreground">
                  Step {step + 1} of {steps.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={prev}
                    className="p-2 rounded-xl border border-border hover:bg-muted text-foreground transition-all"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-2 pl-6 pr-4 py-2 bg-secondary text-secondary-foreground rounded-xl font-bold text-sm shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {isLast ? "Finish" : "Next"}
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes tour-pulse {
          0% { stroke-dashoffset: 0; opacity: 1; stroke-width: 3; filter: drop-shadow(0 0 8px hsl(var(--secondary))); }
          50% { stroke-dashoffset: 24; opacity: 0.6; stroke-width: 6; filter: drop-shadow(0 0 12px hsl(var(--secondary))); }
          100% { stroke-dashoffset: 48; opacity: 1; stroke-width: 3; filter: drop-shadow(0 0 8px hsl(var(--secondary))); }
        }
      `}} />
    </div>
  );
};

export default GuidedTour;
