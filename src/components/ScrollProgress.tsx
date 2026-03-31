import { useEffect, useRef } from "react";

const ScrollProgress = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let ticking = false;
    
    const update = () => {
      const doc = document.documentElement;
      const pct = doc.scrollTop / (doc.scrollHeight - doc.clientHeight);
      bar.style.transform = `scaleX(${isNaN(pct) ? 0 : pct})`;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={barRef}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: 3,
        background: "hsl(217 91% 60%)",
        transformOrigin: "left",
        transform: "scaleX(0)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
};

export default ScrollProgress;
