import React, { useEffect, useMemo, useRef, useState } from "react";

const STYLE_ID = "hero-modern-inline-styles";

type ThemeMode = "dark" | "light";

interface HeroModernProps {
  className?: string;
  compact?: boolean;
  showThemeToggle?: boolean;
}

const getRootTheme = (): ThemeMode => {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (root.classList.contains("dark")) return "dark";
    if (root.getAttribute("data-theme") === "dark" || root.dataset.theme === "dark") return "dark";
    if (root.classList.contains("light")) return "light";
  }

  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return "light";
};

function useThemeSync() {
  const [theme, setTheme] = useState<ThemeMode>(() => getRootTheme());

  useEffect(() => {
    if (typeof document === "undefined") return;

    const sync = () => setTheme(getRootTheme());
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const media = typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

    const onMedia = () => sync();
    media?.addEventListener("change", onMedia);

    return () => {
      observer.disconnect();
      media?.removeEventListener("change", onMedia);
    };
  }, []);

  return [theme, setTheme] as const;
}

function DeckGlyph({ theme }: { theme: ThemeMode }) {
  const stroke = theme === "dark" ? "#f5f5f5" : "#111111";
  const fill = theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(17,17,17,0.08)";

  return (
    <svg viewBox="0 0 120 120" aria-hidden style={{ width: 64, height: 64 }}>
      <circle cx="60" cy="60" r="46" fill="none" stroke={stroke} strokeWidth="1.4" style={{ strokeDasharray: "18 14", animation: "hero-modern-orbit 8.5s linear infinite" }} />
      <rect x="34" y="34" width="52" height="52" rx="14" fill={fill} stroke={stroke} strokeWidth="1.2" style={{ animation: "hero-modern-grid 5.4s ease-in-out infinite" }} />
      <circle cx="60" cy="60" r="7" fill={stroke} />
      <path d="M60 30v10M60 80v10M30 60h10M80 60h10" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" style={{ animation: "hero-modern-pulse 6s ease-in-out infinite" }} />
    </svg>
  );
}

export default function HeroOrbitDeck({
  className,
  compact = false,
  showThemeToggle = true,
}: HeroModernProps) {
  const [theme, setTheme] = useThemeSync();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"strategy" | "execution">("strategy");
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.innerHTML = `
      @keyframes hero-modern-intro {
        0% { opacity: 0; transform: translate3d(0, 48px, 0) scale(0.98); filter: blur(12px); }
        100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
      }
      @keyframes hero-modern-orbit {
        0% { stroke-dashoffset: 0; transform: rotate(0deg); transform-origin: 50% 50%; }
        100% { stroke-dashoffset: -64; transform: rotate(360deg); transform-origin: 50% 50%; }
      }
      @keyframes hero-modern-grid {
        0%, 100% { transform: rotate(-2deg); opacity: 0.7; transform-origin: 50% 50%; }
        50% { transform: rotate(2deg); opacity: 1; transform-origin: 50% 50%; }
      }
      @keyframes hero-modern-pulse {
        0%, 100% { opacity: 0.2; }
        45%, 60% { opacity: 1; }
      }
      @keyframes hero-modern-float {
        0%, 100% { transform: translate3d(0,0,0); }
        50% { transform: translate3d(0,-8px,0); }
      }
      @media (prefers-reduced-motion: reduce) {
        *[data-hero-modern-motion="true"] {
          animation: none !important;
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  useEffect(() => {
    if (!sectionRef.current || typeof window === "undefined") {
      setVisible(true);
      return;
    }

    const node = sectionRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const palette = useMemo(() => {
    if (theme === "dark") {
      return {
        background: "#05070b",
        surface: "rgba(255,255,255,0.05)",
        border: "rgba(255,255,255,0.12)",
        text: "#ffffff",
        subtle: "rgba(255,255,255,0.66)",
        muted: "rgba(255,255,255,0.45)",
        accent: "rgba(255,255,255,0.10)",
        imageOverlay: "linear-gradient(180deg, rgba(0,0,0,0.38), rgba(0,0,0,0.62))",
        glow: "rgba(255,255,255,0.14)",
      };
    }

    return {
      background: "#f5f5f4",
      surface: "rgba(255,255,255,0.78)",
      border: "rgba(17,17,17,0.10)",
      text: "#111111",
      subtle: "rgba(17,17,17,0.66)",
      muted: "rgba(17,17,17,0.46)",
      accent: "rgba(17,17,17,0.05)",
      imageOverlay: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(17,17,17,0.18))",
      glow: "rgba(17,17,17,0.08)",
    };
  }, [theme]);

  const activeMode = mode === "strategy"
    ? {
        title: "Strategy signal",
        description: "A quiet launch surface for planning, clarity, and black-and-white product storytelling.",
        items: [
          "Clear hierarchy without noisy effects",
          "Readable in light and dark mode",
          "Useful as a landing or onboarding panel",
        ],
      }
    : {
        title: "Execution loop",
        description: "A more operational view that still keeps the interface calm, readable, and premium.",
        items: [
          "Status blocks stay easy to scan",
          "Motion is restrained and optional",
          "Works as a hero, panel, or sidebar feature",
        ],
      };

  const showcaseImage =
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80";

  const rootStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    minHeight: compact ? 560 : "100vh",
    width: "100%",
    color: palette.text,
    backgroundColor: palette.background,
    backgroundImage: theme === "dark"
      ? "radial-gradient(ellipse 80% 60% at 10% -10%, rgba(255,255,255,0.15), transparent 60%), radial-gradient(ellipse 90% 70% at 90% -20%, rgba(120,120,120,0.12), transparent 70%)"
      : "radial-gradient(ellipse 80% 60% at 10% -10%, rgba(15,15,15,0.12), transparent 60%), radial-gradient(ellipse 90% 70% at 90% -20%, rgba(15,15,15,0.08), transparent 70%)",
  };

  const sectionStyle: React.CSSProperties = {
    position: "relative",
    display: "grid",
    gap: compact ? "1.25rem" : "2rem",
    padding: compact ? "1.4rem" : "2rem",
    opacity: visible ? 1 : 0,
    animation: visible ? "hero-modern-intro 0.8s cubic-bezier(.22,.68,0,1) forwards" : undefined,
  };

  const cardStyle: React.CSSProperties = {
    borderRadius: 28,
    border: `1px solid ${palette.border}`,
    background: palette.surface,
    backdropFilter: "blur(18px)",
    boxShadow: theme === "dark" ? "0 24px 60px rgba(0,0,0,0.35)" : "0 24px 60px rgba(15,23,42,0.12)",
  };

  const buttonStyle: React.CSSProperties = {
    borderRadius: 999,
    border: `1px solid ${palette.border}`,
    background: palette.accent,
    color: palette.text,
    padding: "0.7rem 1rem",
    fontSize: 11,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    fontWeight: 700,
    cursor: "pointer",
  };

  const toggleTheme = () => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    root.classList.toggle("dark", next === "dark");
    root.classList.toggle("light", next === "light");
    root.setAttribute("data-theme", next);
    setTheme(next);
    try {
      window.localStorage.setItem("hero-theme", next);
    } catch {
      // ignore
    }
  };

  return (
    <div ref={sectionRef} className={className} style={rootStyle}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.8,
          backgroundImage: theme === "dark"
            ? "radial-gradient(circle at 25% 25%, rgba(250,250,250,0.08) 0.7px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(250,250,250,0.08) 0.7px, transparent 1px)"
            : "radial-gradient(circle at 25% 25%, rgba(17,17,17,0.12) 0.7px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(17,17,17,0.08) 0.7px, transparent 1px)",
          backgroundSize: "12px 12px",
          pointerEvents: "none",
        }}
      />

      <div style={sectionStyle}>
        <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: compact ? "1fr" : "minmax(0,1.1fr) minmax(320px,0.9fr)" }}>
          <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <span style={{ ...buttonStyle, cursor: "default" }}>Modern Hero Deck</span>
              {showThemeToggle ? (
                <button type="button" onClick={toggleTheme} style={buttonStyle}>
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </button>
              ) : null}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <h1 style={{ margin: 0, fontSize: compact ? "2rem" : "clamp(2.6rem, 5vw, 4.8rem)", lineHeight: 1.02, letterSpacing: "-0.04em" }}>
                Clean monochrome hero for a calmer, more premium first impression.
              </h1>
              <p style={{ margin: 0, color: palette.subtle, maxWidth: 680, fontSize: compact ? 15 : 17, lineHeight: 1.7 }}>
                This version is easier to use in your app than the fluid canvas. It works in black and white, supports light and dark mode, and gives you a stronger product feel without making the page noisy.
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {["Calm contrast", "Light + dark ready", "Minimal motion"].map((item) => (
                <span key={item} style={{ ...buttonStyle, cursor: "default", fontSize: 10, background: "transparent" }}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle, padding: "1.4rem", display: "grid", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: palette.muted, marginBottom: 10 }}>
                  Mode
                </div>
                <h2 style={{ margin: 0, fontSize: "1.25rem", letterSpacing: "-0.03em" }}>{activeMode.title}</h2>
              </div>
              <div data-hero-modern-motion="true" style={{ animation: "hero-modern-float 9s ease-in-out infinite" }}>
                <DeckGlyph theme={theme} />
              </div>
            </div>

            <p style={{ margin: 0, color: palette.subtle, lineHeight: 1.7, fontSize: 14 }}>
              {activeMode.description}
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setMode("strategy")} style={{ ...buttonStyle, flex: 1, background: mode === "strategy" ? palette.text : palette.accent, color: mode === "strategy" ? palette.background : palette.text }}>
                Strategy
              </button>
              <button type="button" onClick={() => setMode("execution")} style={{ ...buttonStyle, flex: 1, background: mode === "execution" ? palette.text : palette.accent, color: mode === "execution" ? palette.background : palette.text }}>
                Execution
              </button>
            </div>

            <ul style={{ margin: 0, paddingLeft: 18, color: palette.subtle, display: "grid", gap: 8 }}>
              {activeMode.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: compact ? "1fr" : "0.85fr 1.15fr" }}>
          <div style={{ ...cardStyle, padding: "1.2rem", display: "grid", gap: "0.9rem" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: palette.muted }}>
              Why it fits
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                "More visible than the subtle particle background",
                "Still minimalist and not overwhelming",
                "Works as a hero panel or a landing section",
              ].map((item) => (
                <div key={item} style={{ borderRadius: 18, border: `1px solid ${palette.border}`, padding: "0.85rem 1rem", background: "transparent" }}>
                  <span style={{ fontSize: 13, color: palette.subtle }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <figure style={{ ...cardStyle, overflow: "hidden", margin: 0 }}>
            <div style={{ position: "relative", minHeight: compact ? 260 : 360 }}>
              <img
                src={showcaseImage}
                alt="Minimal monochrome workspace"
                loading="lazy"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1)" }}
              />
              <div style={{ position: "absolute", inset: 0, background: palette.imageOverlay }} />
              <div style={{ position: "absolute", inset: 0, border: `1px solid ${palette.border}` }} />
              <div style={{ position: "absolute", left: 20, right: 20, bottom: 18, display: "flex", justifyContent: "space-between", gap: 12, color: "#fff", textTransform: "uppercase", letterSpacing: "0.25em", fontSize: 11 }}>
                <span>Minimal archive</span>
                <span style={{ opacity: 0.8 }}>Monochrome system</span>
              </div>
            </div>
          </figure>
        </div>
      </div>
    </div>
  );
}

export { HeroOrbitDeck };
