import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: `translateX(-50%) scale(${visible ? 1 : 0.8})`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "all" : "none",
        zIndex: 50,
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "hsl(217 91% 60%)",
        color: "#fff",
        border: "none",
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
    >
      <ArrowUp size={20} />
    </button>
  );
};

export default ScrollToTop;
