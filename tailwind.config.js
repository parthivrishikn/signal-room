/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        telemetry: {
          bg: "#0c0d0e",
          surface: "#121417",
          panel: "#181a1f",
          border: "#252830",
          borderLight: "#333842",
          text: "#e6edf3",
          muted: "#8b949e",
          dim: "#484f58",
          accent: "#38bdf8",
          live: "#22c55e",
          warn: "#eab308",
          crit: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
