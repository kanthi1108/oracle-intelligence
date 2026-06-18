import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      colors: {
        oracle: {
          bg: "#0d0d0d",
          panel: "#141416",
          rig: "#1a1a1a",
          accent: "#e8c547",
          border: "#262629",
          mutedBorder: "#333333",
          textPrimary: "#f0f0f0",
          textSecondary: "#888888",
          danger: "#e84747",
        },
        surface: {
          0: "#050505",
          1: "#0a0a0a",
          2: "#0d0d0d",
          3: "#141416",
          4: "#1a1a1a",
          5: "#222224",
        },
        terminal: "#00ff41",
        signal: "#e8c547",
        positive: "#4ade80",
        negative: "#e84747",
        warning: "#fbbf24",
      },
      borderWidth: {
        "3": "3px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;