import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // release.v2 genre palette — see src/index.css :root for the source values.
        genre: {
          ambient: "rgb(var(--c-g-ambient) / <alpha-value>)",
          "classical-folk": "rgb(var(--c-g-classical-folk) / <alpha-value>)",
          downtempo: "rgb(var(--c-g-downtempo) / <alpha-value>)",
          electronic: "rgb(var(--c-g-electronic) / <alpha-value>)",
          experimental: "rgb(var(--c-g-experimental) / <alpha-value>)",
          funk: "rgb(var(--c-g-funk) / <alpha-value>)",
          "hip-hop": "rgb(var(--c-g-hip-hop) / <alpha-value>)",
          jazz: "rgb(var(--c-g-jazz) / <alpha-value>)",
          pop: "rgb(var(--c-g-pop) / <alpha-value>)",
          reggae: "rgb(var(--c-g-reggae) / <alpha-value>)",
          rock: "rgb(var(--c-g-rock) / <alpha-value>)",
          soundtrack: "rgb(var(--c-g-soundtrack) / <alpha-value>)",
          acid: "rgb(var(--c-g-acid) / <alpha-value>)",
          bass: "rgb(var(--c-g-bass) / <alpha-value>)",
          breaks: "rgb(var(--c-g-breaks) / <alpha-value>)",
          "dnb-jungle": "rgb(var(--c-g-dnb-jungle) / <alpha-value>)",
          "drone-noise": "rgb(var(--c-g-drone-noise) / <alpha-value>)",
          dub: "rgb(var(--c-g-dub) / <alpha-value>)",
          electro: "rgb(var(--c-g-electro) / <alpha-value>)",
          "footwork-trap": "rgb(var(--c-g-footwork-trap) / <alpha-value>)",
          house: "rgb(var(--c-g-house) / <alpha-value>)",
          techno: "rgb(var(--c-g-techno) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
