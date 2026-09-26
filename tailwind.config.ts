import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        surface: {
          DEFAULT: "var(--bg-surface)",
          elevated: "var(--bg-surface-elevated)",
          hover: "var(--bg-surface-hover)",
        },
        border: {
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
          focus: "var(--border-focus)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          cyan: "var(--accent-cyan)",
          purple: "var(--accent-purple)",
          neon: "var(--accent-neon-pink)",
          savings: "var(--accent-savings)",
          caution: "var(--accent-caution)",
          danger: "var(--accent-danger)",
          live: "var(--accent-live)",
          curated: "var(--accent-curated)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        glowCyan: "var(--glow-cyan)",
        glowPurple: "var(--glow-purple)",
        glowSavings: "var(--glow-savings)",
      },
    },
  },
  plugins: [],
};

export default config;
