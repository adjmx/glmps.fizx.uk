import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Colour theme. All three palettes ship in BOTH glmps forks (index.css) so
// either site knows every theme; the ONLY per-fork divergence is which one is
// the default, baked as `theme-<x>` on <html> in index.html. Cycled by tapping
// the glmps wordmark, mirroring nview's title-tap. mono is available but is
// never a fork default ("glmps without monochrome" = not the default).
export type Theme = "fizx" | "upleb" | "mono";

const THEME_KEY = "glmps.theme";
const ORDER: Theme[] = ["fizx", "upleb", "mono"];
const CLASSES = ORDER.map((t) => `theme-${t}`);

// Per-theme wordmark gradient. AnimatedTitle takes hex, not CSS tokens, so the
// title can't ride the CSS custom properties like the rest of the chrome —
// this map is how it tracks the active theme. suffixRgba is unused while the
// title has no suffix letters (rest=""), kept for shape parity. mono is a
// light-grey sweep matching ndisc's mono accent (#e8e8ec) → mauve-grey.
export const THEME_TITLE: Record<
  Theme,
  { from: string; to: string; suffixRgba: string }
> = {
  fizx: { from: "#34d399", to: "#a78bfa", suffixRgba: "rgba(52,211,153,0.2)" },
  upleb: { from: "#FF7849", to: "#FFB347", suffixRgba: "rgba(255,120,73,0.2)" },
  mono: { from: "#e8e8ec", to: "#c6c6cc", suffixRgba: "rgba(232,232,236,0.2)" },
};

// The fork's own brand — the theme-<x> class index.html bakes onto <html> — is
// the default when the viewer hasn't picked one. Read it off the element so the
// same code yields upleb on glmps.upleb and fizx on glmps.fizx.
function forkDefault(): Theme {
  if (typeof document !== "undefined") {
    const cl = document.documentElement.classList;
    for (const t of ORDER) if (cl.contains(`theme-${t}`)) return t;
  }
  return "fizx";
}

function initialTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "fizx" || v === "upleb" || v === "mono") return v;
  } catch {
    /* ignore */
  }
  return forkDefault();
}

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    const cl = document.documentElement.classList;
    CLASSES.forEach((c) => cl.remove(c));
    cl.add(`theme-${theme}`);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  const cycleTheme = () =>
    setTheme((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]);
  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
