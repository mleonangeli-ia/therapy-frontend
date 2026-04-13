import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          subtle:  "var(--color-surface-subtle)",
          muted:   "var(--color-surface-muted)",
        },
        ink: {
          DEFAULT:   "var(--color-ink)",
          secondary: "var(--color-ink-secondary)",
          tertiary:  "var(--color-ink-tertiary)",
          disabled:  "var(--color-ink-disabled)",
          inverse:   "var(--color-ink-inverse)",
        },
        line: {
          DEFAULT: "var(--color-line)",
          subtle:  "var(--color-line-subtle)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },
      animation: {
        "fade-in":  "fadeIn 0.25s ease both",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16,1,0.3,1) both",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        xs:   "0 1px 2px rgba(0,0,0,0.05)",
        card: "0 0 0 1px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04)",
        "card-hover": "0 0 0 1px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.06)",
        focus: "0 0 0 2px #fff, 0 0 0 4px #6366f1",
      },
    },
  },
  plugins: [],
};

export default config;
